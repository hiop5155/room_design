import React, { useRef, useState, useEffect } from 'react';
import { FLOOR_MATERIALS } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';
import { calculatePolygonAreaM2 } from '../utils/layoutSync';

// 八大核心分區定義 (精確 X 與 Y 坐標，確保跳轉完美居中)
const ZONES = [
  { key: 'guest', name: '🛏 獨立客房', x: 1325, y: 1950 },
  { key: 'stairs_entry', name: '🪜 戶外梯/大門', x: 3975, y: 3000 },
  { key: 'master', name: '👑 景觀大主臥', x: 1325, y: 8915 },
  { key: 'storage_walkin', name: '📦 大收納間', x: 4550, y: 8900 },
  { key: 'living_dining', name: '🍽 客餐廳', x: 2650, y: 13865 },
  { key: 'kitchen', name: '🍳 獨立廚房', x: 3975, y: 17925 },
  { key: 'bath', name: '🛁 三分離衛浴', x: 1265, y: 17200 },
  { key: 'laundry', name: '🧺 洗衣曬衣', x: 1265, y: 19250 },
];

export default function FloorPlan2D({
  space,
  units = [],
  activeUnitId,
  onSelectActiveUnit,
  onUpdateUnitOffset,
  selectedItemId,
  onSelectItem,
  onUpdateFurniture,
  onUpdateWall,
  onDeleteWall,
  onUpdateDoor,
  onDeleteDoor,
  showDimensions,
  showGrid,
  showRoomLabels,
  planRotation = 90,
  onRotatePlan,
  isPlanLocked = true,
  onToggleLock,
}) {
  const isMobile = useIsMobile(768);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const rotGroupRef = useRef(null);
  const zoneBarRef = useRef(null);

  const [internalRotation, setInternalRotation] = useState(90);
  const currentRotation = planRotation !== undefined ? planRotation : internalRotation;
  const handleToggleRotate = onRotatePlan || (() => setInternalRotation((prev) => (prev + 90) % 360));

  const L = space.length;
  const W = space.width;
  const margin = 1200; // 外圍預留標註尺寸邊界

  // 當前活躍方案的位移世界坐標
  const spaceOx = space.offset ? space.offset[0] : 0;
  const spaceOy = space.offset ? space.offset[1] : 0;

  // 取得其他並排對照的可見方案
  const comparisonUnits = (units || []).filter(
    (u) => u.id !== space.id && u.visible !== false
  );

  // 視野中心 (世界座標 mm)，初始居中在空間中央
  const [viewCenter, setViewCenter] = useState({ x: L / 2 + spaceOx, y: W / 2 + spaceOy });
  // 縮放倍率
  const [zoom, setZoom] = useState(isMobile ? 0.75 : 1);
  // 當前聚焦分區
  const [activeZoneKey, setActiveZoneKey] = useState('living_dining');

  // 平移與拖曳狀態
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startCenterX: L / 2, startCenterY: W / 2 });
  const [dragState, setDragState] = useState(null);
  const [wallDragState, setWallDragState] = useState(null);
  const [doorDragState, setDoorDragState] = useState(null);
  const [unitDragState, setUnitDragState] = useState(null); // 戶型單元整體拖曳狀態
  const [rotateState, setRotateState] = useState(null); // 360度全角度自由旋轉控制狀態

  // 雙指觸控手勢
  const touchInfoRef = useRef({
    initialDist: 0,
    initialZoom: 1,
    isPinching: false,
    startClientX: 0,
    startClientY: 0,
    startCenterX: L / 2,
    startCenterY: W / 2,
  });

  // 座標旋轉換算 (以中心為軸旋轉)
  const getRotatedPoint = (px, py, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = px - L / 2;
    const dy = py - W / 2;
    return {
      x: L / 2 + dx * cos - dy * sin,
      y: W / 2 + dx * sin + dy * cos,
    };
  };

  // 當切換空間或有指定 URL Hash 時定位視角
  useEffect(() => {
    const handleHash = () => {
      const hash = (window.location.hash || '').replace('#', '');
      const matchedZone = ZONES.find((z) => z.key === hash);
      if (matchedZone) {
        setActiveZoneKey(matchedZone.key);
        const target = getRotatedPoint(matchedZone.x, matchedZone.y, currentRotation);
        setViewCenter(target);
        setZoom(isMobile ? 1.8 : 2.1);
      } else {
        setViewCenter({ x: space.length / 2, y: space.width / 2 });
        setZoom(isMobile ? 0.75 : 1);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [space.length, space.width, isMobile, currentRotation]);

  // 鍵盤操作 (R 旋轉選中家具，O 旋轉整張平面圖)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleToggleRotate();
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && selectedItemId) {
        e.preventDefault();
        const item = space.furniture.find((f) => f.id === selectedItemId);
        if (item) {
          const nextRot = ((item.rot || 0) + 90) % 360;
          const clamped = clampFurniturePosition(item, item.cx, item.cy, nextRot);
          onUpdateFurniture(item.id, { rot: nextRot, cx: clamped.x, cy: clamped.y });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, space.furniture, onUpdateFurniture, handleToggleRotate]);

  // 計算當前 ViewBox 視界大小 (考慮旋轉 90 / 270 度時寬高對調)
  const isQuarterTurn = (currentRotation % 180) !== 0;
  const boundW = isQuarterTurn ? W : L;
  const boundH = isQuarterTurn ? L : W;
  const totalWorldW = boundW + margin * 2;
  const totalWorldH = boundH + margin * 2;
  const viewW = totalWorldW / zoom;
  const viewH = totalWorldH / zoom;
  const minX = viewCenter.x - viewW / 2;
  const minY = viewCenter.y - viewH / 2;

  // 防壓牆與貼牆吸附演算法 (Wall Clearance & Snap Engine)
  const clampFurniturePosition = (item, rawCx, rawCy, rot = item.rot || 0) => {
    const isRot90 = rot % 180 !== 0;
    const halfW = (isRot90 ? item.d : item.w) / 2;
    const halfD = (isRot90 ? item.w : item.d) / 2;

    // 1. 外牆硬邊界約束：室內淨範圍 [0, L] 與 [0, W]，家具絕對不能插進外牆厚度中
    let cx = Math.max(halfW, Math.min(L - halfW, rawCx));
    let cy = Math.max(halfD, Math.min(W - halfD, rawCy));

    // 2. 貼外牆吸附 (距離外牆內表面小於 100mm 自動平整吸附貼齊)
    const SNAP_DIST = 100;
    if (Math.abs(cx - halfW) < SNAP_DIST) cx = halfW;
    if (Math.abs(cx - (L - halfW)) < SNAP_DIST) cx = L - halfW;
    if (Math.abs(cy - halfD) < SNAP_DIST) cy = halfD;
    if (Math.abs(cy - (W - halfD)) < SNAP_DIST) cy = W - halfD;

    // 3. 內部隔間牆避讓與推離
    if (space.walls) {
      space.walls.forEach((wall) => {
        const [wx0, wy0, wx1, wy1, wtype] = wall;
        if (wtype === 'n') {
          const minWx = Math.min(wx0, wx1);
          const maxWx = Math.max(wx0, wx1);
          const minWy = Math.min(wy0, wy1);
          const maxWy = Math.max(wy0, wy1);

          const itemMinX = cx - halfW;
          const itemMaxX = cx + halfW;
          const itemMinY = cy - halfD;
          const itemMaxY = cy + halfD;

          if (itemMinX < maxWx && itemMaxX > minWx && itemMinY < maxWy && itemMaxY > minWy) {
            const pushLeft = itemMaxX - minWx;
            const pushRight = maxWx - itemMinX;
            const pushTop = itemMaxY - minWy;
            const pushBottom = maxWy - itemMinY;
            const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

            if (minPush === pushLeft) cx = minWx - halfW;
            else if (minPush === pushRight) cx = maxWx + halfW;
            else if (minPush === pushTop) cy = minWy - halfD;
            else if (minPush === pushBottom) cy = maxWy + halfD;
          }
        }
      });
    }

    return { x: Math.round(cx), y: Math.round(cy) };
  };

  // 轉換螢幕座標至 SVG 世界座標 (精確支援任意角度旋轉後的本地坐標換算)
  const screenToWorld = (clientX, clientY) => {
    const group = rotGroupRef.current;
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    if (group && typeof group.getScreenCTM === 'function') {
      const ctm = group.getScreenCTM();
      if (ctm) {
        const p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
      }
    }
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  // 滑鼠滾輪縮放 (原生事件綁定並指定 passive: false，徹底避免 Unable to preventDefault 錯誤)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom((prev) => Math.min(Math.max(0.3, prev * factor), 5));
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // 滑鼠按下平移
  const handleMouseDown = (e) => {
    // 若點擊的是家具，家具自身會 stopPropagation
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startCenterX: viewCenter.x,
        startCenterY: viewCenter.y,
      };
      onSelectItem(null);
    }
  };

  // 旋轉握把開始旋轉 (滑鼠與手指全角度自由旋轉)
  const handleRotateMouseDown = (e, item, isDoor = false) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (isPlanLocked) return;
    const cx = isDoor ? (item.cx !== undefined ? item.cx : (item.rect[0] + item.rect[2]) / 2) : item.cx;
    const cy = isDoor ? (item.cy !== undefined ? item.cy : (item.rect[1] + item.rect[3]) / 2) : item.cy;
    setRotateState({
      id: item.id,
      cx,
      cy,
      isDoor,
    });
  };

  const handleRotateTouchStart = (e, item, isDoor = false) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      if (isPlanLocked) return;
      const cx = isDoor ? (item.cx !== undefined ? item.cx : (item.rect[0] + item.rect[2]) / 2) : item.cx;
      const cy = isDoor ? (item.cy !== undefined ? item.cy : (item.rect[1] + item.rect[3]) / 2) : item.cy;
      setRotateState({
        id: item.id,
        cx,
        cy,
        isDoor,
      });
    }
  };

  // 戶型單元開始滑鼠拖曳 (拉動分開各戶型)
  const handleUnitDragStart = (e, targetUnit) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const worldP = screenToWorld(e.clientX, e.clientY);
    const ox = targetUnit.offset ? targetUnit.offset[0] : 0;
    const oy = targetUnit.offset ? targetUnit.offset[1] : 0;
    setUnitDragState({
      unitId: targetUnit.id,
      startMouseX: worldP.x,
      startMouseY: worldP.y,
      startOffsetX: ox,
      startOffsetY: oy,
    });
  };

  // 戶型單元開始單指觸控拖曳
  const handleUnitTouchStart = (e, targetUnit) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const ox = targetUnit.offset ? targetUnit.offset[0] : 0;
      const oy = targetUnit.offset ? targetUnit.offset[1] : 0;
      setUnitDragState({
        unitId: targetUnit.id,
        startMouseX: worldP.x,
        startMouseY: worldP.y,
        startOffsetX: ox,
        startOffsetY: oy,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (unitDragState) {
      // 正在自由拖曳整棟戶型單元 (拉開戶型位置，永不重疊)
      const worldP = screenToWorld(e.clientX, e.clientY);
      const deltaX = worldP.x - unitDragState.startMouseX;
      const deltaY = worldP.y - unitDragState.startMouseY;
      const newOx = Math.round((unitDragState.startOffsetX + deltaX) / 100) * 100; // 100mm 步進吸附
      const newOy = Math.round((unitDragState.startOffsetY + deltaY) / 100) * 100;
      if (onUpdateUnitOffset) {
        onUpdateUnitOffset(unitDragState.unitId, [newOx, newOy]);
      }
      return;
    }

    if (rotateState) {
      // 正在 360° 全角度旋轉物件 (家具或門扇)
      const worldP = screenToWorld(e.clientX, e.clientY);
      const dx = worldP.x - rotateState.cx;
      const dy = worldP.y - rotateState.cy;
      let angleRad = Math.atan2(dy, dx);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      if (angleDeg < 0) angleDeg += 360;
      angleDeg = angleDeg % 360;

      // 按住 Shift 鍵可 15° 步進吸附
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15 % 360;
      }

      if (rotateState.isDoor) {
        if (onUpdateDoor) onUpdateDoor(rotateState.id, { rot: angleDeg });
      } else {
        if (onUpdateFurniture) onUpdateFurniture(rotateState.id, { rot: angleDeg });
      }
      return;
    }

    if (wallDragState) {
      // 正在 2D 任意拖曳隔間牆 (可自由跨越各房間)
      const worldP = screenToWorld(e.clientX, e.clientY);
      const deltaX = worldP.x - wallDragState.startMouseX;
      const deltaY = worldP.y - wallDragState.startMouseY;

      let newMinX = Math.round((wallDragState.startMinX + deltaX) / 50) * 50; // 50mm 網格吸附
      let newMinY = Math.round((wallDragState.startMinY + deltaY) / 50) * 50;

      newMinX = Math.max(0, Math.min(L - wallDragState.width, newMinX));
      newMinY = Math.max(0, Math.min(W - wallDragState.height, newMinY));

      if (onUpdateWall) {
        onUpdateWall(wallDragState.id, {
          posX: newMinX,
          posY: newMinY,
        });
      }
      return;
    }

    if (doorDragState) {
      // 正在 2D 拖曳門扇 (自由移動至任何牆體)
      const worldP = screenToWorld(e.clientX, e.clientY);
      const deltaX = worldP.x - doorDragState.startMouseX;
      const deltaY = worldP.y - doorDragState.startMouseY;

      let newCx = Math.round((doorDragState.startCx + deltaX) / 50) * 50;
      let newCy = Math.round((doorDragState.startCy + deltaY) / 50) * 50;

      newCx = Math.max(300, Math.min(L - 300, newCx));
      newCy = Math.max(100, Math.min(W - 100, newCy));

      if (onUpdateDoor) {
        onUpdateDoor(doorDragState.id, {
          cx: newCx,
          cy: newCy,
        });
      }
      return;
    }

    if (dragState) {
      // 正在拖曳家具
      const worldP = screenToWorld(e.clientX, e.clientY);
      const rawCx = worldP.x - dragState.offsetX;
      const rawCy = worldP.y - dragState.offsetY;
      const item = space.furniture.find((f) => f.id === dragState.id);
      if (item) {
        const clamped = clampFurniturePosition(item, rawCx, rawCy);
        onUpdateFurniture(dragState.id, { cx: clamped.x, cy: clamped.y });
      }
      return;
    }

    if (isPanning) {
      // 正在平移畫布 (1:1 精準像素換算，考量 SVG uniform aspect ratio)
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const aspectBox = viewW / viewH;
      const aspectCont = rect.width / rect.height;
      const worldPerPx = aspectBox > aspectCont ? viewW / rect.width : viewH / rect.height;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      setViewCenter({
        x: panStartRef.current.startCenterX - dx * worldPerPx,
        y: panStartRef.current.startCenterY - dy * worldPerPx,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
    setWallDragState(null);
    setDoorDragState(null);
    setUnitDragState(null);
    setRotateState(null);
  };

  // 隔間牆滑鼠點擊開始拖曳
  const handleWallMouseDown = (e, wallId, w) => {
    if (e.button !== 0) return;
    const isLocked = Boolean(w[7] || w[4] === 'e' || w[4] === 'b');
    e.stopPropagation();
    onSelectItem(wallId);

    if (isPlanLocked || isLocked) return;

    const minX = Math.min(w[0], w[2]);
    const maxX = Math.max(w[0], w[2]);
    const minY = Math.min(w[1], w[3]);
    const maxY = Math.max(w[1], w[3]);
    const isH = (maxX - minX) >= (maxY - minY);
    const worldP = screenToWorld(e.clientX, e.clientY);

    setWallDragState({
      id: wallId,
      startMinX: minX,
      startMinY: minY,
      startMouseX: worldP.x,
      startMouseY: worldP.y,
      width: maxX - minX,
      height: maxY - minY,
      isH,
    });
  };

  // 家具滑鼠拖曳
  const handleFurnitureMouseDown = (e, item) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectItem(item.id);

    if (isPlanLocked) return;

    const worldP = screenToWorld(e.clientX, e.clientY);
    setDragState({
      id: item.id,
      offsetX: worldP.x - item.cx,
      offsetY: worldP.y - item.cy,
    });
  };

  // 雙指距離
  const getTouchDist = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 觸控開始 (手機端核心：非家具處觸控一律平移畫布，支援任意左右滑動！)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 雙指捏合縮放
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      touchInfoRef.current = {
        ...touchInfoRef.current,
        initialDist: dist,
        initialZoom: zoom,
        isPinching: true,
      };
      setDragState(null);
      setWallDragState(null);
      setIsPanning(false);
    } else if (e.touches.length === 1 && !dragState && !wallDragState) {
      // 單指觸控畫布任意處 (地坪、背景、牆體) -> 立即平移
      setIsPanning(true);
      touchInfoRef.current = {
        ...touchInfoRef.current,
        startClientX: e.touches[0].clientX,
        startClientY: e.touches[0].clientY,
        startCenterX: viewCenter.x,
        startCenterY: viewCenter.y,
        isPinching: false,
      };
      onSelectItem(null);
    }
  };

  const handleTouchMove = (e) => {
    if (unitDragState && e.touches.length === 1) {
      // 觸控單指自由拖曳整棟戶型單元
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const deltaX = worldP.x - unitDragState.startMouseX;
      const deltaY = worldP.y - unitDragState.startMouseY;
      const newOx = Math.round((unitDragState.startOffsetX + deltaX) / 100) * 100;
      const newOy = Math.round((unitDragState.startOffsetY + deltaY) / 100) * 100;
      if (onUpdateUnitOffset) {
        onUpdateUnitOffset(unitDragState.unitId, [newOx, newOy]);
      }
      return;
    }

    if (rotateState && e.touches.length === 1) {
      // 觸控單指全角度旋轉
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const dx = worldP.x - rotateState.cx;
      const dy = worldP.y - rotateState.cy;
      let angleRad = Math.atan2(dy, dx);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      if (angleDeg < 0) angleDeg += 360;
      angleDeg = angleDeg % 360;

      if (rotateState.isDoor) {
        if (onUpdateDoor) onUpdateDoor(rotateState.id, { rot: angleDeg });
      } else {
        if (onUpdateFurniture) onUpdateFurniture(rotateState.id, { rot: angleDeg });
      }
      return;
    }

    if (touchInfoRef.current.isPinching && e.touches.length === 2) {
      // 雙指即時縮放
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / touchInfoRef.current.initialDist;
      setZoom(Math.min(Math.max(0.3, touchInfoRef.current.initialZoom * factor), 5));
      return;
    }

    if (wallDragState && e.touches.length === 1) {
      // 正在觸控 2D 任意拖曳隔間牆
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const deltaX = worldP.x - wallDragState.startMouseX;
      const deltaY = worldP.y - wallDragState.startMouseY;

      let newMinX = Math.round((wallDragState.startMinX + deltaX) / 50) * 50;
      let newMinY = Math.round((wallDragState.startMinY + deltaY) / 50) * 50;

      newMinX = Math.max(0, Math.min(L - wallDragState.width, newMinX));
      newMinY = Math.max(0, Math.min(W - wallDragState.height, newMinY));

      if (onUpdateWall) {
        onUpdateWall(wallDragState.id, {
          posX: newMinX,
          posY: newMinY,
        });
      }
      return;
    }

    if (doorDragState && e.touches.length === 1) {
      // 正在觸控 2D 拖曳門扇
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const deltaX = worldP.x - doorDragState.startMouseX;
      const deltaY = worldP.y - doorDragState.startMouseY;

      let newCx = Math.round((doorDragState.startCx + deltaX) / 50) * 50;
      let newCy = Math.round((doorDragState.startCy + deltaY) / 50) * 50;

      newCx = Math.max(300, Math.min(L - 300, newCx));
      newCy = Math.max(100, Math.min(W - 100, newCy));

      if (onUpdateDoor) {
        onUpdateDoor(doorDragState.id, {
          cx: newCx,
          cy: newCy,
        });
      }
      return;
    }

    if (dragState && e.touches.length === 1) {
      // 單指拖曳家具
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      const rawCx = worldP.x - dragState.offsetX;
      const rawCy = worldP.y - dragState.offsetY;

      const item = space.furniture.find((f) => f.id === dragState.id);
      if (item) {
        const clamped = clampFurniturePosition(item, rawCx, rawCy);
        onUpdateFurniture(dragState.id, { cx: clamped.x, cy: clamped.y });
      }
      return;
    }

    if (isPanning && e.touches.length === 1) {
      // 單指流暢左右/上下拉動畫布 (與手指 1:1 精確同步)
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const aspectBox = viewW / viewH;
      const aspectCont = rect.width / rect.height;
      const worldPerPx = aspectBox > aspectCont ? viewW / rect.width : viewH / rect.height;

      const dx = touch.clientX - touchInfoRef.current.startClientX;
      const dy = touch.clientY - touchInfoRef.current.startClientY;

      setViewCenter({
        x: touchInfoRef.current.startCenterX - dx * worldPerPx,
        y: touchInfoRef.current.startCenterY - dy * worldPerPx,
      });
    }
  };

  const handleTouchEnd = () => {
    touchInfoRef.current.isPinching = false;
    setIsPanning(false);
    setDragState(null);
    setWallDragState(null);
    setDoorDragState(null);
    setUnitDragState(null);
    setRotateState(null);
  };

  // 門扇滑鼠點擊開始拖曳 (解鎖模式下大門亦可自由拖曳調整位置)
  const handleDoorMouseDown = (e, doorId, door) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectItem(doorId);
    if (isPlanLocked) return;

    const [x0, y0, x1, y1] = door.rect || [0, 0, 900, 120];
    const doorCx = door.cx !== undefined ? door.cx : Math.round((x0 + x1) / 2);
    const doorCy = door.cy !== undefined ? door.cy : Math.round((y0 + y1) / 2);
    const worldP = screenToWorld(e.clientX, e.clientY);

    setDoorDragState({
      id: doorId,
      startCx: doorCx,
      startCy: doorCy,
      startMouseX: worldP.x,
      startMouseY: worldP.y,
    });
  };

  // 門扇觸控開始 (解鎖模式下大門亦可自由拖曳調整位置)
  const handleDoorTouchStart = (e, doorId, door) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      onSelectItem(doorId);
      if (isPlanLocked) return;

      const [x0, y0, x1, y1] = door.rect || [0, 0, 900, 120];
      const doorCx = door.cx !== undefined ? door.cx : Math.round((x0 + x1) / 2);
      const doorCy = door.cy !== undefined ? door.cy : Math.round((y0 + y1) / 2);
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);

      setDoorDragState({
        id: doorId,
        startCx: doorCx,
        startCy: doorCy,
        startMouseX: worldP.x,
        startMouseY: worldP.y,
      });
    }
  };

  // 隔間牆觸控開始
  const handleWallTouchStart = (e, wallId, w) => {
    if (e.touches.length === 1) {
      const isLocked = Boolean(w[7] || w[4] === 'e' || w[4] === 'b');
      e.stopPropagation();
      onSelectItem(wallId);

      if (isPlanLocked || isLocked) return;

      const minX = Math.min(w[0], w[2]);
      const maxX = Math.max(w[0], w[2]);
      const minY = Math.min(w[1], w[3]);
      const maxY = Math.max(w[1], w[3]);
      const isH = (maxX - minX) >= (maxY - minY);
      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);

      setWallDragState({
        id: wallId,
        startMinX: minX,
        startMinY: minY,
        startMouseX: worldP.x,
        startMouseY: worldP.y,
        width: maxX - minX,
        height: maxY - minY,
        isH,
      });
    }
  };

  // 家具觸控開始
  const handleFurnitureTouchStart = (e, item) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      onSelectItem(item.id);

      if (isPlanLocked) return;

      const touch = e.touches[0];
      const worldP = screenToWorld(touch.clientX, touch.clientY);
      setDragState({
        id: item.id,
        offsetX: worldP.x - item.cx,
        offsetY: worldP.y - item.cy,
      });
    }
  };



  // 動態分區清單 (若空間內有自訂/辨識的房間則即時連動，否則使用預設分區)
  const dynamicZones = React.useMemo(() => {
    if (space.rooms && space.rooms.length > 1) {
      return space.rooms.map((r) => ({
        key: r.id,
        name: r.name,
        x: r.at ? r.at[0] : space.length / 2,
        y: r.at ? r.at[1] : space.width / 2,
      }));
    }
    return ZONES;
  }, [space.rooms, space.length, space.width]);

  // 快捷分區定位跳轉 (讓長條空間一鍵飛至對應區域，保持網址列純淨無 hash)
  const handleJumpToZone = (zone) => {
    setActiveZoneKey(zone.key);
    onSelectItem(zone.key); // 同步選中該房間
    const target = getRotatedPoint(zone.x, zone.y, currentRotation);
    setViewCenter(target);
    setZoom(isMobile ? 1.8 : 2.1);
  };

  // 計算距離當前視野中心最近的區域 (平移或點選均精確連動高亮！)
  const currentZoneKey = (() => {
    let closestKey = activeZoneKey || (dynamicZones[0]?.key || 'living_dining');
    let minDistance = Infinity;
    dynamicZones.forEach((z) => {
      const target = getRotatedPoint(z.x, z.y, currentRotation);
      const dx = viewCenter.x - target.x;
      const dy = viewCenter.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestKey = z.key;
      }
    });
    return closestKey;
  })();

  // 當前聚焦膠囊自動平滑居中滾動至可視區域 (手機版滾動條自動對齊)
  useEffect(() => {
    if (!zoneBarRef.current) return;
    const activeEl = zoneBarRef.current.querySelector(`[data-zone="${currentZoneKey}"]`);
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentZoneKey]);

  const getZonePillStyle = (zoneKey) => ({
    ...styles.zonePillBtn,
    ...(currentZoneKey === zoneKey
      ? {
        backgroundColor: '#ea580c',
        color: '#ffffff',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
      }
      : {}),
  });

  // 繪製工程尺寸線
  const renderDimensionLines = () => {
    if (!showDimensions) return null;

    const elements = [];
    const dimH = space.dimHorizontal || [L];
    const dimV = space.dimVertical || [W];

    let curX = 0;
    dimH.forEach((segLen, idx) => {
      const nextX = curX + segLen;
      const lineY = -450;
      elements.push(
        <g key={`dimH_${idx}`}>
          <line x1={curX} y1={lineY} x2={nextX} y2={lineY} stroke="#a8a29e" strokeWidth="2" />
          <line x1={curX - 25} y1={lineY + 25} x2={curX + 25} y2={lineY - 25} stroke="#57534e" strokeWidth="3" />
          <line x1={nextX - 25} y1={lineY + 25} x2={nextX + 25} y2={lineY - 25} stroke="#57534e" strokeWidth="3" />
          <line x1={curX} y1={-50} x2={curX} y2={lineY - 50} stroke="#d6d3d1" strokeWidth="1.5" strokeDasharray="6 6" />
          <text
            x={(curX + nextX) / 2}
            y={lineY - 20}
            fill="#1c1917"
            stroke="#ffffff"
            strokeWidth="12"
            paintOrder="stroke fill"
            fontSize="200"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {segLen}
          </text>
        </g>
      );
      curX = nextX;
    });

    elements.push(
      <g key="dimH_total">
        <line x1={0} y1={-850} x2={L} y2={-850} stroke="#78716c" strokeWidth="2.5" />
        <line x1={-30} y1={-850 + 30} x2={30} y2={-850 - 30} stroke="#1c1917" strokeWidth="3.5" />
        <line x1={L - 30} y1={-850 + 30} x2={L + 30} y2={-850 - 30} stroke="#1c1917" strokeWidth="3.5" />
        <text
          x={L / 2}
          y={-910}
          fill="#c2410c"
          stroke="#ffffff"
          strokeWidth="14"
          paintOrder="stroke fill"
          fontSize="240"
          fontWeight="800"
          textAnchor="middle"
          fontFamily="monospace"
        >
          總長 {L} mm ({(L / 1000).toFixed(2)} m)
        </text>
      </g>
    );

    let curY = 0;
    dimV.forEach((segLen, idx) => {
      const nextY = curY + segLen;
      const lineX = -450;
      elements.push(
        <g key={`dimV_${idx}`}>
          <line x1={lineX} y1={curY} x2={lineX} y2={nextY} stroke="#a8a29e" strokeWidth="2" />
          <line x1={lineX - 25} y1={curY + 25} x2={lineX + 25} y2={curY - 25} stroke="#57534e" strokeWidth="3" />
          <line x1={lineX - 25} y1={nextY + 25} x2={lineX + 25} y2={nextY - 25} stroke="#57534e" strokeWidth="3" />
          <line x1={-50} y1={curY} x2={lineX - 50} y2={curY} stroke="#d6d3d1" strokeWidth="1.5" strokeDasharray="6 6" />
          <text
            x={lineX - 35}
            y={(curY + nextY) / 2 + 60}
            fill="#1c1917"
            stroke="#ffffff"
            strokeWidth="12"
            paintOrder="stroke fill"
            fontSize="200"
            fontWeight="700"
            textAnchor="end"
            fontFamily="monospace"
          >
            {segLen}
          </text>
        </g>
      );
      curY = nextY;
    });

    elements.push(
      <g key="dimV_total">
        <line x1={-850} y1={0} x2={-850} y2={W} stroke="#78716c" strokeWidth="2.5" />
        <line x1={-850 - 30} y1={30} x2={-850 + 30} y2={-30} stroke="#1c1917" strokeWidth="3.5" />
        <line x1={-850 - 30} y1={W + 30} x2={-850 + 30} y2={W - 30} stroke="#1c1917" strokeWidth="3.5" />
        <text
          x={-910}
          y={W / 2}
          fill="#c2410c"
          stroke="#ffffff"
          strokeWidth="14"
          paintOrder="stroke fill"
          fontSize="240"
          fontWeight="800"
          textAnchor="middle"
          transform={`rotate(-90, -910, ${W / 2})`}
          fontFamily="monospace"
        >
          總寬 {W} mm ({(W / 1000).toFixed(2)} m)
        </text>
      </g>
    );

    return elements;
  };

  // 繪製家具
  const renderFurnitureItem = (f) => {
    const isSelected = f.id === selectedItemId;
    const halfW = f.w / 2;
    const halfD = f.d / 2;

    return (
      <g
        key={f.id}
        transform={`translate(${f.cx}, ${f.cy}) rotate(${f.rot || 0})`}
        onMouseDown={(e) => handleFurnitureMouseDown(e, f)}
        onTouchStart={(e) => handleFurnitureTouchStart(e, f)}
        style={{ cursor: isPlanLocked ? 'pointer' : 'move', touchAction: 'none' }}
      >
        {isSelected && (
          <g pointerEvents="none">
            <rect
              x={-halfW - 20}
              y={-halfD - 20}
              width={f.w + 40}
              height={f.d + 40}
              fill="none"
              stroke="#ea580c"
              strokeWidth="14"
              strokeDasharray="24 16"
              rx="10"
            />
          </g>
        )}

        {f.type === 'stairs' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#faebd7" stroke="#8c6d48" strokeWidth="10" rx="4" />
            <line x1={-halfW} y1={0} x2={halfW} y2={0} stroke="#6b4423" strokeWidth="14" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`up_${i}`} x1={-halfW + (f.w / 12) * i} y1={-halfD} x2={-halfW + (f.w / 12) * i} y2={0} stroke="#b08968" strokeWidth="4" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`dn_${i}`} x1={-halfW + (f.w / 12) * i} y1={0} x2={-halfW + (f.w / 12) * i} y2={halfD} stroke="#b08968" strokeWidth="4" />
            ))}
            <text x={-halfW + 300} y={halfD / 2 + 35} fill="#1e3a8a" fontSize="120" fontWeight="bold">DN ➔ (下樓起步)</text>
            <text x={halfW - 950} y={-halfD / 2 + 35} fill="#c2410c" fontSize="120" fontWeight="bold">⬅ UP (上樓抵達)</text>
          </g>
        ) : f.type === 'toilet_wash_tank' ? (
          /* 日本正統水箱洗手免治馬桶 (沖水時洗手流進水箱二次利用) */
          <g>
            {/* 馬桶水箱外框 */}
            <rect x={-halfW * 0.95} y={-halfD} width={f.w * 0.95} height={f.d * 0.32} fill="#e2e8f0" stroke="#475569" strokeWidth="6" rx="8" />
            {/* 水箱頂部凹入洗手盆 */}
            <ellipse cx={0} cy={-halfD + f.d * 0.16} rx={halfW * 0.55} ry={f.d * 0.1} fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" />
            {/* 洗手鵝頸水龍頭 */}
            <circle cx={0} cy={-halfD + f.d * 0.08} r="16" fill="#0284c7" />
            <path d={`M 0 ${-halfD + f.d * 0.08} Q 0 ${-halfD + f.d * 0.14} 0 ${-halfD + f.d * 0.18}`} stroke="#0284c7" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* 出水水花波紋 */}
            <circle cx={0} cy={-halfD + f.d * 0.18} r="8" fill="#38bdf8" />
            {/* 免治馬桶座圈與外盆 */}
            <ellipse cx={0} cy={halfD * 0.35} rx={halfW * 0.9} ry={halfD * 0.55} fill="#ffffff" stroke="#64748b" strokeWidth="6" />
            <ellipse cx={0} cy={halfD * 0.4} rx={halfW * 0.55} ry={halfD * 0.35} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="4" />
            <text x={0} y={-halfD - 15} fill="#0284c7" fontSize="55" fontWeight="bold" textAnchor="middle">💧水箱洗手</text>
          </g>
        ) : f.type === 'toilet' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d * 0.3} fill="#e2e8f0" stroke="#64748b" strokeWidth="6" rx="6" />
            <ellipse cx={0} cy={halfD * 0.3} rx={halfW * 0.88} ry={halfD * 0.55} fill="#ffffff" stroke="#64748b" strokeWidth="6" />
            <ellipse cx={0} cy={halfD * 0.35} rx={halfW * 0.55} ry={halfD * 0.35} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="4" />
          </g>
        ) : f.type === 'washer' ? (
          /* 熱泵滾筒洗脫烘洗衣機 (工作陽台核心) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f8fafc" stroke="#475569" strokeWidth="6" rx="10" />
            {/* 洗劑盒 */}
            <rect x={-halfW + 40} y={-halfD + 40} width={f.w * 0.35} height={70} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" rx="4" />
            {/* 觸控旋鈕與指示燈 */}
            <circle cx={halfW - 90} cy={-halfD + 75} r="28" fill="#334155" stroke="#64748b" strokeWidth="3" />
            <circle cx={halfW - 90} cy={-halfD + 75} r="12" fill="#38bdf8" />
            {/* 滾筒前開透視窗 */}
            <circle cx={0} cy={halfD * 0.22} r={halfW * 0.58} fill="#1e293b" opacity="0.1" stroke="#334155" strokeWidth="12" />
            <circle cx={0} cy={halfD * 0.22} r={halfW * 0.42} fill="#bae6fd" opacity="0.3" stroke="#0284c7" strokeWidth="4" strokeDasharray="16 10" />
            <circle cx={halfW * 0.25} cy={halfD * 0.22} r="12" fill="#64748b" />
          </g>
        ) : f.type === 'laundry_sink' ? (
          /* 工作陽台深型洗衣水槽 */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f1f5f9" stroke="#475569" strokeWidth="6" rx="8" />
            <rect x={-halfW + 50} y={-halfD + 50} width={f.w - 100} height={f.d - 100} fill="#cbd5e1" stroke="#64748b" strokeWidth="4" rx="8" />
            <circle cx={0} cy={-halfD + 80} r="18" fill="#0284c7" />
            <circle cx={0} cy={0} r="25" fill="#94a3b8" />
          </g>
        ) : f.type === 'vanity' ? (
          /* 獨立洗面化妝台 */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#ffffff" stroke="#475569" strokeWidth="6" rx="6" />
            <ellipse cx={0} cy={0} rx={halfW * 0.65} ry={halfD * 0.55} fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" />
            <circle cx={0} cy={-halfD + 75} r="18" fill="#0284c7" />
          </g>
        ) : f.type === 'japan_tub' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f8fafc" stroke="#0284c7" strokeWidth="8" rx="18" />
            <rect x={-halfW + 50} y={-halfD + 50} width={f.w - 100} height={f.d - 100} fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" rx="14" />
            <circle cx={halfW - 120} cy={0} r="30" fill="#0284c7" />
          </g>
        ) : f.type === 'shower_bench' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="6" strokeDasharray="14 10" rx="8" />
            <circle cx={0} cy={0} r="45" fill="#bae6fd" stroke="#0284c7" strokeWidth="4" />
            <circle cx={0} cy={0} r="18" fill="#0284c7" />
          </g>
        ) : f.type === 'bed' ? (
          /* 精美大床 (含床架、床頭板、床墊、雙枕頭/單枕頭與被褥折疊線) */
          <g>
            {/* 床架底座 */}
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f5f5f4" stroke="#78716c" strokeWidth="6" rx="10" />
            {/* 床頭板 */}
            <rect x={-halfW} y={-halfD} width={f.w} height={120} fill="#44403c" stroke="#292524" strokeWidth="5" rx="6" />
            {/* 舒適床墊 */}
            <rect x={-halfW + 40} y={-halfD + 130} width={f.w - 80} height={f.d - 170} fill="#ffffff" stroke="#d6d3d1" strokeWidth="4" rx="8" />
            {f.w < 1200 ? (
              /* 單人床單枕頭 */
              <rect x={-f.w * 0.25} y={-halfD + 170} width={f.w * 0.5} height={280} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" rx="14" />
            ) : (
              /* 雙人床/加大雙人床雙枕頭 */
              <>
                <rect x={-halfW + 90} y={-halfD + 170} width={f.w * 0.38} height={280} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" rx="14" />
                <rect x={halfW - 90 - f.w * 0.38} y={-halfD + 170} width={f.w * 0.38} height={280} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" rx="14" />
              </>
            )}
            {/* 高級羽絨被褥與折疊邊緣 */}
            <rect x={-halfW + 55} y={-halfD + 520} width={f.w - 110} height={f.d - 570} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="3" rx="6" />
            <line x1={-halfW + 55} y1={-halfD + 520} x2={halfW - 55} y2={-halfD + 520} stroke="#78716c" strokeWidth="6" strokeLinecap="round" />
          </g>
        ) : f.type === 'wardrobe' ? (
          /* 頂天大衣櫃 (含滑門分割線、掛衣桿與金屬把手) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#44403c" stroke="#1c1917" strokeWidth="6" rx="4" />
            {/* 內部掛衣桿 */}
            <line x1={-halfW + 60} y1={0} x2={halfW - 60} y2={0} stroke="#a8a29e" strokeWidth="3" strokeDasharray="20 14" />
            {/* 滑門中分線 */}
            <line x1={0} y1={-halfD} x2={0} y2={halfD} stroke="#78716c" strokeWidth="6" />
            {/* 門把手 */}
            <line x1={-30} y1={-halfD + 80} x2={-30} y2={-halfD + 260} stroke="#e7e5e4" strokeWidth="8" strokeLinecap="round" />
            <line x1={30} y1={-halfD + 80} x2={30} y2={-halfD + 260} stroke="#e7e5e4" strokeWidth="8" strokeLinecap="round" />
          </g>
        ) : f.type === 'desk' ? (
          /* 實木工作書桌 (含原木紋理邊框、走線孔與筆電圖示) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#d4b996" stroke="#854d0e" strokeWidth="6" rx="6" />
            {/* 桌面理線孔 */}
            <circle cx={halfW - 80} cy={-halfD + 80} r="20" fill="#78716c" />
            {/* 辦公筆記型電腦圖示 */}
            <rect x={-140} y={-90} width={280} height={180} fill="#334155" stroke="#0f172a" strokeWidth="4" rx="6" />
            <rect x={-110} y={-70} width={220} height={120} fill="#38bdf8" opacity="0.4" rx="2" />
          </g>
        ) : f.type === 'bookcase' ? (
          /* 多層組合書架 */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#e7e5e4" stroke="#57534e" strokeWidth="6" rx="4" />
            <line x1={-halfW * 0.33} y1={-halfD} x2={-halfW * 0.33} y2={halfD} stroke="#78716c" strokeWidth="4" />
            <line x1={halfW * 0.33} y1={-halfD} x2={halfW * 0.33} y2={halfD} stroke="#78716c" strokeWidth="4" />
          </g>
        ) : f.type === 'ksink' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#e2e8f0" stroke="#475569" strokeWidth="6" rx="4" />
            <rect x={-halfW + 60} y={-halfD + 60} width={f.w - 120} height={f.d - 120} fill="#cbd5e1" stroke="#64748b" strokeWidth="4" rx="8" />
            <circle cx={0} cy={0} r="35" fill="#94a3b8" />
            <circle cx={0} cy={-halfD + 80} r="18" fill="#334155" />
          </g>
        ) : f.type === 'stove' ? (
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#1e293b" stroke="#0f172a" strokeWidth="6" rx="6" />
            <circle cx={-halfW * 0.45} cy={0} r={halfD * 0.38} fill="none" stroke="#f97316" strokeWidth="5" />
            <circle cx={halfW * 0.45} cy={0} r={halfD * 0.38} fill="none" stroke="#f97316" strokeWidth="5" />
          </g>
        ) : f.type === 'sofa' || f.type === 'cornersofa' ? (
          /* 高級羽絨獨立筒三人沙發 (含厚實後靠背、雙側扶手與三個獨立坐墊，坐墊朝向正面 +halfD) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#78716c" stroke="#44403c" strokeWidth="6" rx="10" />
            {/* 後靠背 (位於負 Y 側) */}
            <rect x={-halfW + 40} y={-halfD + 30} width={f.w - 80} height={f.d * 0.3} fill="#57534e" stroke="#292524" strokeWidth="4" rx="8" />
            {/* 左側扶手 */}
            <rect x={-halfW + 30} y={-halfD + 40} width={f.w * 0.1} height={f.d - 70} fill="#57534e" stroke="#292524" strokeWidth="4" rx="6" />
            {/* 右側扶手 */}
            <rect x={halfW - 30 - f.w * 0.1} y={-halfD + 40} width={f.w * 0.1} height={f.d - 70} fill="#57534e" stroke="#292524" strokeWidth="4" rx="6" />
            {/* 三個柔軟坐墊 (朝向正 Y 側) */}
            {Array.from({ length: 3 }).map((_, i) => {
              const padW = (f.w - 80 - f.w * 0.22) / 3;
              const padX = -halfW + 40 + f.w * 0.11 + i * padW;
              return (
                <rect
                  key={`sofa_pad_${i}`}
                  x={padX + 10}
                  y={-halfD + f.d * 0.35 + 10}
                  width={padW - 20}
                  height={f.d * 0.55 - 20}
                  fill="#a8a29e"
                  stroke="#57534e"
                  strokeWidth="3"
                  rx="6"
                />
              );
            })}
          </g>
        ) : f.type === 'armchair' ? (
          /* Karimoku 單人休閒沙發椅 (含靠背與扶手，坐墊朝向正面 +halfD) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#c2410c" stroke="#7c2d12" strokeWidth="5" rx="8" />
            {/* 後靠背 */}
            <rect x={-halfW + 50} y={-halfD + 30} width={f.w - 100} height={f.d * 0.3} fill="#9a3412" rx="6" />
            {/* 左右木質扶手 */}
            <rect x={-halfW + 25} y={-halfD + 40} width={50} height={f.d - 80} fill="#431407" rx="4" />
            <rect x={halfW - 75} y={-halfD + 40} width={50} height={f.d - 80} fill="#431407" rx="4" />
            {/* 坐墊 */}
            <rect x={-halfW + 85} y={-halfD + f.d * 0.36 + 10} width={f.w - 170} height={f.d * 0.55 - 20} fill="#ea580c" rx="6" />
          </g>
        ) : f.type === 'sofa_l' ? (
          /* 高級北歐棉麻布藝 L型轉角沙發 (主座深 950 + 貴妃長 1600，右下角完全透空，杜絕床鋪感) */
          (() => {
            const chaiseW = Math.round(f.w * 0.38); // 約 1020mm
            const mainD = Math.round(f.d * 0.6);   // 主座進深約 960mm
            const p0 = `M ${-halfW + 16} ${-halfD}`;
            const p1 = `H ${halfW - 16} Q ${halfW} ${-halfD} ${halfW} ${-halfD + 16}`;
            const p2 = `V ${-halfD + mainD - 16} Q ${halfW} ${-halfD + mainD} ${halfW - 16} ${-halfD + mainD}`;
            const p3 = `H ${-halfW + chaiseW + 16} Q ${-halfW + chaiseW} ${-halfD + mainD} ${-halfW + chaiseW} ${-halfD + mainD + 16}`;
            const p4 = `V ${halfD - 16} Q ${-halfW + chaiseW} ${halfD} ${-halfW + chaiseW - 16} ${halfD}`;
            const p5 = `H ${-halfW + 16} Q ${-halfW} ${halfD} ${-halfW} ${halfD - 16}`;
            const p6 = `V ${-halfD + 16} Q ${-halfW} ${-halfD} ${-halfW + 16} ${-halfD} Z`;
            const lPath = `${p0} ${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`;

            const backD = 180;
            const armW = 140;
            const mainSeatsCount = 2;
            const mainSeatWidth = (f.w - chaiseW - armW - 20) / mainSeatsCount;

            return (
              <g>
                {/* L型底座主輪廓 (暖灰棉麻布藝，右下角完全透空) */}
                <path d={lPath} fill="#57534e" stroke="#292524" strokeWidth="6" />

                {/* 橫向厚實後靠背 */}
                <rect
                  x={-halfW + armW}
                  y={-halfD + 15}
                  width={f.w - armW * 2}
                  height={backD}
                  fill="#44403c"
                  stroke="#292524"
                  strokeWidth="3"
                  rx="8"
                />

                {/* 左側貴妃榻後背與扶手 */}
                <rect
                  x={-halfW + 15}
                  y={-halfD + 15}
                  width={armW}
                  height={f.d - 30}
                  fill="#44403c"
                  stroke="#292524"
                  strokeWidth="3"
                  rx="8"
                />

                {/* 右側主座扶手 */}
                <rect
                  x={halfW - armW - 15}
                  y={-halfD + 15}
                  width={armW}
                  height={mainD - 30}
                  fill="#44403c"
                  stroke="#292524"
                  strokeWidth="3"
                  rx="8"
                />

                {/* 貴妃榻長躺墊 */}
                <rect
                  x={-halfW + armW + 15}
                  y={-halfD + backD + 15}
                  width={chaiseW - armW - 25}
                  height={f.d - backD - 45}
                  fill="#78716c"
                  stroke="#44403c"
                  strokeWidth="3"
                  rx="10"
                />

                {/* 主座雙人坐墊 */}
                {Array.from({ length: mainSeatsCount }).map((_, idx) => (
                  <rect
                    key={`sofa_l_pad_${idx}`}
                    x={-halfW + chaiseW + 10 + idx * mainSeatWidth}
                    y={-halfD + backD + 15}
                    width={mainSeatWidth - 15}
                    height={mainD - backD - 35}
                    fill="#78716c"
                    stroke="#44403c"
                    strokeWidth="3"
                    rx="10"
                  />
                ))}

                {/* 跳色抱枕 1 (米白色羽絨抱枕) */}
                <rect
                  x={-halfW + armW + 25}
                  y={-halfD + backD + 25}
                  width="180"
                  height="180"
                  fill="#f5f5f4"
                  stroke="#d6d3d1"
                  strokeWidth="2"
                  rx="6"
                  transform={`rotate(12, ${-halfW + armW + 115}, ${-halfD + backD + 115})`}
                />

                {/* 跳色抱枕 2 (愛馬仕暖橙抱枕) */}
                <rect
                  x={halfW - armW - 200}
                  y={-halfD + backD + 25}
                  width="180"
                  height="180"
                  fill="#ea580c"
                  stroke="#c2410c"
                  strokeWidth="2"
                  rx="6"
                  transform={`rotate(-8, ${halfW - armW - 110}, ${-halfD + backD + 115})`}
                />
              </g>
            );
          })()
        ) : f.type === 'dining_table' ? (
          /* 實木長餐桌椅組 (標註「餐桌」) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#fef3c7" stroke="#b45309" strokeWidth="6" rx="8" />
            <rect x={-halfW + 120} y={-halfD - 110} width={380} height={90} fill="#d97706" rx="6" />
            <rect x={halfW - 500} y={-halfD - 110} width={380} height={90} fill="#d97706" rx="6" />
            <rect x={-halfW + 120} y={halfD + 20} width={380} height={90} fill="#d97706" rx="6" />
            <rect x={halfW - 500} y={halfD + 20} width={380} height={90} fill="#d97706" rx="6" />
          </g>
        ) : f.type === 'officechair' ? (
          /* Aeron 旗艦人體工學椅 */
          <g>
            <circle cx={0} cy={0} r={halfW * 0.82} fill="#334155" stroke="#1e293b" strokeWidth="5" />
            <rect x={-halfW * 0.75} y={-halfD * 0.8} width={f.w * 0.75} height={f.d * 0.3} fill="#1e293b" rx="6" />
            <rect x={-halfW * 0.6} y={-halfD * 0.2} width={f.w * 0.6} height={f.d * 0.6} fill="#475569" rx="6" />
          </g>
        ) : f.type === 'fridge' ? (
          /* 雙門變頻大電冰箱 (標註「冰箱」) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#e2e8f0" stroke="#475569" strokeWidth="6" rx="6" />
            <line x1={-halfW + 20} y1={0} x2={halfW - 20} y2={0} stroke="#94a3b8" strokeWidth="4" />
            <rect x={halfW - 35} y={-halfD + 40} width={15} height={halfD - 60} fill="#475569" rx="3" />
            <rect x={halfW - 35} y={20} width={15} height={halfD - 60} fill="#475569" rx="3" />
          </g>
        ) : f.type === 'kitchen_counter' ? (
          /* 廚房大料理檯面 (含水槽與瓦斯爐) */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#f1f5f9" stroke="#334155" strokeWidth="6" rx="4" />
            <rect x={-halfW + 80} y={-halfD + 60} width={680} height={f.d - 120} fill="#cbd5e1" stroke="#64748b" strokeWidth="4" rx="6" />
            <circle cx={-halfW + 420} cy={0} r="25" fill="#94a3b8" />
            <circle cx={halfW - 400} cy={0} r={f.d * 0.28} fill="none" stroke="#f97316" strokeWidth="5" />
            <circle cx={halfW - 140} cy={0} r={f.d * 0.28} fill="none" stroke="#f97316" strokeWidth="5" />
          </g>
        ) : f.type === 'tvstand' ? (
          /* 石材電視矮櫃 */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#44403c" stroke="#1c1917" strokeWidth="6" rx="4" />
            <rect x={-halfW + 30} y={-halfD + 30} width={f.w - 60} height={f.d - 60} fill="#57534e" stroke="#292524" strokeWidth="3" rx="2" />
            <line x1={0} y1={-halfD + 30} x2={0} y2={halfD - 30} stroke="#292524" strokeWidth="4" />
          </g>
        ) : f.type === 'tv' ? (
          /* Sony 75吋 OLED 電視 */
          <g>
            <rect x={-halfW} y={-halfD} width={f.w} height={f.d} fill="#09090b" stroke="#0284c7" strokeWidth="4" rx="2" />
            <line x1={-halfW + 40} y1={0} x2={halfW - 40} y2={0} stroke="#38bdf8" strokeWidth="4" />
          </g>
        ) : f.type === 'chair' ? (
          /* 實木靠背旋轉椅 (靠背在 -halfD 側，清晰指示坐向) */
          <g>
            <circle cx={0} cy={0} r={halfW * 0.8} fill="#d4b996" stroke="#854d0e" strokeWidth="4" />
            <rect x={-halfW * 0.75} y={-halfD * 0.82} width={f.w * 0.75} height={f.d * 0.28} fill="#78350f" rx="4" />
            <circle cx={0} cy={halfD * 0.15} r={halfW * 0.45} fill="#fef3c7" />
          </g>
        ) : f.type === 'rug' ? (
          /* 羊毛地毯 */
          <rect
            x={-halfW}
            y={-halfD}
            width={f.w}
            height={f.d}
            fill="#e7e5e4"
            stroke="#a8a29e"
            strokeWidth="3"
            strokeDasharray="16 10"
            rx="12"
          />
        ) : (
          <rect
            x={-halfW}
            y={-halfD}
            width={f.w}
            height={f.d}
            fill={f.color || '#a8a29e'}
            stroke="#44403c"
            strokeWidth="6"
            rx="8"
          />
        )}

        {/* 精簡短標籤 (大於 500mm 才顯示短標籤，防止擠疊) */}
        {f.w >= 500 && f.d >= 350 && f.type !== 'stairs' && (
          <text
            x={0}
            y={25}
            fill="#1c1917"
            stroke="#ffffff"
            strokeWidth="6"
            paintOrder="stroke fill"
            fontSize={Math.min(75, f.w / 6)}
            fontWeight="700"
            textAnchor="middle"
            pointerEvents="none"
            style={{ userSelect: 'none' }}
          >
            {f.name.replace(/(無印良品|國際牌|Cleanup|TOTO|林內|櫻花|HAY)\s*/g, '')}
          </text>
        )}

        {/* 選中時在頂部浮現真實商品與尺寸氣泡 */}
        {isSelected && (
          <g pointerEvents="none" transform={`translate(0, ${-halfD - 45})`}>
            <rect
              x="-260"
              y="-70"
              width="520"
              height="65"
              rx="10"
              fill="#1c1917"
              stroke="#ea580c"
              strokeWidth="3"
            />
            <text x="0" y="-28" fill="#ffffff" fontSize="46" fontWeight="700" textAnchor="middle">
              {f.brand ? `${f.brand} · ` : ''}{f.w}×{f.d}mm · {Math.round(f.rot || 0)}°
            </text>
          </g>
        )}

        {/* 選中時於頂部延伸旋轉控制握把 (支援滑鼠與手指全角度直接旋轉) */}
        {isSelected && !isPlanLocked && (
          <g className="furniture-rotation-handle-group">
            <line
              x1="0"
              y1={-halfD}
              x2="0"
              y2={-halfD - 350}
              stroke="#ea580c"
              strokeWidth="12"
              strokeDasharray="16 12"
            />
            {/* 握把外圍觸控大熱區 */}
            <circle
              cx="0"
              cy={-halfD - 350}
              r="140"
              fill="rgba(234, 88, 12, 0.25)"
            />
            {/* 握把實體按鈕 */}
            <circle
              cx="0"
              cy={-halfD - 350}
              r="85"
              fill="#ea580c"
              stroke="#ffffff"
              strokeWidth="10"
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => handleRotateMouseDown(e, f, false)}
              onTouchStart={(e) => handleRotateTouchStart(e, f, false)}
            />
            <text
              x="0"
              y={-halfD - 322}
              fill="#ffffff"
              fontSize="85"
              fontWeight="900"
              textAnchor="middle"
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              ↻
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 快速分區導航膠囊列 (支援動態房間分區切換與出廠格局導航) */}
      <div
        ref={zoneBarRef}
        style={styles.zoneNavPillBar}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {dynamicZones.map((zone) => (
          <button
            key={zone.key}
            data-zone={zone.key}
            onClick={() => handleJumpToZone(zone)}
            style={getZonePillStyle(zone.key)}
          >
            {zone.name}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        style={styles.svg}
        viewBox={`${minX} ${minY} ${viewW} ${viewH}`}
      >
        <defs>
          <pattern id="bg-grid-pat" width="500" height="500" patternUnits="userSpaceOnUse">
            <path d="M 500 0 L 0 0 0 500" fill="none" stroke="#f0ede6" strokeWidth="3" />
          </pattern>
          {/* 承重柱/剪力結構專用建築鋼筋斜線紋理 */}
          <pattern id="bearing-hatch" width="40" height="40" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#18181b" strokeWidth="14" />
            <rect x="0" y="0" width="40" height="40" fill="#3f3f46" opacity="0.85" />
          </pattern>
          {/* 戶外樓梯斜紋 */}
          <pattern id="outdoor-stair-hatch" width="50" height="50" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="50" stroke="#cbd5e1" strokeWidth="6" />
          </pattern>
          <marker
            id="arrow-entry"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
          </marker>
        </defs>

        {/* 全域旋轉容器 (支援 0°, 90°, 180°, 270° 一鍵橫向/直向轉向，連動逆向坐標映射) */}
        <g ref={rotGroupRef} transform={`rotate(${currentRotation}, ${L / 2}, ${W / 2})`}>
          {showGrid && (
            <rect
              id="bg-grid"
              x={-margin * 3}
              y={-margin * 3}
              width={L + margin * 6}
              height={W + margin * 6}
              fill="url(#bg-grid-pat)"
            />
          )}

          {/* 當前活躍編輯方案 (套用 spaceOx, spaceOy 世界位移，支援任意拉動拖曳) */}
          <g id="active-space-group" transform={`translate(${spaceOx}, ${spaceOy})`}>
            {/* 👑 當前活躍方案銘牌與拖曳把手 */}
            <g
              transform="translate(0, -680)"
              onMouseDown={(e) => handleUnitDragStart(e, space)}
              onTouchStart={(e) => handleUnitTouchStart(e, space)}
              style={{ cursor: unitDragState?.unitId === space.id ? 'grabbing' : 'grab' }}
            >
              <rect
                x="0"
                y="0"
                width={Math.max(L, 5000)}
                height="480"
                rx="24"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="12"
                filter="drop-shadow(0 8px 24px rgba(0,0,0,0.35))"
              />
              <text x="200" y="300" fill="#ffffff" fontSize="220" fontWeight="900">
                {`👑 當前方案：${space.name}`}
              </text>
              <rect
                x={Math.max(L, 5000) - 1900}
                y="60"
                width="1750"
                height="360"
                rx="18"
                fill="#0284c7"
              />
              <text
                x={Math.max(L, 5000) - 1025}
                y="300"
                fill="#ffffff"
                fontSize="190"
                fontWeight="900"
                textAnchor="middle"
              >
                ✥ 按住拖曳移動
              </text>
            </g>

            {/* 房間地坪與自訂空間分區 */}
            {space.rooms?.map((rm) => {
              const pts = rm.poly.map((p) => p.join(',')).join(' ');
              const mat = FLOOR_MATERIALS[rm.mat] || FLOOR_MATERIALS.wood;
              const isSelected = selectedItemId === rm.id;
              const areaM2 = rm.areaM2 || Number(calculatePolygonAreaM2(rm.poly).toFixed(1));
              const areaPing = rm.areaPing || Number((areaM2 * 0.3025).toFixed(1));

              return (
                <g
                  key={rm.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(rm.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <polygon
                    points={pts}
                    fill={isSelected ? '#fdba74' : mat.color}
                    opacity={isSelected ? '0.65' : '0.42'}
                    stroke={isSelected ? '#ea580c' : '#d6d3d1'}
                    strokeWidth={isSelected ? '14' : '3'}
                    strokeDasharray={isSelected ? '24 16' : 'none'}
                  />
                  {rm.id === 'stairs_outdoor' && (
                    <g pointerEvents="none">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <line
                          key={`stair_step_${i}`}
                          x1={2770}
                          y1={250 + i * 400}
                          x2={5300}
                          y2={250 + i * 400}
                          stroke="#cbd5e1"
                          strokeWidth="4"
                          strokeDasharray="14 8"
                        />
                      ))}
                    </g>
                  )}
                  {showRoomLabels && rm.at && (
                    <g
                      transform={`translate(${rm.at[0]}, ${rm.at[1]})`}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x="-270"
                        y="-70"
                        width="540"
                        height="140"
                        rx="22"
                        fill={isSelected ? '#ea580c' : 'rgba(255, 255, 255, 0.95)'}
                        stroke={isSelected ? '#ffffff' : '#d6d3d1'}
                        strokeWidth={isSelected ? '8' : '3'}
                        filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
                      />
                      <text
                        x="0"
                        y="-10"
                        fill={isSelected ? '#ffffff' : '#1c1917'}
                        fontSize="75"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {rm.name}
                      </text>
                      <text
                        x="0"
                        y="45"
                        fill={isSelected ? '#ffedd5' : '#78716c'}
                        fontSize="50"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {areaM2} m² · {areaPing} 坪
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 牆體渲染 (結構固定承重外牆 vs 可自由拖曳室內隔間牆，支援斜角隔間) */}
            {space.walls?.map((w, idx) => {
              const [x0, y0, x1, y1, type, id, name, isLocked] = w;
              const wallId = id || (type === 'n' ? `wall_n_${idx}` : `wall_${type}_${idx}`);
              const isSelected = selectedItemId === wallId;
              const isBearing = type === 'b';
              const isExterior = type === 'e';

              const minX = Math.min(x0, x1);
              const maxX = Math.max(x0, x1);
              const minY = Math.min(y0, y1);
              const maxY = Math.max(y0, y1);
              const ww = Math.abs(maxX - minX);
              const wh = Math.abs(maxY - minY);
              const isH = ww >= wh;
              const isDiagonal = ww > 200 && wh > 200;

              if (isBearing) {
                return (
                  <g
                    key={wallId}
                    onClick={() => onSelectItem(wallId)}
                    style={{ cursor: 'not-allowed' }}
                  >
                    <rect
                      x={minX}
                      y={minY}
                      width={ww}
                      height={wh}
                      fill="url(#bearing-hatch)"
                      stroke="#18181b"
                      strokeWidth="8"
                    />
                    <title>{name || '🔒 承重柱/結構主體 (嚴禁拆改)'}</title>
                  </g>
                );
              }

              if (isExterior) {
                return (
                  <g
                    key={wallId}
                    onClick={() => onSelectItem(wallId)}
                    style={{ cursor: 'not-allowed' }}
                  >
                    <rect
                      x={minX}
                      y={minY}
                      width={ww}
                      height={wh}
                      fill="#27272a"
                      stroke="#09090b"
                      strokeWidth="8"
                    />
                    <title>{name || '🔒 建築外牆 (固定不可動)'}</title>
                  </g>
                );
              }

              // 室內斜角隔間牆 (例如主臥 w_master_chamfer 斜切動線)
              if (isDiagonal) {
                return (
                  <g
                    key={wallId}
                    onMouseDown={(e) => handleWallMouseDown(e, wallId, w)}
                    onTouchStart={(e) => handleWallTouchStart(e, wallId, w)}
                    style={{ cursor: isPlanLocked ? 'pointer' : 'move' }}
                  >
                    {/* 寬幅隱形點擊/觸控熱區 */}
                    <line
                      x1={x0}
                      y1={y0}
                      x2={x1}
                      y2={y1}
                      stroke="transparent"
                      strokeWidth="240"
                      strokeLinecap="round"
                    />
                    {/* 斜角隔間實體 */}
                    <line
                      x1={x0}
                      y1={y0}
                      x2={x1}
                      y2={y1}
                      stroke={isSelected ? '#ea580c' : '#71717a'}
                      strokeWidth={isSelected ? '140' : '120'}
                      strokeLinecap="round"
                    />
                    {isSelected && (
                      <g pointerEvents="none">
                        <line
                          x1={x0}
                          y1={y0}
                          x2={x1}
                          y2={y1}
                          stroke="#ea580c"
                          strokeWidth="160"
                          strokeDasharray="24 16"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <g transform={`translate(${(x0 + x1) / 2}, ${(y0 + y1) / 2})`}>
                          <rect
                            x="-250"
                            y="-42"
                            width="500"
                            height="84"
                            rx="14"
                            fill="rgba(234, 88, 12, 0.95)"
                            stroke="#ffffff"
                            strokeWidth="4"
                          />
                          <text x="0" y="8" fill="#ffffff" fontSize="44" fontWeight="800" textAnchor="middle">
                            {`✦ ${name || '斜角隔間牆'}`}
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              }

              // 室內非承重矩形輕隔間牆 (可自由選取、平移拖曳、刪除)
              return (
                <g
                  key={wallId}
                  onMouseDown={(e) => handleWallMouseDown(e, wallId, w)}
                  onTouchStart={(e) => handleWallTouchStart(e, wallId, w)}
                  style={{
                    cursor: isPlanLocked ? 'pointer' : 'move',
                  }}
                >
                  {/* 寬幅隱形點擊/觸控熱區 (增加 60px 邊界更易抓取) */}
                  <rect
                    x={isH ? minX : minX - 60}
                    y={isH ? minY - 60 : minY}
                    width={isH ? ww : ww + 120}
                    height={isH ? wh + 120 : wh}
                    fill="transparent"
                  />

                  {/* 隔間牆實體 */}
                  <rect
                    x={minX}
                    y={minY}
                    width={ww}
                    height={wh}
                    fill={isSelected ? '#ea580c' : '#71717a'}
                    stroke={isSelected ? '#c2410c' : '#52525b'}
                    strokeWidth={isSelected ? '8' : '4'}
                    rx="2"
                  />

                  {/* 選中高亮虛線框與坐標徽章 */}
                  {isSelected && (
                    <g pointerEvents="none">
                      <rect
                        x={minX - 16}
                        y={minY - 16}
                        width={ww + 32}
                        height={wh + 32}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="8"
                        strokeDasharray="24 12"
                        rx="6"
                      />
                      {/* 中央標籤與坐標徽章 */}
                      <g transform={`translate(${minX + ww / 2}, ${minY + wh / 2})`}>
                        <rect
                          x="-250"
                          y="-42"
                          width="500"
                          height="84"
                          rx="14"
                          fill="rgba(234, 88, 12, 0.95)"
                          stroke="#ffffff"
                          strokeWidth="4"
                        />
                        <text x="0" y="8" fill="#ffffff" fontSize="44" fontWeight="800" textAnchor="middle">
                          {`✦ ${name || '隔間牆'} · (${Math.round(minX)}, ${Math.round(minY)})`}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 窗戶 (採用橘色醒目線條) */}
            {space.windows?.map((win, idx) => {
              const [x0, y0, x1, y1] = win;
              const wx = Math.min(x0, x1);
              const wy = Math.min(y0, y1);
              const ww = Math.abs(x1 - x0);
              const wh = Math.abs(y1 - y0);
              return (
                <g key={`win_${idx}`}>
                  <rect x={wx} y={wy} width={ww} height={wh} fill="#ffedd5" stroke="#ea580c" strokeWidth="6" />
                  {ww > wh ? (
                    <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#f97316" strokeWidth="4" />
                  ) : (
                    <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#f97316" strokeWidth="4" />
                  )}
                </g>
              );
            })}

            {/* 門扇 (綠色大門、藍色拉門、棕色木門，支援中心定位與 360° 全角度旋轉貼合斜牆) */}
            {space.doors?.map((door, idx) => {
              const [x0, y0, x1, y1] = door.rect || [0, 0, 900, 120];
              const rawW = Math.abs(x1 - x0);
              const rawH = Math.abs(y1 - y0);
              const isHorizontal = rawW >= rawH;
              const doorLen = door.len || (isHorizontal ? rawW : rawH) || 900;
              const doorThick = door.thickness || (isHorizontal ? rawH : rawW) || 120;
              const doorCx = door.cx !== undefined ? door.cx : Math.round((x0 + x1) / 2);
              const doorCy = door.cy !== undefined ? door.cy : Math.round((y0 + y1) / 2);
              const doorRot = door.rot !== undefined ? door.rot : (isHorizontal ? 0 : 90);

              const isSelected = selectedItemId === door.id;
              const doorStrokeColor = door.color || (door.entry ? '#16a34a' : door.isSliding ? '#0284c7' : '#b45309');

              return (
                <g
                  key={door.id || `door_${idx}`}
                  transform={`translate(${doorCx}, ${doorCy}) rotate(${doorRot})`}
                  onMouseDown={(e) => handleDoorMouseDown(e, door.id, door)}
                  onTouchStart={(e) => handleDoorTouchStart(e, door.id, door)}
                  style={{ cursor: isPlanLocked ? 'pointer' : 'move' }}
                >
                  {/* 隱形點擊/觸控擴展熱區 */}
                  <rect
                    x={-doorLen / 2 - 40}
                    y={-doorThick / 2 - 40}
                    width={doorLen + 80}
                    height={doorThick + 80}
                    fill="transparent"
                  />

                  {/* 門洞底色 (打通牆面) */}
                  <rect
                    x={-doorLen / 2}
                    y={-doorThick / 2}
                    width={doorLen}
                    height={doorThick}
                    fill="#fafaf9"
                  />

                  {/* 兩側固定門框柱 */}
                  <rect
                    x={-doorLen / 2}
                    y={-doorThick / 2}
                    width={30}
                    height={doorThick}
                    fill="#44403c"
                    rx="2"
                  />
                  <rect
                    x={doorLen / 2 - 30}
                    y={-doorThick / 2}
                    width={30}
                    height={doorThick}
                    fill="#44403c"
                    rx="2"
                  />

                  {/* 選中高亮虛線框與標籤徽章 */}
                  {isSelected && (
                    <g pointerEvents="none">
                      <rect
                        x={-doorLen / 2 - 12}
                        y={-doorThick / 2 - 12}
                        width={doorLen + 24}
                        height={doorThick + 24}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="6"
                        strokeDasharray="16 10"
                        rx="4"
                      />
                      <g transform={`translate(0, 0)`}>
                        <rect
                          x="-220"
                          y="-38"
                          width="440"
                          height="76"
                          rx="12"
                          fill="rgba(234, 88, 12, 0.95)"
                          stroke="#ffffff"
                          strokeWidth="3"
                        />
                        <text x="0" y="8" fill="#ffffff" fontSize="38" fontWeight="800" textAnchor="middle">
                          {`🚪 ${door.name || '門扇'} · ${Math.round(doorRot)}°`}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 日式滑動拉門 (藍色滑軌) */}
                  {door.isSliding ? (
                    <g>
                      <line
                        x1={-doorLen / 2 + 30}
                        y1={-doorThick * 0.2}
                        x2={doorLen * 0.1}
                        y2={-doorThick * 0.2}
                        stroke="#0284c7"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <line
                        x1={-doorLen * 0.1}
                        y1={doorThick * 0.2}
                        x2={doorLen / 2 - 30}
                        y2={doorThick * 0.2}
                        stroke="#0284c7"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </g>
                  ) : (
                    /* 平開門 (門軸 + 門扇開啟 90 度實線 + 開啟軌跡虛線圓弧) */
                    (() => {
                      const hingeX = !door.flipH ? -doorLen / 2 + 20 : doorLen / 2 - 20;
                      const hingeY = 0;
                      const openYSign = !door.flipV ? -1 : 1;
                      const openXSign = !door.flipH ? 1 : -1;
                      const leafEndX = hingeX;
                      const leafEndY = hingeY + openYSign * doorLen;
                      const closedX = hingeX + openXSign * (doorLen - 20);
                      const closedY = hingeY;
                      const sweepFlag = (!door.flipH && !door.flipV) ? 0 : (!door.flipH && door.flipV) ? 1 : (door.flipH && !door.flipV) ? 1 : 0;

                      return (
                        <g>
                          <circle cx={hingeX} cy={hingeY} r="7" fill={doorStrokeColor} />
                          <line
                            x1={hingeX}
                            y1={hingeY}
                            x2={leafEndX}
                            y2={leafEndY}
                            stroke={isSelected ? '#ea580c' : doorStrokeColor}
                            strokeWidth={isSelected ? '8' : '6'}
                            strokeLinecap="round"
                          />
                          <path
                            d={`M ${closedX} ${closedY} A ${doorLen - 20} ${doorLen - 20} 0 0 ${sweepFlag} ${leafEndX} ${leafEndY}`}
                            fill="none"
                            stroke={isSelected ? '#ea580c' : doorStrokeColor}
                            strokeWidth={door.entry ? '8' : isSelected ? '6' : '4'}
                            strokeDasharray={door.entry ? '20 12' : '16 10'}
                          />
                        </g>
                      );
                    })()
                  )}

                  {/* 旋轉控制握把 (支援滑鼠與手指全角度直接旋轉) */}
                  {isSelected && !isPlanLocked && !isLocked && (
                    <g className="door-rotation-handle-group">
                      <line
                        x1="0"
                        y1={-doorThick / 2}
                        x2="0"
                        y2={-doorThick / 2 - 260}
                        stroke="#ea580c"
                        strokeWidth="10"
                        strokeDasharray="14 10"
                      />
                      <circle
                        cx="0"
                        cy={-doorThick / 2 - 260}
                        r="120"
                        fill="rgba(234, 88, 12, 0.25)"
                      />
                      <circle
                        cx="0"
                        cy={-doorThick / 2 - 260}
                        r="70"
                        fill="#ea580c"
                        stroke="#ffffff"
                        strokeWidth="8"
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => handleRotateMouseDown(e, door, true)}
                        onTouchStart={(e) => handleRotateTouchStart(e, door, true)}
                      />
                      <text
                        x="0"
                        y={-doorThick / 2 - 238}
                        fill="#ffffff"
                        fontSize="70"
                        fontWeight="900"
                        textAnchor="middle"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        ↻
                      </text>
                    </g>
                  )}

                  {/* 入口紅色圈選標記 (Red Circle Entrance Badge) */}
                  {door.entry && (
                    <g pointerEvents="none">
                      <circle
                        cx="0"
                        cy={doorThick / 2 + 500}
                        r="520"
                        fill="rgba(239, 68, 68, 0.12)"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeDasharray="24 16"
                      />
                      <circle
                        cx="0"
                        cy={doorThick / 2 + 500}
                        r="580"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="4"
                        opacity="0.8"
                      />
                      <line
                        x1="0"
                        y1={doorThick / 2 + 920}
                        x2="0"
                        y2={-doorThick / 2 - 60}
                        stroke="#dc2626"
                        strokeWidth="10"
                        strokeLinecap="round"
                        markerEnd="url(#arrow-entry)"
                      />
                      <g transform={`translate(0, ${doorThick / 2 + 980})`}>
                        <rect
                          x="-440"
                          y="-50"
                          width="880"
                          height="100"
                          rx="18"
                          fill="#dc2626"
                          stroke="#ffffff"
                          strokeWidth="5"
                        />
                        <text
                          x="0"
                          y="18"
                          fill="#ffffff"
                          fontSize="50"
                          fontWeight="900"
                          textAnchor="middle"
                          style={{ letterSpacing: '2px' }}
                        >
                          🔴 主要入戶大門 (戶外樓梯底端 · 開門進落塵區)
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 家具 */}
            {space.furniture?.map(renderFurnitureItem)}

            {/* 工程尺寸標註線 */}
            {renderDimensionLines()}
          </g>

          {/* 多方案並排對比渲染 (同時將其他打勾的可見方案渲染在畫布對應偏移位置) */}
          {comparisonUnits.map((compUnit, cIdx) => {
            const ox = compUnit.offset ? compUnit.offset[0] : 0;
            const oy = compUnit.offset ? compUnit.offset[1] : 0;
            const cLen = Math.max(compUnit.length || 5300, 5000);

            return (
              <g
                key={compUnit.id}
                transform={`translate(${ox}, ${oy})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectActiveUnit && onSelectActiveUnit(compUnit.id)}
              >
                {/* ✦ 對照方案銘牌與拖曳把手 */}
                <g
                  transform="translate(0, -680)"
                  onMouseDown={(e) => handleUnitDragStart(e, compUnit)}
                  onTouchStart={(e) => handleUnitTouchStart(e, compUnit)}
                  style={{ cursor: unitDragState?.unitId === compUnit.id ? 'grabbing' : 'grab' }}
                >
                  <rect
                    x="0"
                    y="0"
                    width={cLen}
                    height="480"
                    rx="24"
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth="10"
                    filter="drop-shadow(0 8px 24px rgba(0,0,0,0.25))"
                  />
                  <text
                    x="200"
                    y="300"
                    fill="#ffffff"
                    fontSize="220"
                    fontWeight="800"
                  >
                    {`✦ 對照方案：${compUnit.name} (點擊切換)`}
                  </text>
                  <rect
                    x={cLen - 1900}
                    y="60"
                    width="1750"
                    height="360"
                    rx="18"
                    fill="#475569"
                  />
                  <text
                    x={cLen - 1025}
                    y="300"
                    fill="#ffffff"
                    fontSize="190"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    ✥ 按住拖曳移動
                  </text>
                </g>

                {/* 對照方案房間地坪 */}
                {compUnit.rooms?.map((rm) => {
                  const pts = rm.poly ? rm.poly.map((p) => p.join(',')).join(' ') : '';
                  const mat = FLOOR_MATERIALS[rm.mat] || FLOOR_MATERIALS.wood;
                  return (
                    <polygon
                      key={`comp_rm_${rm.id}`}
                      points={pts}
                      fill={mat.color}
                      opacity="0.38"
                      stroke="#94a3b8"
                      strokeWidth="6"
                    />
                  );
                })}

                {/* 對照方案隔間牆與外牆 */}
                {compUnit.walls?.map((w, wIdx) => {
                  const [x0, y0, x1, y1, type] = w;
                  const isBearing = type === 'b';
                  const isExt = type === 'e';
                  const minX = Math.min(x0, x1);
                  const maxX = Math.max(x0, x1);
                  const minY = Math.min(y0, y1);
                  const maxY = Math.max(y0, y1);
                  const ww = Math.abs(maxX - minX);
                  const wh = Math.abs(maxY - minY);
                  return (
                    <rect
                      key={`comp_w_${wIdx}`}
                      x={minX}
                      y={minY}
                      width={ww}
                      height={wh}
                      fill={isBearing ? '#18181b' : isExt ? '#3f3f46' : '#a1a1aa'}
                      opacity="0.88"
                      stroke="#52525b"
                      strokeWidth="5"
                    />
                  );
                })}

                {/* 對照方案門扇 */}
                {compUnit.doors?.map((d, dIdx) => {
                  const [dx0, dy0, dx1, dy1] = d.rect || [0, 0, 900, 120];
                  const minX = Math.min(dx0, dx1);
                  const minY = Math.min(dy0, dy1);
                  const dw = Math.abs(dx1 - dx0);
                  const dh = Math.abs(dy1 - dy0);
                  return (
                    <rect
                      key={`comp_d_${dIdx}`}
                      x={minX}
                      y={minY}
                      width={dw}
                      height={dh}
                      fill="#38bdf8"
                      opacity="0.85"
                    />
                  );
                })}

                {/* 對照方案家具 */}
                {compUnit.furniture?.map((f) => {
                  const hw = f.w / 2;
                  const hd = f.d / 2;
                  return (
                    <g key={`comp_f_${f.id}`} transform={`translate(${f.cx}, ${f.cy}) rotate(${f.rot || 0})`}>
                      <rect
                        x={-hw}
                        y={-hd}
                        width={f.w}
                        height={f.d}
                        fill={f.color || '#cbd5e1'}
                        opacity="0.75"
                        stroke="#64748b"
                        strokeWidth="4"
                        rx="8"
                      />
                      <text x="0" y="8" fill="#1e293b" fontSize="64" fontWeight="700" textAnchor="middle">
                        {f.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 浮動縮放與平移按鈕 */}
      <div
        style={{
          ...styles.floatingControls,
          ...(isMobile ? styles.mobileFloatingControls : {}),
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {onToggleLock && (
          <button
            style={{
              ...styles.floatingBtn,
              ...(isMobile ? styles.mobileFloatingBtn : {}),
              backgroundColor: isPlanLocked ? '#fef3c7' : '#f0fdf4',
              borderColor: isPlanLocked ? '#f59e0b' : '#22c55e',
              color: isPlanLocked ? '#b45309' : '#15803d',
              fontWeight: 700,
            }}
            onClick={onToggleLock}
            title={isPlanLocked ? '格局與家具已鎖定 (點擊解鎖以編輯)' : '格局編輯模式中 (點擊鎖定防誤觸)'}
          >
            {isPlanLocked ? '🔒' : '🔓'}
          </button>
        )}
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={handleToggleRotate}
          title={`轉向平面圖 (${currentRotation}° ➔ ${(currentRotation + 90) % 360}°)`}
        >
          🔄
        </button>
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={() => setZoom((z) => Math.min(z * 1.3, 5))}
          title="放大視角"
        >
          ＋
        </button>
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={() => setZoom((z) => Math.max(z / 1.3, 0.3))}
          title="縮小視角"
        >
          －
        </button>
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={() => setViewCenter((prev) => ({ ...prev, x: Math.max(margin, prev.x - 3000 / zoom) }))}
          title="向左平移"
        >
          ◀
        </button>
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={() => setViewCenter((prev) => ({ ...prev, x: Math.min(L - margin / 2, prev.x + 3000 / zoom) }))}
          title="向右平移"
        >
          ▶
        </button>
        <button
          style={{ ...styles.floatingBtn, ...(isMobile ? styles.mobileFloatingBtn : {}) }}
          onClick={() => {
            setZoom(isMobile ? 0.75 : 1);
            setViewCenter({ x: L / 2, y: W / 2 });
          }}
          title="重置視圖至中心"
        >
          ⌖
        </button>
      </div>

      {currentRotation !== 0 && (
        <div style={styles.rotBadge}>
          ↻ 旋轉 {currentRotation}°
        </div>
      )}

      {/* 底部格局鎖定狀態指示條 (預設鎖定防誤觸，點擊即可一鍵切換) */}
      <div
        style={{
          ...styles.lockStatusPill,
          backgroundColor: isPlanLocked ? 'rgba(254, 243, 199, 0.95)' : 'rgba(240, 253, 244, 0.95)',
          color: isPlanLocked ? '#92400e' : '#166534',
          borderColor: isPlanLocked ? '#fcd34d' : '#86efac',
          ...(isMobile ? styles.mobileLockStatusPill : {}),
        }}
        onClick={onToggleLock}
        title={isPlanLocked ? '點擊解鎖以自由移動格局與家具' : '點擊鎖定保護格局'}
      >
        <span>{isPlanLocked ? '🔒 格局已鎖定 (防誤觸 · 點擊解鎖)' : '🔓 編輯模式 (可任意搬移家具)'}</span>
      </div>

      {!isMobile && (
        <div style={styles.helpPill}>
          💡 單指/滑鼠拖曳畫布可自由左右滑動 · 雙指/滾輪縮放 · 點選家具自動避讓牆體
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#faf8f5',
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'none',
  },
  svg: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  zoneNavPillBar: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(8px)',
    padding: '4px 6px',
    borderRadius: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    border: '1px solid #e7e5e4',
    zIndex: 65,
    maxWidth: '94vw',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    touchAction: 'pan-x',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  zonePillBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '16px',
    border: '1px solid transparent',
    backgroundColor: '#f5f5f4',
    color: '#44403c',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  floatingControls: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: '#ffffff',
    padding: '6px',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    border: '1px solid #e7e5e4',
    zIndex: 60,
  },
  mobileFloatingControls: {
    bottom: '72px',
    right: '12px',
    padding: '4px',
    gap: '4px',
    borderRadius: '8px',
  },
  floatingBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafaf9',
    border: '1px solid #d6d3d1',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#44403c',
  },
  mobileFloatingBtn: {
    width: '38px',
    height: '38px',
    fontSize: '18px',
  },
  helpPill: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(6px)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#57534e',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e7e5e4',
    pointerEvents: 'none',
    zIndex: 60,
  },
  rotBadge: {
    position: 'absolute',
    bottom: '68px',
    left: '24px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
    zIndex: 60,
  },
  lockStatusPill: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer',
    zIndex: 65,
    userSelect: 'none',
    transition: 'all 0.15s ease',
  },
  mobileLockStatusPill: {
    bottom: '18px',
    padding: '5px 12px',
    fontSize: '11px',
    maxWidth: '90vw',
    whiteSpace: 'nowrap',
  },
};
