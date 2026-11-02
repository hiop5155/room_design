import React, { useState } from 'react';
import { FURNITURE_CATALOG } from '../constants';
import { getProductImage } from '../utils/productImages';

export default function MobileCatalogSheet({
  isOpen,
  onClose,
  onAddFurniture,
  onAddWall,
  onAddDoor,
  onAutoDetectRooms,
  onAddCustomRoom,
}) {
  const urlCat = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cat') : null;
  const defaultCat = urlCat
    ? (FURNITURE_CATALOG.find((c) => c.category.includes(urlCat))?.category || FURNITURE_CATALOG[0].category)
    : FURNITURE_CATALOG[1].category;
  const [activeCategory, setActiveCategory] = useState(defaultCat);

  if (!isOpen) return null;

  const currentCat = FURNITURE_CATALOG.find((c) => c.category === activeCategory);

  const handleSelect = (item) => {
    if ((item.isDoor || item.type?.startsWith('door_')) && onAddDoor) {
      onAddDoor(item);
    } else if (item.isWall && onAddWall) {
      const isV = item.type?.includes('_v') || item.w < item.d;
      const targetLength = Math.max(item.w, item.d);
      const targetThickness = item.thickness || Math.min(item.w, item.d) || 120;
      onAddWall(isV ? 'vertical' : 'horizontal', targetLength, targetThickness, item.name);
    } else {
      onAddFurniture(item);
    }
    onClose();
  };

  // 取得精簡分類標題 (防手機標籤折行或撐出邊界)
  const getShortCatTitle = (cat) => {
    if (cat.includes('結構與隔間')) return '🧱 結構隔間';
    if (cat.includes('三分離衛浴')) return '🇯🇵 三分離衛浴';
    if (cat.includes('陽台')) return '🧺 陽台洗衣';
    if (cat.includes('廚房')) return '🍳 廚房料理';
    if (cat.includes('客房')) return '🛏 獨立客房';
    if (cat.includes('中島')) return '🍽 餐飲中島';
    if (cat.includes('主臥')) return '👑 獨立主臥';
    if (cat.includes('客廳')) return '🛋 景觀客廳';
    return cat;
  };

  return (
    <div style={styles.overlay} className="bottom-sheet-overlay" onClick={onClose}>
      <div
        style={styles.sheet}
        className="bottom-sheet-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部拉手 */}
        <div style={styles.handleBar}>
          <div style={styles.handle} />
        </div>

        {/* 標題欄 */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>置入構件與家具庫</div>
            <div style={styles.subtitle}>點選即可置入空間 · 隔間牆支援任意 2D 平移</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="關閉抽屜">
            ✕
          </button>
        </div>

        {/* 空間分區與格局自動辨識快捷列 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '0 16px 10px 16px' }}>
          {onAutoDetectRooms && (
            <button
              onClick={() => {
                onAutoDetectRooms();
                onClose();
              }}
              style={{
                padding: '8px 6px',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚡ 一鍵辨識格局區域
            </button>
          )}
          {onAddCustomRoom && (
            <button
              onClick={() => {
                onAddCustomRoom();
                onClose();
              }}
              style={{
                padding: '8px 6px',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                border: '1px solid #fdba74',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📐 ＋ 新增自訂區域
            </button>
          )}
        </div>

        {/* 橫向分類滑動標籤 */}
        <div style={styles.categoryScroll}>
          {FURNITURE_CATALOG.map((cat) => {
            const isActive = activeCategory === cat.category;
            return (
              <button
                key={cat.category}
                style={{
                  ...styles.chip,
                  ...(isActive ? styles.chipActive : {}),
                }}
                onClick={() => setActiveCategory(cat.category)}
              >
                {getShortCatTitle(cat.category)}
              </button>
            );
          })}
        </div>

        {/* 特色橫幅提示 */}
        {activeCategory.includes('三分離衛浴') && (
          <div style={styles.featureBanner}>
            <div style={styles.bannerTitle}>🇯🇵 日本正統三分離衛浴特色</div>
            <div style={styles.bannerText}>
              獨立便所（自帶洗手水箱）、獨立洗面脫衣所、獨立風呂浴室，三人同時使用零衝突！
            </div>
          </div>
        )}

        {activeCategory.includes('結構與隔間') && (
          <div style={{ ...styles.featureBanner, backgroundColor: '#fbf7ee', borderColor: '#e2d9c8' }}>
            <div style={{ ...styles.bannerTitle, color: '#9a3412' }}>🧱 實心隔間與輕隔間構件</div>
            <div style={styles.bannerText}>
              點擊直接置入畫布，支援 360° 任意 2D 拖曳至任意房間，地坪空間渲染將自動貼齊連動！
            </div>
          </div>
        )}

        {/* 元件卡片 2 欄矩陣 (嚴格限制 minmax(0, 1fr) 防任何破版) */}
        <div style={styles.grid}>
          {currentCat?.items.map((item) => {
            const isWall = Boolean(item.isWall);
            const isV = isWall && (item.type?.includes('_v') || item.w < item.d);
            const imgSrc = getProductImage(item);

            return (
              <div
                key={item.type + item.name}
                style={styles.card}
                onClick={() => handleSelect(item)}
              >
                {/* ★ 真實商品寫實視覺縮圖 */}
                <div style={styles.thumbnailContainer}>
                  <img
                    src={imgSrc}
                    alt={item.name}
                    style={styles.thumbnailImg}
                    loading="lazy"
                  />
                  {item.brand && (
                    <span style={styles.brandBadge}>{item.brand}</span>
                  )}
                </div>

                {/* 卡片標題與色彩識別點 */}
                <div style={styles.cardTop}>
                  <span
                    style={{
                      ...styles.colorDot,
                      backgroundColor: item.color || '#a8a29e',
                    }}
                  />
                  <span style={styles.itemName} title={item.name}>
                    {item.name}
                  </span>
                </div>

                {/* 構件規格與方向標籤 */}
                <div style={styles.metaRow}>
                  <span style={styles.sizeTag}>
                    {item.w} × {item.d} mm
                  </span>
                  {isWall && (
                    <span style={styles.wallTag}>
                      {isV ? '↕ 縱向' : '↔ 橫向'}
                    </span>
                  )}
                </div>

                {/* 描述說明 */}
                {item.desc && (
                  <div style={styles.descText} title={item.desc}>
                    {item.desc}
                  </div>
                )}

                {/* 全寬防溢出置入按鈕 */}
                <div style={styles.addBtnContainer}>
                  <div style={styles.addBtnPill}>
                    ＋ 置入空間
                  </div>
                </div>
              </div>
            );
          })}
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
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    maxHeight: '80dvh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    overflow: 'hidden',
  },
  handleBar: {
    width: '100%',
    padding: '10px 0 4px',
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  handle: {
    width: '36px',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#d6d3d1',
  },
  header: {
    padding: '6px 16px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1c1917',
  },
  subtitle: {
    fontSize: '11px',
    color: '#78716c',
    marginTop: '2px',
  },
  closeBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f4',
    border: 'none',
    fontSize: '14px',
    color: '#78716c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  categoryScroll: {
    display: 'flex',
    gap: '6px',
    padding: '0 16px 10px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    touchAction: 'pan-x',
    WebkitOverflowScrolling: 'touch',
    borderBottom: '1px solid #efebe2',
    flexShrink: 0,
  },
  chip: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '18px',
    backgroundColor: '#f5f5f4',
    border: '1px solid #e7e5e4',
    color: '#57534e',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  chipActive: {
    backgroundColor: '#c2410c',
    color: '#ffffff',
    borderColor: '#c2410c',
    boxShadow: '0 2px 6px rgba(194, 65, 12, 0.25)',
  },
  featureBanner: {
    margin: '8px 16px 4px',
    padding: '8px 12px',
    backgroundColor: '#fffaf5',
    border: '1px solid #fed7aa',
    borderRadius: '10px',
    flexShrink: 0,
  },
  bannerTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#c2410c',
  },
  bannerText: {
    fontSize: '10px',
    color: '#78716c',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 14px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    touchAction: 'pan-y',
    alignContent: 'start',
  },
  card: {
    padding: '8px',
    borderRadius: '10px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    minWidth: 0,
    overflow: 'hidden',
    transition: 'transform 0.1s ease, border-color 0.15s ease',
  },
  thumbnailContainer: {
    width: '100%',
    height: '75px',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f4',
    border: '1px solid #e7e5e4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  brandBadge: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    fontSize: '8px',
    fontWeight: 700,
    padding: '2px 5px',
    borderRadius: '4px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1c1917',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    minWidth: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
    minWidth: 0,
    marginTop: '1px',
  },
  sizeTag: {
    fontSize: '10px',
    color: '#78716c',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  },
  wallTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#854d0e',
    backgroundColor: '#fef3c7',
    padding: '1px 4px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  descText: {
    fontSize: '10px',
    color: '#9a3412',
    lineHeight: '1.25',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginTop: '1px',
  },
  addBtnContainer: {
    marginTop: '4px',
  },
  addBtnPill: {
    width: '100%',
    padding: '5px 0',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    color: '#ea580c',
    fontSize: '11px',
    fontWeight: 700,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
