import React, { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { isPointInPolygon } from '../utils/roomDetector';

// 即時判斷坐標所處房間名稱 (優先使用房間多邊形幾何判定，fallback 至通用坐標系)
export function getRoomNameAt(x, z, rooms = []) {
  const mmX = x * 1000;
  const mmZ = z * 1000;

  if (rooms && rooms.length > 0) {
    for (const rm of rooms) {
      if (rm.poly && isPointInPolygon(mmX, mmZ, rm.poly)) {
        return rm.name;
      }
    }
  }

  // fallback 通用長條戶型坐標判定 (5.3m × 19.83m)
  if (z < 3.9) return '🛏️ 客房 (北起居)';
  if (z >= 3.9 && z < 6.0) {
    if (x >= 2.65) return '🪜 戶外樓梯間';
    return '📦 儲藏室過道';
  }
  if (z >= 6.0 && z < 7.5 && x >= 2.65) return '🚪 玄關入戶大門';
  if (z >= 6.0 && z < 11.8) {
    if (x < 2.65) return '🛏️ 大主臥室';
    if (x >= 3.8) return '📦 收納大儲藏室';
    return '🚶 室內中央過道';
  }
  if (z >= 11.8 && z < 16.0) return '🛋️ 客餐廳 (核心起居)';
  if (z >= 16.0) {
    if (x >= 2.53) return '🍳 獨立大廚房';
    if (z < 17.2) return '🧺 獨立洗衣曬衣間';
    if (z >= 18.6 && x < 1.3) return '🛁 三分離 · 風呂浴室';
    if (z < 18.6 && x < 1.2) return '🚽 三分離 · 獨立便所';
    return '🪞 三分離 · 洗面脫衣室';
  }
  return '🏠 室內空間';
}

export default function MinimapHUD({
  space,
  playerPos,
  playerYaw,
  isWalkMode,
  onTeleport,
}) {
  const isMobile = useIsMobile(768);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!space) return null;

  const lenMm = space.length || 5300;
  const widMm = space.width || 19830;
  const currentRoomName = getRoomNameAt(playerPos.x, playerPos.z, space.rooms);

  // 點擊地圖傳送
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatioX = (e.clientX - rect.left) / rect.width;
    const clickRatioY = (e.clientY - rect.top) / rect.height;
    const targetX = (clickRatioX * lenMm) / 1000;
    const targetZ = (clickRatioY * widMm) / 1000;
    if (onTeleport) {
      onTeleport(targetX, targetZ);
    }
  };

  // 旋轉角計算 (相機朝向)
  // yaw 0 = 面向 -Z (北), Math.PI/2 = 面向 -X (西), Math.PI = 面向 +Z (南)
  const deg = ((-playerYaw) * 180) / Math.PI;

  return (
    <div
      style={{
        ...styles.container,
        ...(isMobile ? styles.mobileContainer : {}),
      }}
    >
      {/* 頂部標題欄 */}
      <div style={styles.header}>
        <div style={styles.headerTitleWrap}>
          <div style={styles.radarDot} />
          <span style={styles.headerTitle}>{currentRoomName}</span>
        </div>
        <button
          style={styles.collapseBtn}
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? '展開地圖' : '收合地圖'}
        >
          {isCollapsed ? '▲ 展開' : '▼ 收合'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 小地圖 SVG 容器 */}
          <div style={styles.mapWrap}>
            <svg
              viewBox={`0 0 ${lenMm} ${widMm}`}
              style={styles.svgMap}
              onClick={handleMapClick}
              title="點擊小地圖任意位置可直接走至該處"
            >
              <defs>
                {/* 視野扇形漸變 */}
                <radialGradient id="fovGrad" cx="0%" cy="100%" r="100%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. 地基背景 */}
              <rect x="0" y="0" width={lenMm} height={widMm} fill="#faf8f5" />

              {/* 2. 房間多邊形色塊 */}
              {space.rooms?.map((rm) => {
                if (!rm.poly || rm.poly.length < 3) return null;
                const pointsStr = rm.poly.map((p) => `${p[0]},${p[1]}`).join(' ');
                let fillColor = '#f5f5f4';
                const n = rm.name || '';
                if (rm.id === 'living' || n.includes('客') || n.includes('起居')) fillColor = '#fff7ed';
                else if (rm.id === 'master' || n.includes('主臥')) fillColor = '#ffedd5';
                else if (rm.id === 'guest' || n.includes('客房') || n.includes('次臥') || n.includes('臥室')) fillColor = '#fef3c7';
                else if (rm.id === 'kitchen' || n.includes('廚房')) fillColor = '#f1f5f9';
                else if (rm.id === 'laundry' || n.includes('洗衣') || n.includes('陽台')) fillColor = '#ecfdf5';
                else if (['toilet', 'wash', 'bath', 'bathroom'].includes(rm.id) || n.includes('衛浴') || n.includes('廁所') || n.includes('便所') || n.includes('洗手')) fillColor = '#e0f2fe';
                else if (n.includes('書房')) fillColor = '#f0fdf4';
                else if (n.includes('更衣') || n.includes('儲藏')) fillColor = '#fafaf9';
                else if (rm.mat === 'wood') fillColor = '#fffbeb';
                else if (rm.mat === 'marble') fillColor = '#f8fafc';

                return (
                  <polygon
                    key={rm.id}
                    points={pointsStr}
                    fill={fillColor}
                    stroke="#e7e5e4"
                    strokeWidth="40"
                  />
                );
              })}

              {/* 3. 家具輪廓 */}
              {space.furniture?.map((f) => {
                const fx = f.cx - f.w / 2;
                const fy = f.cy - f.d / 2;
                return (
                  <rect
                    key={f.id}
                    x={fx}
                    y={fy}
                    width={f.w}
                    height={f.d}
                    fill="#d6d3d1"
                    stroke="#a8a29e"
                    strokeWidth="30"
                    rx="80"
                    transform={`rotate(${f.rot || 0}, ${f.cx}, ${f.cy})`}
                    opacity="0.75"
                  />
                );
              })}

              {/* 4. 牆體 */}
              {space.walls?.map((w, idx) => {
                const [x0, y0, x1, y1, type] = w;
                const wx = Math.min(x0, x1);
                const wy = Math.min(y0, y1);
                const ww = Math.max(80, Math.abs(x1 - x0));
                const wh = Math.max(80, Math.abs(y1 - y0));
                const isBearing = type === 'b' || type === 'e';
                return (
                  <rect
                    key={idx}
                    x={wx}
                    y={wy}
                    width={ww}
                    height={wh}
                    fill={isBearing ? '#27272a' : '#52525b'}
                  />
                );
              })}

              {/* 5. 門扇開口 */}
              {space.doors?.map((d, idx) => {
                const [x0, y0, x1, y1] = d.rect || [0, 0, 900, 120];
                const dx = (d.cx !== undefined ? d.cx : (x0 + x1) / 2);
                const dz = (d.cy !== undefined ? d.cy : (y0 + y1) / 2);
                return (
                  <circle
                    key={idx}
                    cx={dx}
                    cy={dz}
                    r="240"
                    fill="#16a34a"
                    opacity="0.85"
                  />
                );
              })}

              {/* 6. 人物動態雷達位置與視野扇形 (FOV Cone) */}
              <g transform={`translate(${playerPos.x * 1000}, ${playerPos.z * 1000})`}>
                {/* 視野光錐 (跟隨相機 360° 旋轉) */}
                <g transform={`rotate(${deg})`}>
                  <path
                    d="M 0 0 L -1200 -3600 A 3600 3600 0 0 1 1200 -3600 Z"
                    fill="url(#fovGrad)"
                  />
                </g>

                {/* 外擴呼吸光環 */}
                <circle r="750" fill="rgba(234, 88, 12, 0.25)" />
                <circle r="500" fill="rgba(234, 88, 12, 0.45)" />

                {/* 核心人物圓點 */}
                <circle
                  r="300"
                  fill="#ea580c"
                  stroke="#ffffff"
                  strokeWidth="80"
                />
              </g>
            </svg>
          </div>

          {/* 底部操作指引 */}
          <div style={styles.footerHint}>
            📍 <strong>點擊小地圖</strong> 可瞬移位置
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    width: '148px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    border: '1px solid #e7e5e4',
    zIndex: 65,
    overflow: 'hidden',
    userSelect: 'none',
    transition: 'all 0.2s ease',
  },
  mobileContainer: {
    bottom: '16px',
    right: '12px',
    width: '126px',
    borderRadius: '10px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 9px',
    backgroundColor: '#fafaf9',
    borderBottom: '1px solid #f0ede8',
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    overflow: 'hidden',
  },
  radarDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    boxShadow: '0 0 6px #22c55e',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#292524',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '82px',
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '9px',
    fontWeight: 600,
    color: '#a8a29e',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
  },
  mapWrap: {
    width: '100%',
    height: '280px',
    backgroundColor: '#f5f3ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    boxSizing: 'border-box',
    cursor: 'crosshair',
  },
  svgMap: {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    border: '1px solid #e2ded9',
    backgroundColor: '#ffffff',
  },
  footerHint: {
    padding: '4px 6px',
    fontSize: '10px',
    color: '#78716c',
    textAlign: 'center',
    backgroundColor: '#fafaf9',
    borderTop: '1px solid #f0ede8',
  },
};
