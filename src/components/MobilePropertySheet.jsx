import React from 'react';
import { getProductImage } from '../utils/productImages';

export default function MobilePropertySheet({
  isOpen,
  onClose,
  space,
  selectedItem,
  onUpdateSelectedItem,
  onDeleteSelectedItem,
  onDuplicateSelectedItem,
}) {
  if (!isOpen) return null;

  const areaM2 = ((space.length * space.width) / 1000000).toFixed(1);
  const areaPing = (areaM2 * 0.3025).toFixed(1);

  const handleRotate = () => {
    if (!selectedItem) return;
    const nextRot = ((selectedItem.rot || 0) + 90) % 360;
    onUpdateSelectedItem({ rot: nextRot });
  };

  const getFacingLabel = (rot = 0) => {
    const normalized = ((rot % 360) + 360) % 360;
    if (normalized >= 315 || normalized < 45) return '朝南 (0°)';
    if (normalized >= 45 && normalized < 135) return '朝西 (90°)';
    if (normalized >= 135 && normalized < 225) return '朝北 (180°)';
    return '朝東 (270°)';
  };

  const PRESET_COLORS = [
    { label: '原木', color: '#d4b996' },
    { label: '暖灰', color: '#78716c' },
    { label: '黑曜', color: '#292524' },
    { label: '石墨', color: '#475569' },
    { label: '純白', color: '#f8fafc' },
    { label: '珊瑚', color: '#ea580c' },
  ];

  return (
    <div style={styles.overlay} className="bottom-sheet-overlay" onClick={onClose}>
      <div
        style={styles.sheet}
        className="bottom-sheet-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Grab Bar */}
        <div style={styles.handleBar} onClick={onClose}>
          <div style={styles.handle} />
        </div>

        {/* Sheet Header */}
        <div style={styles.header}>
          <div style={styles.headerTextGroup}>
            <div style={styles.title}>
              {selectedItem
                ? selectedItem.isRoom
                  ? '空間分區屬性'
                  : selectedItem.isDoor
                  ? '門扇構件屬性'
                  : selectedItem.isWall
                  ? '室內隔間牆屬性'
                  : '編輯物件屬性'
                : '空間指標與全室資訊'}
            </div>
            {selectedItem && (
              <div style={styles.subBadgeRow}>
                <span
                  style={{
                    ...styles.subBadgeDot,
                    backgroundColor: selectedItem.color || (selectedItem.isRoom ? '#ea580c' : selectedItem.isDoor ? '#ea580c' : selectedItem.isWall ? (selectedItem.isLocked ? '#71717a' : '#ea580c') : '#78716c'),
                  }}
                />
                <span style={styles.subBadgeText}>
                  {selectedItem.isRoom
                    ? `📐 面積 ${selectedItem.areaM2 || 0} m² (${selectedItem.areaPing || 0} 坪)`
                    : selectedItem.isDoor
                    ? selectedItem.isLocked
                      ? '🔒 主要入戶大門 (固定)'
                      : `🚪 ${selectedItem.isSliding ? '滑動推拉門' : '單開室內門'} · 寬度 ${selectedItem.length || 900}mm`
                    : selectedItem.isWall
                    ? selectedItem.isLocked
                      ? '🔒 建築承重結構 / 外牆 (固定)'
                      : `✨ 可移動隔間 · 厚度 ${selectedItem.thickness}mm`
                    : `${selectedItem.w} × ${selectedItem.d} mm · ${getFacingLabel(selectedItem.rot)}`}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="關閉">
            ✕
          </button>
        </div>

        {/* Sheet Body Content */}
        <div style={styles.content}>
          {selectedItem ? (
            selectedItem.isRoom ? (
              /* ==================== 房間區域專屬屬性編輯 ==================== */
              <div style={styles.formStack}>
                <div style={styles.cardSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c' }}>📐 空間分區資訊</span>
                    <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700 }}>
                      {selectedItem.isAuto ? '⚡ 自動辨識' : '✨ 自訂分區'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>估算坪數</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>{selectedItem.areaPing || 0} 坪</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>實質面積</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{selectedItem.areaM2 || 0} m²</div>
                    </div>
                  </div>
                  <label style={styles.cardLabel}>🏷 分區名稱</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                    style={styles.input}
                    placeholder="輸入分區名稱"
                  />
                </div>

                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>⚡ 快速推薦命名</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      '👑 景觀主臥', '🛏️ 獨立客房', '🛋️ 景觀客餐廳',
                      '🍳 獨立廚房', '🛁 三分離衛浴', '🧺 洗衣曬衣區',
                      '💻 獨立書房', '📦 步入更衣室', '🪜 梯間動線',
                    ].map((pName) => (
                      <button
                        key={pName}
                        type="button"
                        style={{
                          padding: '6px 2px',
                          fontSize: '11px',
                          border: '1px solid',
                          borderRadius: '6px',
                          backgroundColor: selectedItem.name === pName ? '#ea580c' : '#ffffff',
                          color: selectedItem.name === pName ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.name === pName ? '#c2410c' : '#e2e8f0',
                          fontWeight: selectedItem.name === pName ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ name: pName })}
                      >
                        {pName}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>🪵 地坪材質 (同步 2D/3D)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'wood', name: '🪵 溫潤實木地板' },
                      { id: 'tile', name: '✨ 拋光石英磚' },
                      { id: 'tile_gray', name: '🌫 啞光灰耐磨磚' },
                      { id: 'marble', name: '🏛 義大利大理石' },
                      { id: 'wood_dark', name: '🎋 沉穩日式深木' },
                    ].map((mItem) => (
                      <button
                        key={mItem.id}
                        type="button"
                        style={{
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: '1px solid',
                          fontSize: '11px',
                          textAlign: 'left',
                          backgroundColor: selectedItem.mat === mItem.id ? '#fff7ed' : '#ffffff',
                          color: selectedItem.mat === mItem.id ? '#ea580c' : '#1c1917',
                          borderColor: selectedItem.mat === mItem.id ? '#ea580c' : '#e2e8f0',
                          fontWeight: selectedItem.mat === mItem.id ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ mat: mItem.id })}
                      >
                        {mItem.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '8px 0' }}>
                  <button
                    type="button"
                    style={{ ...styles.actionBtn, width: '100%', color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => {
                      onDeleteSelectedItem();
                      onClose();
                    }}
                  >
                    🗑 刪除此空間分區
                  </button>
                </div>
              </div>
            ) : selectedItem.isDoor ? (
              /* ==================== 0. 門扇構件專屬編輯表單 ==================== */
              <div style={styles.formStack}>
                {/* 寫實商品預覽圖 */}
                <div style={styles.heroImgContainer}>
                  <img
                    src={getProductImage({ type: selectedItem.isSliding ? 'sliding_door' : 'wood_door', name: selectedItem.name })}
                    alt={selectedItem.name}
                    style={styles.heroImg}
                  />
                  <span style={styles.heroBrandBadge}>{selectedItem.isSliding ? '室內鋁框玻璃拉門' : '實木靜音門'}</span>
                </div>

                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>🏷 門扇名稱</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                    style={styles.input}
                    placeholder="例如：客房房門 / 陽台拉門"
                  />
                </div>

                {selectedItem.isLocked ? (
                  <div style={styles.lockedCard}>
                    <div style={styles.lockedIcon}>🔒</div>
                    <div style={styles.lockedTitle}>主要入戶大門 (建築核心)</div>
                    <div style={styles.lockedDesc}>
                      依消防與建築法規，主要入戶玄關大門與逃生動線為建築固定開口，不可拆除。
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 門扇形式切換 */}
                    <div style={styles.cardSection}>
                      <label style={styles.cardLabel}>🚪 門扇形式</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(!selectedItem.isSliding ? styles.orientationBtnActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ isSliding: false })}
                        >
                          🚪 單開木門 (旋轉開合)
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(selectedItem.isSliding ? styles.orientationBtnActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ isSliding: true })}
                        >
                          ↔ 滑動推拉門 (雙軌重疊)
                        </button>
                      </div>
                    </div>

                    {/* 2D 任意坐標矩陣 (X 與 Y 軸同時開放平移微調) */}
                    <div style={styles.matrixCard}>
                      <div style={styles.matrixGrid2x2}>
                        {/* Cell 1: X 軸坐標 (左右平移) */}
                        <div style={styles.matrixCell}>
                          <div style={styles.cellHeader}>
                            <span style={styles.cellLabel}>↔ X 坐標 (左右)</span>
                            <span style={styles.cellUnit}>mm</span>
                          </div>
                          <input
                            type="number"
                            step="50"
                            value={Math.round(selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0)}
                            onChange={(e) => onUpdateSelectedItem({ posX: Number(e.target.value) })}
                            style={styles.cellInput}
                          />
                          <div style={styles.miniStepperRow}>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posX: (selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0) - 50 })}
                            >
                              －50
                            </button>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posX: (selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0) + 50 })}
                            >
                              ＋50
                            </button>
                          </div>
                        </div>

                        {/* Cell 2: Y 軸坐標 (上下平移) */}
                        <div style={styles.matrixCell}>
                          <div style={styles.cellHeader}>
                            <span style={styles.cellLabel}>↕ Y 坐標 (上下)</span>
                            <span style={styles.cellUnit}>mm</span>
                          </div>
                          <input
                            type="number"
                            step="50"
                            value={Math.round(selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0)}
                            onChange={(e) => onUpdateSelectedItem({ posY: Number(e.target.value) })}
                            style={styles.cellInput}
                          />
                          <div style={styles.miniStepperRow}>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posY: (selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0) - 50 })}
                            >
                              －50
                            </button>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posY: (selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0) + 50 })}
                            >
                              ＋50
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 門扇 360° 全角度旋轉控制 */}
                    <div style={styles.cardSection}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ ...styles.cardLabel, marginBottom: 0 }}>🔄 門扇旋轉角度</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(selectedItem.rot || 0)}
                            onChange={(e) => onUpdateSelectedItem({ rot: (Number(e.target.value) % 360 + 360) % 360 })}
                            style={{ ...styles.input, width: '64px', padding: '3px 6px', fontSize: '13px', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '13px', color: '#78716c', fontWeight: 700 }}>°</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={selectedItem.rot || 0}
                        onChange={(e) => onUpdateSelectedItem({ rot: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#ea580c', margin: '8px 0' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(selectedItem.rot === 0 || selectedItem.orientation === 'horizontal' ? styles.orientationBtnActive : {}),
                            padding: '6px 2px',
                            fontSize: '12px',
                          }}
                          onClick={() => onUpdateSelectedItem({ rot: 0, orientation: 'horizontal' })}
                        >
                          0° 水平
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(selectedItem.rot === 90 || selectedItem.orientation === 'vertical' ? styles.orientationBtnActive : {}),
                            padding: '6px 2px',
                            fontSize: '12px',
                          }}
                          onClick={() => onUpdateSelectedItem({ rot: 90, orientation: 'vertical' })}
                        >
                          90° 垂直
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.orientationBtn, padding: '6px 2px', fontSize: '12px' }}
                          onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 345) % 360 })}
                        >
                          －15°
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.orientationBtn, padding: '6px 2px', fontSize: '12px' }}
                          onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 15) % 360 })}
                        >
                          ＋15°
                        </button>
                      </div>

                      <button
                        type="button"
                        style={{
                          ...styles.orientationBtn,
                          width: '100%',
                          marginTop: '6px',
                          padding: '6px 4px',
                          fontSize: '12px',
                          color: '#ea580c',
                          borderColor: '#fdba74',
                        }}
                        onClick={() => onUpdateSelectedItem({ rot: 53.6 })}
                      >
                        📐 快速貼齊主臥 53.6° 斜角隔間牆
                      </button>
                    </div>

                    {/* 開啟翻轉 (鉸鏈與內外開) */}
                    {!selectedItem.isSliding && (
                      <div style={styles.cardSection}>
                        <label style={styles.cardLabel}>🔀 開啟軌跡與門軸翻轉</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            style={styles.quickPresetChip}
                            onClick={() => onUpdateSelectedItem({ flipH: !selectedItem.flipH })}
                          >
                            🔄 門軸換邊 ({selectedItem.flipH ? '右/下軸' : '左/上軸'})
                          </button>
                          <button
                            type="button"
                            style={styles.quickPresetChip}
                            onClick={() => onUpdateSelectedItem({ flipV: !selectedItem.flipV })}
                          >
                            🔄 開啟換向 ({selectedItem.flipV ? '開向南/東' : '開向北/西'})
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 門洞寬度/開度 */}
                    <div style={styles.cardSection}>
                      <div style={styles.sectionHeaderBetween}>
                        <label style={styles.cardLabel}>📐 門扇開度 (寬度)</label>
                        <span style={styles.valueBadge}>{selectedItem.length || 900} mm</span>
                      </div>
                      <div style={styles.presetChipRow}>
                        {[650, 750, 800, 900, 1000].map((len) => (
                          <button
                            key={len}
                            type="button"
                            style={{
                              ...styles.quickPresetChip,
                              ...(selectedItem.length === len ? styles.quickPresetChipActive : {}),
                            }}
                            onClick={() => onUpdateSelectedItem({ length: len })}
                          >
                            {len === 650 ? '650 (衛浴)' : len === 750 ? '750 (客房)' : len === 800 ? '800 (標準)' : len === 900 ? '900 (寬敞)' : '1000 (大門)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 刪除按鈕 */}
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        style={styles.dangerBtn}
                        onClick={onDeleteSelectedItem}
                      >
                        🗑 刪除此門扇
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : selectedItem.isWall ? (
              /* ==================== 1. 隔間牆專屬編輯表單 ==================== */
              <div style={styles.formStack}>
                {/* 寫實隔間預覽圖 */}
                <div style={styles.heroImgContainer}>
                  <img
                    src={getProductImage({
                      type: (selectedItem.thickness || 120) >= 150 ? 'brick_wall' : (selectedItem.thickness || 120) >= 120 ? 'grout_wall' : 'drywall',
                      name: selectedItem.name,
                    })}
                    alt={selectedItem.name}
                    style={styles.heroImg}
                  />
                  <span style={styles.heroBrandBadge}>
                    {(selectedItem.thickness || 120) >= 150 ? '4吋紅磚實心牆' : (selectedItem.thickness || 120) >= 120 ? '濕式灌漿牆' : '輕鋼架乾式輕隔間'}
                  </span>
                </div>

                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>🏷 隔間名稱</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                    style={styles.input}
                    placeholder="例如：主臥/客廳分界牆"
                  />
                </div>

                {selectedItem.isLocked ? (
                  <div style={styles.lockedCard}>
                    <div style={styles.lockedIcon}>🔒</div>
                    <div style={styles.lockedTitle}>建築承重結構 / 外牆</div>
                    <div style={styles.lockedDesc}>
                      依照建築結構與法規安全標準，建築四面外牆、剪力角柱與管道間為房屋本體核心，不可拆除或位移。
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 2D 任意坐標矩陣 (X 與 Y 軸同時開放平移微調，自由跨越任何房間) */}
                    <div style={styles.matrixCard}>
                      <div style={styles.matrixGrid2x2}>
                        {/* Cell 1: X 軸坐標 (左右平移) */}
                        <div style={styles.matrixCell}>
                          <div style={styles.cellHeader}>
                            <span style={styles.cellLabel}>↔ X 坐標 (左右)</span>
                            <span style={styles.cellUnit}>mm</span>
                          </div>
                          <input
                            type="number"
                            step="50"
                            value={Math.round(selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0)}
                            onChange={(e) => onUpdateSelectedItem({ posX: Number(e.target.value) })}
                            style={styles.cellInput}
                          />
                          <div style={styles.miniStepperRow}>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posX: (selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0) - 50 })}
                            >
                              －50
                            </button>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posX: (selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0) + 50 })}
                            >
                              ＋50
                            </button>
                          </div>
                        </div>

                        {/* Cell 2: Y 軸坐標 (上下平移) */}
                        <div style={styles.matrixCell}>
                          <div style={styles.cellHeader}>
                            <span style={styles.cellLabel}>↕ Y 坐標 (上下)</span>
                            <span style={styles.cellUnit}>mm</span>
                          </div>
                          <input
                            type="number"
                            step="50"
                            value={Math.round(selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0)}
                            onChange={(e) => onUpdateSelectedItem({ posY: Number(e.target.value) })}
                            style={styles.cellInput}
                          />
                          <div style={styles.miniStepperRow}>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posY: (selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0) - 50 })}
                            >
                              －50
                            </button>
                            <button
                              type="button"
                              style={styles.miniStepBtn}
                              onClick={() => onUpdateSelectedItem({ posY: (selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0) + 50 })}
                            >
                              ＋50
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 隔間方向一鍵切換卡片 */}
                    <div style={styles.cardSection}>
                      <label style={styles.cardLabel}>🔄 牆體方向 (水平 ↔ 垂直)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(selectedItem.orientation === 'horizontal' ? styles.orientationBtnActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ orientation: 'horizontal' })}
                        >
                          ↔ 水平橫向
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.orientationBtn,
                            ...(selectedItem.orientation === 'vertical' ? styles.orientationBtnActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ orientation: 'vertical' })}
                        >
                          ↕ 垂直縱向
                        </button>
                      </div>
                    </div>

                    {/* 長度自訂卡片 */}
                    <div style={styles.cardSection}>
                      <div style={styles.cardHeaderRow}>
                        <label style={styles.cardLabel}>📐 牆體長度 (可自由拉伸)</label>
                        <button
                          type="button"
                          style={styles.pillActionBtn}
                          onClick={() => onUpdateSelectedItem({ length: selectedItem.orientation === 'vertical' ? space.width : space.length })}
                        >
                          滿跨度
                        </button>
                      </div>
                      <div style={styles.numberInputRow}>
                        <input
                          type="number"
                          step="100"
                          value={Math.round(selectedItem.length)}
                          onChange={(e) => onUpdateSelectedItem({ length: Math.max(300, Number(e.target.value)) })}
                          style={styles.input}
                        />
                        <div style={styles.stepperGroup}>
                          <button
                            type="button"
                            style={styles.stepperBtn}
                            onClick={() => onUpdateSelectedItem({ length: Math.max(300, selectedItem.length - 500) })}
                          >
                            －500
                          </button>
                          <button
                            type="button"
                            style={styles.stepperBtn}
                            onClick={() => onUpdateSelectedItem({ length: selectedItem.length + 500 })}
                          >
                            ＋500
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 工法厚度預設選擇器 */}
                    <div style={styles.cardSection}>
                      <label style={styles.cardLabel}>
                        🧱 隔間牆工法與厚度 (目前: {selectedItem.thickness}mm)
                      </label>
                      <div style={styles.presetGrid2x2}>
                        <button
                          type="button"
                          style={{
                            ...styles.presetPill,
                            ...(selectedItem.thickness === 100 ? styles.presetPillActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ thickness: 100, name: selectedItem.name.includes('紅磚') ? '輕鋼架乾式隔間' : selectedItem.name })}
                        >
                          <span style={styles.pillPrimary}>100mm</span>
                          <span style={styles.pillSecondary}>輕鋼架矽酸鈣板</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.presetPill,
                            ...(selectedItem.thickness === 120 ? styles.presetPillActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ thickness: 120, name: selectedItem.name.includes('紅磚') ? '濕式灌漿實心牆' : selectedItem.name })}
                        >
                          <span style={styles.pillPrimary}>120mm</span>
                          <span style={styles.pillSecondary}>濕式灌漿實心牆</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.presetPill,
                            ...(selectedItem.thickness === 150 ? styles.presetPillActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ thickness: 150, name: selectedItem.name.includes('輕鋼架') ? '4吋紅磚實心牆' : selectedItem.name })}
                        >
                          <span style={styles.pillPrimary}>150mm</span>
                          <span style={styles.pillSecondary}>4吋紅磚實心牆</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.presetPill,
                            ...(selectedItem.thickness === 200 ? styles.presetPillActive : {}),
                          }}
                          onClick={() => onUpdateSelectedItem({ thickness: 200 })}
                        >
                          <span style={styles.pillPrimary}>200mm</span>
                          <span style={styles.pillSecondary}>RC / 8吋磚厚牆</span>
                        </button>
                      </div>

                      <div style={styles.customThicknessRow}>
                        <span style={styles.customThickLabel}>自訂厚度:</span>
                        <input
                          type="number"
                          step="10"
                          value={selectedItem.thickness}
                          onChange={(e) => onUpdateSelectedItem({ thickness: Math.max(60, Number(e.target.value)) })}
                          style={{ ...styles.input, flex: 1 }}
                        />
                        <span style={styles.dimUnitTag}>mm</span>
                      </div>
                    </div>

                    {/* 拆除隔間牆按鈕 */}
                    <div style={styles.dangerActionSection}>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSelectedItem();
                          onClose();
                        }}
                        style={styles.deleteWallBtn}
                      >
                        🗑 拆除 / 刪除此道隔間牆 (打通空間)
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ==================== 2. 家具與構件全新重構表單 ==================== */
              <div style={styles.formStack}>
                {/* 寫實商品預覽圖 */}
                <div style={styles.heroImgContainer}>
                  <img
                    src={getProductImage(selectedItem)}
                    alt={selectedItem.name}
                    style={styles.heroImg}
                  />
                  {selectedItem.brand && (
                    <span style={styles.heroBrandBadge}>{selectedItem.brand}</span>
                  )}
                </div>

                {/* 物件名稱卡片 */}
                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>🏷 物件名稱</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                    style={styles.input}
                    placeholder="輸入家具品名"
                  />
                </div>

                {/* 2×2 精準坐標與尺寸方格卡片 (徹底杜絕跑版與右側裁切) */}
                <div style={styles.matrixCard}>
                  <div style={styles.matrixGrid2x2}>
                    {/* Cell 1: X 座標 */}
                    <div style={styles.matrixCell}>
                      <div style={styles.cellHeader}>
                        <span style={styles.cellLabel}>X 坐標 (水平)</span>
                        <span style={styles.cellUnit}>mm</span>
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={Math.round(selectedItem.cx)}
                        onChange={(e) => onUpdateSelectedItem({ cx: Number(e.target.value) })}
                        style={styles.cellInput}
                      />
                      <div style={styles.miniStepperRow}>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ cx: Math.max(0, selectedItem.cx - 50) })}
                        >
                          －50
                        </button>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ cx: selectedItem.cx + 50 })}
                        >
                          ＋50
                        </button>
                      </div>
                    </div>

                    {/* Cell 2: Y 座標 */}
                    <div style={styles.matrixCell}>
                      <div style={styles.cellHeader}>
                        <span style={styles.cellLabel}>Y 坐標 (垂直)</span>
                        <span style={styles.cellUnit}>mm</span>
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={Math.round(selectedItem.cy)}
                        onChange={(e) => onUpdateSelectedItem({ cy: Number(e.target.value) })}
                        style={styles.cellInput}
                      />
                      <div style={styles.miniStepperRow}>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ cy: Math.max(0, selectedItem.cy - 50) })}
                        >
                          －50
                        </button>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ cy: selectedItem.cy + 50 })}
                        >
                          ＋50
                        </button>
                      </div>
                    </div>

                    {/* Cell 3: 寬度 W */}
                    <div style={styles.matrixCell}>
                      <div style={styles.cellHeader}>
                        <span style={styles.cellLabel}>寬度 W</span>
                        <span style={styles.cellUnit}>mm</span>
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={selectedItem.w}
                        onChange={(e) => onUpdateSelectedItem({ w: Math.max(100, Number(e.target.value)) })}
                        style={styles.cellInput}
                      />
                      <div style={styles.miniStepperRow}>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ w: Math.max(100, selectedItem.w - 100) })}
                        >
                          －100
                        </button>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ w: selectedItem.w + 100 })}
                        >
                          ＋100
                        </button>
                      </div>
                    </div>

                    {/* Cell 4: 深度 D */}
                    <div style={styles.matrixCell}>
                      <div style={styles.cellHeader}>
                        <span style={styles.cellLabel}>深度 D</span>
                        <span style={styles.cellUnit}>mm</span>
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={selectedItem.d}
                        onChange={(e) => onUpdateSelectedItem({ d: Math.max(100, Number(e.target.value)) })}
                        style={styles.cellInput}
                      />
                      <div style={styles.miniStepperRow}>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ d: Math.max(100, selectedItem.d - 100) })}
                        >
                          －100
                        </button>
                        <button
                          type="button"
                          style={styles.miniStepBtn}
                          onClick={() => onUpdateSelectedItem({ d: selectedItem.d + 100 })}
                        >
                          ＋100
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 旋轉與朝向卡片 (包含快捷 4 向方位膠囊鍵與自訂角度) */}
                <div style={styles.cardSection}>
                  <div style={styles.cardHeaderRow}>
                    <label style={styles.cardLabel}>🧭 朝向方位與角度 (360° 全角度)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={Math.round(selectedItem.rot || 0)}
                        onChange={(e) => onUpdateSelectedItem({ rot: (Number(e.target.value) % 360 + 360) % 360 })}
                        style={{ ...styles.input, width: '60px', padding: '2px 4px', fontSize: '13px', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '13px', color: '#78716c', fontWeight: 700 }}>°</span>
                    </div>
                  </div>

                  {/* 4 個 90 度方向快捷膠囊 + 斜牆對齊 */}
                  <div style={styles.rotPillRow}>
                    {[
                      { rot: 0, label: '朝南 0°' },
                      { rot: 90, label: '朝西 90°' },
                      { rot: 180, label: '朝北 180°' },
                      { rot: 270, label: '朝東 270°' },
                      { rot: 53.6, label: '斜牆 53.6°' },
                    ].map((item) => (
                      <button
                        key={item.rot}
                        type="button"
                        style={{
                          ...styles.rotPill,
                          ...((selectedItem.rot || 0) === item.rot ? styles.rotPillActive : {}),
                        }}
                        onClick={() => onUpdateSelectedItem({ rot: item.rot })}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* 滑桿與 90° / ±15° 旋轉按鈕 */}
                  <div style={styles.sliderRow}>
                    <button
                      type="button"
                      onClick={handleRotate}
                      style={styles.rotateActionBtn}
                      title="順時針旋轉 90 度"
                    >
                      ↻ 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 345) % 360 })}
                      style={{ ...styles.rotateActionBtn, flex: '0 0 52px' }}
                      title="逆時針微調 15 度"
                    >
                      －15°
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 15) % 360 })}
                      style={{ ...styles.rotateActionBtn, flex: '0 0 52px' }}
                      title="順時針微調 15 度"
                    >
                      ＋15°
                    </button>
                    <div style={styles.sliderWrapper}>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={selectedItem.rot || 0}
                        onChange={(e) => onUpdateSelectedItem({ rot: Number(e.target.value) })}
                        style={styles.rangeSlider}
                      />
                    </div>
                  </div>
                </div>

                {/* 顏色與標記卡片 */}
                <div style={styles.cardSection}>
                  <label style={styles.cardLabel}>🎨 材質外觀色彩</label>
                  <div style={styles.colorSwatchRow}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: c.color,
                          boxShadow: selectedItem.color === c.color ? '0 0 0 3px #ea580c' : 'none',
                        }}
                        onClick={() => onUpdateSelectedItem({ color: c.color })}
                        title={c.label}
                      />
                    ))}
                    <div style={styles.customColorWrap}>
                      <input
                        type="color"
                        value={selectedItem.color || '#78716c'}
                        onChange={(e) => onUpdateSelectedItem({ color: e.target.value })}
                        style={styles.nativeColorPicker}
                        title="自訂色盤"
                      />
                    </div>
                  </div>
                </div>

                {/* 底部操作按鈕 (複製與刪除，對齊安全區) */}
                <div style={styles.actionGridRow}>
                  <button
                    type="button"
                    onClick={onDuplicateSelectedItem}
                    style={styles.btnSecondary}
                  >
                    ❐ 複製物件
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteSelectedItem();
                      onClose();
                    }}
                    style={styles.btnDanger}
                  >
                    🗑 刪除物件
                  </button>
                </div>
              </div>
            )
          ) : (
            /* ==================== 3. 空間總覽 ==================== */
            <div style={styles.spaceSummary}>
              <div style={styles.statCards}>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>總長度</span>
                  <strong style={styles.statVal}>{(space.length / 1000).toFixed(2)} m</strong>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>總寬度</span>
                  <strong style={styles.statVal}>{(space.width / 1000).toFixed(2)} m</strong>
                </div>
                <div style={styles.statCardHighlight}>
                  <span style={styles.statLabelHighlight}>換算坪數</span>
                  <strong style={styles.statValHighlight}>{areaPing} 坪</strong>
                </div>
              </div>

              <div style={styles.infoSection}>
                <div style={styles.infoTitle}>💡 日本三分離衛浴規劃</div>
                <div style={styles.infoText}>
                  獨立馬桶便所、獨立洗面化妝脫衣所、獨立風呂浴室（深浴缸＋坐洗），可同時供多人使用不衝突！
                </div>
              </div>

              <div style={styles.infoSection}>
                <div style={styles.infoTitle}>🚰 原水管位保留原則</div>
                <div style={styles.infoText}>
                  保留左側排污立管與排水孔，免除高昂改管費用，徹底杜絕日後漏水與排水不順。
                </div>
              </div>
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
    width: '100vw',
    maxWidth: '100vw',
    backgroundColor: 'rgba(28, 25, 23, 0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    maxHeight: '88dvh',
    width: '100%',
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  heroImgContainer: {
    position: 'relative',
    width: '100%',
    height: '140px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#1c1917',
    border: '1px solid #e7e5e4',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  heroBrandBadge: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  handleBar: {
    width: '100%',
    padding: '12px 0 6px',
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  handle: {
    width: '42px',
    height: '5px',
    borderRadius: '3px',
    backgroundColor: '#d6d3d1',
  },
  header: {
    padding: '6px 18px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #efebe2',
    flexShrink: 0,
  },
  headerTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    overflow: 'hidden',
    paddingRight: '10px',
  },
  title: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#1c1917',
    letterSpacing: '-0.02em',
  },
  subBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflow: 'hidden',
  },
  subBadgeDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  subBadgeText: {
    fontSize: '12px',
    color: '#78716c',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f4',
    border: 'none',
    fontSize: '15px',
    color: '#78716c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  content: {
    padding: '16px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: '100%',
    boxSizing: 'border-box',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardSection: {
    backgroundColor: '#fafaf9',
    borderRadius: '14px',
    padding: '12px 14px',
    border: '1px solid #f0ede6',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#44403c',
    letterSpacing: '-0.01em',
  },
  dimUnitTag: {
    fontSize: '11px',
    color: '#a8a29e',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    height: '42px',
    padding: '8px 12px',
    fontSize: '16px', // 避免 iOS 自動放大
    borderRadius: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    color: '#1c1917',
    fontWeight: 600,
    outline: 'none',
  },
  numberInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  stepperGroup: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  stepperBtn: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#ffffff',
    border: '1px solid #d6d3d1',
    borderRadius: '8px',
    color: '#44403c',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  pillActionBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#ffedd5',
    color: '#ea580c',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  presetGrid2x2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
  },
  presetPill: {
    padding: '8px 6px',
    borderRadius: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },
  presetPillActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
    boxShadow: '0 0 0 1px #ea580c',
  },
  pillPrimary: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#1c1917',
  },
  pillSecondary: {
    fontSize: '10px',
    color: '#78716c',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  customThicknessRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    width: '100%',
    boxSizing: 'border-box',
  },
  customThickLabel: {
    fontSize: '12px',
    color: '#78716c',
    flexShrink: 0,
  },
  lockedCard: {
    backgroundColor: '#f5f5f4',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #e7e5e4',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '6px',
  },
  lockedIcon: {
    fontSize: '28px',
  },
  lockedTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#292524',
  },
  lockedDesc: {
    fontSize: '12px',
    color: '#78716c',
    lineHeight: '1.6',
  },
  dangerActionSection: {
    marginTop: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  deleteWallBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #fca5a5',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },

  /* ---------- 2×2 Matrix Card (針對家具 X, Y, W, D) ---------- */
  matrixCard: {
    backgroundColor: '#fafaf9',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid #f0ede6',
    width: '100%',
    boxSizing: 'border-box',
  },
  matrixGrid2x2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  matrixCell: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '10px 10px',
    border: '1px solid #e7e5e4',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  cellHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cellLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#78716c',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  cellUnit: {
    fontSize: '10px',
    color: '#a8a29e',
  },
  cellInput: {
    width: '100%',
    minWidth: 0,
    height: '38px',
    padding: '6px 8px',
    fontSize: '16px',
    fontWeight: 800,
    color: '#1c1917',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  miniStepperRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    width: '100%',
  },
  miniStepBtn: {
    padding: '5px 0',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    cursor: 'pointer',
    touchAction: 'manipulation',
    textAlign: 'center',
  },

  /* ---------- 旋轉與朝向 ---------- */
  orientationBtn: {
    padding: '10px 8px',
    borderRadius: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    color: '#44403c',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    touchAction: 'manipulation',
    textAlign: 'center',
  },
  orientationBtnActive: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    borderColor: '#ea580c',
    boxShadow: '0 0 0 1px #ea580c',
  },
  activeAngleBadge: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  rotPillRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  rotPill: {
    padding: '8px 0',
    borderRadius: '8px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    color: '#57534e',
    cursor: 'pointer',
    textAlign: 'center',
    touchAction: 'manipulation',
  },
  rotPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#c2410c',
    color: '#ffffff',
    fontWeight: 800,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '4px',
    width: '100%',
    boxSizing: 'border-box',
  },
  rotateActionBtn: {
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: '10px',
    border: '1px solid #d6d3d1',
    backgroundColor: '#ffffff',
    color: '#1c1917',
    cursor: 'pointer',
    flexShrink: 0,
    touchAction: 'manipulation',
  },
  sliderWrapper: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  },
  rangeSlider: {
    width: '100%',
    minWidth: 0,
    accentColor: '#ea580c',
    cursor: 'pointer',
  },

  /* ---------- 色彩樣式 ---------- */
  colorSwatchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  colorCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid #ffffff',
    cursor: 'pointer',
    touchAction: 'manipulation',
    flexShrink: 0,
  },
  customColorWrap: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '1px solid #d6d3d1',
    flexShrink: 0,
  },
  nativeColorPicker: {
    width: '40px',
    height: '40px',
    margin: '-6px',
    cursor: 'pointer',
    border: 'none',
  },

  /* ---------- 底部動作 ---------- */
  actionGridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  btnSecondary: {
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #d6d3d1',
    backgroundColor: '#f5f5f4',
    color: '#1c1917',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    touchAction: 'manipulation',
  },
  btnDanger: {
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #fca5a5',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    touchAction: 'manipulation',
  },

  /* ---------- 空間總覽 ---------- */
  spaceSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  statCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '8px',
  },
  statCard: {
    backgroundColor: '#fafaf9',
    borderRadius: '12px',
    padding: '10px 8px',
    textAlign: 'center',
    border: '1px solid #efebe2',
  },
  statCardHighlight: {
    backgroundColor: '#fff7ed',
    borderRadius: '12px',
    padding: '10px 8px',
    textAlign: 'center',
    border: '1px solid #ffedd5',
  },
  statLabel: {
    fontSize: '11px',
    color: '#78716c',
    display: 'block',
  },
  statVal: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1c1917',
    marginTop: '2px',
    display: 'block',
  },
  statLabelHighlight: {
    fontSize: '11px',
    color: '#ea580c',
    display: 'block',
    fontWeight: 700,
  },
  statValHighlight: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#c2410c',
    marginTop: '2px',
    display: 'block',
  },
  infoSection: {
    backgroundColor: '#fafaf9',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #efebe2',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#292524',
    marginBottom: '4px',
  },
  infoText: {
    fontSize: '12px',
    color: '#57534e',
    lineHeight: '1.6',
  },
};
