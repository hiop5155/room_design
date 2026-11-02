import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import FloorPlan2D from './components/FloorPlan2D';
import Viewport3D from './components/Viewport3D';
import NewSpaceModal from './components/NewSpaceModal';
import MobileBottomBar from './components/MobileBottomBar';
import MobileCatalogSheet from './components/MobileCatalogSheet';
import MobilePropertySheet from './components/MobilePropertySheet';
import MobileQuickToolbar from './components/MobileQuickToolbar';
import SchemeManagerBar from './components/SchemeManagerBar';
import WalkRoomPickerModal from './components/WalkRoomPickerModal';
import { useIsMobile } from './hooks/useIsMobile';
import { BLUEPRINT_PROJECT, SCHEME_B_OPEN, SCHEME_C_SUITES } from './constants';
import { synchronizeLayout, calculateDoorGeometry, calculatePolygonAreaM2 } from './utils/layoutSync';
import { detectRoomsFromWalls, createCustomRoom } from './utils/roomDetector';
import { recalculateSchemeOffsets, cloneUnitScheme } from './utils/schemeLayout';
import {
  loadLocalProject,
  saveLocalProject,
  syncProjectToCloud,
  getStoredUser,
  setAuthSession,
  clearAuthSession,
} from './services/api';

import newDesignSpace from './constants/newDesignSpace.json';

const STORAGE_KEY = 'floorplan_user_space_v14';

// 預設三個獨立戶型 (方案 A 三分離標準案 + 方案 B 全開放大客餐廚 + 方案 C 雙獨立大套房)
const INITIAL_SCHEMES = [
  {
    ...BLUEPRINT_PROJECT,
    id: 'unit_scheme_a',
    name: '方案 A · 三分離衛浴標準案 (19.8m × 5.3m)',
    visible: true,
    offset: [0, 0],
  },
  {
    ...SCHEME_B_OPEN,
    id: 'unit_scheme_b',
    name: '方案 B · 全開放大客餐廚 (19.8m × 5.3m)',
    visible: true,
    offset: [7500, 0],
  },
  {
    ...SCHEME_C_SUITES,
    id: 'unit_scheme_c',
    name: '方案 C · 雙獨立大套房 (19.8m × 5.3m)',
    visible: true,
    offset: [15000, 0],
  },
];

// 自動檢查並升級舊版格式資料
function migrateSpaceData(rawSpace) {
  if (!rawSpace || !rawSpace.furniture) return rawSpace;
  const migrated = { ...rawSpace };

  // 若南側垂直隔間牆仍為舊位置 x < 2400 或未升級為最新三分離
  const needsSouthUpgrade = (migrated.walls && migrated.walls.some(w => w[5] === 'w_kitchen_west' && w[0] < 2400))
    || (!migrated.rooms || !migrated.rooms.some(r => r.id === 'toilet'))
    || (migrated.doors && migrated.doors.some(d => d.id === 'd_bath'));

  if (needsSouthUpgrade) {
    migrated.walls = JSON.parse(JSON.stringify(BLUEPRINT_PROJECT.walls));
    migrated.doors = JSON.parse(JSON.stringify(BLUEPRINT_PROJECT.doors));
    migrated.rooms = JSON.parse(JSON.stringify(BLUEPRINT_PROJECT.rooms));
    // 替換南側家具 (保留北側客房、主臥、客廳沙發)
    const northFurniture = (migrated.furniture || []).filter(f => {
      return !['f_toilet', 'f_vanity', 'f_bathtub', 'f_shower', 'f_washer', 'f_laundry_sink', 'f_fridge', 'f_kitchen_counter'].includes(f.id);
    });
    const southFurniture = (BLUEPRINT_PROJECT.furniture || []).filter(f => {
      return ['f_toilet', 'f_vanity', 'f_bathtub', 'f_shower', 'f_washer', 'f_laundry_sink', 'f_fridge', 'f_kitchen_counter'].includes(f.id);
    });
    migrated.furniture = [...northFurniture, ...southFurniture];
  }

  migrated.furniture = (migrated.furniture || []).map((f) => {
    if (f.id === 'f_sofa_l' || f.type === 'sofa_l') {
      // 若尺寸為舊版 2000×2400 或顏色為紅色，自動遷移至最新標準客廳沙發
      if (f.w === 2000 || f.d === 2400 || f.color === '#f87171') {
        return {
          ...f,
          w: 2700,
          d: 1600,
          cx: 1450,
          cy: 14500,
          rot: 180,
          color: '#57534e',
          name: '客廳 L型布藝沙發',
          model: 'Mags Soft 現代布藝L型轉角沙發 (270×160)',
        };
      }
    }
    return f;
  });
  return migrated;
}

