import React from 'react';
import { generateDynamicRoomPresets } from './Viewport3D';

export default function WalkRoomPickerModal({
  isOpen,
  onClose,
  units,
  activeUnitId,
  onSelectTarget,
}) {
  if (!isOpen) return null;

  // 過濾出當前可見的方案
  const visibleUnits = (units || []).filter((u) => u.visible !== false);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 頂部 Header */}
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <span style={styles.icon}>🚶‍♂️</span>
            <div>
              <h3 style={styles.title}>選擇漫遊出發方案與房間</h3>
              <p style={styles.subTitle}>畫布上已同時載入多套設計方案，請選擇您想親身走入體驗的空間：</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 方案清單 */}
        <div style={styles.body}>
          {visibleUnits.length === 0 ? (
            <div style={styles.emptyTip}>目前沒有勾選任何可見方案，請先在方案清單中開啟至少一個方案。</div>
          ) : (
            visibleUnits.map((unit, uIdx) => {
              const presets = generateDynamicRoomPresets(unit);
              const isCurrent = unit.id === activeUnitId;

              return (
                <div
                  key={unit.id}
                  style={{
                    ...styles.unitCard,
                    ...(isCurrent ? styles.unitCardActive : {}),
                  }}
                >
                  <div style={styles.unitHeader}>
                    <div style={styles.unitBadge}>
                      <span style={styles.unitBadgeDot} />
                      <span style={styles.unitBadgeText}>方案 {String.fromCharCode(65 + uIdx)}</span>
                    </div>
                    <span style={styles.unitName}>{unit.name}</span>
                    {isCurrent && <span style={styles.activeTag}>當前編輯中</span>}
                  </div>

                  {/* 該方案的房間列表按鈕 */}
                  <div style={styles.roomGrid}>
                    {presets.map((rm) => (
                      <button
                        key={rm.id}
                        style={styles.roomBtn}
                        onClick={() => {
                          onSelectTarget(unit, rm);
                          onClose();
                        }}
                      >
                        <span style={styles.roomBtnName}>{rm.name}</span>
                        <span style={styles.roomBtnArrow}>➔ 漫遊直達</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部說明 */}
        <div style={styles.footer}>
          <span style={styles.footerTip}>💡 提示：漫遊中可隨時點擊右上角「快速直達」或小地圖切換到其他房間。</span>
          <button style={styles.cancelBtn} onClick={onClose}>關閉</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'modalSlideUp 0.2s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f0eeee',
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '26px',
    backgroundColor: '#fff7ed',
    padding: '6px 10px',
    borderRadius: '12px',
    border: '1px solid #ffedd5',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#1c1917',
  },
  subTitle: {
    margin: '3px 0 0 0',
    fontSize: '12px',
    color: '#78716c',
  },
  closeBtn: {
    border: 'none',
    backgroundColor: '#f5f5f4',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#78716c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyTip: {
    padding: '30px',
    textAlign: 'center',
    color: '#a8a29e',
    fontSize: '14px',
  },
  unitCard: {
    border: '1.5px solid #e7e5e4',
    borderRadius: '12px',
    padding: '14px',
    backgroundColor: '#fafaf9',
    transition: 'all 0.15s ease',
  },
  unitCardActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fffaf5',
  },
  unitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  unitBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#1c1917',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '10px',
  },
  unitBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  unitBadgeText: {
    letterSpacing: '0.5px',
  },
  unitName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#292524',
  },
  activeTag: {
    fontSize: '11px',
    color: '#ea580c',
    backgroundColor: '#ffedd5',
    padding: '1px 7px',
    borderRadius: '8px',
    fontWeight: 600,
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '8px',
  },
  roomBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e7e5e4',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  roomBtnName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#44403c',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roomBtnArrow: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#ea580c',
    marginLeft: '6px',
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid #f0eeee',
    backgroundColor: '#fafaf9',
  },
  footerTip: {
    fontSize: '11px',
    color: '#78716c',
  },
  cancelBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #d6d3d1',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    color: '#57534e',
    cursor: 'pointer',
  },
};

