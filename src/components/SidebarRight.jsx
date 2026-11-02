import React from 'react';
import { getProductImage } from '../utils/productImages';

export default function SidebarRight({
  space,
  selectedItem,
  onUpdateSelectedItem,
  onDeleteSelectedItem,
  onDuplicateSelectedItem,
}) {
  const areaM2 = ((space.length * space.width) / 1000000).toFixed(1);
  const areaPing = (areaM2 * 0.3025).toFixed(1);

  const handleRotate = () => {
    if (!selectedItem) return;
    const nextRot = ((selectedItem.rot || 0) + 90) % 360;
    onUpdateSelectedItem({ rot: nextRot });
  };

  return (
    <aside style={styles.sidebar}>
      {/* Space Overview Card */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>空間指標與概要</span>
        </div>
        <div style={styles.statGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>總長度 (X)</span>
            <span style={styles.statVal}>{(space.length / 1000).toFixed(2)} m</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>總寬度 (Y)</span>
            <span style={styles.statVal}>{(space.width / 1000).toFixed(2)} m</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>室內淨高</span>
            <span style={styles.statVal}>{(space.height / 1000).toFixed(2)} m</span>
          </div>
          <div style={styles.statBoxHighlight}>
            <span style={styles.statLabelHighlight}>坪數估算</span>
            <span style={styles.statValHighlight}>{areaPing} 坪</span>
          </div>
        </div>
      </div>

      {/* Property Inspector */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>選取物件屬性</span>
          {selectedItem && (
            <span style={styles.badge}>{selectedItem.type}</span>
          )}
        </div>

        {selectedItem ? (
          selectedItem.isRoom ? (
            /* ★ 房間區域專屬屬性檢視面板 */
            <div style={styles.inspectorBody}>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#fff7ed',
                  borderRadius: '10px',
                  border: '1px solid #fed7aa',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
                    📐 空間分區屬性
                  </span>
                  <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700 }}>
                    {selectedItem.isAuto ? '⚡ 自動辨識' : '✨ 自訂分區'}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1c1917', marginTop: '4px' }}>
                  {selectedItem.name}
                </div>
              </div>

              {/* 面積指標卡片 */}
              <div style={styles.statGrid}>
                <div style={styles.statBoxHighlight}>
                  <span style={styles.statLabelHighlight}>空間估算坪數</span>
                  <span style={styles.statValHighlight}>{selectedItem.areaPing || 0} 坪</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>實質面積</span>
                  <span style={styles.statVal}>{selectedItem.areaM2 || 0} m²</span>
                </div>
              </div>

              {/* 房間名稱輸入 */}
              <div style={styles.field}>
                <label style={styles.label}>分區自訂名稱</label>
                <input
                  type="text"
                  value={selectedItem.name || ''}
                  onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                  style={styles.input}
                  placeholder="例如: 景觀大主臥、獨立書房..."
                />
              </div>

              {/* 快捷命名標籤 */}
              <div style={styles.field}>
                <label style={{ ...styles.label, marginBottom: '6px' }}>快速推薦命名標籤</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    '👑 景觀主臥', '🛏️ 獨立客房', '🛋️ 景觀客餐廳',
                    '🍳 獨立廚房', '🛁 三分離衛浴', '🧺 洗衣曬衣區',
                    '💻 獨立書房', '📦 步入更衣室', '🪜 梯間動線',
                  ].map((presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      style={{
                        ...styles.actionBtn,
                        padding: '5px 2px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: selectedItem.name === presetName ? '#ea580c' : '#ffffff',
                        color: selectedItem.name === presetName ? '#ffffff' : '#1c1917',
                        borderColor: selectedItem.name === presetName ? '#c2410c' : '#e7e5e4',
                        fontWeight: selectedItem.name === presetName ? 700 : 500,
                      }}
                      onClick={() => onUpdateSelectedItem({ name: presetName })}
                    >
                      {presetName}
                    </button>
                  ))}
                </div>
              </div>

              {/* 地坪材質選擇器 */}
              <div style={styles.field}>
                <label style={styles.label}>地坪鋪設材質 (同步渲染 2D/3D)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { id: 'wood', name: '🪵 溫潤實木地板', desc: '臥室/客廳' },
                    { id: 'tile', name: '✨ 拋光石英磚', desc: '開闊現代' },
                    { id: 'tile_gray', name: '🌫 啞光灰耐磨磚', desc: '廚房/梯間' },
                    { id: 'marble', name: '🏛 義大利大理石', desc: '輕奢大器' },
                    { id: 'wood_dark', name: '🎋 沉穩日式深木', desc: '茶室/書房' },
                  ].map((matItem) => (
                    <button
                      key={matItem.id}
                      type="button"
                      style={{
                        ...styles.actionBtn,
                        padding: '8px 6px',
                        textAlign: 'left',
                        backgroundColor: selectedItem.mat === matItem.id ? '#fff7ed' : '#ffffff',
                        color: selectedItem.mat === matItem.id ? '#ea580c' : '#1c1917',
                        borderColor: selectedItem.mat === matItem.id ? '#ea580c' : '#e7e5e4',
                        fontWeight: selectedItem.mat === matItem.id ? 700 : 500,
                      }}
                      onClick={() => onUpdateSelectedItem({ mat: matItem.id })}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700 }}>{matItem.name}</div>
                      <div style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>{matItem.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div style={{ ...styles.field, marginTop: '16px' }}>
                <button
                  type="button"
                  style={{ ...styles.actionBtn, width: '100%', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={onDeleteSelectedItem}
                >
                  🗑 刪除此空間分區
                </button>
              </div>
            </div>
          ) : selectedItem.isDoor ? (
            /* ★ 門扇專屬屬性檢視面板 */
            <div style={styles.inspectorBody}>
              <div style={styles.heroImgContainer}>
                <img
                  src={getProductImage({ type: selectedItem.isSliding ? 'sliding_door' : 'wood_door', name: selectedItem.name })}
                  alt={selectedItem.name}
                  style={styles.heroImg}
                />
                <span style={styles.heroBrandBadge}>{selectedItem.isSliding ? '室內鋁框玻璃拉門' : '實木靜音門'}</span>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: selectedItem.isEntryDoor ? '#f0fdf4' : '#fff7ed',
                  borderRadius: '8px',
                  border: selectedItem.isEntryDoor ? '1px solid #bbf7d0' : '1px solid #ffedd5',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: selectedItem.isEntryDoor ? '#15803d' : '#ea580c',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {selectedItem.isEntryDoor ? '🟢 主要入戶大門 (本戶出入口)' : '🚪 室內自訂門扇構件'}
                  </div>
                  <button
                    type="button"
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: selectedItem.isEntryDoor ? '1px solid #86efac' : '1px solid #fed7aa',
                      backgroundColor: '#ffffff',
                      color: selectedItem.isEntryDoor ? '#15803d' : '#ea580c',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => onUpdateSelectedItem({
                      entry: !selectedItem.isEntryDoor,
                      name: !selectedItem.isEntryDoor ? '入戶防爆大門' : '室內單開木門',
                    })}
                  >
                    {selectedItem.isEntryDoor ? '取消設為大門' : '🌟 設為入戶大門'}
                  </button>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', marginTop: '4px' }}>
                  {selectedItem.name}
                </div>
                <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>
                  {selectedItem.isEntryDoor
                    ? '✦ 解鎖格局後可直接在 2D 畫布拖曳、旋轉或透過下方數值微調至任何外牆。'
                    : '✦ 可在格局中任意滑動、旋轉貼齊隔間牆。'}
                </div>
              </div>

              <>
                <div style={styles.field}>
                  <label style={styles.label}>門扇名稱</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                  {/* 門扇形式切換 */}
                  <div style={styles.field}>
                    <label style={styles.label}>門扇形式</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: !selectedItem.isSliding ? '#ea580c' : '#ffffff',
                          color: !selectedItem.isSliding ? '#ffffff' : '#1c1917',
                          borderColor: !selectedItem.isSliding ? '#c2410c' : '#d6d3d1',
                          fontWeight: !selectedItem.isSliding ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ isSliding: false })}
                      >
                        🚪 單開木門
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: selectedItem.isSliding ? '#ea580c' : '#ffffff',
                          color: selectedItem.isSliding ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.isSliding ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.isSliding ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ isSliding: true })}
                      >
                        ↔ 滑動推拉門
                      </button>
                    </div>
                  </div>

                  {/* 2D 坐標設定 */}
                  <div style={styles.field}>
                    <label style={styles.label}>2D 平面坐標 (mm)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '2px' }}>↔ X 坐標</div>
                        <input
                          type="number"
                          step="50"
                          value={Math.round(selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0)}
                          onChange={(e) => onUpdateSelectedItem({ posX: Number(e.target.value) })}
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '2px' }}>↕ Y 坐標</div>
                        <input
                          type="number"
                          step="50"
                          value={Math.round(selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0)}
                          onChange={(e) => onUpdateSelectedItem({ posY: Number(e.target.value) })}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 門扇方向與 360° 全角度旋轉 */}
                  <div style={styles.field}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ ...styles.label, marginBottom: 0 }}>門扇旋轉角度</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={Math.round(selectedItem.rot || 0)}
                          onChange={(e) => onUpdateSelectedItem({ rot: (Number(e.target.value) % 360 + 360) % 360 })}
                          style={{ ...styles.input, width: '60px', padding: '2px 4px', fontSize: '12px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '12px', color: '#78716c' }}>°</span>
                      </div>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={selectedItem.rot || 0}
                      onChange={(e) => onUpdateSelectedItem({ rot: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#ea580c', marginBottom: '8px' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '6px' }}>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ rot: 0, orientation: 'horizontal' })}
                      >
                        0° 水平
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ rot: 90, orientation: 'vertical' })}
                      >
                        90° 垂直
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 345) % 360 })}
                      >
                        －15°
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 15) % 360 })}
                      >
                        ＋15°
                      </button>
                    </div>

                    <button
                      type="button"
                      style={{ ...styles.actionBtn, width: '100%', padding: '4px', fontSize: '11px', color: '#ea580c', borderColor: '#fdba74' }}
                      onClick={() => onUpdateSelectedItem({ rot: 53.6 })}
                    >
                      📐 快速貼齊主臥 53.6° 斜隔間牆
                    </button>
                  </div>

                  {/* 開啟翻轉 (鉸鏈與內外開) */}
                  {!selectedItem.isSliding && (
                    <div style={styles.field}>
                      <label style={styles.label}>開啟軌跡與門軸位置</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          style={styles.actionBtn}
                          onClick={() => onUpdateSelectedItem({ flipH: !selectedItem.flipH })}
                        >
                          🔄 門軸換邊 ({selectedItem.flipH ? '右/下軸' : '左/上軸'})
                        </button>
                        <button
                          type="button"
                          style={styles.actionBtn}
                          onClick={() => onUpdateSelectedItem({ flipV: !selectedItem.flipV })}
                        >
                          🔄 開啟換向 ({selectedItem.flipV ? '開向南/東' : '開向北/西'})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 門寬 / 開度 */}
                  <div style={styles.field}>
                    <label style={styles.label}>門洞寬度 (當前: {selectedItem.length || 900} mm)</label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {[650, 750, 800, 900, 1000].map((len) => (
                        <button
                          key={len}
                          type="button"
                          style={{
                            ...styles.actionBtn,
                            flex: 1,
                            fontSize: '11px',
                            padding: '4px 2px',
                            backgroundColor: selectedItem.length === len ? '#ea580c' : '#ffffff',
                            color: selectedItem.length === len ? '#ffffff' : '#1c1917',
                          }}
                          onClick={() => onUpdateSelectedItem({ length: len })}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div style={{ ...styles.field, marginTop: '16px' }}>
                    <button
                      type="button"
                      style={{ ...styles.actionBtn, width: '100%', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={onDeleteSelectedItem}
                    >
                      {selectedItem.isEntryDoor ? '🗑 拆除主要入戶大門' : '🗑 刪除此門扇'}
                    </button>
                  </div>
                </>
            </div>
          ) : selectedItem.isWall ? (
            /* ★ 隔間牆專屬屬性檢視面板 */
            <div style={styles.inspectorBody}>
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
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: selectedItem.isLocked ? '#f5f5f4' : '#fff7ed',
                  borderRadius: '8px',
                  border: selectedItem.isLocked ? '1px solid #e7e5e4' : '1px solid #ffedd5',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: selectedItem.isLocked ? '#78716c' : '#ea580c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {selectedItem.isLocked ? '🔒 建築承重結構 / 外牆 (固定)' : '✨ 可自由移動室內輕隔間'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', marginTop: '3px' }}>
                  {selectedItem.name}
                </div>
              </div>

              {selectedItem.isLocked ? (
                <div style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.6', padding: '6px 0' }}>
                  依照建築法規與結構安全，建築四面外牆、剪力角柱與管道間為建築本體核心，嚴禁拆除與移動。
                </div>
              ) : (
                <>
                  <div style={styles.field}>
                    <label style={styles.label}>隔間牆名稱</label>
                    <input
                      type="text"
                      value={selectedItem.name || ''}
                      onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  {/* 2D 任意坐標設定 (X 與 Y 軸自由平移至任何房間) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={styles.field}>
                      <label style={styles.label}>↔ X 軸坐標 (mm)</label>
                      <input
                        type="number"
                        step="50"
                        value={Math.round(selectedItem.posX !== undefined ? selectedItem.posX : selectedItem.x0)}
                        onChange={(e) => onUpdateSelectedItem({ posX: Number(e.target.value) })}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>↕ Y 軸坐標 (mm)</label>
                      <input
                        type="number"
                        step="50"
                        value={Math.round(selectedItem.posY !== undefined ? selectedItem.posY : selectedItem.y0)}
                        onChange={(e) => onUpdateSelectedItem({ posY: Number(e.target.value) })}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* 牆向切換 (水平 ↔ 垂直) */}
                  <div style={{ ...styles.field, marginBottom: '12px' }}>
                    <label style={styles.label}>牆體擺向 (水平 ↔ 垂直)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.orientation === 'horizontal' ? '#ea580c' : '#ffffff',
                          color: selectedItem.orientation === 'horizontal' ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.orientation === 'horizontal' ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.orientation === 'horizontal' ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ orientation: 'horizontal' })}
                      >
                        ↔ 水平橫向
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.orientation === 'vertical' ? '#ea580c' : '#ffffff',
                          color: selectedItem.orientation === 'vertical' ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.orientation === 'vertical' ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.orientation === 'vertical' ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ orientation: 'vertical' })}
                      >
                        ↕ 垂直縱向
                      </button>
                    </div>
                  </div>

                  {/* 自訂長度 (開放任意數值輸入與快捷按鈕) */}
                  <div style={styles.field}>
                    <label style={styles.label}>牆體長度 (mm · 可自訂任意長度)</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        step="100"
                        value={Math.round(selectedItem.length)}
                        onChange={(e) => onUpdateSelectedItem({ length: Math.max(300, Number(e.target.value)) })}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                        onClick={() => onUpdateSelectedItem({ length: selectedItem.orientation === 'vertical' ? space.width : space.length })}
                        title="延伸至滿室尺寸"
                      >
                        滿跨度
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, flex: 1, padding: '4px 6px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ length: Math.max(300, selectedItem.length - 500) })}
                      >
                        － 500mm
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, flex: 1, padding: '4px 6px', fontSize: '11px' }}
                        onClick={() => onUpdateSelectedItem({ length: selectedItem.length + 500 })}
                      >
                        ＋ 500mm
                      </button>
                    </div>
                  </div>

                  {/* 牆厚與實心隔間工法選擇器 */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      牆體工法厚度 (當前: {selectedItem.thickness} mm)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.thickness === 100 ? '#ea580c' : '#ffffff',
                          color: selectedItem.thickness === 100 ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.thickness === 100 ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.thickness === 100 ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ thickness: 100, name: selectedItem.name.includes('紅磚') ? '輕鋼架乾式輕隔間' : selectedItem.name })}
                      >
                        100mm 輕鋼架
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.thickness === 120 ? '#ea580c' : '#ffffff',
                          color: selectedItem.thickness === 120 ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.thickness === 120 ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.thickness === 120 ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ thickness: 120, name: selectedItem.name.includes('紅磚') ? '濕式灌漿實心牆' : selectedItem.name })}
                      >
                        120mm 灌漿實心
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.thickness === 150 ? '#ea580c' : '#ffffff',
                          color: selectedItem.thickness === 150 ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.thickness === 150 ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.thickness === 150 ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ thickness: 150, name: selectedItem.name.includes('輕鋼架') ? '4吋紅磚實心牆' : selectedItem.name })}
                      >
                        🧱 150mm 紅磚實心
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
                          padding: '6px 4px',
                          fontSize: '11px',
                          backgroundColor: selectedItem.thickness === 200 ? '#ea580c' : '#ffffff',
                          color: selectedItem.thickness === 200 ? '#ffffff' : '#1c1917',
                          borderColor: selectedItem.thickness === 200 ? '#c2410c' : '#d6d3d1',
                          fontWeight: selectedItem.thickness === 200 ? 700 : 500,
                        }}
                        onClick={() => onUpdateSelectedItem({ thickness: 200 })}
                      >
                        200mm RC/加厚
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#78716c' }}>自訂厚度:</span>
                      <input
                        type="number"
                        step="10"
                        value={selectedItem.thickness}
                        onChange={(e) => onUpdateSelectedItem({ thickness: Math.max(60, Number(e.target.value)) })}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <span style={{ fontSize: '11px', color: '#78716c' }}>mm</span>
                    </div>
                  </div>

                  {/* 實心 vs 輕隔間工程參考小貼士 */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#fafaf9',
                      borderRadius: '8px',
                      border: '1px solid #e7e5e4',
                      fontSize: '11px',
                      lineHeight: '1.6',
                      color: '#57534e',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#292524', marginBottom: '3px' }}>
                      🧱 實心隔間 vs 輕隔間參考厚度：
                    </div>
                    <div>• <strong>4吋紅磚實心 (150mm)</strong>：紅磚10cm+雙面打底粉光各2cm，全實心隔音佳、吊掛力極強(電視/重吊櫃)，水區首選。</div>
                    <div>• <strong>濕式灌漿實心 (120mm)</strong>：雙面水泥板灌注水泥砂漿發泡抗震粒，100%實心耐震、大樓新案主流。</div>
                    <div>• <strong>乾式輕鋼架 (100mm)</strong>：C型鋼填岩棉雙面矽酸鈣板，輕量施工快，吊掛需預埋補強板。</div>
                  </div>

                  {/* 快捷微調按鈕 */}
                  <div style={styles.field}>
                    <label style={styles.label}>精準微調 (步進 50mm)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedItem.orientation === 'vertical' ? (
                        <>
                          <button
                            type="button"
                            style={{ ...styles.actionBtn, flex: 1 }}
                            onClick={() => onUpdateSelectedItem({ pos: selectedItem.pos - 50 })}
                          >
                            ◀ 向左 50mm
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.actionBtn, flex: 1 }}
                            onClick={() => onUpdateSelectedItem({ pos: selectedItem.pos + 50 })}
                          >
                            ▶ 向右 50mm
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={{ ...styles.actionBtn, flex: 1 }}
                            onClick={() => onUpdateSelectedItem({ pos: selectedItem.pos - 50 })}
                          >
                            ▲ 向上 50mm
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.actionBtn, flex: 1 }}
                            onClick={() => onUpdateSelectedItem({ pos: selectedItem.pos + 50 })}
                          >
                            ▼ 向下 50mm
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #efebe2' }}>
                    <button
                      type="button"
                      onClick={onDeleteSelectedItem}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🗑 拆除/刪除此道隔間牆 (打通空間)
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={styles.inspectorBody}>
              {/* ★ 真實商品寫實視覺照片 */}
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

              <div style={styles.field}>
                <label style={styles.label}>名稱</label>
                <input
                  type="text"
                  value={selectedItem.name || ''}
                  onChange={(e) => onUpdateSelectedItem({ name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>X 座標 (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={Math.round(selectedItem.cx)}
                    onChange={(e) =>
                      onUpdateSelectedItem({ cx: Number(e.target.value) })
                    }
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Y 座標 (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={Math.round(selectedItem.cy)}
                    onChange={(e) =>
                      onUpdateSelectedItem({ cy: Number(e.target.value) })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>寬度 W (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={selectedItem.w}
                    onChange={(e) =>
                      onUpdateSelectedItem({ w: Math.max(100, Number(e.target.value)) })
                    }
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>深度 D (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={selectedItem.d}
                    onChange={(e) =>
                      onUpdateSelectedItem({ d: Math.max(100, Number(e.target.value)) })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>
                    旋轉角度 (支援 360° 全角度旋轉)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={Math.round(selectedItem.rot || 0)}
                      onChange={(e) =>
                        onUpdateSelectedItem({ rot: (Number(e.target.value) % 360 + 360) % 360 })
                      }
                      style={{ ...styles.input, width: '60px', padding: '2px 4px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: '#78716c' }}>°</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={selectedItem.rot || 0}
                  onChange={(e) =>
                    onUpdateSelectedItem({ rot: Number(e.target.value) })
                  }
                  style={{ width: '100%', accentColor: '#ea580c', marginBottom: '8px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '6px' }}>
                  <button
                    type="button"
                    onClick={handleRotate}
                    style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                    title="旋轉 90 度 (快速鍵 R)"
                  >
                    ↻ 90° (R)
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                    onClick={() =>
                      onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 345) % 360 })
                    }
                  >
                    －15°
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px' }}
                    onClick={() =>
                      onUpdateSelectedItem({ rot: ((selectedItem.rot || 0) + 15) % 360 })
                    }
                  >
                    ＋15°
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.actionBtn, padding: '4px 2px', fontSize: '11px', color: '#ea580c' }}
                    onClick={() => onUpdateSelectedItem({ rot: 53.6 })}
                    title="對齊主臥 53.6° 斜角牆"
                  >
                    📐 53.6°
                  </button>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>顏色標識</label>
                <div style={styles.colorRow}>
                  <input
                    type="color"
                    value={selectedItem.color || '#78716c'}
                    onChange={(e) =>
                      onUpdateSelectedItem({ color: e.target.value })
                    }
                    style={styles.colorPicker}
                  />
                  <span style={styles.colorHex}>{selectedItem.color || '#78716c'}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.inspectorActions}>
                <button
                  onClick={onDuplicateSelectedItem}
                  style={styles.btnSecondary}
                  title="複製此物件"
                >
                  ❐ 複製
                </button>
                <button
                  onClick={onDeleteSelectedItem}
                  style={styles.btnDanger}
                  title="刪除此物件 (快速鍵 Delete)"
                >
                  🗑 刪除
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={styles.emptyPrompt}>
            <div style={styles.emptyIcon}>👆</div>
            <div style={styles.emptyText}>點擊畫布上的家具或構件</div>
            <div style={styles.emptySubtext}>
              可拖曳移動、按 R 旋轉、或在此處精準調整尺寸數值
            </div>
          </div>
        )}
      </div>

      {/* Design Principles Guides */}
      <div style={styles.guideSection}>
        <div style={styles.guideHeader}>💡 核心設計原則與考量</div>

        <details style={styles.details} open>
          <summary style={styles.summary}>🇯🇵 日本三分離衛浴理念</summary>
          <div style={styles.guideContent}>
            <strong>① 獨立便所 (Toilet)：</strong>獨立封閉，設小型洗手檯，衛生無異味。
            <br />
            <strong>② 獨立洗面脫衣所 (Wash)：</strong>洗手台梳妝與洗衣動線一體，乾爽整潔。
            <br />
            <strong>③ 獨立風呂浴室 (Bath)：</strong>泡澡深浴缸＋日式坐式沖洗，家人可同時使用不卡關。
          </div>
        </details>

        <details style={styles.details}>
          <summary style={styles.summary}>🚰 原水管位保留原則</summary>
          <div style={styles.guideContent}>
            保留左側主排污立管與排水孔位置（衛浴位於左上、廚房流理台與雙口爐位於左下），省去高昂墊高地板改管費用，杜絕漏水與回湧隱患。
          </div>
        </details>

        <details style={styles.details}>
          <summary style={styles.summary}>🪜 雙向樓梯動線優化</summary>
          <div style={styles.guideContent}>
            保留 5 米長雙向折返梯（DN下樓 / UP上樓），樓梯下方規劃為大型收納櫃體與展示端景，動線流暢不壓迫。
          </div>
        </details>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e6e1d6',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 56px)',
    overflowY: 'auto',
    userSelect: 'none',
  },
  section: {
    padding: '16px',
    borderBottom: '1px solid #efebe2',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
    letterSpacing: '-0.01em',
  },
  badge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: '#f5f5f4',
    color: '#78716c',
    borderRadius: '4px',
    fontWeight: 600,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  statBox: {
    padding: '8px 10px',
    backgroundColor: '#fafaf9',
    borderRadius: '6px',
    border: '1px solid #f0ede6',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '11px',
    color: '#a8a29e',
    marginBottom: '2px',
  },
  statVal: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#292524',
    fontVariantNumeric: 'tabular-nums',
  },
  statBoxHighlight: {
    padding: '8px 10px',
    backgroundColor: '#fffaf5',
    borderRadius: '6px',
    border: '1px solid #fed7aa',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabelHighlight: {
    fontSize: '11px',
    color: '#c2410c',
    fontWeight: 600,
    marginBottom: '2px',
  },
  statValHighlight: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#c2410c',
    fontVariantNumeric: 'tabular-nums',
  },
  inspectorBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  heroImgContainer: {
    position: 'relative',
    width: '100%',
    height: '140px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#1c1917',
    border: '1px solid #e7e5e4',
    marginBottom: '14px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#57534e',
  },
  input: {
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid #d6d3d1',
    backgroundColor: '#fafaf9',
    outline: 'none',
  },
  rotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#f5f5f4',
    border: '1px solid #d6d3d1',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorPicker: {
    width: '32px',
    height: '24px',
    border: 'none',
    padding: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  colorHex: {
    fontSize: '11px',
    color: '#78716c',
    fontFamily: 'monospace',
  },
  inspectorActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '6px',
  },
  btnSecondary: {
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#f5f5f4',
    border: '1px solid #d6d3d1',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#44403c',
  },
  btnDanger: {
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#b91c1c',
  },
  emptyPrompt: {
    padding: '24px 12px',
    textAlign: 'center',
    backgroundColor: '#fafaf9',
    borderRadius: '8px',
    border: '1px dashed #e7e5e4',
  },
  emptyIcon: {
    fontSize: '24px',
    marginBottom: '6px',
  },
  emptyText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#57534e',
    marginBottom: '4px',
  },
  emptySubtext: {
    fontSize: '11px',
    color: '#a8a29e',
    lineHeight: '1.4',
  },
  guideSection: {
    padding: '16px',
    backgroundColor: '#fffdf9',
    flex: 1,
  },
  guideHeader: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#854d0e',
    marginBottom: '10px',
  },
  details: {
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #fef08a',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  summary: {
    padding: '8px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#713f12',
    backgroundColor: '#fefce8',
    outline: 'none',
  },
  guideContent: {
    padding: '8px 10px',
    fontSize: '11px',
    color: '#78716c',
    lineHeight: '1.5',
    borderTop: '1px solid #fef08a',
  },
};

