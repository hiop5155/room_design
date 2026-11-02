import React from 'react';

export default function MobileBottomBar({
  viewMode,
  setViewMode,
  onOpenCatalog,
  onOpenProperties,
  onOpenNewSpace,
  hasSelection,
}) {
  return (
    <nav style={styles.navBar}>
      <button onClick={onOpenCatalog} style={styles.tabBtn}>
        <span style={styles.icon}>🛋</span>
        <span style={styles.label}>置入元件</span>
      </button>

      <button
        onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
        style={{
          ...styles.tabBtn,
          ...(viewMode === '3d' ? styles.tabBtnActive : {}),
        }}
      >
        <span style={styles.icon}>{viewMode === '2d' ? '🏠' : '📐'}</span>
        <span style={styles.label}>{viewMode === '2d' ? '3D 實境' : '2D 平面'}</span>
      </button>

      <button
        onClick={onOpenProperties}
        style={{
          ...styles.tabBtn,
          ...(hasSelection ? styles.tabBtnHighlighted : {}),
        }}
      >
        {hasSelection && <span style={styles.dotBadge} />}
        <span style={styles.icon}>⚙</span>
        <span style={styles.label}>{hasSelection ? '物件編輯' : '空間資訊'}</span>
      </button>

      <button onClick={onOpenNewSpace} style={styles.tabBtn}>
        <span style={styles.icon}>📏</span>
        <span style={styles.label}>換戶型</span>
      </button>
    </nav>
  );
}

const styles = {
  navBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid #e6e1d6',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 80,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
  },
  tabBtn: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#57534e',
    minWidth: '60px',
  },
  tabBtnActive: {
    color: '#c2410c',
  },
  tabBtnHighlighted: {
    color: '#c2410c',
    backgroundColor: '#fffaf5',
  },
  icon: {
    fontSize: '18px',
    lineHeight: 1,
    marginBottom: '3px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
  },
  dotBadge: {
    position: 'absolute',
    top: '6px',
    right: '18px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ea580c',
  },
};

