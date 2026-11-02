import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useIsMobile } from '../hooks/useIsMobile';
import MinimapHUD, { getRoomNameAt } from './MinimapHUD';
import { isPointInPolygon } from '../utils/roomDetector';
import { calculateVisibleBounds } from '../utils/schemeLayout';
import {
  createWoodTexture,
  createMarbleTexture,
  createTileTexture,
  createBrickTexture,
  createTVScreenTexture,
} from '../utils/threeTextures';

// 計算 2D 平面上點 (px, pz) 到線段 (x0, z0)-(x1, z1) 的最短歐幾里得距離
function pointToSegmentDistance(px, pz, x0, z0, x1, z1) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(px - x0, pz - z0);
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / lenSq));
  const projX = x0 + t * dx;
  const projZ = z0 + t * dz;
  return Math.hypot(px - projX, pz - projZ);
}

// 障礙物碰撞檢測 (精準虛擬膠囊人體碰撞 · 寬容門洞穿行與絲滑走廊滑動)
export function isPositionBlocked(x, z, space) {
  if (!space) return false;
  const lenM = space.length / 1000;
  const widM = space.width / 1000;
  // 玩家身軀碰撞半徑大幅瘦身 (由原先臃腫的 0.22m 降為標準體態 0.12m，直徑 24cm)
  const pRadius = 0.12;

  // 1. 外牆邊界防護 (預留 0.15m 貼牆空間)
  if (x < pRadius + 0.05 || x > lenM - pRadius - 0.05) return true;
  if (z < pRadius + 0.05 || z > widM - pRadius - 0.05) return true;

  // 2. 門扇通行優先檢查 (若玩家在門洞範圍內，視為門洞開口，立即開放穿行)
  const isNearDoor = (space.doors || []).some((d) => {
    const [x0, y0, x1, y1] = d.rect || [0, 0, 900, 120];
    const dx = (d.cx !== undefined ? d.cx : (x0 + x1) / 2) / 1000;
    const dz = (d.cy !== undefined ? d.cy : (y0 + y1) / 2) / 1000;
    const dist = Math.hypot(x - dx, z - dz);
    return dist < 0.85; // 門洞通行容差擴大至 0.85m，保證進出門如絲般順暢
  });
  if (isNearDoor) return false;

  // 3. 室內隔間牆精準線段距離碰撞檢查 (支援任意角度斜牆與正交牆)
  for (const w of space.walls || []) {
    const [x0, y0, x1, y1, type] = w;
    if (type === 'e') continue; // 外牆已在邊界處理

    const wx0 = x0 / 1000;
    const wz0 = y0 / 1000;
    const wx1 = x1 / 1000;
    const wz1 = y1 / 1000;

    const dx = Math.abs(x1 - x0);
    const dz = Math.abs(y1 - y0);
    const isH = dx >= dz;
    const rawThickM = (isH ? dz : dx) / 1000;
    const halfThick = Math.min(0.08, Math.max(0.04, rawThickM / 2 || 0.06));

    // 計算點到牆體中心線段的最短距離
    const segDist = pointToSegmentDistance(
      x,
      z,
      isH ? Math.min(wx0, wx1) : (wx0 + wx1) / 2,
      isH ? (wz0 + wz1) / 2 : Math.min(wz0, wz1),
      isH ? Math.max(wx0, wx1) : (wx0 + wx1) / 2,
      isH ? (wz0 + wz1) / 2 : Math.max(wz0, wz1)
    );

    // 碰撞閾值：半牆厚 + 玩家半徑 (0.12m) + 安全裕度 (0.015m)
    if (segDist < halfThick + pRadius + 0.015) {
      return true;
    }
  }

  // 4. 大型家具實體核心碰撞檢查 (椅子與地毯不設阻擋)
  const solidTypes = [
    'bed', 'bed_queen', 'bed_single',
    'sofa', 'cornersofa', 'sofa_l',
    'tvstand',
    'kitchen_counter',
    'fridge',
    'japan_tub',
    'wardrobe',
    'dining_table',
  ];

  for (const f of space.furniture || []) {
    if (!solidTypes.includes(f.type)) continue;

    const fcx = f.cx / 1000;
    const fcz = f.cy / 1000;
    // 縮小為核心 75% 佔比，防止貼近床緣或沙發邊時卡死
    const hw = Math.max(0.12, (f.w / 2000) * 0.75);
    const hd = Math.max(0.12, (f.d / 2000) * 0.75);

    if (
      x >= fcx - hw - pRadius &&
      x <= fcx + hw + pRadius &&
      z >= fcz - hd - pRadius &&
      z <= fcz + hd + pRadius
    ) {
      return true;
    }
  }

  return false;
}

// 核心房間預設 fallback 坐標 (米制 · 吻合長條戶型 5.3m × 19.83m 基礎坐標系)
export const ROOM_PRESETS = [
  { id: 'living', name: '🛋️ 客餐廳', pos: [3.2, 1.6, 14.8], look: [1.4, 1.1, 12.5], orbit: [2.6, 0.8, 13.8], orbitRadius: 7.2 },
  { id: 'master', name: '🛏️ 大主臥', pos: [2.2, 1.6, 7.8], look: [1.4, 0.9, 10.2], orbit: [1.3, 0.8, 9.0], orbitRadius: 6.2 },
  { id: 'guest', name: '🛏️ 客房', pos: [2.0, 1.6, 3.2], look: [1.2, 0.9, 1.2], orbit: [1.3, 0.8, 2.2], orbitRadius: 5.8 },
  { id: 'kitchen', name: '🍳 大廚房', pos: [3.3, 1.6, 16.6], look: [4.2, 1.1, 17.6], orbit: [3.8, 0.8, 17.5], orbitRadius: 6.0 },
  { id: 'laundry', name: '🧺 洗衣間', pos: [1.3, 1.6, 15.6], look: [1.6, 0.9, 16.6], orbit: [1.3, 0.8, 16.6], orbitRadius: 4.8 },
  { id: 'bath', name: '🛁 三分離衛浴', pos: [1.8, 1.6, 17.2], look: [1.8, 1.1, 18.2], orbit: [1.3, 0.8, 18.2], orbitRadius: 5.0 },
  { id: 'entry', name: '🚪 玄關入口', pos: [3.3, 1.6, 6.4], look: [3.3, 1.4, 8.5], orbit: [3.3, 0.8, 6.6], orbitRadius: 5.2 },
];

/**
 * 智慧動態生成 3D 快速直達房間列表 (支援自訂格局與自動分割房間)
 */
export function generateDynamicRoomPresets(space) {
  if (!space) return ROOM_PRESETS;

  const rooms = space.rooms;
  if (!rooms || rooms.length === 0) {
    return ROOM_PRESETS;
  }

  const lenM = space.length / 1000;
  const widM = space.width / 1000;

  // 為名稱自動補充適合的 emoji 圖示
  const getRoomEmoji = (name = '', cat = '') => {
    if (/[\p{Extended_Pictographic}]/u.test(name)) return '';
    const str = (name + ' ' + cat).toLowerCase();
    if (str.includes('主臥')) return '🛏️ ';
    if (str.includes('客房') || str.includes('臥室') || str.includes('睡')) return '🛏️ ';
    if (str.includes('客餐') || str.includes('客廳') || str.includes('起居')) return '🛋️ ';
    if (str.includes('中島') || str.includes('廚房') || str.includes('料理')) return '🍳 ';
    if (str.includes('風呂') || str.includes('浴室') || str.includes('泡澡') || str.includes('淋浴')) return '🛁 ';
    if (str.includes('便所') || str.includes('馬桶') || str.includes('廁')) return '🚽 ';
    if (str.includes('洗面') || str.includes('洗漱') || str.includes('更衣') || str.includes('梳妝') || str.includes('化妝')) return '🪞 ';
    if (str.includes('洗衣') || str.includes('曬衣') || str.includes('家政')) return '🧺 ';
    if (str.includes('玄關') || str.includes('落塵') || str.includes('入戶') || str.includes('大門')) return '🚪 ';
    if (str.includes('樓梯') || str.includes('梯間')) return '🪜 ';
    if (str.includes('儲藏') || str.includes('收納') || str.includes('庫')) return '📦 ';
    if (str.includes('廊') || str.includes('過道') || str.includes('走廊') || str.includes('通道')) return '🚶 ';
    if (str.includes('陽台') || str.includes('露台')) return '🌿 ';
    return '🏠 ';
  };

  const presets = rooms.map((rm, idx) => {
    // 1. 計算房間邊界
    let minX = 0, maxX = lenM, minZ = 0, maxZ = widM;
    const poly = rm.poly;

    if (poly && poly.length >= 3) {
      const xs = poly.map((p) => p[0] / 1000);
      const zs = poly.map((p) => p[1] / 1000);
      minX = Math.min(...xs);
      maxX = Math.max(...xs);
      minZ = Math.min(...zs);
      maxZ = Math.max(...zs);
    }

    // 2. 幾何中心
    let cx = (minX + maxX) / 2;
    let cz = (minZ + maxZ) / 2;
    if (rm.at && Array.isArray(rm.at) && rm.at.length >= 2) {
      cx = rm.at[0] / 1000;
      cz = rm.at[1] / 1000;
    }

    const spanX = Math.max(0.6, maxX - minX);
    const spanZ = Math.max(0.6, maxZ - minZ);
    const maxSpan = Math.max(spanX, spanZ);

    // 3. 漫遊安全站立點與舒適視野朝向
    let standX = cx;
    let standZ = cz;

    // 優先嘗試從房間中心稍微退後 0.7m ~ 1.2m 的機位，站在門口或開闊邊緣看向中心
    const candidateOffsets = [
      spanX >= spanZ ? [-spanX * 0.32, 0] : [0, -spanZ * 0.32],
      spanX >= spanZ ? [spanX * 0.32, 0] : [0, spanZ * 0.32],
      [0, -spanZ * 0.32],
      [0, spanZ * 0.32],
      [-spanX * 0.28, -spanZ * 0.28],
      [spanX * 0.28, -spanZ * 0.28],
      [0, 0], // 正中心
    ];

    let bestStand = null;
    for (const [ox, oz] of candidateOffsets) {
      const tx = THREE.MathUtils.clamp(cx + ox, minX + 0.3, maxX - 0.3);
      const tz = THREE.MathUtils.clamp(cz + oz, minZ + 0.3, maxZ - 0.3);
      if (poly && poly.length >= 3) {
        if (!isPointInPolygon(tx * 1000, tz * 1000, poly)) continue;
      }
      if (!isPositionBlocked(tx, tz, space)) {
        bestStand = [tx, tz];
        break;
      }
    }

    if (bestStand) {
      standX = bestStand[0];
      standZ = bestStand[1];
    } else {
      // 若特定候選被擋，向周圍環狀探索合法站位
      let found = false;
      const searchDists = [0.25, 0.45, 0.7, 0.95, 1.25];
      const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2, Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4];

      for (const dist of searchDists) {
        if (found) break;
        for (const ang of angles) {
          const testX = THREE.MathUtils.clamp(cx + Math.cos(ang) * dist, minX + 0.25, maxX - 0.25);
          const testZ = THREE.MathUtils.clamp(cz + Math.sin(ang) * dist, minZ + 0.25, maxZ - 0.25);
          if (testX < 0.2 || testX > lenM - 0.2 || testZ < 0.2 || testZ > widM - 0.2) continue;

          if (poly && poly.length >= 3) {
            if (!isPointInPolygon(testX * 1000, testZ * 1000, poly)) continue;
          }
          if (!isPositionBlocked(testX, testZ, space)) {
            standX = testX;
            standZ = testZ;
            found = true;
            break;
          }
        }
      }
    }

    // 4. 注視朝向：從站立點看向房間幾何重心 (cx, cz)，視野自然開闊且一覽全室
    let lookTarget;
    const toCenterDist = Math.hypot(cx - standX, cz - standZ);
    if (toCenterDist > 0.4) {
      lookTarget = [cx, 1.3, cz];
    } else {
      // 站在正中心時，朝長軸深處看
      if (spanX >= spanZ) {
        lookTarget = [standX + (cx >= lenM / 2 ? -2.2 : 2.2), 1.3, standZ];
      } else {
        lookTarget = [standX, 1.3, standZ + (cz >= widM / 2 ? -2.2 : 2.2)];
      }
    }

    // 5. 鳥瞰對焦點與半徑
    const orbitTarget = [cx, 0.8, cz];
    const orbitRadius = Math.max(4.2, Math.min(8.5, maxSpan * 1.45));

    // 6. 名稱修飾
    const emoji = getRoomEmoji(rm.name, rm.category);
    const displayName = `${emoji}${rm.name || `分區 ${idx + 1}`}`;

    return {
      id: rm.id || `room_${idx}`,
      rawId: rm.id,
      name: displayName,
      pos: [standX, 1.6, standZ],
      look: lookTarget,
      orbit: orbitTarget,
      orbitRadius,
      minX, // 供橫向戶型排序
      minZ, // 供直向戶型排序
      area: rm.area || rm.areaM2,
    };
  });

  // 按空間長軸動線自然排序 (橫向按 X 軸西至東、直向按 Z 軸北至南)
  const isHorizontalLayout = lenM >= widM;
  if (isHorizontalLayout) {
    presets.sort((a, b) => a.minX - b.minX);
  } else {
    presets.sort((a, b) => a.minZ - b.minZ);
  }
  return presets;
}

