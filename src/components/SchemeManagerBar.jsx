import React, { useState } from 'react';

export default function SchemeManagerBar({
  units = [],
  activeUnitId,
  onSelectActiveUnit,
  onToggleUnitVisibility,
  onCloneUnit,
  onRenameUnit,
  onSetAsDefaultScheme,
  onAutoSpreadSchemes,
  onAddBlankUnit,
  onDeleteUnit,
  layoutMode,
  onChangeLayoutMode,
}) {
  return (
    <div style={styles.container}>
      {/* 左側：多方案並排對比標籤群組與管理控制列 */}
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

                {/* 方案重新命名快捷按鈕 */}
                <button
                  style={styles.renameBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newName = window.prompt(`請輸入方案 ${String.fromCharCode(65 + idx)} 的新名稱：`, unit.name);
                    if (newName && newName.trim() && newName.trim() !== unit.name) {
                      if (onRenameUnit) onRenameUnit(unit.id, newName.trim());
                    }
                  }}
                  title="重新命名此戶型名稱 (在匯出與 3D 漫遊時顯示)"
                >
                  ✏️
                </button>

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

        {/* 方案新增 / 複製 / 重新命名 / 預設 / 間距排版控制按鈕群 */}
        <div style={styles.actionsWrap}>
          <button
            style={styles.addBtn}
            onClick={() => onCloneUnit(activeUnitId)}
            title="以當前活躍方案為範本，複製為新方案進行改動對比"
          >
            ＋ 複製當前戶型
          </button>
          <button
            style={styles.actionSecondaryBtn}
            onClick={() => {
              const cur = units.find((u) => u.id === activeUnitId) || units[0];
              if (!cur) return;
              const newName = window.prompt('請輸入當前戶型的新名稱：', cur.name);
              if (newName && newName.trim() && newName.trim() !== cur.name) {
                if (onRenameUnit) onRenameUnit(cur.id, newName.trim());
              }
            }}
            title="重新命名當前戶型名稱 (在匯出與 3D 漫遊時顯示)"
          >
            ✏️ 重新命名
          </button>
          {onSetAsDefaultScheme && (
            <button
              style={{
                ...styles.actionSecondaryBtn,
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                borderColor: '#bbf7d0',
              }}
              onClick={() => onSetAsDefaultScheme(activeUnitId)}
              title="將當前戶型儲存為自訂預設戶型 (日後新建或重設時以此為標準)"
            >
              💾 設為預設戶型
            </button>
          )}
          {onAutoSpreadSchemes && (
            <button
              style={styles.actionSecondaryBtn}
              onClick={onAutoSpreadSchemes}
              title="一鍵智慧計算並拉開所有方案間距 (防止戶型重疊)"
            >
              ↔ 自動拉開間距
            </button>
          )}
          <button
            style={styles.layoutToggleBtn}
            onClick={() => onChangeLayoutMode(layoutMode === 'horizontal' ? 'vertical' : 'horizontal')}
            title="切換方案在畫布上的排列方向"
          >
            {layoutMode === 'horizontal' ? '⬌ 橫向並排' : '⬍ 直向並列'}
          </button>
        </div>
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
    padding: '0 12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    zIndex: 60,
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
  schemesGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
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
    flexShrink: 0,
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
  renameBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#78716c',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
    opacity: 0.7,
    transition: 'opacity 0.15s',
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
    gap: '6px',
    marginLeft: '4px',
    flexShrink: 0,
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
  actionSecondaryBtn: {
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #e7e5e4',
    backgroundColor: '#fafaf9',
    borderRadius: '12px',
    color: '#44403c',
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
};

