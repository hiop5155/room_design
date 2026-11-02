import React, { useState } from 'react';
import { generateEmptySpace, PRESET_SPACES } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';

export default function NewSpaceModal({ isOpen, onClose, onApplySpace }) {
  const isMobile = useIsMobile(768);
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'presets'

  // 自訂空間表單狀態
  const [spaceName, setSpaceName] = useState('自訂全新空間');
  const [lengthMm, setLengthMm] = useState(10000);
  const [widthMm, setWidthMm] = useState(6000);
  const [heightMm, setHeightMm] = useState(2800);
  const [wallThickMm, setWallThickMm] = useState(200);
  const [segHStr, setSegHStr] = useState('');
  const [segVStr, setSegVStr] = useState('');
  const [addDoor, setAddDoor] = useState(true);
  const [addWin, setAddWin] = useState(true);

  if (!isOpen) return null;

  // 計算即時坪數
  const currentAreaM2 = ((lengthMm * widthMm) / 1000000).toFixed(1);
  const currentAreaPing = (currentAreaM2 * 0.3025).toFixed(1);

  const handleCreateCustom = (e) => {
    e.preventDefault();
    const l = Math.max(2000, Number(lengthMm) || 10000);
    const w = Math.max(2000, Number(widthMm) || 6000);
    const h = Math.max(2000, Number(heightMm) || 2800);
    const t = Math.max(100, Number(wallThickMm) || 200);

    // 解析分段
    let dimH = null;
    if (segHStr.trim()) {
      dimH = segHStr
        .split(/[,，\s]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }
    let dimV = null;
    if (segVStr.trim()) {
      dimV = segVStr
        .split(/[,，\s]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    const newSpace = generateEmptySpace({
      name: spaceName.trim() || `自訂空間 (${(l / 1000).toFixed(1)}m × ${(w / 1000).toFixed(1)}m)`,
      length: l,
      width: w,
      height: h,
      wallThickness: t,
      dimHorizontal: dimH,
      dimVertical: dimV,
      includeDefaultDoor: addDoor,
      includeDefaultWindow: addWin,
    });

    onApplySpace(newSpace);
    onClose();
  };

  const handleSelectPreset = (preset) => {
    // 深拷貝預設資料，避免直接變更
    const copied = JSON.parse(JSON.stringify(preset.data));
    onApplySpace(copied);
    onClose();
  };

  return (
    <div
      style={{
        ...styles.overlay,
        ...(isMobile ? { padding: 0, alignItems: 'flex-end' } : {}),
      }}
    >
      <div
        style={{
          ...styles.modal,
          ...(isMobile
            ? {
                borderRadius: '20px 20px 0 0',
                maxHeight: '92dvh',
                maxWidth: '100%',
              }
            : {}),
        }}
      >
        {/* Header */}
        <div
          style={{
            ...styles.header,
            ...(isMobile ? { padding: '16px 20px 12px' } : {}),
          }}
        >
          <div>
            <h2 style={{ ...styles.title, ...(isMobile ? { fontSize: '18px' } : {}) }}>
              空間尺寸與戶型生成
            </h2>
            <p style={styles.subtitle}>
              輸入自訂空間尺寸生成空白空間，或直接載入本案預設戶型
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="關閉">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'custom' ? styles.tabBtnActive : {}),
              ...(isMobile ? { padding: '8px 12px', fontSize: '13px' } : {}),
            }}
            onClick={() => setActiveTab('custom')}
          >
            ✏️ 自訂尺寸生成空白空間
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'presets' ? styles.tabBtnActive : {}),
              ...(isMobile ? { padding: '8px 12px', fontSize: '13px' } : {}),
            }}
            onClick={() => setActiveTab('presets')}
          >
            📂 載入預設戶型
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            ...styles.content,
            ...(isMobile ? { padding: '16px 20px' } : {}),
          }}
        >
          {activeTab === 'custom' ? (
            <form onSubmit={handleCreateCustom} style={styles.form}>
              <div
                style={{
                  ...styles.grid2,
                  ...(isMobile ? { gridTemplateColumns: '1fr', gap: '12px' } : {}),
                }}
              >
                <div style={styles.field}>
                  <label style={styles.label}>空間名稱</label>
                  <input
                    type="text"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    style={styles.input}
                    placeholder="例：自訂三房兩廳、挑高套房"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>天花板室內淨高 (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={heightMm}
                    onChange={(e) => setHeightMm(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.dimensionBox}>
                <div
                  style={{
                    ...styles.grid2,
                    ...(isMobile ? { gridTemplateColumns: '1fr', gap: '12px' } : {}),
                  }}
                >
                  <div style={styles.field}>
                    <label style={styles.labelBold}>
                      總長度 Length (X 軸，mm)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={lengthMm}
                      onChange={(e) => setLengthMm(e.target.value)}
                      style={{ ...styles.input, fontWeight: 700 }}
                    />
                    <span style={styles.hint}>
                      {(lengthMm / 1000).toFixed(2)} 公尺 (m)
                    </span>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.labelBold}>
                      總寬度 Width (Y 軸，mm)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={widthMm}
                      onChange={(e) => setWidthMm(e.target.value)}
                      style={{ ...styles.input, fontWeight: 700 }}
                    />
                    <span style={styles.hint}>
                      {(widthMm / 1000).toFixed(2)} 公尺 (m)
                    </span>
                  </div>
                </div>

                <div style={styles.areaPreview}>
                  <div style={styles.areaItem}>
                    <span style={styles.areaLabel}>預估室內總面積</span>
                    <strong style={styles.areaVal}>{currentAreaM2} m²</strong>
                  </div>
                  <div style={styles.areaDivider}>/</div>
                  <div style={styles.areaItem}>
                    <span style={styles.areaLabel}>換算台灣實坪</span>
                    <strong style={styles.areaValHighlight}>{currentAreaPing} 坪</strong>
                  </div>
                </div>
              </div>

              {/* 進階分段標註 (選填) */}
              <div style={styles.fieldSection}>
                <div style={styles.fieldSectionTitle}>
                  📐 工程尺寸分段標註 (選填)
                </div>
                <div
                  style={{
                    ...styles.grid2,
                    ...(isMobile ? { gridTemplateColumns: '1fr', gap: '12px' } : {}),
                  }}
                >
                  <div style={styles.field}>
                    <label style={styles.label}>
                      橫向分段 (mm，逗號分隔)
                    </label>
                    <input
                      type="text"
                      value={segHStr}
                      onChange={(e) => setSegHStr(e.target.value)}
                      style={styles.input}
                      placeholder="例：3480, 3930, 5330, 6510"
                    />
                    <span style={styles.hint}>留空則標註整體外廓總長</span>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>
                      直向分段 (mm，逗號分隔)
                    </label>
                    <input
                      type="text"
                      value={segVStr}
                      onChange={(e) => setSegVStr(e.target.value)}
                      style={styles.input}
                      placeholder="例：2200, 2610"
                    />
                    <span style={styles.hint}>留空則標註整體外廓總寬</span>
                  </div>
                </div>
              </div>

              {/* 預設配備勾選 */}
              <div
                style={{
                  ...styles.checkRow,
                  ...(isMobile ? { flexDirection: 'column', gap: '8px' } : {}),
                }}
              >
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={addDoor}
                    onChange={(e) => setAddDoor(e.target.checked)}
                    style={styles.checkbox}
                  />
                  自動放置標準入戶大門
                </label>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={addWin}
                    onChange={(e) => setAddWin(e.target.checked)}
                    style={styles.checkbox}
                  />
                  自動放置外牆主採光窗
                </label>
              </div>

              {/* Submit */}
              <div style={styles.footer}>
                <button
                  type="button"
                  onClick={onClose}
                  style={styles.btnSecondary}
                >
                  取消
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  ✨ 立即生成空白空間
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.presetList}>
              {PRESET_SPACES.map((preset) => (
                <div key={preset.id} style={styles.presetCard}>
                  <div style={styles.presetTop}>
                    <span style={styles.presetTag}>{preset.tag}</span>
                    <h3 style={styles.presetTitle}>{preset.title}</h3>
                  </div>
                  <p style={styles.presetDesc}>{preset.description}</p>
                  <button
                    onClick={() => handleSelectPreset(preset)}
                    style={styles.presetBtn}
                  >
                    選擇並載入此戶型 →
                  </button>
                </div>
              ))}
            </div>
          )}
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
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '680px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    border: '1px solid #e6e1d6',
  },
  header: {
    padding: '24px 28px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #efebe2',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1c1917',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#78716c',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#a8a29e',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  tabBar: {
    display: 'flex',
    padding: '8px 24px 0',
    borderBottom: '1px solid #efebe2',
    backgroundColor: '#faf8f5',
    gap: '8px',
  },
  tabBtn: {
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    background: 'transparent',
    color: '#78716c',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: '#c2410c',
    borderBottom: '3px solid #c2410c',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  content: {
    padding: '24px 28px',
    overflowY: 'auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#44403c',
  },
  labelBold: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d6d3d1',
    backgroundColor: '#fafaf9',
    outline: 'none',
  },
  hint: {
    fontSize: '11px',
    color: '#a8a29e',
  },
  dimensionBox: {
    padding: '16px',
    backgroundColor: '#fffaf5',
    border: '1px solid #fed7aa',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  areaPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px dashed #fdba74',
  },
  areaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  areaLabel: {
    fontSize: '11px',
    color: '#78716c',
  },
  areaVal: {
    fontSize: '18px',
    color: '#1c1917',
  },
  areaValHighlight: {
    fontSize: '20px',
    color: '#ea580c',
  },
  areaDivider: {
    fontSize: '18px',
    color: '#fdba74',
    fontWeight: 300,
  },
  fieldSection: {
    padding: '14px',
    backgroundColor: '#f5f5f4',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fieldSectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#57534e',
  },
  checkRow: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#44403c',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#c2410c',
    width: '16px',
    height: '16px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #efebe2',
  },
  btnSecondary: {
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #d6d3d1',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#44403c',
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '10px 22px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#c2410c',
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(194, 65, 12, 0.3)',
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  presetCard: {
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#fafaf9',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  presetTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  presetTag: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#ffedd5',
    color: '#9a3412',
  },
  presetTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#1c1917',
  },
  presetDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#78716c',
    lineHeight: '1.5',
  },
  presetBtn: {
    alignSelf: 'flex-start',
    marginTop: '4px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#ffffff',
    border: '1px solid #d6d3d1',
    borderRadius: '6px',
    color: '#1c1917',
    cursor: 'pointer',
  },
};

