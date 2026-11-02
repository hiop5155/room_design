import React from 'react';

export default function MobileQuickToolbar({
  selectedItem,
  onRotate,
  onDuplicate,
  onDelete,
  onDeselect,
  onOpenDetails,
}) {
  if (!selectedItem) return null;

  if (selectedItem.isRoom) {
    return (
      <div style={styles.container} className="bottom-sheet-panel">
        <div style={styles.infoRow}>
          <div style={styles.nameBlock}>
            <span style={{ ...styles.dot, backgroundColor: '#ea580c' }} />
            <span style={styles.name}>{selectedItem.name}</span>
            <span style={styles.dim}>({selectedItem.areaPing || 0} 坪 · {selectedItem.areaM2 || 0} m²)</span>
          </div>
          <button onClick={onOpenDetails} style={styles.detailBtn}>
            編輯分區 ⚙
          </button>
        </div>

        <div style={styles.actionRow}>
          <button
            onClick={onDelete}
            style={{ ...styles.btnAction, ...styles.btnDanger }}
            title="刪除空間分區"
          >
            <span style={styles.icon}>🗑</span>
            <span style={styles.label}>刪除分區</span>
          </button>
          <button onClick={onDeselect} style={styles.btnClose} title="完成">
            完成 ✓
          </button>
        </div>
      </div>
    );
  }

  if (selectedItem.isWall) {
    return (
      <div style={styles.container} className="bottom-sheet-panel">
        <div style={styles.infoRow}>
          <div style={styles.nameBlock}>
            <span
              style={{
                ...styles.dot,
                backgroundColor: selectedItem.isLocked ? '#71717a' : '#ea580c',
              }}
            />
            <span style={styles.name}>{selectedItem.name}</span>
            <span style={styles.dim}>
              ({selectedItem.orientation === 'vertical' ? `X: ${Math.round(selectedItem.pos)}mm` : `Y: ${Math.round(selectedItem.pos)}mm`})
            </span>
          </div>
          <button onClick={onOpenDetails} style={styles.detailBtn}>
            詳細數值 ⚙
          </button>
        </div>

        <div style={styles.actionRow}>
          {!selectedItem.isLocked && (
            <button
              onClick={onDelete}
              style={{ ...styles.btnAction, ...styles.btnDanger }}
              title="拆除隔間牆"
            >
              <span style={styles.icon}>🗑</span>
              <span style={styles.label}>拆除隔間</span>
            </button>
          )}
          <button onClick={onDeselect} style={styles.btnClose} title="完成">
            完成 ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="bottom-sheet-panel">
      <div style={styles.infoRow}>
        <div style={styles.nameBlock}>
          <span style={{ ...styles.dot, backgroundColor: selectedItem.color || '#a8a29e' }} />
          <span style={styles.name}>{selectedItem.name}</span>
          <span style={styles.dim}>({selectedItem.w} × {selectedItem.d})</span>
        </div>
        <button onClick={onOpenDetails} style={styles.detailBtn}>
          詳細數值 ⚙
        </button>
      </div>

      <div style={styles.actionRow}>
        <button onClick={onRotate} style={styles.btnAction} title="旋轉 90 度">
          <span style={styles.icon}>↻</span>
          <span style={styles.label}>旋轉 90°</span>
        </button>
        <button onClick={onDuplicate} style={styles.btnAction} title="複製物件">
          <span style={styles.icon}>❐</span>
          <span style={styles.label}>複製</span>
        </button>
        <button onClick={onDelete} style={{ ...styles.btnAction, ...styles.btnDanger }} title="刪除物件">
          <span style={styles.icon}>🗑</span>
          <span style={styles.label}>刪除</span>
        </button>
        <button onClick={onDeselect} style={styles.btnClose} title="完成">
          完成 ✓
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: '72px',
    left: '12px',
    right: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '12px 14px',
    boxShadow: '0 8px 24px rgba(28, 25, 23, 0.18)',
    border: '1px solid #e7e5e4',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #f5f5f4',
  },
  nameBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflow: 'hidden',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: '160px',
  },
  dim: {
    fontSize: '11px',
    color: '#78716c',
    fontVariantNumeric: 'tabular-nums',
  },
  detailBtn: {
    fontSize: '12px',
    color: '#c2410c',
    backgroundColor: '#fffaf5',
    border: '1px solid #fed7aa',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
  },
  btnAction: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '8px 4px',
    borderRadius: '10px',
    backgroundColor: '#f5f5f4',
    border: '1px solid #e7e5e4',
    cursor: 'pointer',
  },
  btnDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#b91c1c',
  },
  icon: {
    fontSize: '15px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
  },
  btnClose: {
    padding: '0 14px',
    borderRadius: '10px',
    backgroundColor: '#1c1917',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

