import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { clearAuthSession } from '../services/api';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Header({
  space,
  viewMode,
  setViewMode,
  onOpenNewSpaceModal,
  showDimensions,
  setShowDimensions,
  showGrid,
  setShowGrid,
  showRoomLabels,
  setShowRoomLabels,
  onExportJson,
  onImportJson,
  onExportPng,
  onResetToBlueprint,
  planRotation = 0,
  onRotatePlan,
  isPlanLocked = true,
  onToggleLock,
  onAutoDetectRooms,
  onAddCustomRoom,
  user,
  onLoginSuccess,
  onLogout,
  syncStatus = 'idle',
}) {
  const isMobile = useIsMobile(768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Google 登入觸發
  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (onLoginSuccess) {
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const gInfo = await res.json();
          onLoginSuccess(tokenResponse.access_token, {
            id: gInfo.sub,
            email: gInfo.email,
            name: gInfo.name,
            avatar: gInfo.picture,
          });
        } catch (err) {
          console.error('取得 Google 資訊失敗:', err);
        }
      }
    },
    onError: (error) => {
      console.warn('Google 登入失敗或已取消:', error);
    },
  });

  const areaM2 = ((space.length * space.width) / 1000000).toFixed(1);
  const areaPing = (areaM2 * 0.3025).toFixed(1);

  if (isMobile) {
    return (
      <header style={styles.mobileHeader}>
        {/* Left: Space Name & Ping Badge */}
        <div style={styles.mobileBrandGroup}>
          <span style={styles.mobileSpaceName}>{space.name}</span>
          <span style={styles.mobileBadge}>{areaPing} 坪</span>
        </div>

        {/* Right: Quick Blueprint, Rotate, Lock & More Menu */}
        <div style={styles.mobileRightGroup}>
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              style={{
                ...styles.mobilePresetBtn,
                backgroundColor: isPlanLocked ? '#fef3c7' : '#f0fdf4',
                color: isPlanLocked ? '#b45309' : '#15803d',
                borderColor: isPlanLocked ? '#f59e0b' : '#22c55e',
                fontWeight: 700,
              }}
              title={isPlanLocked ? '格局與家具已鎖定 (點擊解鎖以編輯)' : '格局編輯中 (點擊鎖定防誤觸)'}
            >
              {isPlanLocked ? '🔒 鎖定' : '🔓 編輯'}
            </button>
          )}

          {onRotatePlan && (
            <button
              onClick={onRotatePlan}
              style={{
                ...styles.mobilePresetBtn,
                backgroundColor: '#f1f5f9',
                color: '#334155',
                borderColor: '#cbd5e1',
              }}
              title={`旋轉 2D 平面圖 (當前 ${planRotation}°)`}
            >
              🔄 {planRotation % 180 === 0 ? '直向' : '橫向'}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              ...styles.mobileMenuBtn,
              ...(mobileMenuOpen ? styles.mobileMenuBtnActive : {}),
            }}
            title="設定與更多選單"
          >
            ⋯
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={styles.menuBackdrop}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              style={styles.dropdownMenu}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.menuHeader}>圖層與工程顯示</div>
              <div style={styles.menuRow}>
                <button
                  style={{
                    ...styles.layerChip,
                    ...(showDimensions ? styles.layerChipActive : {}),
                  }}
                  onClick={() => setShowDimensions(!showDimensions)}
                >
                  📐 尺寸標註
                </button>
                <button
                  style={{
                    ...styles.layerChip,
                    ...(showGrid ? styles.layerChipActive : {}),
                  }}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  ▦ 參考格線
                </button>
                <button
                  style={{
                    ...styles.layerChip,
                    ...(showRoomLabels ? styles.layerChipActive : {}),
                  }}
                  onClick={() => setShowRoomLabels(!showRoomLabels)}
                >
                  🏷 空間分區
                </button>
                {onRotatePlan && (
                  <button
                    style={styles.layerChip}
                    onClick={() => {
                      onRotatePlan();
                      setMobileMenuOpen(false);
                    }}
                  >
                    🔄 旋轉視角 ({planRotation}°)
                  </button>
                )}
              </div>

              <div style={styles.menuDivider} />
              <div style={styles.menuHeader}>空間區域與格局辨識</div>
              <div style={styles.menuActions}>
                {onAutoDetectRooms && (
                  <button
                    onClick={() => {
                      onAutoDetectRooms();
                      setMobileMenuOpen(false);
                    }}
                    style={{ ...styles.actionItem, color: '#ea580c', fontWeight: 700 }}
                  >
                    ⚡ 一鍵依隔間牆辨識所有區域
                  </button>
                )}
                {onAddCustomRoom && (
                  <button
                    onClick={() => {
                      onAddCustomRoom();
                      setMobileMenuOpen(false);
                    }}
                    style={styles.actionItem}
                  >
                    📐 ＋ 新增自訂空間區域
                  </button>
                )}
              </div>

              <div style={styles.menuDivider} />
              <div style={styles.menuHeader}>專案檔案與匯出</div>

              <div style={styles.menuActions}>
                <button
                  onClick={() => {
                    onExportPng();
                    setMobileMenuOpen(false);
                  }}
                  style={styles.actionItem}
                >
                  📷 匯出高清平面圖 (PNG)
                </button>
                <button
                  onClick={() => {
                    onExportJson();
                    setMobileMenuOpen(false);
                  }}
                  style={styles.actionItem}
                >
                  ⬇ 匯出專案配置 (JSON)
                </button>
                <label style={styles.actionItemLabel}>
                  ⬆ 匯入專案配置 (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      onImportJson(e);
                      setMobileMenuOpen(false);
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  // Desktop Header
  return (
    <header style={styles.header}>
      {/* Left: Space Info & Actions */}
      <div style={styles.brandGroup}>
        <div style={styles.spaceInfo}>
          <div style={styles.spaceNameRow}>
            <span style={styles.spaceName}>{space.name}</span>
            <span style={styles.dimensionBadge}>
              {(space.length / 1000).toFixed(2)}m × {(space.width / 1000).toFixed(2)}m · {areaPing} 坪 ({areaM2} m²)
            </span>
          </div>
        </div>

        <button
          onClick={onOpenNewSpaceModal}
          style={styles.newSpaceBtn}
          title="建立自訂尺寸空白空間或載入範本"
        >
          <span>📐 自訂空間尺寸 / 換戶型</span>
        </button>

        {onAutoDetectRooms && (
          <button
            onClick={onAutoDetectRooms}
            style={{
              ...styles.presetQuickBtn,
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              borderColor: '#fdba74',
              fontWeight: 700,
            }}
            title="一鍵根據室內隔間牆自動辨識封閉空間，生成彩色地坪、標籤與精準坪數"
          >
            <span>⚡ 自動辨識格局區域</span>
          </button>
        )}

        {onAddCustomRoom && (
          <button
            onClick={() => onAddCustomRoom('自訂全新分區', 'wood')}
            style={{
              ...styles.presetQuickBtn,
              backgroundColor: '#f8fafc',
              color: '#334155',
              borderColor: '#cbd5e1',
            }}
            title="新增一個自訂空間多邊形區域"
          >
            <span>＋ 新增區域</span>
          </button>
        )}

        <button
          onClick={onResetToBlueprint}
          style={styles.presetQuickBtn}
          title="重設為預設三分離衛浴格局"
        >
          <span>🔄 重設為標準格局</span>
        </button>

        <span
          style={{
            fontSize: '11px',
            color: '#15803d',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="您在瀏覽器中的所有更動 (家具與隔間牆) 均會即時自動暫存至 localStorage，重新整理頁面不會遺失！"
        >
          ● 瀏覽器即時暫存
        </span>
      </div>

      {/* Middle: 2D / 3D Segmented Control */}
      <div style={styles.viewToggleGroup}>
        <button
          style={{
            ...styles.toggleBtn,
            ...(viewMode === '2d' ? styles.toggleBtnActive : {}),
          }}
          onClick={() => setViewMode('2d')}
        >
          <span>📐 2D 平面圖</span>
        </button>
        <button
          style={{
            ...styles.toggleBtn,
            ...(viewMode === '3d' ? styles.toggleBtnActive : {}),
          }}
          onClick={() => setViewMode('3d')}
        >
          <span>🏠 3D 立體實境</span>
        </button>
      </div>

      {/* Right: Layers & Actions */}
      <div style={styles.actionsGroup}>
        <div style={styles.layerToggles}>
          {onToggleLock && (
            <button
              style={{
                ...styles.layerBtn,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: isPlanLocked ? '#fef3c7' : '#f0fdf4',
                color: isPlanLocked ? '#b45309' : '#15803d',
                borderColor: isPlanLocked ? '#f59e0b' : '#22c55e',
                fontWeight: 700,
              }}
              onClick={onToggleLock}
              title={isPlanLocked ? '格局與家具已鎖定 (點擊解鎖以進行搬動或修改)' : '格局編輯模式中 (點擊鎖定防誤觸)'}
            >
              <span>{isPlanLocked ? '🔒 格局已鎖定' : '🔓 編輯模式'}</span>
            </button>
          )}

          <button
            style={{
              ...styles.layerBtn,
              ...(showDimensions ? styles.layerBtnActive : {}),
            }}
            onClick={() => setShowDimensions(!showDimensions)}
            title="開關尺寸標註線"
          >
            標註
          </button>
          <button
            style={{
              ...styles.layerBtn,
              ...(showGrid ? styles.layerBtnActive : {}),
            }}
            onClick={() => setShowGrid(!showGrid)}
            title="開關參考格線"
          >
            格線
          </button>
          <button
            style={{
              ...styles.layerBtn,
              ...(showRoomLabels ? styles.layerBtnActive : {}),
            }}
            onClick={() => setShowRoomLabels(!showRoomLabels)}
            title="開關空間分區名稱"
          >
            分區
          </button>
          {onRotatePlan && (
            <button
              style={{
                ...styles.layerBtn,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={onRotatePlan}
              title={`旋轉 2D 平面圖視角 (每次旋轉 90 度，當前 ${planRotation}°)`}
            >
              <span style={{ display: 'inline-block', transform: `rotate(${planRotation}deg)`, transition: 'transform 0.25s' }}>
                🔄
              </span>
              <span>轉向 ({planRotation % 180 === 0 ? '直向' : '橫向'})</span>
            </button>
          )}
        </div>

        <div style={styles.divider} />

        <div style={styles.fileActions}>
          <button
            onClick={onExportPng}
            style={styles.iconBtn}
            title="匯出高清 2D 平面圖 PNG"
          >
            📷 圖片
          </button>
          <button
            onClick={onExportJson}
            style={styles.iconBtn}
            title="匯出專案配置 JSON"
          >
            ⬇ 匯出
          </button>
          <label style={styles.importLabel} title="匯入專案配置 JSON">
            ⬆ 匯入
            <input
              type="file"
              accept=".json"
              onChange={onImportJson}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={styles.divider} />

        {/* 右側最末：Google 帳號狀態與 Cloudflare 雲端同步狀態 */}
        <div style={styles.authGroup}>
          <div style={styles.syncBadge} title="Cloudflare D1 雲端同步狀態">
            <span
              style={{
                ...styles.syncDot,
                backgroundColor:
                  syncStatus === 'syncing' ? '#eab308' : syncStatus === 'synced' ? '#22c55e' : '#94a3b8',
              }}
            />
            <span style={styles.syncText}>
              {syncStatus === 'syncing' ? '同步中' : syncStatus === 'synced' ? '已同步' : '離線暫存'}
            </span>
          </div>

          {user ? (
            <div style={styles.userProfile}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={styles.userAvatar} />
              ) : (
                <div style={styles.userAvatarPlaceholder}>{user.name ? user.name[0] : 'U'}</div>
              )}
              <span style={styles.userName}>{user.name || user.email}</span>
              <button
                style={styles.logoutBtn}
                onClick={() => {
                  clearAuthSession();
                  if (onLogout) onLogout();
                }}
                title="登出 Google 帳號"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              style={styles.googleLoginBtn}
              onClick={() => handleGoogleAuth()}
              title="透過 Google 登入以跨裝置儲存與同步方案"
            >
              <svg style={styles.googleIcon} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.91H1.21v3.15C3.25 21.41 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.09 0 9.99 0 12s.44 3.91 1.21 5.44l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.59 1.21 6.56l4.11 3.15c.94-2.82 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span>登入</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  // Mobile Header Styles
  mobileHeader: {
    height: 'calc(48px + env(safe-area-inset-top, 0px))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e6e1d6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '12px',
    paddingRight: '12px',
    position: 'relative',
    zIndex: 90,
  },
  mobileBrandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#ea580c',
    backgroundColor: '#fffaf5',
    border: '1px solid #fed7aa',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  mobileRightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mobilePresetBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
    backgroundColor: '#f5f5f4',
    border: '1px solid #d6d3d1',
    color: '#44403c',
    cursor: 'pointer',
  },
  mobileMenuBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f4',
    border: '1px solid #e7e5e4',
    fontSize: '16px',
    fontWeight: 700,
    color: '#1c1917',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  mobileMenuBtnActive: {
    backgroundColor: '#1c1917',
    color: '#ffffff',
  },
  menuBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 25, 23, 0.4)',
    backdropFilter: 'blur(3px)',
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(52px + env(safe-area-inset-top, 0px))',
    right: '12px',
    width: '260px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
    border: '1px solid #e7e5e4',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  menuHeader: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#78716c',
  },
  menuRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  layerChip: {
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
    backgroundColor: '#fafaf9',
    border: '1px solid #e7e5e4',
    color: '#78716c',
    cursor: 'pointer',
  },
  layerChipActive: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
    color: '#c2410c',
    fontWeight: 700,
  },
  menuDivider: {
    height: '1px',
    backgroundColor: '#efebe2',
    margin: '2px 0',
  },
  menuActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  actionItem: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    backgroundColor: '#fafaf9',
    border: '1px solid #e7e5e4',
    color: '#1c1917',
    textAlign: 'left',
    cursor: 'pointer',
  },
  actionItemLabel: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    backgroundColor: '#fafaf9',
    border: '1px solid #e7e5e4',
    color: '#1c1917',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'block',
  },

  // Desktop Header Styles
  header: {
    height: '56px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e6e1d6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    userSelect: 'none',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    gap: '12px',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  mobileSpaceName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#e6e1d6',
    flexShrink: 0,
  },
  spaceInfo: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  spaceNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spaceName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
    maxWidth: '220px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dimensionBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#f5f5f4',
    color: '#78716c',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    flexShrink: 0,
  },
  newSpaceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #c2410c',
    backgroundColor: '#fffaf5',
    color: '#c2410c',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  presetQuickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 7px',
    borderRadius: '6px',
    border: '1px solid #d6d3d1',
    backgroundColor: '#f5f5f4',
    color: '#44403c',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  viewToggleGroup: {
    display: 'flex',
    backgroundColor: '#f5f5f4',
    borderRadius: '8px',
    padding: '2px',
    border: '1px solid #e7e5e4',
    flexShrink: 0,
  },
  toggleBtn: {
    padding: '4px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#78716c',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1c1917',
    boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  layerToggles: {
    display: 'flex',
    backgroundColor: '#f5f5f4',
    borderRadius: '6px',
    padding: '2px',
    flexShrink: 0,
  },
  layerBtn: {
    padding: '4px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a8a29e',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  layerBtnActive: {
    backgroundColor: '#ffffff',
    color: '#c2410c',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  fileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  iconBtn: {
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #e7e5e4',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#44403c',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  importLabel: {
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #e7e5e4',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#44403c',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  authGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  syncBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#78716c',
    backgroundColor: '#f5f5f4',
    padding: '3px 7px',
    borderRadius: '12px',
    border: '1px solid #e7e5e4',
    whiteSpace: 'nowrap',
  },
  syncDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  syncText: {
    fontSize: '11px',
    fontWeight: 600,
  },
  googleLoginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #d6d3d1',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    color: '#374151',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    whiteSpace: 'nowrap',
  },
  googleIcon: {
    width: '13px',
    height: '13px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
  },
  userAvatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userAvatarPlaceholder: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
  },
  userName: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#292524',
    maxWidth: '90px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    padding: '2px 5px',
    fontSize: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#f5f5f4',
    borderRadius: '4px',
    color: '#78716c',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
