import React, { useState } from 'react';
import { FURNITURE_CATALOG } from '../constants';
import { getProductImage } from '../utils/productImages';

export default function SidebarLeft({
  onAddFurniture,
  onAddWall,
  onAddDoor,
  onAutoDetectRooms,
  onAddCustomRoom,
}) {
  const [activeCategory, setActiveCategory] = useState(FURNITURE_CATALOG[0].category);

  const handleItemClick = (item) => {
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
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <span style={styles.title}>元件庫與工具箱</span>
        <span style={styles.subtext}>點擊置入畫布</span>
      </div>

      {/* 空間區域與格局辨識快捷列 */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0ede6', backgroundColor: '#fff7ed' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', marginBottom: '6px', textTransform: 'uppercase' }}>
          📐 格局與分區工具
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {onAutoDetectRooms && (
            <button
              onClick={onAutoDetectRooms}
              style={{
                padding: '6px 4px',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
              title="自動分析所有室內隔間牆，提取閉合房間多邊形並標註面積"
            >
              ⚡ 自動辨識
            </button>
          )}
          {onAddCustomRoom && (
            <button
              onClick={() => onAddCustomRoom()}
              style={{
                padding: '6px 4px',
                backgroundColor: '#ffffff',
                color: '#1c1917',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
              title="在畫布中置入一個自訂功能分區"
            >
              ＋ 新增區域
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={styles.categoryList}>
        {FURNITURE_CATALOG.map((cat) => {
          const shortTitle = cat.category.includes('結構與隔間')
            ? '🧱 結構隔間 (實心/灌漿/輕隔間)'
            : cat.category.includes('三分離衛浴')
            ? '🇯🇵 日本三分離衛浴'
            : cat.category;

          return (
            <button
              key={cat.category}
              style={{
                ...styles.catBtn,
                ...(activeCategory === cat.category ? styles.catBtnActive : {}),
              }}
              onClick={() => setActiveCategory(cat.category)}
            >
              {shortTitle}
            </button>
          );
        })}
      </div>

      {/* Item Grid */}
      <div style={styles.itemList}>
        {FURNITURE_CATALOG.find((c) => c.category === activeCategory)?.items.map(
          (item) => {
            const isWall = Boolean(item.isWall);
            const isV = isWall && (item.type?.includes('_v') || item.w < item.d);
            const imgSrc = getProductImage(item);

            return (
              <div
                key={item.type + item.name}
                style={styles.itemCard}
                onClick={() => handleItemClick(item)}
                title={`點擊置入「${item.name}」(${item.w} × ${item.d} mm)`}
              >
                {/* ★ 真實商品寫實視覺縮圖 (Real View Thumbnail) */}
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

                <div style={styles.itemTop}>
                  <span
                    style={{
                      ...styles.colorDot,
                      backgroundColor: item.color || '#a8a29e',
                    }}
                  />
                  <span style={styles.itemName}>{item.name}</span>
                </div>
                <div style={styles.itemMeta}>
                  <span style={styles.itemSize}>
                    {isWall ? (isV ? '↕ 縱向 · ' : '↔ 橫向 · ') : ''}
                    {item.w} × {item.d} mm
                  </span>
                  <span style={styles.addIcon}>＋ 置入</span>
                </div>
                {item.desc && <div style={styles.itemDesc}>{item.desc}</div>}
              </div>
            );
          }
        )}
      </div>

      {/* Japanese 3-Way Quick Insert Banner */}
      <div style={styles.japanBadge}>
        <div style={styles.japanBadgeTitle}>🇯🇵 日本三分離衛浴推薦</div>
        <div style={styles.japanBadgeText}>
          獨立馬桶間（完全封閉）、獨立洗面脫衣所（洗手梳妝與洗衣）、獨立風呂浴室（浴缸與坐洗），可同時供多人使用不衝突！
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e6e1d6',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 56px)',
    overflow: 'hidden',
    userSelect: 'none',
  },
  header: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #efebe2',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1c1917',
    letterSpacing: '-0.01em',
  },
  subtext: {
    fontSize: '11px',
    color: '#a8a29e',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 12px',
    gap: '4px',
    borderBottom: '1px solid #efebe2',
    backgroundColor: '#fafaf9',
  },
  catBtn: {
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 500,
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    color: '#57534e',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  catBtnActive: {
    backgroundColor: '#ffffff',
    color: '#c2410c',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  itemList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemCard: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #e7e5e4',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  thumbnailContainer: {
    width: '100%',
    height: '90px',
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
    top: '4px',
    left: '4px',
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.02em',
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    border: '1px solid rgba(0,0,0,0.1)',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1c1917',
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSize: {
    fontSize: '11px',
    color: '#78716c',
    fontVariantNumeric: 'tabular-nums',
  },
  addIcon: {
    fontSize: '13px',
    color: '#c2410c',
    fontWeight: 700,
  },
  itemDesc: {
    fontSize: '10px',
    color: '#9a3412',
    backgroundColor: '#fffaf5',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
  },
  japanBadge: {
    padding: '12px 14px',
    backgroundColor: '#fffaf5',
    borderTop: '1px solid #fed7aa',
  },
  japanBadgeTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#c2410c',
    marginBottom: '4px',
  },
  japanBadgeText: {
    fontSize: '10px',
    color: '#78716c',
    lineHeight: '1.4',
  },
};