export default function App() {
  const isMobile = useIsMobile(768);

  // 支援 URL 參數 ?mode=3d 或 ?modal=1
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialMode = urlParams?.get('mode') === '3d' ? '3d' : '2d';
  const initialModal = urlParams?.get('modal') === '1';
  const initialCatalog = urlParams?.get('sheet') === 'catalog';
  const initialProperty = urlParams?.get('sheet') === 'property';
  const initialSelect = urlParams?.get('select');
  const initialLocked = urlParams?.has('unlocked') ? false : true;
  const initialRot = urlParams?.has('rot')
    ? (Number(urlParams.get('rot')) % 360)
    : 90;

  // 🔒 格局與家具鎖定鍵 (預設為鎖定狀態，保護格局與家具防誤觸)
  const [isPlanLocked, setIsPlanLocked] = useState(initialLocked);
  const handleToggleLock = () => {
    setIsPlanLocked((prev) => !prev);
  };

  // 排版排列方向 ('horizontal' 橫向並排 | 'vertical' 直向並列)
  const [layoutMode, setLayoutMode] = useState('horizontal');

  // 多方案狀態 (預設並排載入方案 A 與方案 B，支援同時渲染與切換)
  const [units, setUnits] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const pPreset = urlParams?.get('preset') || urlParams?.get('design');
        if (pPreset === 'new' || pPreset === 'new_design') {
          return recalculateSchemeOffsets([
            { ...newDesignSpace, id: 'unit_new_design', name: '新版大客餐廚 (新案)', visible: true },
            { ...BLUEPRINT_PROJECT, id: 'unit_blueprint', name: '原案三分離 (標準版)', visible: true },
          ], 'horizontal');
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return recalculateSchemeOffsets(parsed, 'horizontal');
          }
        }
      } catch (e) {
        console.warn('載入多方案配置失敗，使用預設配置:', e);
      }
    }
    return JSON.parse(JSON.stringify(INITIAL_SCHEMES));
  });

  // 當前編輯中的方案 ID
  const [activeUnitId, setActiveUnitId] = useState(() => {
    return units[0]?.id || 'unit_blueprint';
  });

  // 第一人稱漫遊選房彈窗與直達目標狀態
  const [isWalkPickerOpen, setIsWalkPickerOpen] = useState(() => {
    return urlParams?.get('modal') === 'walk_picker';
  });
  const [walkTarget, setWalkTarget] = useState(null);

  // 使用者 Google 帳號與 Cloudflare D1 同步狀態
  const [user, setUser] = useState(() => getStoredUser());
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // 從 IndexedDB 離線快取非同步載入專案
  useEffect(() => {
    loadLocalProject('proj_default').then((savedProj) => {
      if (savedProj && Array.isArray(savedProj.units) && savedProj.units.length > 0) {
        setUnits(recalculateSchemeOffsets(savedProj.units, layoutMode));
        if (savedProj.units[0]?.id) {
          setActiveUnitId(savedProj.units[0].id);
        }
      }
    }).catch((err) => {
      console.warn('讀取 IndexedDB 失敗:', err);
    });
  }, []);

  // 當多方案狀態更新時，自動持久化至 localStorage 與 IndexedDB
  useEffect(() => {
    if (typeof window !== 'undefined' && units && units.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
        saveLocalProject({
          id: 'proj_default',
          name: '全案方案對比',
          units,
        });
      } catch (e) {
        console.warn('自動儲存多方案失敗:', e);
      }
    }
  }, [units]);

  // 當前活躍編輯的空間物件
  const space = units.find((u) => u.id === activeUnitId) || units[0] || BLUEPRINT_PROJECT;

  // 封裝 setSpace 函式：無縫相容現存所有家具/隔間牆/門扇/房間編輯 Handler
  const setSpace = (updater) => {
    setUnits((prevUnits) => {
      return prevUnits.map((u) => {
        if (u.id === activeUnitId) {
          const nextU = typeof updater === 'function' ? updater(u) : updater;
          return {
            ...nextU,
            id: u.id,
            name: u.name,
            visible: u.visible,
            offset: u.offset,
          };
        }
        return u;
      });
    });
  };

  // 方案管理回呼函式
  const handleSelectActiveUnit = (targetId) => {
    setActiveUnitId(targetId);
  };

  const handleToggleUnitVisibility = (targetId) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, visible: u.visible === false } : u))
    );
  };

  // ★ 拖曳移動戶型位置 (更新 World Offset)
  const handleUpdateUnitOffset = (targetId, newOffset) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, offset: newOffset } : u))
    );
  };

  // ★ 複製當前戶型為新方案 (放置在右側並自動分開，防重疊)
  const handleCloneUnit = (targetId) => {
    const target = units.find((u) => u.id === targetId) || space;
    const cloned = cloneUnitScheme(target, `${target.name.replace(/\s*\(複本\)/g, '')} (複本)`);

    // 計算當前所有方案在 X 軸的最右側邊界
    let maxEndX = 0;
    units.forEach((u) => {
      const ox = u.offset ? u.offset[0] : 0;
      const w = Math.max(u.length || 5300, u.width || 19830);
      maxEndX = Math.max(maxEndX, ox + w);
    });

    cloned.offset = [maxEndX + 3500, target.offset ? target.offset[1] : 0];

    const nextUnits = [...units, cloned];
    setUnits(nextUnits);
    setActiveUnitId(cloned.id);
  };

  // ★ 重新命名方案名稱 (支援自訂戶型名稱，在匯出與 3D 漫遊中連動顯示)
  const handleRenameUnit = (targetId, newName) => {
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    setUnits((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, name: trimmed } : u))
    );
  };

  // ★ 將當前戶型儲存為預設戶型 (覆蓋/存入自訂預設庫)
  const handleSetAsDefaultScheme = (targetId) => {
    const target = units.find((u) => u.id === targetId) || space;
    try {
      localStorage.setItem('floorplan_user_default_scheme', JSON.stringify(target));
      alert(`💾 已成功將「${target.name}」儲存為預設戶型！日後載入預設規格或新建時將以此配置為準。`);
    } catch (e) {
      console.warn('儲存預設戶型失敗:', e);
      alert('⚠️ 儲存預設戶型失敗，請確認瀏覽器儲存空間。');
    }
  };

  // ★ 一鍵自動拉開所有方案間距 (防止重疊)
  const handleAutoSpreadSchemes = () => {
    setUnits((prev) => recalculateSchemeOffsets(prev, layoutMode, 4000));
  };

  const handleDeleteUnit = (targetId) => {
    if (units.length <= 1) {
      alert('⚠️ 至少必須保留一個設計方案！');
      return;
    }
    const nextUnits = recalculateSchemeOffsets(
      units.filter((u) => u.id !== targetId),
      layoutMode
    );
    setUnits(nextUnits);
    if (activeUnitId === targetId) {
      setActiveUnitId(nextUnits[0]?.id || '');
    }
  };

  const handleChangeLayoutMode = (newMode) => {
    setLayoutMode(newMode);
    setUnits((prev) => recalculateSchemeOffsets(prev, newMode));
  };

  // 漫遊選房出發直達
  const handleSelectWalkTarget = (targetUnit, targetRoom) => {
    setWalkTarget({
      unit: targetUnit,
      room: targetRoom,
      timestamp: Date.now(),
    });
    setViewMode('3d');
    setIsWalkPickerOpen(false);
  };

  // Google 登入成功與雲端同步
  const handleLoginSuccess = async (token, userInfo) => {
    setAuthSession(token, userInfo);
    setUser(userInfo);
    setSyncStatus('syncing');
    try {
      await syncProjectToCloud({
        id: 'proj_default',
        name: '全案方案對比',
        units,
      });
      setSyncStatus('synced');
    } catch (err) {
      console.warn('雲端同步 D1 失敗 (將保留 IndexedDB 本地快取):', err);
      setSyncStatus('error');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setSyncStatus('idle');
  };

  // 視角模式 ('2d' | '3d')
  const [viewMode, setViewMode] = useState(initialMode);

  // 2D 平面圖視角旋轉 (0, 90, 180, 270 度，支援橫向/直向一鍵轉向)
  const [planRotation, setPlanRotation] = useState(initialRot);
  const handleRotatePlan = () => {
    setPlanRotation((prev) => (prev + 90) % 360);
  };

  // 選取的家具/隔間牆 ID
  const [selectedItemId, setSelectedItemId] = useState(initialSelect || null);

  // 圖層開關
  const [showDimensions, setShowDimensions] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showRoomLabels, setShowRoomLabels] = useState(true);

  // 彈窗與抽屜開關
  const [isModalOpen, setIsModalOpen] = useState(initialModal);
  const [isCatalogSheetOpen, setIsCatalogSheetOpen] = useState(initialCatalog);
  const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(initialProperty);

  // 取得目前選中的物件 (支援家具、室內隔間牆、門扇、自訂/獨立房間區域)
  const selectedFurniture = space.furniture?.find((f) => f.id === selectedItemId);
  const selectedWallRaw = !selectedFurniture && (space.walls || []).find((w, idx) => {
    const wId = w[5] || (w[4] === 'n' ? `wall_n_${idx}` : `wall_${w[4]}_${idx}`);
    return wId === selectedItemId || w[5] === selectedItemId;
  });
  const selectedDoor = !selectedFurniture && !selectedWallRaw && (space.doors || []).find((d) => d.id === selectedItemId);
  const selectedRoom = !selectedFurniture && !selectedWallRaw && !selectedDoor && (space.rooms || []).find((r) => r.id === selectedItemId);

  let selectedItem = null;
  if (selectedFurniture) {
    selectedItem = selectedFurniture;
  } else if (selectedWallRaw) {
    const [x0, y0, x1, y1, type, id, name, isLocked] = selectedWallRaw;
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    const isHorizontal = (maxX - minX) >= (maxY - minY);
    selectedItem = {
      id: id || selectedItemId,
      isWall: true,
      name: name || (type === 'n' ? '室內隔間牆' : type === 'b' ? '結構承重柱' : '建築外牆'),
      type: type,
      isLocked: Boolean(isLocked || type === 'e' || type === 'b'),
      x0: minX,
      y0: minY,
      x1: maxX,
      y1: maxY,
      cx: Math.round((minX + maxX) / 2),
      cy: Math.round((minY + maxY) / 2),
      w: Math.round(maxX - minX),
      d: Math.round(maxY - minY),
      orientation: isHorizontal ? 'horizontal' : 'vertical',
      pos: isHorizontal ? minY : minX,
      posX: minX,
      posY: minY,
      length: isHorizontal ? Math.round(maxX - minX) : Math.round(maxY - minY),
      thickness: isHorizontal ? Math.round(maxY - minY) : Math.round(maxX - minX),
    };
  } else if (selectedDoor) {
    const [x0, y0, x1, y1] = selectedDoor.rect || [0, 0, 900, 120];
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    const isHorizontal = (maxX - minX) >= (maxY - minY);
    const doorLen = selectedDoor.len || (isHorizontal ? (maxX - minX) : (maxY - minY));
    const doorThick = selectedDoor.thickness || (isHorizontal ? (maxY - minY) : (maxX - minX));
    const cx = selectedDoor.cx !== undefined ? selectedDoor.cx : Math.round((minX + maxX) / 2);
    const cy = selectedDoor.cy !== undefined ? selectedDoor.cy : Math.round((minY + maxY) / 2);
    const rot = selectedDoor.rot !== undefined ? selectedDoor.rot : (isHorizontal ? 0 : 90);

    selectedItem = {
      ...selectedDoor,
      id: selectedDoor.id,
      isDoor: true,
      name: selectedDoor.name || (selectedDoor.entry ? '入戶防爆大門' : selectedDoor.isSliding ? '滑動推拉門' : '單開室內木門'),
      isEntryDoor: Boolean(selectedDoor.entry),
      isLocked: Boolean(isPlanLocked),
      x0: minX,
      y0: minY,
      x1: maxX,
      y1: maxY,
      cx,
      cy,
      w: Math.round(doorLen),
      d: Math.round(doorThick),
      length: Math.round(doorLen),
      thickness: Math.round(doorThick),
      rot,
      orientation: (rot % 180 === 0) ? 'horizontal' : 'vertical',
      posX: minX,
      posY: minY,
      isSliding: Boolean(selectedDoor.isSliding),
      flipH: Boolean(selectedDoor.flipH),
      flipV: Boolean(selectedDoor.flipV),
    };
  } else if (selectedRoom) {
    const areaM2 = selectedRoom.areaM2 || Number(calculatePolygonAreaM2(selectedRoom.poly).toFixed(1));
    const areaPing = selectedRoom.areaPing || Number((areaM2 * 0.3025).toFixed(1));
    selectedItem = {
      ...selectedRoom,
      id: selectedRoom.id,
      isRoom: true,
      name: selectedRoom.name,
      mat: selectedRoom.mat || 'wood',
      areaM2,
      areaPing,
      note: selectedRoom.note || '獨立空間功能分區',
    };
  }

  // 應用新空間 (由 Modal 產生或載入)
  const handleApplySpace = (newSpace) => {
    let finalSpace = { ...newSpace };
    // 若載入的空間只有 1 個未細分的整體空間 (如 main_space)，且包含室內隔間牆，自動執行空間格局辨識
    const hasOnlyOneOpenRoom = !finalSpace.rooms || finalSpace.rooms.length <= 1;
    const hasInteriorWalls = (finalSpace.walls || []).filter(w => w[4] === 'n').length >= 2;
    if (hasOnlyOneOpenRoom && hasInteriorWalls) {
      const autoRooms = detectRoomsFromWalls(finalSpace);
      if (autoRooms && autoRooms.length > 0) {
        finalSpace.rooms = autoRooms;
      }
    }
    setSpace(finalSpace);
    setSelectedItemId(null);
  };

  // 📐 一鍵自動依隔間牆辨識格局區域
  const handleAutoDetectRooms = () => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護狀態，請先點擊頂部「🔒 格局已鎖定」按鈕解鎖，再執行自動辨識！');
      return;
    }
    const detected = detectRoomsFromWalls(space);
    if (detected && detected.length > 0) {
      setSpace((prev) => ({
        ...prev,
        rooms: detected,
      }));
      alert(`⚡ 格局辨識完成！已自動根據室內隔間牆分割出 ${detected.length} 個獨立空間分區，並智慧完成房間命名與面積換算。`);
    } else {
      alert('⚠️ 未能辨識出封閉空間，請確認室內有足夠的隔間牆劃分閉合區域。');
    }
  };

  // 📐 新增自訂空間區域
  const handleAddCustomRoom = (name, mat) => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護狀態。若要新增自訂區域，請先點擊頂部「🔒 格局已鎖定」按鈕解鎖！');
      return;
    }
    const safeName = (typeof name === 'string' && name.trim()) ? name.trim() : '自訂全新區域';
    const safeMat = (typeof mat === 'string' && mat.trim()) ? mat.trim() : 'wood';
    const newRoom = createCustomRoom(space, safeName, safeMat);
    setSpace((prev) => ({
      ...prev,
      rooms: [...(prev.rooms || []), newRoom],
    }));
    setSelectedItemId(newRoom.id);
    if (isMobile) setIsPropertySheetOpen(true);
  };

  // 📐 更新特定房間屬性 (名稱、地坪材質、多邊形、中心標籤坐標)
  const handleUpdateRoom = (roomId, partial) => {
    if (isPlanLocked) return;
    setSpace((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) => {
        if (r.id !== roomId) return r;
        const updated = { ...r, ...partial };
        if (partial.poly) {
          const areaM2 = Number(calculatePolygonAreaM2(partial.poly).toFixed(1));
          updated.areaM2 = areaM2;
          updated.areaPing = Number((areaM2 * 0.3025).toFixed(1));
        }
        return updated;
      }),
    }));
  };

  // 📐 刪除特定房間區域
  const handleDeleteRoom = (roomId) => {
    if (isPlanLocked) return;
    setSpace((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).filter((r) => r.id !== roomId),
    }));
    setSelectedItemId(null);
  };

  // 一鍵重設回本案預設戶型
  const handleResetToBlueprint = () => {
    if (window.confirm('確定要重設為「出廠標準長條複層配置」嗎？當前自訂的改動將會被覆蓋。')) {
      const resetSpace = JSON.parse(JSON.stringify(BLUEPRINT_PROJECT));
      setSpace(resetSpace);
      setSelectedItemId(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resetSpace));
        } catch (e) {}
      }
    }
  };

  // 新增家具到畫布中央 (若傳入的是隔間牆或門扇則自動分發處理)
  const handleAddFurniture = (itemTemplate) => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護狀態。若要新增或調整家具，請先點擊頂部或右下角的「🔒 格局已鎖定」按鈕進行解鎖！');
      return;
    }
    if (itemTemplate.isWall) {
      const isV = itemTemplate.type?.includes('_v') || itemTemplate.w < itemTemplate.d;
      const targetLength = Math.max(itemTemplate.w, itemTemplate.d);
      const targetThickness = itemTemplate.thickness || Math.min(itemTemplate.w, itemTemplate.d) || 120;
      handleAddWall(isV ? 'vertical' : 'horizontal', targetLength, targetThickness, itemTemplate.name);
      return;
    }

    if (itemTemplate.isDoor || itemTemplate.type === 'door_swing' || itemTemplate.type === 'door_slide') {
      handleAddDoor(itemTemplate);
      return;
    }

    const newItem = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: itemTemplate.type,
      name: itemTemplate.name,
      cx: Math.round(space.length / 2),
      cy: Math.round(space.width / 2),
      w: itemTemplate.w,
      d: itemTemplate.d,
      rot: 0,
      color: itemTemplate.color || '#a8a29e',
    };

    setSpace((prev) => ({
      ...prev,
      furniture: [...(prev.furniture || []), newItem],
    }));
    setSelectedItemId(newItem.id);
  };

  // 新增自訂門扇 (單開木門 / 滑動推拉門，支援在牆體上自動開洞並繪製開啟虛線軌跡)
  const handleAddDoor = (itemTemplate = {}) => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護狀態。若要新增門扇，請先點擊頂部或右下角的「🔒 格局已鎖定」按鈕進行解鎖！');
      return;
    }
    const isSliding = itemTemplate.type === 'door_slide' || Boolean(itemTemplate.isSliding);
    const doorLen = itemTemplate.w || 900;
    const doorThick = itemTemplate.thickness || itemTemplate.d || 120;
    const doorId = `door_user_${Date.now()}`;
    const name = itemTemplate.name || (isSliding ? '滑動推拉門' : '單開室內木門');

    // 預設置入於畫布中央視角處 (50mm 網格對齊)
    const cx = Math.round(space.length / 2 / 50) * 50;
    const cy = Math.round(space.width / 2 / 50) * 50;

    const minX = Math.round(cx - doorLen / 2);
    const minY = Math.round(cy - doorThick / 2);

    const geom = calculateDoorGeometry(minX, minY, doorLen, doorThick, true, false, false);

    const newDoor = {
      id: doorId,
      name,
      rect: geom.rect,
      leaf: isSliding ? null : geom.leaf,
      arc: isSliding ? null : geom.arc,
      len: doorLen,
      thickness: doorThick,
      isSliding,
      orientation: 'horizontal',
      flipH: false,
      flipV: false,
    };

    setSpace((prev) => ({
      ...prev,
      doors: [...(prev.doors || []), newDoor],
    }));
    setSelectedItemId(doorId);
    if (isMobile) setIsPropertySheetOpen(true);
  };

  // 更新特定門扇屬性 (2D 坐標平移、長度開度、厚度、水平/垂直轉向、鉸鏈/內外開翻轉)
  const handleUpdateDoor = (doorId, partial) => {
    if (isPlanLocked) return;
    setSpace((prev) => {
      const updatedDoors = (prev.doors || []).map((d) => {
        if (d.id !== doorId) return d;

        const [x0, y0, x1, y1] = d.rect || [0, 0, 900, 120];
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);
        const rawW = maxX - minX;
        const rawH = maxY - minY;
        const curLen = d.len || (rawW >= rawH ? rawW : rawH);
        const curThick = d.thickness || (rawW >= rawH ? rawH : rawW);
        const curRot = d.rot !== undefined ? d.rot : (rawW >= rawH ? 0 : 90);
        const curCx = d.cx !== undefined ? d.cx : Math.round((minX + maxX) / 2);
        const curCy = d.cy !== undefined ? d.cy : Math.round((minY + maxY) / 2);

        let newLen = partial.length !== undefined ? Math.max(400, Number(partial.length)) : (partial.w !== undefined ? Math.max(400, Number(partial.w)) : curLen);
        let newThick = partial.thickness !== undefined ? Math.max(60, Number(partial.thickness)) : (partial.d !== undefined ? Math.max(60, Number(partial.d)) : curThick);
        let newRot = partial.rot !== undefined ? ((Number(partial.rot) % 360) + 360) % 360 : curRot;
        if (partial.orientation) {
          newRot = partial.orientation === 'horizontal' ? 0 : 90;
        }

        let newCx = curCx;
        let newCy = curCy;
        if (partial.cx !== undefined) newCx = Number(partial.cx);
        if (partial.cy !== undefined) newCy = Number(partial.cy);
        if (partial.deltaX !== undefined) newCx += partial.deltaX;
        if (partial.deltaY !== undefined) newCy += partial.deltaY;
        if (partial.posX !== undefined) newCx = Number(partial.posX) + newLen / 2;
        if (partial.posY !== undefined) newCy = Number(partial.posY) + newThick / 2;

        // 邊界防溢出
        const boundL = prev.length || 20000;
        const boundW = prev.width || 6000;
        newCx = Math.max(newLen / 2, Math.min(boundL - newLen / 2, newCx));
        newCy = Math.max(newThick / 2, Math.min(boundW - newThick / 2, newCy));

        let newName = partial.name !== undefined ? partial.name : d.name;
        let isSliding = partial.isSliding !== undefined ? Boolean(partial.isSliding) : Boolean(d.isSliding);
        let flipH = partial.flipH !== undefined ? Boolean(partial.flipH) : Boolean(d.flipH);
        let flipV = partial.flipV !== undefined ? Boolean(partial.flipV) : Boolean(d.flipV);
        let isEntry = partial.entry !== undefined ? Boolean(partial.entry) : Boolean(d.entry);
        if (partial.entry === true) {
          isEntry = (d.id === doorId);
        } else if (partial.entry === false && d.id === doorId) {
          isEntry = false;
        }

        const isH = (newRot % 180 === 0);
        const halfBoxW = (isH ? newLen : newThick) / 2;
        const halfBoxH = (isH ? newThick : newLen) / 2;
        const newX0 = Math.round(newCx - halfBoxW);
        const newY0 = Math.round(newCy - halfBoxH);

        const geom = calculateDoorGeometry(newX0, newY0, newLen, newThick, isH, flipH, flipV);

        return {
          ...d,
          name: newName,
          cx: Math.round(newCx),
          cy: Math.round(newCy),
          rect: geom.rect,
          leaf: isSliding ? null : geom.leaf,
          arc: isSliding ? null : geom.arc,
          len: newLen,
          thickness: newThick,
          rot: newRot,
          orientation: isH ? 'horizontal' : 'vertical',
          entry: isEntry,
          isSliding,
          flipH,
          flipV,
        };
      });

      return {
        ...prev,
        doors: updatedDoors,
      };
    });
  };

  // 刪除特定門扇
  const handleDeleteDoor = (doorId) => {
    if (isPlanLocked) return;
    setSpace((prev) => ({
      ...prev,
      doors: (prev.doors || []).filter((d) => d.id !== doorId),
    }));
    setSelectedItemId(null);
  };

  // 新增可自訂長度與厚度的室內隔間牆 (實心紅磚 / 灌漿實心 / 輕隔間)
  const handleAddWall = (orientation = 'vertical', customLength = null, customThickness = null, customName = null, initialX = null, initialY = null) => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護狀態。若要新增隔間牆，請先點擊頂部或右下角的「🔒 格局已鎖定」按鈕進行解鎖！');
      return;
    }
    const isV = orientation === 'vertical';
    const L = space.length;
    const W = space.width;
    const thick = customThickness || 120;
    const wallLen = customLength || (isV ? Math.round(W * 0.7) : Math.round(L * 0.25));
    const cx = initialX !== null ? initialX : Math.round(L / 2);
    const cy = initialY !== null ? initialY : Math.round(W / 2);
    const wallId = `w_user_${Date.now()}`;
    const wallName = customName || (isV ? '自訂垂直隔間牆' : '自訂水平隔間牆');

    const newWall = isV
      ? [cx - thick / 2, Math.max(0, cy - wallLen / 2), cx + thick / 2, Math.min(W, cy + wallLen / 2), 'n', wallId, wallName, false]
      : [Math.max(0, cx - wallLen / 2), cy - thick / 2, Math.min(L, cx + wallLen / 2), cy + thick / 2, 'n', wallId, wallName, false];

    setSpace((prev) => {
      const updatedWalls = [...(prev.walls || []), newWall];
      const synced = synchronizeLayout(
        updatedWalls,
        prev.rooms,
        prev.doors,
        prev.length,
        prev.width
      );

      return {
        ...prev,
        walls: synced.walls,
        rooms: synced.rooms,
        doors: synced.doors,
      };
    });
    setSelectedItemId(wallId);
  };

  // 更新特定隔間牆 (支援任意 2D 平移 posX, posY, 厚度 thickness, 長度 length, 轉向 orientation, 名稱 name)
  const handleUpdateWall = (wallId, partial) => {
    if (isPlanLocked) return;
    setSpace((prev) => {
      const updatedWalls = (prev.walls || []).map((w, idx) => {
        const wId = w[5] || (w[4] === 'n' ? `wall_n_${idx}` : `wall_${w[4]}_${idx}`);
        if (wId !== wallId && w[5] !== wallId) return w;

        const minX = Math.min(w[0], w[2]);
        const maxX = Math.max(w[0], w[2]);
        const minY = Math.min(w[1], w[3]);
        const maxY = Math.max(w[1], w[3]);
        let isH = (maxX - minX) >= (maxY - minY);
        let curLen = isH ? (maxX - minX) : (maxY - minY);
        let curThick = isH ? (maxY - minY) : (maxX - minX);

        // 支援一鍵水平 ↔ 垂直轉向
        if (partial.orientation) {
          isH = partial.orientation === 'horizontal';
        }

        let newLen = partial.length !== undefined ? Math.max(200, Number(partial.length)) : curLen;
        let newThick = partial.thickness !== undefined ? Math.max(60, Number(partial.thickness)) : curThick;
        let newName = partial.name !== undefined ? partial.name : (w[6] || '室內隔間牆');

        let newX0 = minX;
        let newY0 = minY;

        // 支援任意 2D 平移 (posX, posY, deltaX, deltaY)
        if (partial.deltaX !== undefined) newX0 += partial.deltaX;
        if (partial.deltaY !== undefined) newY0 += partial.deltaY;

        if (partial.posX !== undefined) {
          newX0 = Number(partial.posX);
        } else if (partial.pos !== undefined && !isH) {
          newX0 = Number(partial.pos);
        }

        if (partial.posY !== undefined) {
          newY0 = Number(partial.posY);
        } else if (partial.pos !== undefined && isH) {
          newY0 = Number(partial.pos);
        }

        // 邊界防溢出
        const boundL = prev.length || 20000;
        const boundW = prev.width || 6000;
        newX0 = Math.max(0, Math.min(boundL - (isH ? newLen : newThick), newX0));
        newY0 = Math.max(0, Math.min(boundW - (isH ? newThick : newLen), newY0));

        const newX1 = newX0 + (isH ? newLen : newThick);
        const newY1 = newY0 + (isH ? newThick : newLen);

        return [newX0, newY0, newX1, newY1, w[4], w[5] || wallId, newName, Boolean(w[7])];
      });

      // 執行幾何與格局全域同步 (房間地坪多邊形、T字交會牆端點、門扇)
      const synced = synchronizeLayout(
        updatedWalls,
        prev.rooms,
        prev.doors,
        prev.length,
        prev.width
      );

      return {
        ...prev,
        walls: synced.walls,
        rooms: synced.rooms,
        doors: synced.doors,
      };
    });
  };

  // 刪除特定隔間牆 (刪除後自動重組相鄰空間地坪)
  const handleDeleteWall = (wallId) => {
    if (isPlanLocked) return;
    setSpace((prev) => {
      const filteredWalls = (prev.walls || []).filter((w, idx) => {
        const wId = w[5] || (w[4] === 'n' ? `wall_n_${idx}` : `wall_${w[4]}_${idx}`);
        return wId !== wallId && w[5] !== wallId;
      });

      const synced = synchronizeLayout(
        filteredWalls,
        prev.rooms,
        prev.doors,
        prev.length,
        prev.width
      );

      return {
        ...prev,
        walls: synced.walls,
        rooms: synced.rooms,
        doors: synced.doors,
      };
    });
    setSelectedItemId(null);
  };

  // 更新特定家具屬性
  const handleUpdateFurniture = (id, partial) => {
    if (isPlanLocked) return;
    setSpace((prev) => ({
      ...prev,
      furniture: prev.furniture.map((f) => (f.id === id ? { ...f, ...partial } : f)),
    }));
  };

  // 更新當前選中項 (自動分發給門扇、隔間牆、自訂房間分區或家具)
  const handleUpdateSelectedItem = (partial) => {
    if (!selectedItemId || !selectedItem) return;
    if (selectedItem.isDoor) {
      handleUpdateDoor(selectedItem.id, partial);
    } else if (selectedItem.isWall) {
      handleUpdateWall(selectedItem.id, partial);
    } else if (selectedItem.isRoom) {
      handleUpdateRoom(selectedItem.id, partial);
    } else {
      handleUpdateFurniture(selectedItem.id, partial);
    }
  };

  // 快速旋轉 90 度
  const handleRotateSelectedItem = () => {
    if (isPlanLocked) {
      alert('🔒 目前格局與家具處於鎖定狀態。若要旋轉物件，請先點擊頂部或右下角的「🔒 格局已鎖定」按鈕進行解鎖！');
      return;
    }
    if (!selectedItem) return;
    if (selectedItem.isDoor) {
      handleUpdateDoor(selectedItem.id, {
        orientation: selectedItem.orientation === 'horizontal' ? 'vertical' : 'horizontal',
      });
      return;
    }
    if (selectedItem.isWall) {
      handleUpdateWall(selectedItem.id, {
        orientation: selectedItem.orientation === 'horizontal' ? 'vertical' : 'horizontal',
      });
      return;
    }
    if (selectedItem.isRoom) {
      return;
    }
    const nextRot = ((selectedItem.rot || 0) + 90) % 360;
    handleUpdateFurniture(selectedItem.id, { rot: nextRot });
  };

  // 刪除選中項 (門扇、隔間牆、自訂房間分區或家具)
  const handleDeleteSelectedItem = () => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護模式，請先解鎖以刪除物件！');
      return;
    }
    if (!selectedItemId || !selectedItem) return;
    if (selectedItem.isDoor) {
      if (selectedItem.isEntryDoor) {
        const confirmDelete = window.confirm('⚠️ 此門扇被標記為「主要入戶大門」。\n\n確定要拆除嗎？（拆除後可隨時從左側工具箱新增門扇，並在右側屬性面板指定為新大門）');
        if (!confirmDelete) return;
      }
      handleDeleteDoor(selectedItem.id);
    } else if (selectedItem.isWall) {
      if (selectedItem.isLocked) {
        alert('🔒 此為建築外牆或承重柱，依結構安全規範不可拆除！');
        return;
      }
      handleDeleteWall(selectedItem.id);
    } else if (selectedItem.isRoom) {
      handleDeleteRoom(selectedItem.id);
    } else {
      setSpace((prev) => ({
        ...prev,
        furniture: prev.furniture.filter((f) => f.id !== selectedItemId),
      }));
      setSelectedItemId(null);
    }
  };

  // 複製選中項
  const handleDuplicateSelectedItem = () => {
    if (isPlanLocked) {
      alert('🔒 目前格局處於鎖定保護模式，請先解鎖以複製物件！');
      return;
    }
    if (!selectedItem || selectedItem.isWall) return;
    const duplicated = {
      ...selectedItem,
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${selectedItem.name} (複製)`,
      cx: Math.min(space.length - 200, selectedItem.cx + 250),
      cy: Math.min(space.width - 200, selectedItem.cy + 250),
    };
    setSpace((prev) => ({
      ...prev,
      furniture: [...prev.furniture, duplicated],
    }));
    setSelectedItemId(duplicated.id);
  };

  // 匯出專案 JSON (全案多戶型相容封裝，同時向後相容單戶型讀取)
  const handleExportJson = () => {
    const exportPayload = {
      version: 'v14',
      appName: '空間規劃師',
      exportTime: new Date().toISOString(),
      activeUnitId,
      activeScheme: space,
      units,
      // 根層級完整展開當前空間屬性，保證 100% 相容僅讀取 root length/width 的歷史舊版
      ...space,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${(space.name || '空間設計').replace(/\s+/g, '_')}_全案設計配置.json`);
    dlAnchorElem.click();
  };

  // 匯入專案 JSON (100% 全相容歷史舊版 tunnel 匯出檔案、localStorage dump 陣列與新版多戶型格式)
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target.result;
        const parsed = JSON.parse(rawContent);

        // 格式 1：直接匯入了 JSON 陣列 (例如從舊版 localStorage 直接 dump 出來的陣列)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migratedUnits = parsed.map(migrateSpaceData);
          const spacedUnits = recalculateSchemeOffsets(migratedUnits, layoutMode);
          setUnits(spacedUnits);
          setActiveUnitId(spacedUnits[0]?.id || '');
          setSelectedItemId(null);
          alert(`✅ 成功匯入舊版多方案配置！已相容還原 ${spacedUnits.length} 套設計方案。`);
          return;
        }

        // 格式 2：多方案完整封裝包 (包含 units 陣列)
        if (parsed.units && Array.isArray(parsed.units) && parsed.units.length > 0) {
          const migratedUnits = parsed.units.map(migrateSpaceData);
          setUnits(migratedUnits);
          if (parsed.activeUnitId && migratedUnits.some((u) => u.id === parsed.activeUnitId)) {
            setActiveUnitId(parsed.activeUnitId);
          } else if (migratedUnits[0]?.id) {
            setActiveUnitId(migratedUnits[0].id);
          }
          setSelectedItemId(null);
          alert(`✅ 專案全案匯入成功！已完整還原 ${migratedUnits.length} 套戶型方案與自訂配置。`);
          return;
        }

        // 格式 3：舊版單一空間物件 (tunnel 歷史匯出檔、或帶有 data/space 包裝)
        let singleSpace = parsed.data || parsed.space || (parsed.length && parsed.width ? parsed : null);
        if (singleSpace && singleSpace.length && singleSpace.width) {
          const migrated = migrateSpaceData(singleSpace);
          const hasOnlyOneOpenRoom = !migrated.rooms || migrated.rooms.length <= 1;
          const hasInteriorWalls = (migrated.walls || []).filter((w) => w[4] === 'n').length >= 2;
          if (hasOnlyOneOpenRoom && hasInteriorWalls) {
            const autoRooms = detectRoomsFromWalls(migrated);
            if (autoRooms && autoRooms.length > 0) {
              migrated.rooms = autoRooms;
            }
          }

          // 將匯入的單一格局相容置換至當前活躍方案中，保留其 offset 與 ID
          setUnits((prev) => {
            const exists = prev.some((u) => u.id === activeUnitId);
            if (exists) {
              return prev.map((u) => (u.id === activeUnitId ? { ...migrated, id: u.id, offset: u.offset } : u));
            }
            return [{ ...migrated, id: `unit_${Date.now()}`, offset: [0, 0] }, ...prev];
          });
          setSelectedItemId(null);
          alert(`✅ 舊版空間配置【${migrated.name || '歷史格局'}】匯入成功！已相容還原所有隔間牆、門窗與家具。`);
          return;
        }

        alert('⚠️ 未能辨識 JSON 內容格式，請確認是否為本系統匯出的專案或空間檔案！');
      } catch (err) {
        console.error('匯入 JSON 失敗:', err);
        alert('⚠️ 解析 JSON 檔案失敗，請檢查檔案格式是否正確！');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 匯出 2D 平面圖 PNG
  const handleExportPng = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 2400;
    canvas.height = Math.round((2400 * space.width) / space.length) + 400;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL('image/png');
      const dlLink = document.createElement('a');
      dlLink.download = `${space.name}_平面圖.png`;
      dlLink.href = pngFile;
      dlLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={styles.appRoot}>
      {/* 頂部導航列 (自動響應手機/桌面，整合 Google 登入與雲端同步狀態) */}
      <Header
        space={space}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenNewSpaceModal={() => setIsModalOpen(true)}
        showDimensions={showDimensions}
        setShowDimensions={setShowDimensions}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showRoomLabels={showRoomLabels}
        setShowRoomLabels={setShowRoomLabels}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportPng={handleExportPng}
        onResetToBlueprint={handleResetToBlueprint}
        planRotation={planRotation}
        onRotatePlan={handleRotatePlan}
        isPlanLocked={isPlanLocked}
        onToggleLock={handleToggleLock}
        onAutoDetectRooms={handleAutoDetectRooms}
        onAddCustomRoom={handleAddCustomRoom}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        syncStatus={syncStatus}
      />

      {/* 方案對比管理條 (專注於方案切換、複製、重命名、預設與排版) */}
      <SchemeManagerBar
        units={units}
        activeUnitId={activeUnitId}
        onSelectActiveUnit={handleSelectActiveUnit}
        onToggleUnitVisibility={handleToggleUnitVisibility}
        onCloneUnit={handleCloneUnit}
        onRenameUnit={handleRenameUnit}
        onSetAsDefaultScheme={handleSetAsDefaultScheme}
        onAutoSpreadSchemes={handleAutoSpreadSchemes}
        onDeleteUnit={handleDeleteUnit}
        layoutMode={layoutMode}
        onChangeLayoutMode={handleChangeLayoutMode}
      />

      {/* 主工作區 */}
      <div style={styles.workspace}>
        {/* 桌面端側邊欄 (手機端隱藏) */}
        {!isMobile && (
          <SidebarLeft
            onAddFurniture={handleAddFurniture}
            onAddWall={handleAddWall}
            onAddDoor={handleAddDoor}
            onAutoDetectRooms={handleAutoDetectRooms}
            onAddCustomRoom={handleAddCustomRoom}
          />
        )}

        {/* 中央主畫布 (手機端佔滿 100%) */}
        <main
          style={{
            ...styles.canvasArea,
            ...(isMobile ? { paddingBottom: 'calc(54px + env(safe-area-inset-bottom, 0px))' } : {}),
          }}
        >
          {viewMode === '2d' ? (
            <FloorPlan2D
              space={space}
              units={units}
              activeUnitId={activeUnitId}
              onSelectActiveUnit={handleSelectActiveUnit}
              onUpdateUnitOffset={handleUpdateUnitOffset}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              onUpdateFurniture={handleUpdateFurniture}
              onUpdateWall={handleUpdateWall}
              onDeleteWall={handleDeleteWall}
              onUpdateDoor={handleUpdateDoor}
              onDeleteDoor={handleDeleteDoor}
              showDimensions={showDimensions}
              showGrid={showGrid}
              showRoomLabels={showRoomLabels}
              planRotation={planRotation}
              onRotatePlan={handleRotatePlan}
              isPlanLocked={isPlanLocked}
              onToggleLock={handleToggleLock}
            />
          ) : (
            <Viewport3D
              space={space}
              units={units}
              activeUnitId={activeUnitId}
              walkTarget={walkTarget}
              onRequestOpenWalkPicker={() => setIsWalkPickerOpen(true)}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
            />
          )}

          {/* 行動端選取物件浮動快捷條 */}
          {isMobile && selectedItem && (
            <MobileQuickToolbar
              selectedItem={selectedItem}
              onRotate={handleRotateSelectedItem}
              onDuplicate={handleDuplicateSelectedItem}
              onDelete={handleDeleteSelectedItem}
              onDeselect={() => setSelectedItemId(null)}
              onOpenDetails={() => setIsPropertySheetOpen(true)}
            />
          )}
        </main>

        {/* 桌面端屬性面板 (手機端隱藏) */}
        {!isMobile && (
          <SidebarRight
            space={space}
            selectedItem={selectedItem}
            onUpdateSelectedItem={handleUpdateSelectedItem}
            onDeleteSelectedItem={handleDeleteSelectedItem}
            onDuplicateSelectedItem={handleDuplicateSelectedItem}
          />
        )}
      </div>

      {/* 行動端專屬底部導航欄 */}
      {isMobile && (
        <MobileBottomBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenCatalog={() => setIsCatalogSheetOpen(true)}
          onOpenProperties={() => setIsPropertySheetOpen(true)}
          onOpenNewSpace={() => setIsModalOpen(true)}
          hasSelection={Boolean(selectedItem)}
        />
      )}

      {/* 行動端元件庫抽屜 (Bottom Sheet) */}
      <MobileCatalogSheet
        isOpen={isCatalogSheetOpen}
        onClose={() => setIsCatalogSheetOpen(false)}
        onAddFurniture={handleAddFurniture}
        onAddWall={handleAddWall}
        onAddDoor={handleAddDoor}
        onAutoDetectRooms={handleAutoDetectRooms}
        onAddCustomRoom={handleAddCustomRoom}
      />

      {/* 行動端屬性與空間資訊抽屜 (Bottom Sheet) */}
      <MobilePropertySheet
        isOpen={isPropertySheetOpen}
        onClose={() => setIsPropertySheetOpen(false)}
        space={space}
        selectedItem={selectedItem}
        onUpdateSelectedItem={handleUpdateSelectedItem}
        onDeleteSelectedItem={handleDeleteSelectedItem}
        onDuplicateSelectedItem={handleDuplicateSelectedItem}
      />

      {/* 自訂空間尺寸彈窗 (自適應手機/桌面) */}
      <NewSpaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplySpace={handleApplySpace}
      />

      {/* 第一人稱漫遊出發選房彈窗 */}
      <WalkRoomPickerModal
        isOpen={isWalkPickerOpen}
        onClose={() => setIsWalkPickerOpen(false)}
        units={units}
        activeUnitId={activeUnitId}
        onSelectTarget={handleSelectWalkTarget}
      />
    </div>
  );
}

const styles = {
  appRoot: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    backgroundColor: '#f7f5f0',
  },
  workspace: {
    display: 'flex',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasArea: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#faf8f5',
  },
};
