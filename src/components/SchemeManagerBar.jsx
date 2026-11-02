import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { getStoredUser, clearAuthSession } from '../services/api';

export default function SchemeManagerBar({
  units = [],
  activeUnitId,
  onSelectActiveUnit,
  onToggleUnitVisibility,
  onCloneUnit,
  onAddBlankUnit,
  onDeleteUnit,
  layoutMode,
  onChangeLayoutMode,
  user,
  onLoginSuccess,
  onLogout,
  syncStatus = 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Google 登入觸發
  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (onLoginSuccess) {
        // 使用 access_token 取得 Google 使用者資料
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

  return (
    <div style={styles.container}>
      {/* 左側：多方案並排對比標籤群組 */}
      <div style={styles.schemesGroup}>
        <div style={styles.badgeLabel}>
          <span style={styles.badgeIcon}>📐</span>
          <span>方案對比</span>
        </div>

        {/* 方案清單 */}
        <div style={styles.unitList}>
          {units.map((unit, idx) => {
            const isActive = unit.id === activeUnitId;
            const isVisible = unit.visible !== false;

            return (
              <div
                key={unit.id}
                style={{
                  ...styles.unitPill,
                  ...(isActive ? styles.unitPillActive : {}),
                  ...(!isVisible ? styles.unitPillHidden : {}),
                }}
              >
                {/* 眼睛可見性開關 */}
                <button
                  style={{
                    ...styles.visBtn,
                    ...(isVisible ? styles.visBtnOn : styles.visBtnOff),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUnitVisibility(unit.id);
                  }}
                  title={isVisible ? '點擊在 2D/3D 中隱藏此方案' : '點擊在 2D/3D 中同時渲染此方案'}
                >
                  {isVisible ? '👁️' : '🚫'}
                </button>

                {/* 方案名稱 (點擊設為活躍編輯) */}
                <span
                  style={styles.unitTitle}
                  onClick={() => onSelectActiveUnit(unit.id)}
                  title={`切換為當前編輯方案 (${unit.name})`}
                >
                  <strong style={styles.unitChar}>{String.fromCharCode(65 + idx)}.</strong> {unit.name}
                </span>

                {/* 方案刪除 (至少保留 1 個方案) */}
                {units.length > 1 && (
                  <button
                    style={styles.delBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`確定要刪除「${unit.name}」嗎？`)) {
                        onDeleteUnit(unit.id);
                      }
                    }}
                    title="刪除此方案"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 方案新增 / 複製下拉選單 */}
        <div style={styles.actionsWrap}>
          <button
            style={styles.addBtn}
            onClick={() => onCloneUnit(activeUnitId)}
            title="以當前活躍方案為範本，複製為新方案進行改動對比"
          >
            ＋ 複製方案
          </button>
          <button
            style={styles.layoutToggleBtn}
            onClick={() => onChangeLayoutMode(layoutMode === 'horizontal' ? 'vertical' : 'horizontal')}
            title="切換方案在畫布上的排列方向"
          >
            {layoutMode === 'horizontal' ? '⬌ 橫向並排' : '⬍ 直向並列'}
          </button>
        </div>
      </div>

      {/* 右側：Google 帳號狀態與 Cloudflare 雲端同步狀態 */}
      <div style={styles.authGroup}>
        {/* 同步狀態指示燈 */}
        <div style={styles.syncBadge}>
          <span
            style={{
              ...styles.syncDot,
              backgroundColor:
                syncStatus === 'syncing' ? '#eab308' : syncStatus === 'synced' ? '#22c55e' : '#94a3b8',
            }}
          />
          <span style={styles.syncText}>
            {syncStatus === 'syncing' ? '雲端同步中...' : syncStatus === 'synced' ? 'D1 雲端已同步' : '本地離線暫存 (IndexedDB)'}
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
            Google 登入
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '42px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e7e5e4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    zIndex: 60,
  },
  schemesGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflowX: 'auto',
    maxWidth: 'calc(100vw - 360px)',
  },
  badgeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#78716c',
    backgroundColor: '#f5f5f4',
    padding: '3px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  badgeIcon: {
    fontSize: '13px',
  },
  unitList: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  unitPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    backgroundColor: '#fafaf9',
    border: '1px solid #e7e5e4',
    borderRadius: '16px',
    fontSize: '12px',
    color: '#44403c',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  unitPillActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
    color: '#c2410c',
    fontWeight: 700,
    boxShadow: '0 1px 4px rgba(234, 88, 12, 0.12)',
  },
  unitPillHidden: {
    opacity: 0.5,
    backgroundColor: '#f5f5f4',
    borderStyle: 'dashed',
  },
  visBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '0 2px',
    fontSize: '13px',
    lineHeight: 1,
  },
  visBtnOn: {},
  visBtnOff: {
    filter: 'grayscale(1)',
  },
  unitTitle: {
    userSelect: 'none',
  },
  unitChar: {
    color: '#ea580c',
    marginRight: '2px',
  },
  delBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a8a29e',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
    borderRadius: '50%',
  },
  actionsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '4px',
  },
  addBtn: {
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px dashed #d6d3d1',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    color: '#57534e',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  layoutToggleBtn: {
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #e7e5e4',
    backgroundColor: '#fafaf9',
    borderRadius: '12px',
    color: '#78716c',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  authGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  syncBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#78716c',
    whiteSpace: 'nowrap',
  },
  syncDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  syncText: {
    fontSize: '11px',
  },
  googleLoginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    color: '#374151',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  googleIcon: {
    width: '14px',
    height: '14px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userAvatarPlaceholder: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  userName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#292524',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    padding: '2px 6px',
    fontSize: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#f5f5f4',
    borderRadius: '4px',
    color: '#78716c',
    cursor: 'pointer',
  },
};