export default function Viewport3D({
  space,
  units = [],
  activeUnitId,
  selectedItemId,
  onSelectItem,
  walkTarget,
  onRequestOpenWalkPicker,
}) {
  const isMobile = useIsMobile(768);
  const mountRef = useRef(null);

  // 取得當前可見的方案清單
  const visibleUnits = useMemo(() => {
    return units && units.length > 0
      ? units.filter((u) => u.visible !== false)
      : space
      ? [space]
      : [];
  }, [units, space]);

  // 動態根據當前格局 (包含多方案並排) 產生快速直達房間列表
  const dynamicRoomPresets = useMemo(() => {
    if (visibleUnits.length === 0) return ROOM_PRESETS;
    if (visibleUnits.length === 1) {
      return generateDynamicRoomPresets(visibleUnits[0]);
    }
    const combined = [];
    visibleUnits.forEach((unit, uIdx) => {
      const uPresets = generateDynamicRoomPresets(unit);
      const prefix = `方案 ${String.fromCharCode(65 + uIdx)} · `;
      const oxM = (unit.offset ? unit.offset[0] : 0) / 1000;
      const ozM = (unit.offset ? unit.offset[1] : 0) / 1000;

      uPresets.forEach((p) => {
        combined.push({
          ...p,
          id: `${unit.id}_${p.id}`,
          rawId: p.rawId,
          name: `${prefix}${p.name}`,
          pos: [p.pos[0] + oxM, p.pos[1], p.pos[2] + ozM],
          look: [p.look[0] + oxM, p.look[1], p.look[2] + ozM],
          orbit: [p.orbit[0] + oxM, p.orbit[1], p.orbit[2] + ozM],
          unitId: unit.id,
        });
      });
    });
    return combined;
  }, [visibleUnits]);

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialViewMode = urlParams?.get('view') === 'walk' ? 'walk' : 'orbit';
  const initialWallMode = urlParams?.get('wall') || 'cutaway';
  const initialRoomId = urlParams?.get('room') || null;

  // 視圖模式：'orbit' (鳥瞰檢視) | 'walk' (第一人稱漫遊)
  const [viewMode, setViewMode] = useState(initialViewMode);
  // 牆面剖切模式：'cutaway' (Dollhouse 動態近牆剖透) | 'low' (固定矮牆 1.2m) | 'full' (真實全高 2.8m)
  const [wallMode, setWallMode] = useState(initialWallMode);
  // 鳥瞰相機預設：'bird' | 'top' | 'eye'
  const [cameraPreset, setCameraPreset] = useState('bird');
  // 當前聚焦房間
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId);

  // 小地圖實時 HUD 狀態 (毫秒級同步人物坐標與視野朝向)
  const [playerHUD, setPlayerHUD] = useState({
    x: 2.6,
    z: 14.0,
    yaw: Math.PI,
  });
  const hudThrottleRef = useRef(0);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Orbit 控制參數
  const orbitRef = useRef({
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    spherical: { radius: 25, phi: Math.PI / 4, theta: Math.PI / 4 },
    target: new THREE.Vector3(0, 0, 0),
  });

  // 第一人稱漫遊狀態 (預設站立在客餐廳開闊核心)
  const walkRef = useRef({
    pos: new THREE.Vector3(2.6, 1.6, 14.0),
    yaw: Math.PI, // 面向北側電視主牆與大主臥
    pitch: -0.05,
    speed: 2.4, // m/s
    bobPhase: 0, // 人體步態微動相位 (Head Bobbing)
    keys: { w: false, a: false, s: false, d: false, shift: false },
    isDraggingLook: false,
    prevMouse: { x: 0, y: 0 },
    // 行動端虛擬搖桿
    joystick: { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 },
    touchLook: { active: false, lastX: 0, lastY: 0 },
  });

  // 牆體 Meshes（供 Dollhouse 動態近牆剖切計算）
  const wallDataRef = useRef([]);

  // 更新 Orbit 相機
  const updateOrbitCamera = useCallback(() => {
    if (!cameraRef.current || viewMode === 'walk') return;
    const { spherical, target } = orbitRef.current;
    const x =
      target.x +
      spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    const y = target.y + spherical.radius * Math.cos(spherical.phi);
    const z =
      target.z +
      spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, [viewMode]);

  // 切換鳥瞰預設視角
  const handlePresetView = (preset) => {
    setCameraPreset(preset);
    if (viewMode === 'walk') {
      setViewMode('orbit');
    }
    const lenM = space.length / 1000;
    const widM = space.width / 1000;
    const center = new THREE.Vector3(lenM / 2, 0, widM / 2);
    orbitRef.current.target.copy(center);

    const maxDim = Math.max(lenM, widM);
    if (preset === 'top') {
      orbitRef.current.spherical = {
        radius: maxDim * 1.5,
        phi: 0.05,
        theta: 0,
      };
    } else if (preset === 'bird') {
      orbitRef.current.spherical = {
        radius: maxDim * 1.35,
        phi: Math.PI / 3.8,
        theta: Math.PI / 4,
      };
    } else if (preset === 'eye') {
      orbitRef.current.spherical = {
        radius: maxDim * 0.75,
        phi: Math.PI / 2.3,
        theta: Math.PI / 3,
      };
      orbitRef.current.target.y = 1.2;
    }
    updateOrbitCamera();
  };

  // 飛入指定房間 (支援鳥瞰對焦與第一人稱漫遊直達)
  const flyToRoom = (roomPreset, enterWalkMode = false) => {
    setActiveRoomId(roomPreset.id);

    if (enterWalkMode || viewMode === 'walk') {
      setViewMode('walk');
      walkRef.current.pos.set(roomPreset.pos[0], roomPreset.pos[1], roomPreset.pos[2]);
      const dirX = roomPreset.look[0] - roomPreset.pos[0];
      const dirZ = roomPreset.look[2] - roomPreset.pos[2];
      walkRef.current.yaw = Math.atan2(-dirX, -dirZ);
      walkRef.current.pitch = -0.05;
      if (cameraRef.current) {
        cameraRef.current.position.copy(walkRef.current.pos);
      }
    } else {
      // 鳥瞰對焦該房間
      orbitRef.current.target.set(roomPreset.orbit[0], roomPreset.orbit[1], roomPreset.orbit[2]);
      orbitRef.current.spherical.radius = roomPreset.orbitRadius || 6.5;
      orbitRef.current.spherical.phi = Math.PI / 3.4;
      updateOrbitCamera();
    }
  };

  // 進入/退出第一人稱漫遊
  const toggleWalkMode = () => {
    if (viewMode === 'orbit') {
      setViewMode('walk');
      // 將漫遊初始點設為當前 Orbit 觀察中心的人眼高度
      const tgt = orbitRef.current.target;
      const lenM = space.length / 1000;
      const widM = space.width / 1000;
      const px = THREE.MathUtils.clamp(tgt.x, 0.8, lenM - 0.8);
      const pz = THREE.MathUtils.clamp(tgt.z, 0.8, widM - 0.8);
      walkRef.current.pos.set(px, 1.6, pz);
      walkRef.current.yaw = orbitRef.current.spherical.theta + Math.PI;
      walkRef.current.pitch = -0.05;
      if (cameraRef.current) {
        cameraRef.current.position.copy(walkRef.current.pos);
      }
    } else {
      setViewMode('orbit');
      // 退出漫遊時，將 Orbit Target 設在剛才站立的位置前方
      const fwd = new THREE.Vector3(
        -Math.sin(walkRef.current.yaw),
        0,
        -Math.cos(walkRef.current.yaw)
      ).normalize();
      orbitRef.current.target.copy(walkRef.current.pos).addScaledVector(fwd, 2.0);
      orbitRef.current.target.y = 0.8;
      orbitRef.current.spherical.radius = 7.0;
      orbitRef.current.spherical.phi = Math.PI / 3.6;
      updateOrbitCamera();
    }
  };

  // 記錄人物當前漫遊所在的方案（供小地圖與碰撞檢測使用）
  const [walkingUnit, setWalkingUnit] = useState(() => {
    return (units || []).find((u) => u.id === activeUnitId) || space;
  });

  // 監聽外部傳入的漫遊目標 (例如來自 WalkRoomPickerModal 的點選)
  useEffect(() => {
    if (!walkTarget) return;
    const { unit, room, targetPos, targetLook } = walkTarget;
    if (unit && room) {
      setWalkingUnit(unit);
      const oxM = (unit.offset ? unit.offset[0] : 0) / 1000;
      const ozM = (unit.offset ? unit.offset[1] : 0) / 1000;
      const worldPos = [room.pos[0] + oxM, room.pos[1], room.pos[2] + ozM];
      const worldLook = room.look ? [room.look[0] + oxM, room.look[1], room.look[2] + ozM] : [worldPos[0], worldPos[1], worldPos[2] - 1];

      setViewMode('walk');
      setActiveRoomId(`${unit.id}_${room.id}`);
      walkRef.current.pos.set(worldPos[0], worldPos[1], worldPos[2]);
      const dirX = worldLook[0] - worldPos[0];
      const dirZ = worldLook[2] - worldPos[2];
      walkRef.current.yaw = Math.atan2(-dirX, -dirZ);
      walkRef.current.pitch = -0.05;

      if (cameraRef.current) {
        cameraRef.current.position.copy(walkRef.current.pos);
        const lt = new THREE.Vector3(worldLook[0], worldLook[1], worldLook[2]);
        cameraRef.current.lookAt(lt);
      }
    } else if (targetPos) {
      setViewMode('walk');
      walkRef.current.pos.set(targetPos[0], targetPos[1], targetPos[2]);
      if (targetLook) {
        const dirX = targetLook[0] - targetPos[0];
        const dirZ = targetLook[2] - targetPos[2];
        walkRef.current.yaw = Math.atan2(-dirX, -dirZ);
      }
      walkRef.current.pitch = -0.05;
      if (cameraRef.current) {
        cameraRef.current.position.copy(walkRef.current.pos);
      }
    }
  }, [walkTarget]);

  // 建構 3D 場景
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f5f1);
    scene.fog = new THREE.FogExp2(0xf6f5f1, 0.009);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer (支援高擬真 ACESFilmic 色調與柔和陰影)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights (主日光 + 暖白天空光 + 地面漫反射光)
    const ambientLight = new THREE.AmbientLight(0xfff7ee, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4cebe, 0.6);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.4);
    sunLight.position.set(24, 38, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // 5. 各房間溫馨室內點光源 (動態根據空間格局分區分佈，營造奢華且生動的空間光影氛圍)
    const addRoomLight = (x, y, z, color, intensity, dist) => {
      const pl = new THREE.PointLight(color, intensity, dist, 1.4);
      pl.position.set(x, y, z);
      scene.add(pl);
    };
    if (dynamicRoomPresets && dynamicRoomPresets.length > 0) {
      dynamicRoomPresets.forEach((rm) => {
        addRoomLight(rm.orbit[0], 2.3, rm.orbit[2], 0xfff4e6, 0.65, 6.5);
      });
    } else {
      addRoomLight(2.6, 2.3, 13.8, 0xfff0db, 0.75, 7.5); // 客餐廳
      addRoomLight(1.3, 2.3, 9.0, 0xffedd5, 0.65, 6.0);  // 大主臥
      addRoomLight(1.3, 2.3, 2.2, 0xfef3c7, 0.6, 6.0);   // 客房
      addRoomLight(3.8, 2.3, 17.5, 0xffffff, 0.85, 7.0); // 大廚房
      addRoomLight(1.3, 2.2, 16.6, 0xf1f5f9, 0.55, 5.0); // 洗衣間
      addRoomLight(1.3, 2.2, 18.2, 0xe0f2fe, 0.65, 5.0); // 三分離衛浴
      addRoomLight(3.3, 2.2, 6.6, 0xfef3c7, 0.5, 5.0);   // 玄關入口
    }

    // 6. 幾何體建構 (同時渲染所有勾選的可見方案)
    buildScene(scene, visibleUnits);

    // 初始化相機目標 (自動適應所有並排方案的整體邊界)
    const bounds = calculateVisibleBounds(visibleUnits);
    const center = new THREE.Vector3(bounds.centerX / 1000, 0, bounds.centerY / 1000);
    orbitRef.current.target.copy(center);
    const maxDim = Math.max(bounds.width / 1000, bounds.height / 1000);
    orbitRef.current.spherical.radius = Math.max(12, maxDim * 1.35);

    // URL Focus / Room 偵測 (支援動態格局與關鍵字匹配)
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const focusZone = urlParams?.get('focus');
    const targetRoomId = urlParams?.get('room');
    const matchedRoom = targetRoomId
      ? (dynamicRoomPresets.find(r => r.id === targetRoomId || r.rawId === targetRoomId || (r.name && r.name.toLowerCase().includes(targetRoomId.toLowerCase()))))
      : null;

    if (matchedRoom) {
      if (viewMode === 'walk') {
        walkRef.current.pos.set(matchedRoom.pos[0], matchedRoom.pos[1], matchedRoom.pos[2]);
        const dirX = matchedRoom.look[0] - matchedRoom.pos[0];
        const dirZ = matchedRoom.look[2] - matchedRoom.pos[2];
        walkRef.current.yaw = Math.atan2(-dirX, -dirZ);
        camera.position.copy(walkRef.current.pos);
        const lookTarget = new THREE.Vector3(matchedRoom.look[0], matchedRoom.look[1], matchedRoom.look[2]);
        camera.lookAt(lookTarget);
      } else {
        orbitRef.current.target.set(matchedRoom.orbit[0], matchedRoom.orbit[1], matchedRoom.orbit[2]);
        orbitRef.current.spherical.radius = matchedRoom.orbitRadius || 6.5;
        orbitRef.current.spherical.phi = Math.PI / 3.4;
      }
    } else if (focusZone === 'south' || focusZone === 'kitchen' || focusZone === 'bath') {
      orbitRef.current.target.set(lenM / 2, 0.8, 17.5);
      orbitRef.current.spherical = { radius: 8.5, phi: Math.PI / 3.4, theta: Math.PI / 3.6 };
    }

    if (viewMode !== 'walk') {
      updateOrbitCamera();
    }

    // 7. 動態循環：處理漫遊步進與 Dollhouse 近牆動態剖切 (Cutaway Walls)
    let animId;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 第一人稱漫遊行走邏輯
      if (viewMode === 'walk') {
        stepWalk(dt);
      } else {
        // 鳥瞰模式：計算 Dollhouse 近牆動態剖透
        updateWallCutaway(camera, orbitRef.current, wallMode);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. 桌面端鍵盤監聽 (WASD 行走 + Shift 加速)
    const handleKeyDown = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') walkRef.current.keys.w = true;
      if (code === 'KeyS' || code === 'ArrowDown') walkRef.current.keys.s = true;
      if (code === 'KeyA' || code === 'ArrowLeft') walkRef.current.keys.a = true;
      if (code === 'KeyD' || code === 'ArrowRight') walkRef.current.keys.d = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') walkRef.current.keys.shift = true;
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') walkRef.current.keys.w = false;
      if (code === 'KeyS' || code === 'ArrowDown') walkRef.current.keys.s = false;
      if (code === 'KeyA' || code === 'ArrowLeft') walkRef.current.keys.a = false;
      if (code === 'KeyD' || code === 'ArrowRight') walkRef.current.keys.d = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') walkRef.current.keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 9. 滑鼠互動 (Orbit 旋轉 / Walk 視角旋轉)
    const domEl = renderer.domElement;

    const handleMouseDown = (e) => {
      if (viewMode === 'walk') {
        walkRef.current.isDraggingLook = true;
        walkRef.current.prevMouse = { x: e.clientX, y: e.clientY };
      } else {
        orbitRef.current.isDragging = true;
        orbitRef.current.prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e) => {
      if (viewMode === 'walk') {
        if (!walkRef.current.isDraggingLook) return;
        const dx = e.clientX - walkRef.current.prevMouse.x;
        const dy = e.clientY - walkRef.current.prevMouse.y;
        walkRef.current.prevMouse = { x: e.clientX, y: e.clientY };

        walkRef.current.yaw -= dx * 0.0035;
        walkRef.current.pitch = THREE.MathUtils.clamp(
          walkRef.current.pitch - dy * 0.0035,
          -Math.PI / 2.3,
          Math.PI / 2.3
        );
      } else {
        if (!orbitRef.current.isDragging) return;
        const dx = e.clientX - orbitRef.current.prevMouse.x;
        const dy = e.clientY - orbitRef.current.prevMouse.y;
        orbitRef.current.prevMouse = { x: e.clientX, y: e.clientY };

        if (e.buttons === 1) {
          // Orbit 旋轉
          orbitRef.current.spherical.theta -= dx * 0.005;
          orbitRef.current.spherical.phi = THREE.MathUtils.clamp(
            orbitRef.current.spherical.phi - dy * 0.005,
            0.1,
            Math.PI / 2 - 0.05
          );
        } else if (e.buttons === 2 || e.buttons === 4) {
          // Pan 平移
          const panSpeed = 0.015;
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

          orbitRef.current.target.addScaledVector(right, -dx * panSpeed);
          orbitRef.current.target.addScaledVector(forward, dy * panSpeed);
        }
        updateOrbitCamera();
      }
    };

    const handleMouseUp = () => {
      orbitRef.current.isDragging = false;
      walkRef.current.isDraggingLook = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (viewMode === 'walk') {
        // 漫遊時滾輪快速微幅前進後退
        const fwd = new THREE.Vector3(
          -Math.sin(walkRef.current.yaw),
          0,
          -Math.cos(walkRef.current.yaw)
        ).normalize();
        const dist = e.deltaY > 0 ? -0.4 : 0.4;
        walkRef.current.pos.addScaledVector(fwd, dist);
      } else {
        const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
        orbitRef.current.spherical.radius = THREE.MathUtils.clamp(
          orbitRef.current.spherical.radius * zoomFactor,
          2.5,
          85
        );
        updateOrbitCamera();
      }
    };

    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // 10. 行動端觸控事件 (支援虛擬搖桿與雙指縮放)
    let touchDistStart = 0;
    let touchZoomStart = 1;
    let isTouchPinch = false;

    const handleTouchStart = (e) => {
      if (viewMode === 'walk') {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          if (t.clientX < window.innerWidth * 0.45) {
            // 螢幕左半部：虛擬搖桿移動
            walkRef.current.joystick.active = true;
            walkRef.current.joystick.startX = t.clientX;
            walkRef.current.joystick.startY = t.clientY;
            walkRef.current.joystick.moveX = 0;
            walkRef.current.joystick.moveY = 0;
          } else {
            // 螢幕右半部：視角旋轉
            walkRef.current.touchLook.active = true;
            walkRef.current.touchLook.lastX = t.clientX;
            walkRef.current.touchLook.lastY = t.clientY;
          }
        }
      } else {
        if (e.touches.length === 1) {
          orbitRef.current.isDragging = true;
          orbitRef.current.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          isTouchPinch = false;
        } else if (e.touches.length === 2) {
          orbitRef.current.isDragging = false;
          isTouchPinch = true;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          touchDistStart = Math.sqrt(dx * dx + dy * dy);
          touchZoomStart = orbitRef.current.spherical.radius;
        }
      }
    };

    const handleTouchMove = (e) => {
      if (viewMode === 'walk') {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          if (walkRef.current.joystick.active && t.clientX < window.innerWidth * 0.5) {
            walkRef.current.joystick.moveX = t.clientX - walkRef.current.joystick.startX;
            walkRef.current.joystick.moveY = t.clientY - walkRef.current.joystick.startY;
          } else if (walkRef.current.touchLook.active && t.clientX >= window.innerWidth * 0.4) {
            const dx = t.clientX - walkRef.current.touchLook.lastX;
            const dy = t.clientY - walkRef.current.touchLook.lastY;
            walkRef.current.touchLook.lastX = t.clientX;
            walkRef.current.touchLook.lastY = t.clientY;
            walkRef.current.yaw -= dx * 0.005;
            walkRef.current.pitch = THREE.MathUtils.clamp(
              walkRef.current.pitch - dy * 0.005,
              -Math.PI / 2.3,
              Math.PI / 2.3
            );
          }
        }
      } else {
        if (isTouchPinch && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const factor = touchDistStart / Math.max(10, dist);
          orbitRef.current.spherical.radius = THREE.MathUtils.clamp(
            touchZoomStart * factor,
            2.5,
            85
          );
          updateOrbitCamera();
          return;
        }

        if (orbitRef.current.isDragging && e.touches.length === 1) {
          const dx = e.touches[0].clientX - orbitRef.current.prevMouse.x;
          const dy = e.touches[0].clientY - orbitRef.current.prevMouse.y;
          orbitRef.current.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };

          orbitRef.current.spherical.theta -= dx * 0.007;
          orbitRef.current.spherical.phi = THREE.MathUtils.clamp(
            orbitRef.current.spherical.phi - dy * 0.007,
            0.1,
            Math.PI / 2 - 0.05
          );
          updateOrbitCamera();
        }
      }
    };

    const handleTouchEnd = () => {
      orbitRef.current.isDragging = false;
      isTouchPinch = false;
      walkRef.current.joystick.active = false;
      walkRef.current.joystick.moveX = 0;
      walkRef.current.joystick.moveY = 0;
      walkRef.current.touchLook.active = false;
    };

    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // 11. 視窗縮放自適應
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [space, viewMode, wallMode, updateOrbitCamera]);

  // 小地圖點擊傳送 / 快速走至目標點
  const handleMinimapTeleport = (targetX, targetZ) => {
    const lenM = space.length / 1000;
    const widM = space.width / 1000;
    const tx = THREE.MathUtils.clamp(targetX, 0.45, lenM - 0.45);
    const tz = THREE.MathUtils.clamp(targetZ, 0.45, widM - 0.45);

    if (viewMode === 'walk') {
      walkRef.current.pos.set(tx, 1.6, tz);
      if (cameraRef.current) {
        cameraRef.current.position.copy(walkRef.current.pos);
      }
      setPlayerHUD({ x: tx, z: tz, yaw: walkRef.current.yaw });
    } else {
      orbitRef.current.target.set(tx, 0.8, tz);
      updateOrbitCamera();
      setPlayerHUD({ x: tx, z: tz, yaw: orbitRef.current.spherical.theta + Math.PI });
    }
  };

  // 第一人稱行走單步演算 (支援多方案世界位移坐標轉換 + 實體牆面/家具碰撞滑行 + 擬真人體步態微動 Head Bobbing)
  const stepWalk = (dt) => {
    if (!cameraRef.current) return;
    const walk = walkRef.current;

    // 找出人物當前最接近或所在的 unit 方案
    let currUnit = space;
    let oxM = 0;
    let ozM = 0;
    const targetUnits = visibleUnits && visibleUnits.length > 0 ? visibleUnits : [space];
    for (const u of targetUnits) {
      const uox = (u.offset ? u.offset[0] : 0) / 1000;
      const uoz = (u.offset ? u.offset[1] : 0) / 1000;
      const ulen = (u.length || 5300) / 1000;
      const uwid = (u.width || 19830) / 1000;
      if (
        walk.pos.x >= uox - 0.5 &&
        walk.pos.x <= uox + ulen + 0.5 &&
        walk.pos.z >= uoz - 0.5 &&
        walk.pos.z <= uoz + uwid + 0.5
      ) {
        currUnit = u;
        oxM = uox;
        ozM = uoz;
        break;
      }
    }

    const lenM = (currUnit.length || 5300) / 1000;
    const widM = (currUnit.width || 19830) / 1000;

    let moveX = 0;
    let moveZ = 0;

    // 鍵盤移動輸入
    if (walk.keys.w) moveZ -= 1;
    if (walk.keys.s) moveZ += 1;
    if (walk.keys.a) moveX -= 1;
    if (walk.keys.d) moveX += 1;

    // 觸控虛擬搖桿輸入
    if (walk.joystick.active) {
      const jx = walk.joystick.moveX / 40;
      const jy = walk.joystick.moveY / 40;
      moveX += THREE.MathUtils.clamp(jx, -1, 1);
      moveZ += THREE.MathUtils.clamp(jy, -1, 1);
    }

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const nx = moveX / len;
      const nz = moveZ / len;

      const fwd = new THREE.Vector3(-Math.sin(walk.yaw), 0, -Math.cos(walk.yaw));
      const right = new THREE.Vector3(Math.cos(walk.yaw), 0, -Math.sin(walk.yaw));

      const currentSpeed = walk.speed * (walk.keys.shift ? 1.75 : 1.0);
      const moveDelta = fwd
        .multiplyScalar(-nz * currentSpeed * dt)
        .add(right.multiplyScalar(nx * currentSpeed * dt));

      // 分軸滑動碰撞檢測 (相對於當前 unit 的局部坐標)
      const nextX = walk.pos.x + moveDelta.x;
      const nextLocalX = nextX - oxM;
      const currLocalZ = walk.pos.z - ozM;
      if (!isPositionBlocked(nextLocalX, currLocalZ, currUnit)) {
        walk.pos.x = nextX;
      }
      const nextZ = walk.pos.z + moveDelta.z;
      const currLocalX = walk.pos.x - oxM;
      const nextLocalZ = nextZ - ozM;
      if (!isPositionBlocked(currLocalX, nextLocalZ, currUnit)) {
        walk.pos.z = nextZ;
      }

      // 人體步態起伏 (Head Bobbing)
      walk.bobPhase += dt * currentSpeed * 8.5;
    } else {
      // 靜止時步態微動平緩回歸 0
      walk.bobPhase = THREE.MathUtils.lerp(walk.bobPhase, 0, 0.15);
    }

    // 邊界防禦約束 (相對於當前 unit 的局部範圍)
    walk.pos.x = THREE.MathUtils.clamp(walk.pos.x, oxM + 0.18, oxM + lenM - 0.18);
    walk.pos.z = THREE.MathUtils.clamp(walk.pos.z, ozM + 0.18, ozM + widM - 0.18);

    // 人體真實步態高度：1.6m 基準 + 步態微幅起伏 (精細 0.012m，降低晃動更舒適流暢)
    const eyeHeight = 1.6 + Math.sin(walk.bobPhase) * 0.012;
    walk.pos.y = eyeHeight;

    // 更新相機位置與注視點
    cameraRef.current.position.copy(walk.pos);

    const lookTarget = new THREE.Vector3(
      walk.pos.x - Math.sin(walk.yaw) * Math.cos(walk.pitch),
      walk.pos.y + Math.sin(walk.pitch),
      walk.pos.z - Math.cos(walk.yaw) * Math.cos(walk.pitch)
    );
    cameraRef.current.lookAt(lookTarget);

    // 漫遊時所有牆面恢復 2.8m 全高以提供真實空間包覆感
    wallDataRef.current.forEach((w) => {
      w.mesh.scale.y += (1.0 - w.mesh.scale.y) * 0.15;
    });

    // 節流同步小地圖雷達位置 (轉換為該方案局部坐標，每 2 幀更新一次以保證極致流暢)
    hudThrottleRef.current++;
    if (hudThrottleRef.current % 2 === 0) {
      setPlayerHUD({
        x: walk.pos.x - oxM,
        z: walk.pos.z - ozM,
        yaw: walk.yaw,
      });
    }
  };

  // Dollhouse 動態近牆剖切 (Cutaway Walls) 演算
  // 參考 room-from-photos 規範：
  // 靠近鏡頭、擋在相機與房間核心之間的近景牆動態降低至 0.95m，遠景背牆保持 2.8m 全高
  const updateWallCutaway = (camera, orbit, currentWallMode) => {
    if (!camera) return;

    if (currentWallMode === 'full') {
      wallDataRef.current.forEach((w) => {
        w.mesh.scale.y += (1.0 - w.mesh.scale.y) * 0.12;
      });
      return;
    }

    if (currentWallMode === 'low') {
      const lowRatio = 1.2 / 2.8;
      wallDataRef.current.forEach((w) => {
        w.mesh.scale.y += (lowRatio - w.mesh.scale.y) * 0.12;
      });
      return;
    }

    // 'cutaway' 模式：動態相機方位計算
    const camPos = camera.position;
    const target = orbit.target;

    // 相機到目標點的水平前進向量 (Camera Forward)
    const forwardX = target.x - camPos.x;
    const forwardZ = target.z - camPos.z;
    const fwdDist = Math.sqrt(forwardX * forwardX + forwardZ * forwardZ) || 1;
    const fwdDirX = forwardX / fwdDist;
    const fwdDirZ = forwardZ / fwdDist;

    wallDataRef.current.forEach((w) => {
      // 牆壁相對於目標點的向量
      const relX = w.cx - target.x;
      const relZ = w.cz - target.z;

      // 投影至相機前進向量：
      // dot < 0 表示牆壁在目標點靠相機的一側（即前景近牆，擋住視野）
      // dot > 0 表示牆壁在目標點的後方（即背景背牆，保留全高呈現立體空間感）
      const dot = relX * fwdDirX + relZ * fwdDirZ;

      let targetScale;
      if (dot < -0.3) {
        // 前景近牆：剖切降低至 0.95m (0.95 / 2.8 ≈ 0.34)
        targetScale = 0.34;
      } else if (dot > 0.8) {
        // 遠景背牆：維持 2.8m 全高 (1.0)
        targetScale = 1.0;
      } else {
        // 中間過渡牆面平滑線性插值
        const t = (dot - (-0.3)) / 1.1;
        targetScale = THREE.MathUtils.lerp(0.34, 1.0, t);
      }

      // 平滑漸變
      w.mesh.scale.y += (targetScale - w.mesh.scale.y) * 0.1;
    });
  };

  // 建構 3D 場景實物模型 (同時渲染所有勾選的可見方案)
  const buildScene = (scene, allSpaces) => {
    const spacesList = Array.isArray(allSpaces) ? allSpaces : [allSpaces];

    // 準備高質感材質貼圖庫
    const woodTexture = createWoodTexture();
    const marbleTexture = createMarbleTexture();
    const tileTexture = createTileTexture(64, '#d8dbd9', '#a6aca8');
    const brickTexture = createBrickTexture();
    const tvScreenTexture = createTVScreenTexture();

    // 1. 大地坪 (覆蓋所有並排方案的世界無邊界地面)
    const bounds = calculateVisibleBounds(spacesList);
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xeeece8,
      roughness: 0.95,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(bounds.centerX / 1000, -0.015, bounds.centerY / 1000);
    ground.receiveShadow = true;
    scene.add(ground);

    wallDataRef.current = [];

    // 遍歷所有勾選的可見方案，分別在對應的世界偏移 (offset) 處立體生成
    spacesList.forEach((currentSpace, sIdx) => {
      const oxM = (currentSpace.offset ? currentSpace.offset[0] : 0) / 1000;
      const ozM = (currentSpace.offset ? currentSpace.offset[1] : 0) / 1000;
      const fullWallH = (currentSpace.height || 2800) / 1000; // 2.8m 全高
      const lenM = currentSpace.length / 1000;
      const widM = currentSpace.width / 1000;

      // 2. 房間專屬地坪 (木質、大理石、磁磚)
      currentSpace.rooms?.forEach((rm) => {
        const shape = new THREE.Shape();
        if (!rm.poly || rm.poly.length < 3) return;
        const pts = rm.poly.map((p) => [p[0] / 1000 + oxM, p[1] / 1000 + ozM]);
        shape.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i][0], pts[i][1]);
        }
        shape.closePath();

        const floorGeo = new THREE.ShapeGeometry(shape);
        let floorMat;
        if (rm.mat === 'marble' || rm.mat === 'tile800') {
          floorMat = new THREE.MeshStandardMaterial({
            map: marbleTexture,
            roughness: 0.2,
            metalness: 0.08,
          });
        } else if (rm.mat === 'tile_gray') {
          floorMat = new THREE.MeshStandardMaterial({
            map: tileTexture,
            color: 0x94a3b8,
            roughness: 0.6,
            metalness: 0.05,
          });
        } else if (rm.mat === 'antislip' || rm.mat === 'tile600' || rm.mat === 'tile') {
          floorMat = new THREE.MeshStandardMaterial({
            map: tileTexture,
            roughness: 0.55,
            metalness: 0.05,
          });
        } else if (rm.mat === 'wood_dark') {
          floorMat = new THREE.MeshStandardMaterial({
            map: woodTexture,
            color: 0x854d0e,
            roughness: 0.5,
            metalness: 0.05,
          });
        } else {
          floorMat = new THREE.MeshStandardMaterial({
            map: woodTexture,
            roughness: 0.45,
            metalness: 0.05,
          });
        }

        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = Math.PI / 2;
        floorMesh.rotation.z = Math.PI;
        floorMesh.scale.set(-1, 1, 1);
        floorMesh.position.y = 0.005;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);
      });

    // 3. 牆體 (真實現身：門洞精準挖空留路 + 斜牆定向旋轉 + 地面 Pivot 支援 Dollhouse 動態近牆剖切)
    const drywallMat = new THREE.MeshStandardMaterial({ color: 0xfcfbf9, roughness: 0.85 });
    const bearingMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 });
    const brickMat = new THREE.MeshStandardMaterial({ map: brickTexture, roughness: 0.75 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });

    wallDataRef.current = [];

    const wallThickness = 0.12; // 120mm 標準輕隔間牆厚
    const doorClearH = 2.1; // 門洞淨空高度 2.1m
    const headerBeamH = Math.max(0.1, fullWallH - doorClearH); // 門樑高度 (0.7m)

    currentSpace.walls?.forEach((w) => {
      const [x0, y0, x1, y1, type, id, name] = w;
      const isBearing = type === 'b' || type === 'e';
      const isBrick = name && (name.includes('紅磚') || (Math.abs(x1 - x0) >= 140 && Math.abs(y1 - y0) >= 140));
      const mat = isBearing ? bearingMat : isBrick ? brickMat : drywallMat;

      const dx = (x1 - x0) / 1000;
      const dz = (y1 - y0) / 1000;
      const wallLen = Math.hypot(dx, dz);
      if (wallLen < 0.05) return;

      const rotY = -Math.atan2(dz, dx);

      // 檢查此牆面上是否有門扇 (若有，則扣除門洞留出走道與出入口！)
      const wallDoors = (currentSpace.doors || []).filter((d) => {
        const [dx0, dy0, dx1, dy1] = d.rect || [0, 0, 900, 120];
        const dcx = d.cx !== undefined ? d.cx : (dx0 + dx1) / 2;
        const dcz = d.cy !== undefined ? d.cy : (dy0 + dy1) / 2;
        const minX = Math.min(x0, x1) - 150;
        const maxX = Math.max(x0, x1) + 150;
        const minY = Math.min(y0, y1) - 150;
        const maxY = Math.max(y0, y1) + 150;
        return dcx >= minX && dcx <= maxX && dcz >= minY && dcz <= maxY;
      });

      if (wallDoors.length === 0) {
        // 無門洞牆體 (含直牆與任意角度斜牆)
        const geo = new THREE.BoxGeometry(wallLen, fullWallH, wallThickness);
        geo.translate(0, fullWallH / 2, 0);
        const wallMesh = new THREE.Mesh(geo, mat);
        wallMesh.position.set((x0 + x1) / 2000 + oxM, 0, (y0 + y1) / 2000 + ozM);
        wallMesh.rotation.y = rotY;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);

        // 踢腳線 (80mm)
        const bbGeo = new THREE.BoxGeometry(wallLen * 1.002, 0.08, wallThickness * 1.05);
        bbGeo.translate(0, 0.04, 0);
        const bbMesh = new THREE.Mesh(bbGeo, baseboardMat);
        bbMesh.position.set((x0 + x1) / 2000 + oxM, 0, (y0 + y1) / 2000 + ozM);
        bbMesh.rotation.y = rotY;
        bbMesh.castShadow = true;
        scene.add(bbMesh);

        wallDataRef.current.push({
          mesh: wallMesh,
          cx: (x0 + x1) / 2000 + oxM,
          cz: (y0 + y1) / 2000 + ozM,
          isBearing,
        });
      } else {
        // 有門洞牆體：按門洞沿牆投影區間切分實體牆段，並在門洞上方生成過樑，門洞 0~2.1m 留空！
        const intervals = [];
        wallDoors.forEach((d) => {
          const [dx0, dy0, dx1, dy1] = d.rect || [0, 0, 900, 120];
          const dcx = ((d.cx !== undefined ? d.cx : (dx0 + dx1) / 2) - x0) / 1000;
          const dcz = ((d.cy !== undefined ? d.cy : (dy0 + dy1) / 2) - y0) / 1000;
          const tMid = (dcx * dx + dcz * dz) / wallLen;
          const dLen = (d.len || 900) / 1000;
          const t0 = Math.max(0, tMid - dLen / 2);
          const t1 = Math.min(wallLen, tMid + dLen / 2);
          if (t1 > t0) intervals.push({ t0, t1 });
        });
        intervals.sort((a, b) => a.t0 - b.t0);

        let currentT = 0;
        intervals.forEach((iv) => {
          // 門洞左側/前側實體段
          if (iv.t0 - currentT > 0.04) {
            const segLen = iv.t0 - currentT;
            const segMidT = currentT + segLen / 2;
            const segX = x0 / 1000 + (dx / wallLen) * segMidT + oxM;
            const segZ = y0 / 1000 + (dz / wallLen) * segMidT + ozM;

            const geo = new THREE.BoxGeometry(segLen, fullWallH, wallThickness);
            geo.translate(0, fullWallH / 2, 0);
            const wallMesh = new THREE.Mesh(geo, mat);
            wallMesh.position.set(segX, 0, segZ);
            wallMesh.rotation.y = rotY;
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);

            const bbGeo = new THREE.BoxGeometry(segLen * 1.002, 0.08, wallThickness * 1.05);
            bbGeo.translate(0, 0.04, 0);
            const bbMesh = new THREE.Mesh(bbGeo, baseboardMat);
            bbMesh.position.set(segX, 0, segZ);
            bbMesh.rotation.y = rotY;
            bbMesh.castShadow = true;
            scene.add(bbMesh);

            wallDataRef.current.push({ mesh: wallMesh, cx: segX, cz: segZ, isBearing });
          }

          // 門洞上方過樑段 (2.1m ~ 2.8m，下方留空通風走人)
          const doorLen = iv.t1 - iv.t0;
          const doorMidT = iv.t0 + doorLen / 2;
          const beamX = x0 / 1000 + (dx / wallLen) * doorMidT + oxM;
          const beamZ = y0 / 1000 + (dz / wallLen) * doorMidT + ozM;

          const beamGeo = new THREE.BoxGeometry(doorLen, headerBeamH, wallThickness);
          beamGeo.translate(0, doorClearH + headerBeamH / 2, 0);
          const beamMesh = new THREE.Mesh(beamGeo, mat);
          beamMesh.position.set(beamX, 0, beamZ);
          beamMesh.rotation.y = rotY;
          beamMesh.castShadow = true;
          beamMesh.receiveShadow = true;
          scene.add(beamMesh);

          wallDataRef.current.push({ mesh: beamMesh, cx: beamX, cz: beamZ, isBearing });
          currentT = iv.t1;
        });

        // 門洞右側/後側剩餘實體段
        if (wallLen - currentT > 0.04) {
          const segLen = wallLen - currentT;
          const segMidT = currentT + segLen / 2;
          const segX = x0 / 1000 + (dx / wallLen) * segMidT + oxM;
          const segZ = y0 / 1000 + (dz / wallLen) * segMidT + ozM;

          const geo = new THREE.BoxGeometry(segLen, fullWallH, wallThickness);
          geo.translate(0, fullWallH / 2, 0);
          const wallMesh = new THREE.Mesh(geo, mat);
          wallMesh.position.set(segX, 0, segZ);
          wallMesh.rotation.y = rotY;
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          scene.add(wallMesh);

          const bbGeo = new THREE.BoxGeometry(segLen * 1.002, 0.08, wallThickness * 1.05);
          bbGeo.translate(0, 0.04, 0);
          const bbMesh = new THREE.Mesh(bbGeo, baseboardMat);
          bbMesh.position.set(segX, 0, segZ);
          bbMesh.rotation.y = rotY;
          bbMesh.castShadow = true;
          scene.add(bbMesh);

          wallDataRef.current.push({ mesh: wallMesh, cx: segX, cz: segZ, isBearing });
        }
      }
    });

    // 4. 門扇構件 (包含精準雙向開門扇、金屬把手與通透拉門)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
    const woodDoorMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.45 });
    const greenDoorMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.3,
    });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9, roughness: 0.15 });

    currentSpace.doors?.forEach((d) => {
      const doorGroup = new THREE.Group();
      const [x0, y0, x1, y1] = d.rect || [0, 0, 900, 120];
      const rawW = Math.abs(x1 - x0) / 1000;
      const rawH = Math.abs(y1 - y0) / 1000;
      const isHorizontal = rawW >= rawH;

      const dLen = (d.len || (isHorizontal ? rawW * 1000 : rawH * 1000) || 900) / 1000;
      const dx = (d.cx !== undefined ? d.cx : (x0 + x1) / 2) / 1000;
      const dz = (d.cy !== undefined ? d.cy : (y0 + y1) / 2) / 1000;
      const dRotDeg = d.rot !== undefined ? d.rot : (isHorizontal ? 0 : 90);
      const dRotRad = -(dRotDeg * Math.PI) / 180;

      const isSliding = d.isSliding || (d.name && d.name.includes('拉門'));
      const isEntry = d.entry || d.id === 'd_entry';
      const doorH = 2.1;

      if (isSliding) {
        // 鋁合金玻璃拉門
        const frame = new THREE.Mesh(new THREE.BoxGeometry(dLen, doorH, 0.05), doorFrameMat);
        frame.position.y = doorH / 2;
        doorGroup.add(frame);

        const glassPane = new THREE.Mesh(new THREE.BoxGeometry(dLen * 0.94, doorH * 0.94, 0.02), glassMat);
        glassPane.position.y = doorH / 2;
        doorGroup.add(glassPane);
      } else {
        // 單開門：微開 37 度木門扇 + 金屬橫把手
        const leafThick = 0.04;
        const pivotGroup = new THREE.Group();
        const leafMat = isEntry ? greenDoorMat : woodDoorMat;

        const leaf = new THREE.Mesh(new THREE.BoxGeometry(dLen * 0.96, doorH * 0.98, leafThick), leafMat);
        leaf.castShadow = true;
        leaf.position.set(dLen * 0.48, doorH * 0.49, 0);

        pivotGroup.position.set(-dLen * 0.48, 0, 0);
        pivotGroup.rotation.y = 0.65; // 微開約 37 度

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.12), handleMat);
        handle.position.set(dLen * 0.88, doorH * 0.48, 0.04);
        pivotGroup.add(leaf);
        pivotGroup.add(handle);
        doorGroup.add(pivotGroup);
      }

      doorGroup.position.set(dx + oxM, 0, dz + ozM);
      doorGroup.rotation.y = dRotRad;
      scene.add(doorGroup);
    });

    // 5. 窗戶構件 (深色鋁窗框 + 雙層透明採光玻璃)
    currentSpace.windows?.forEach((win) => {
      const [x0, y0, x1, y1] = win;
      const wx = Math.abs(x1 - x0) / 1000;
      const wz = Math.abs(y1 - y0) / 1000;
      const cx = (x0 + x1) / 2000;
      const cz = (y0 + y1) / 2000;
      const isH = wx > wz;
      const winW = isH ? wx : wz;
      const winH = 1.3;
      const winSill = 0.85;

      const winGroup = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(isH ? winW : 0.08, winH, isH ? 0.08 : winW),
        doorFrameMat
      );
      frame.position.y = winSill + winH / 2;
      winGroup.add(frame);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(isH ? winW * 0.94 : 0.015, winH * 0.94, isH ? 0.015 : winW * 0.94),
        glassMat
      );
      glass.position.y = winSill + winH / 2;
      winGroup.add(glass);

      winGroup.position.set(cx + oxM, 0, cz + ozM);
      scene.add(winGroup);
    });

    // 6. 家具實物模型 (全套 PBR 擬真幾何體：包含 L 型轉角沙發、4K 電視、Takara 廚具等)
    currentSpace.furniture?.forEach((f) => {
      const group = new THREE.Group();
      const fw = f.w / 1000;
      const fd = f.d / 1000;
      const fx = f.cx / 1000;
      const fz = f.cy / 1000;
      const rotRad = -((f.rot || 0) * Math.PI) / 180;

      if (f.type === 'stairs') {
        // 雙向折返梯
        const steps = 12;
        const totalHeight = 2.8;
        const halfStepH = totalHeight / (steps * 2);

        for (let i = 0; i < steps; i++) {
          const stepW = fw / steps;
          const stepGeo = new THREE.BoxGeometry(stepW, (i + 1) * halfStepH, fd / 2);
          const stepMat = new THREE.MeshStandardMaterial({ color: 0x8d6e4f, roughness: 0.6 });
          const stepMesh = new THREE.Mesh(stepGeo, stepMat);
          stepMesh.position.set(-fw / 2 + stepW * (i + 0.5), ((i + 1) * halfStepH) / 2, fd / 4);
          stepMesh.castShadow = true;
          stepMesh.receiveShadow = true;
          group.add(stepMesh);
        }

        for (let i = 0; i < steps; i++) {
          const stepW = fw / steps;
          const stepGeo = new THREE.BoxGeometry(stepW, (steps + i + 1) * halfStepH, fd / 2);
          const stepMat = new THREE.MeshStandardMaterial({ color: 0xa57c56, roughness: 0.6 });
          const stepMesh = new THREE.Mesh(stepGeo, stepMat);
          stepMesh.position.set(fw / 2 - stepW * (i + 0.5), ((steps + i + 1) * halfStepH) / 2, -fd / 4);
          stepMesh.castShadow = true;
          stepMesh.receiveShadow = true;
          group.add(stepMesh);
        }

        const railGeo = new THREE.BoxGeometry(fw, totalHeight * 0.6, 0.05);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.4 });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(0, (totalHeight * 0.6) / 2, 0);
        group.add(rail);
      } else if (f.type === 'toilet_wash_tank' || f.type === 'toilet') {
        // TOTO 水箱洗手免治馬桶
        const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.5 });

        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(fw * 0.44, fw * 0.35, 0.42, 18), porcelainMat);
        bowl.position.set(0, 0.21, fd * 0.12);
        bowl.castShadow = true;
        group.add(bowl);

        const tank = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.9, 0.72, fd * 0.36), porcelainMat);
        tank.position.set(0, 0.36, -fd * 0.28);
        tank.castShadow = true;
        group.add(tank);

        if (f.type === 'toilet_wash_tank') {
          const basinWater = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.65, 0.02, fd * 0.2), waterMat);
          basinWater.position.set(0, 0.725, -fd * 0.28);
          group.add(basinWater);

          const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14), chromeMat);
          faucetStem.position.set(0, 0.78, -fd * 0.35);
          faucetStem.castShadow = true;
          group.add(faucetStem);

          const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08), chromeMat);
          faucetSpout.rotation.x = Math.PI / 2;
          faucetSpout.position.set(0, 0.84, -fd * 0.31);
          group.add(faucetSpout);
        }
      } else if (f.type === 'washer') {
        // 滾筒式洗脫烘洗衣機
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.2, roughness: 0.25 });
        const glassDoorMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.7 });
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.15 });

        const washerBody = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.98, fd), bodyMat);
        washerBody.position.y = 0.49;
        washerBody.castShadow = true;
        group.add(washerBody);

        const ring = new THREE.Mesh(new THREE.CylinderGeometry(fw * 0.36, fw * 0.36, 0.03, 24), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.5, fd / 2 + 0.012);
        group.add(ring);

        const glass = new THREE.Mesh(new THREE.CylinderGeometry(fw * 0.28, fw * 0.28, 0.035, 24), glassDoorMat);
        glass.rotation.x = Math.PI / 2;
        glass.position.set(0, 0.5, fd / 2 + 0.018);
        group.add(glass);

        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(fw * 0.9, 0.15, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 })
        );
        panel.position.set(0, 0.88, fd / 2 + 0.005);
        group.add(panel);
      } else if (f.type === 'bed' || f.type === 'bed_single' || f.type === 'bed_queen') {
        // 精品雙人/單人實木軟包床
        const isSingle = f.type === 'bed_single' || fw < 1.3;
        const frameMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.55 });
        const mattressMat = new THREE.MeshStandardMaterial({ color: 0xfbfbfa, roughness: 0.75 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
        const headboardMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.65 });
        const runnerMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });

        const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.24, fd), frameMat);
        frame.position.y = 0.12;
        frame.castShadow = true;
        group.add(frame);

        const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12);
        [
          [-fw / 2 + 0.08, -fd / 2 + 0.08],
          [fw / 2 - 0.08, -fd / 2 + 0.08],
          [-fw / 2 + 0.08, fd / 2 - 0.08],
          [fw / 2 - 0.08, fd / 2 - 0.08],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, frameMat);
          leg.position.set(lx, 0.06, lz);
          group.add(leg);
        });

        const mattress = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.95, 0.28, fd * 0.92), mattressMat);
        mattress.position.set(0, 0.36, fd * 0.02);
        mattress.castShadow = true;
        group.add(mattress);

        const headboard = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.95, 0.1), headboardMat);
        headboard.position.set(0, 0.475, -fd / 2 + 0.05);
        headboard.castShadow = true;
        group.add(headboard);

        if (isSingle) {
          const pillow = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.65, 0.11, fd * 0.2), pillowMat);
          pillow.position.set(0, 0.54, -fd * 0.3);
          pillow.rotation.x = 0.1;
          pillow.castShadow = true;
          group.add(pillow);
        } else {
          const pillowL = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.4, 0.11, fd * 0.2), pillowMat);
          pillowL.position.set(-fw * 0.25, 0.54, -fd * 0.3);
          pillowL.rotation.x = 0.1;
          pillowL.castShadow = true;
          group.add(pillowL);

          const pillowR = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.4, 0.11, fd * 0.2), pillowMat);
          pillowR.position.set(fw * 0.25, 0.54, -fd * 0.3);
          pillowR.rotation.x = 0.1;
          pillowR.castShadow = true;
          group.add(pillowR);
        }

        const runner = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.96, 0.03, fd * 0.26), runnerMat);
        runner.position.set(0, 0.505, fd * 0.32);
        group.add(runner);
      } else if (f.type === 'sofa' || f.type === 'cornersofa' || f.type === 'sofa_l') {
        // B&B Italia 風格 L型轉角沙發 (主座深 0.96m + 貴妃榻，右下透空，無床鋪感)
        const sofaMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
        const accentPillowMat1 = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const accentPillowMat2 = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.8 });
        const footMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });

        const chaiseW = fw * 0.38;
        const mainW = fw - chaiseW;
        const mainD = fd * 0.6;

        const chaiseBase = new THREE.Mesh(new THREE.BoxGeometry(chaiseW, 0.22, fd), sofaMat);
        chaiseBase.position.set(-fw / 2 + chaiseW / 2, 0.11, 0);
        chaiseBase.castShadow = true;
        group.add(chaiseBase);

        const mainBase = new THREE.Mesh(new THREE.BoxGeometry(mainW, 0.22, mainD), sofaMat);
        mainBase.position.set(chaiseW / 2, 0.11, -fd / 2 + mainD / 2);
        mainBase.castShadow = true;
        group.add(mainBase);

        const loungeSeat = new THREE.Mesh(new THREE.BoxGeometry(chaiseW * 0.88, 0.22, fd * 0.86), cushionMat);
        loungeSeat.position.set(-fw / 2 + chaiseW / 2, 0.31, 0.05);
        loungeSeat.castShadow = true;
        group.add(loungeSeat);

        const mainSeat = new THREE.Mesh(new THREE.BoxGeometry(mainW * 0.9, 0.22, mainD * 0.8), cushionMat);
        mainSeat.position.set(chaiseW / 2, 0.31, -fd / 2 + mainD * 0.55);
        mainSeat.castShadow = true;
        group.add(mainSeat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.55, fd * 0.18), sofaMat);
        back.position.set(0, 0.48, -fd / 2 + fd * 0.09);
        back.castShadow = true;
        group.add(back);

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, fd * 0.92), sofaMat);
        armL.position.set(-fw / 2 + 0.07, 0.33, 0.04);
        armL.castShadow = true;
        group.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, mainD * 0.85), sofaMat);
        armR.position.set(fw / 2 - 0.07, 0.33, -fd / 2 + mainD * 0.52);
        armR.castShadow = true;
        group.add(armR);

        const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.14), accentPillowMat1);
        pillow1.position.set(-fw / 2 + chaiseW + 0.15, 0.52, -fd / 2 + 0.25);
        pillow1.rotation.y = 0.2;
        group.add(pillow1);

        const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.12), accentPillowMat2);
        pillow2.position.set(fw / 2 - 0.3, 0.52, -fd / 2 + 0.25);
        pillow2.rotation.y = -0.15;
        group.add(pillow2);

        const footOffsets = [
          [-fw / 2 + 0.08, -fd / 2 + 0.08],
          [fw / 2 - 0.08, -fd / 2 + 0.08],
          [-fw / 2 + 0.08, fd / 2 - 0.08],
          [-fw / 2 + chaiseW - 0.08, fd / 2 - 0.08],
          [-fw / 2 + chaiseW - 0.08, -fd / 2 + mainD - 0.08],
          [fw / 2 - 0.08, -fd / 2 + mainD - 0.08],
        ];
        footOffsets.forEach(([px, pz]) => {
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), footMat);
          foot.position.set(px, 0.04, pz);
          group.add(foot);
        });
      } else if (f.type === 'dining_table') {
        // 北歐實木餐桌椅組
        const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.5 });
        const chairWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.55 });
        const seatFabricMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.8 });

        const top = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.04, fd), woodMat);
        top.position.y = 0.72;
        top.castShadow = true;
        group.add(top);

        const legGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.7);
        [
          [-fw / 2 + 0.08, -fd / 2 + 0.08],
          [fw / 2 - 0.08, -fd / 2 + 0.08],
          [-fw / 2 + 0.08, fd / 2 - 0.08],
          [fw / 2 - 0.08, fd / 2 - 0.08],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(lx, 0.35, lz);
          leg.castShadow = true;
          group.add(leg);
        });

        [
          [-fw * 0.25, -fd * 0.75, 0],
          [fw * 0.25, -fd * 0.75, 0],
          [-fw * 0.25, fd * 0.75, Math.PI],
          [fw * 0.25, fd * 0.75, Math.PI],
        ].forEach(([cx, cz, crot]) => {
          const chairGroup = new THREE.Group();
          const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.4), seatFabricMat);
          chairSeat.position.y = 0.45;
          chairGroup.add(chairSeat);

          const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.03), chairWoodMat);
          chairBack.position.set(0, 0.68, -0.18);
          chairGroup.add(chairBack);

          [
            [-0.18, -0.16],
            [0.18, -0.16],
            [-0.18, 0.16],
            [0.18, 0.16],
          ].forEach(([clx, clz]) => {
            const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.44), chairWoodMat);
            cLeg.position.set(clx, 0.22, clz);
            chairGroup.add(cLeg);
          });

          chairGroup.position.set(cx, 0, cz);
          chairGroup.rotation.y = crot;
          group.add(chairGroup);
        });
      } else if (f.type === 'chair' || f.type === 'officechair') {
        // 人體工學辦公網椅
        const meshMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.7 });
        const blackMetalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), blackMetalMat);
        base.position.y = 0.08;
        group.add(base);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34), blackMetalMat);
        pole.position.y = 0.25;
        group.add(pole);

        const seat = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.8, 0.05, fd * 0.75), meshMat);
        seat.position.set(0, 0.45, 0);
        seat.castShadow = true;
        group.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.75, 0.52, 0.04), meshMat);
        back.position.set(0, 0.74, -fd * 0.32);
        back.rotation.x = -0.1;
        back.castShadow = true;
        group.add(back);

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.24), blackMetalMat);
        armL.position.set(-fw * 0.38, 0.6, -0.05);
        group.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.24), blackMetalMat);
        armR.position.set(fw * 0.38, 0.6, -0.05);
        group.add(armR);
      } else if (f.type === 'fridge') {
        // 日系旗艦變頻六門冰箱
        const fridgeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.65, roughness: 0.2 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 });
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });

        const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(fw, 1.83, fd), fridgeMat);
        fridgeBody.position.y = 0.915;
        fridgeBody.castShadow = true;
        group.add(fridgeBody);

        const seamV = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.95, 0.02), trimMat);
        seamV.position.set(0, 1.35, fd / 2 + 0.005);
        group.add(seamV);

        [0.85, 0.5, 0.2].forEach((h) => {
          const seamH = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.98, 0.008, 0.02), trimMat);
          seamH.position.set(0, h, fd / 2 + 0.005);
          group.add(seamH);
        });

        const ledScreen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.01), screenMat);
        ledScreen.position.set(fw * 0.25, 1.45, fd / 2 + 0.01);
        group.add(ledScreen);
      } else if (f.type === 'kitchen_counter') {
        // Takara 頂級琺瑯廚具料理檯 (大理石檯面 + 瓦斯爐 + 不鏽鋼大水槽)
        const topMat = new THREE.MeshStandardMaterial({ map: marbleTexture, roughness: 0.25 });
        const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 });
        const sinkMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
        const stoveMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });

        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.82, fd * 0.96), cabinetMat);
        cabinet.position.set(0, 0.41, 0);
        cabinet.castShadow = true;
        group.add(cabinet);

        const top = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.02, 0.04, fd * 1.02), topMat);
        top.position.y = 0.84;
        top.castShadow = true;
        group.add(top);

        const sink = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.02, fd * 0.65), sinkMat);
        sink.position.set(-fw * 0.25, 0.855, 0);
        group.add(sink);

        const tapStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.25), sinkMat);
        tapStem.position.set(-fw * 0.25, 0.98, -fd * 0.25);
        group.add(tapStem);

        const stove = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.015, fd * 0.65), stoveMat);
        stove.position.set(fw * 0.25, 0.852, 0);
        group.add(stove);

        const burner1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 16), stoveMat);
        burner1.position.set(fw * 0.16, 0.865, 0);
        group.add(burner1);

        const burner2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 16), stoveMat);
        burner2.position.set(fw * 0.34, 0.865, 0);
        group.add(burner2);
      } else if (f.type === 'tvstand') {
        // 懸浮大理石電視矮櫃
        const topMat = new THREE.MeshStandardMaterial({ map: marbleTexture, roughness: 0.25 });
        const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.5 });
        const footMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.36, fd), woodMat);
        body.position.set(0, 0.28, 0);
        body.castShadow = true;
        group.add(body);

        const top = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.02, 0.03, fd * 1.02), topMat);
        top.position.y = 0.475;
        top.castShadow = true;
        group.add(top);

        [
          [-fw / 2 + 0.08, -fd / 2 + 0.08],
          [fw / 2 - 0.08, -fd / 2 + 0.08],
          [-fw / 2 + 0.08, fd / 2 - 0.08],
          [fw / 2 - 0.08, fd / 2 - 0.08],
        ].forEach(([px, pz]) => {
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1), footMat);
          foot.position.set(px, 0.05, pz);
          group.add(foot);
        });
      } else if (f.type === 'tv') {
        // Sony 75" 4K OLED 發光電視
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
        const screenMat = new THREE.MeshStandardMaterial({
          map: tvScreenTexture,
          roughness: 0.1,
          emissive: 0xffffff,
          emissiveMap: tvScreenTexture,
          emissiveIntensity: 0.85,
        });

        const tvBody = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.96, fd), frameMat);
        tvBody.position.set(0, 1.15, 0);
        tvBody.castShadow = true;
        group.add(tvBody);

        const screen = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.98, 0.92, 0.01), screenMat);
        screen.position.set(0, 1.15, fd / 2 + 0.005);
        group.add(screen);
      } else if (f.type === 'vanity') {
        // 洗面化妝檯
        const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.05, metalness: 0.95 });
        const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
        const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.5 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.76, fd), woodMat);
        base.position.set(0, 0.38, 0);
        base.castShadow = true;
        group.add(base);

        const basin = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.02, 0.08, fd * 1.02), porcelainMat);
        basin.position.y = 0.8;
        basin.castShadow = true;
        group.add(basin);

        const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18), chromeMat);
        tap.position.set(0, 0.93, -fd * 0.28);
        group.add(tap);

        const mirror = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.98, 0.95, 0.14), mirrorMat);
        mirror.position.set(0, 1.45, -fd * 0.28);
        group.add(mirror);
      } else if (f.type === 'japan_tub') {
        // TOTO 日本深浸溫泉浴缸
        const tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.05 });
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          roughness: 0.1,
          metalness: 0.4,
          transparent: true,
          opacity: 0.75,
        });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });

        const tub = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.6, fd), tubMat);
        tub.position.y = 0.3;
        tub.castShadow = true;
        group.add(tub);

        const water = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.86, 0.02, fd * 0.86), waterMat);
        water.position.y = 0.52;
        group.add(water);

        const spout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.1), chromeMat);
        spout.position.set(0, 0.61, -fd / 2 + 0.05);
        group.add(spout);
      } else if (f.type === 'laundry_sink') {
        // 洗衣專用水槽
        const ssMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.6 });

        const cab = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.78, fd), cabMat);
        cab.position.y = 0.39;
        cab.castShadow = true;
        group.add(cab);

        const basin = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.02, 0.06, fd * 1.02), ssMat);
        basin.position.y = 0.82;
        group.add(basin);

        const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2), ssMat);
        tap.position.set(-fw * 0.2, 0.95, -fd * 0.25);
        group.add(tap);
      } else if (f.type === 'wardrobe') {
        // 系統衣櫃
        const wardMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.7 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });

        const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(fw, 2.3, fd), wardMat);
        wardrobe.position.y = 1.15;
        wardrobe.castShadow = true;
        group.add(wardrobe);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.015, 2.28, fd * 1.01), trimMat);
        trim.position.y = 1.15;
        group.add(trim);

        const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 0.02), handleMat);
        handleL.position.set(-0.06, 1.15, fd / 2 + 0.015);
        group.add(handleL);

        const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 0.02), handleMat);
        handleR.position.set(0.06, 1.15, fd / 2 + 0.015);
        group.add(handleR);
      } else if (f.type === 'desk') {
        // 實木書桌與筆電
        const topMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.5 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
        const laptopMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.2 });
        const padMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });

        const top = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.04, fd), topMat);
        top.position.y = 0.72;
        top.castShadow = true;
        group.add(top);

        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7);
        [
          [-fw / 2 + 0.06, -fd / 2 + 0.06],
          [fw / 2 - 0.06, -fd / 2 + 0.06],
          [-fw / 2 + 0.06, fd / 2 - 0.06],
          [fw / 2 - 0.06, fd / 2 - 0.06],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(lx, 0.35, lz);
          leg.castShadow = true;
          group.add(leg);
        });

        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.005, 0.35), padMat);
        pad.position.set(0, 0.742, 0.02);
        group.add(pad);

        const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.22), laptopMat);
        laptopBase.position.set(0, 0.748, 0);
        group.add(laptopBase);

        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.21, 0.01), laptopMat);
        laptopScreen.position.set(0, 0.85, -0.095);
        laptopScreen.rotation.x = 0.18;
        group.add(laptopScreen);
      } else {
        const h = Math.min(0.85, Math.max(0.4, Math.min(fw, fd)));
        const boxGeo = new THREE.BoxGeometry(fw, h, fd);
        const boxMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(f.color || 0x78716c),
          roughness: 0.5,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }

      group.position.set(fx + oxM, 0, fz + ozM);
      group.rotation.y = rotRad;
      scene.add(group);
    });

    // 方案 3D 浮動銘牌 (標記於該方案入口外側)
    if (spacesList.length > 1) {
      const nameTagCanvas = document.createElement('canvas');
      nameTagCanvas.width = 512;
      nameTagCanvas.height = 128;
      const ctx = nameTagCanvas.getContext('2d');
      ctx.fillStyle = sIdx === 0 ? '#18181b' : '#ea580c';
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 108, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`方案 ${String.fromCharCode(65 + sIdx)} · ${currentSpace.name || '設計方案'}`, 256, 64);

      const tagTexture = new THREE.CanvasTexture(nameTagCanvas);
      const tagMat = new THREE.MeshBasicMaterial({ map: tagTexture, transparent: true });
      const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), tagMat);
      tagMesh.rotation.x = -Math.PI / 2;
      tagMesh.position.set(oxM + 2.0, 0.02, ozM - 0.8);
      scene.add(tagMesh);
    }
  });
  };

  return (
    <div style={styles.container}>
      <div ref={mountRef} style={styles.canvasContainer} />

      {/* 漫遊模式準星 (Crosshair) */}
      {viewMode === 'walk' && (
        <div style={styles.crosshairContainer}>
          <div style={styles.crosshairDot} />
        </div>
      )}

      {/* 漫遊模式行動端虛擬搖桿底盤提示 */}
      {viewMode === 'walk' && isMobile && (
        <div style={styles.mobileJoystickHint}>
          🕹️ 左側滑動行走 · 右側滑動轉向
        </div>
      )}

      {/* 頂部快速控制列 */}
      <div
        style={{
          ...styles.topControlBar,
          ...(isMobile ? styles.mobileTopControlBar : {}),
        }}
      >
        {/* 模式切換：鳥瞰 Orbit vs 第一人稱漫遊 Walk */}
        <div style={styles.modePillGroup}>
          <button
            style={{
              ...styles.modePillBtn,
              ...(viewMode === 'orbit' ? styles.modePillActive : {}),
            }}
            onClick={() => {
              if (viewMode === 'walk') toggleWalkMode();
            }}
          >
            🛸 鳥瞰檢視
          </button>
          <button
            style={{
              ...styles.modePillBtn,
              ...(viewMode === 'walk' ? styles.modePillActiveWalk : {}),
            }}
            onClick={() => {
              if (viewMode === 'orbit') {
                if (visibleUnits.length > 1 && onRequestOpenWalkPicker) {
                  onRequestOpenWalkPicker();
                } else {
                  toggleWalkMode();
                }
              }
            }}
            title="以人眼 1.6m 視角在房屋內自由走動"
          >
            🚶‍♂️ 第一人稱漫遊
          </button>
        </div>

        {/* 牆體模式 (僅鳥瞰模式下顯示) */}
        {viewMode === 'orbit' && (
          <div style={styles.wallModeGroup}>
            <button
              style={{
                ...styles.wallBtn,
                ...(wallMode === 'cutaway' ? styles.wallBtnActive : {}),
              }}
              onClick={() => setWallMode('cutaway')}
              title="Dollhouse 動態近牆剖透：轉動視角時近牆自動剖開，遠牆維持全高"
            >
              動態剖透
            </button>
            <button
              style={{
                ...styles.wallBtn,
                ...(wallMode === 'low' ? styles.wallBtnActive : {}),
              }}
              onClick={() => setWallMode('low')}
              title="固定 1.2m 矮牆"
            >
              矮牆
            </button>
            <button
              style={{
                ...styles.wallBtn,
                ...(wallMode === 'full' ? styles.wallBtnActive : {}),
              }}
              onClick={() => setWallMode('full')}
              title="固定 2.8m 全高"
            >
              全牆
            </button>
          </div>
        )}

        {/* 鳥瞰視角預設 (僅鳥瞰模式下顯示) */}
        {viewMode === 'orbit' && !isMobile && (
          <div style={styles.presetGroup}>
            <button
              style={{
                ...styles.presetBtn,
                ...(cameraPreset === 'bird' ? styles.presetBtnActive : {}),
              }}
              onClick={() => handlePresetView('bird')}
            >
              45° 鳥瞰
            </button>
            <button
              style={{
                ...styles.presetBtn,
                ...(cameraPreset === 'top' ? styles.presetBtnActive : {}),
              }}
              onClick={() => handlePresetView('top')}
            >
              頂視
            </button>
          </div>
        )}

        {/* 漫遊模式下的一鍵退出按鈕 */}
        {viewMode === 'walk' && (
          <button style={styles.exitWalkBtn} onClick={toggleWalkMode}>
            ✕ 退出漫遊
          </button>
        )}
      </div>

      {/* 房間一鍵飛入藥丸列 (Fly to Room: 即時連動使用者設定/智慧辨識之格局) */}
      <div
        style={{
          ...styles.roomBar,
          ...(isMobile ? styles.mobileRoomBar : {}),
        }}
      >
        <span style={styles.roomBarTitle}>快速直達：</span>
        {dynamicRoomPresets.map((rm) => (
          <button
            key={rm.id}
            style={{
              ...styles.roomBtn,
              ...(activeRoomId === rm.id ? styles.roomBtnActive : {}),
            }}
            onClick={() => flyToRoom(rm, viewMode === 'walk')}
          >
            {rm.name}
          </button>
        ))}
      </div>

      {/* 實時雷達小地圖 (Minimap HUD: 標示當前人物位置、視野扇形、即時房間名與點擊瞬移) */}
      <MinimapHUD
        space={walkingUnit || space}
        playerPos={playerHUD}
        playerYaw={playerHUD.yaw}
        isWalkMode={viewMode === 'walk'}
        onTeleport={handleMinimapTeleport}
      />

      {/* 底部操作指引 */}
      <div style={styles.helpPill}>
        {viewMode === 'walk' ? (
          <span>
            🚶‍♂️ <strong>漫遊中【{(walkingUnit || space)?.name}】</strong>：
            {isMobile
              ? ' 左下搖桿行走 · 右側滑動轉向'
              : ' [W/A/S/D] 行走 · [Shift] 奔跑 · 按住滑鼠拖曳 360° 環顧 · 滾輪前後'}
          </span>
        ) : (
          <span>
            🏠 <strong>Dollhouse 動態剖透模式</strong>：滑鼠左鍵旋轉 · 右鍵平移 · 滾輪縮放（近牆依相機角度動態切矮，遠景維持全高真實包覆）
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f6f5f1',
    touchAction: 'none',
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
    outline: 'none',
  },
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 50,
  },
  crosshairDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(194, 65, 12, 0.85)',
    boxShadow: '0 0 6px rgba(0,0,0,0.4)',
  },
  mobileJoystickHint: {
    position: 'absolute',
    bottom: '80px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    pointerEvents: 'none',
    zIndex: 55,
  },
  topControlBar: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(10px)',
    padding: '6px 12px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e7e5e4',
    zIndex: 60,
  },
  mobileTopControlBar: {
    top: '10px',
    right: '10px',
    left: '10px',
    justifyContent: 'space-between',
    padding: '4px 8px',
    gap: '6px',
    borderRadius: '8px',
  },
  modePillGroup: {
    display: 'flex',
    backgroundColor: '#f5f5f4',
    padding: '3px',
    borderRadius: '8px',
    gap: '2px',
  },
  modePillBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    color: '#78716c',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modePillActive: {
    backgroundColor: '#ffffff',
    color: '#1c1917',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  modePillActiveWalk: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
  },
  wallModeGroup: {
    display: 'flex',
    gap: '4px',
    borderLeft: '1px solid #e7e5e4',
    paddingLeft: '8px',
  },
  wallBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #e7e5e4',
    backgroundColor: '#fafaf9',
    borderRadius: '6px',
    color: '#57534e',
    cursor: 'pointer',
  },
  wallBtnActive: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    borderColor: '#fdba74',
    fontWeight: 700,
  },
  presetGroup: {
    display: 'flex',
    gap: '4px',
    borderLeft: '1px solid #e7e5e4',
    paddingLeft: '8px',
  },
  presetBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid transparent',
    backgroundColor: '#f5f5f4',
    borderRadius: '6px',
    color: '#78716c',
    cursor: 'pointer',
  },
  presetBtnActive: {
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderColor: '#e4e4e7',
  },
  exitWalkBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid #fecdd3',
    backgroundColor: '#ffe4e6',
    borderRadius: '6px',
    color: '#e11d48',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  roomBar: {
    position: 'absolute',
    top: '72px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    padding: '5px 10px',
    borderRadius: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e7e5e4',
    zIndex: 58,
    maxWidth: '92vw',
    overflowX: 'auto',
  },
  mobileRoomBar: {
    top: '56px',
    left: '10px',
    right: '10px',
    padding: '4px 8px',
    gap: '4px',
  },
  roomBarTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#a8a29e',
    whiteSpace: 'nowrap',
    paddingLeft: '4px',
  },
  roomBtn: {
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    color: '#44403c',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  roomBtnActive: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    borderColor: '#ea580c',
  },
  helpPill: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(8px)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#44403c',
    boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e7e5e4',
    pointerEvents: 'none',
    zIndex: 60,
    maxWidth: '85vw',
  },
};
