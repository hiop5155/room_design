/**
 * 多方案並排對比排版引擎 (Multi-Scheme Comparison Layout Engine)
 */

export const DEFAULT_SCHEME_SPACING_MM = 2500; // 預設方案並排間距 2.5m

/**
 * 重新計算所有方案單元的世界坐標位移 (World Offsets)
 * @param {Array} units 方案清單
 * @param {'horizontal'|'vertical'} layoutMode 排列方向: 水平左右並排 | 垂直上下並排
 * @param {number} spacingMm 方案之間的間隙 (毫米)
 * @returns {Array} 帶有更新後 offset 的 units
 */
export function recalculateSchemeOffsets(units, layoutMode = 'vertical', spacingMm = DEFAULT_SCHEME_SPACING_MM) {
  if (!units || !Array.isArray(units) || units.length === 0) return [];

  let currentX = 0;
  let currentY = 0;

  return units.map((unit, idx) => {
    const uLen = unit.length || 19830;
    const uWid = unit.width || 5300;

    const offset = idx === 0 ? [0, 0] : [currentX, currentY];

    if (layoutMode === 'horizontal') {
      currentX += uLen + spacingMm;
    } else {
      currentY += uWid + spacingMm;
    }

    return {
      ...unit,
      offset,
    };
  });
}

/**
 * 計算所有可見方案的整體包圍盒 (Bounding Box)
 * @param {Array} units 方案清單
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, centerX: number, centerY: number }}
 */
export function calculateVisibleBounds(units) {
  const visibleUnits = (units || []).filter((u) => u.visible !== false);
  if (visibleUnits.length === 0) {
    return { minX: 0, minY: 0, maxX: 19830, maxY: 5300, width: 19830, height: 5300, centerX: 9915, centerY: 2650 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  visibleUnits.forEach((u) => {
    const ox = u.offset ? u.offset[0] : 0;
    const oy = u.offset ? u.offset[1] : 0;
    const w = u.length || 19830;
    const h = u.width || 5300;

    minX = Math.min(minX, ox);
    minY = Math.min(minY, oy);
    maxX = Math.max(maxX, ox + w);
    maxY = Math.max(maxY, oy + h);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * 克隆一個新方案 (深拷貝)
 */
export function cloneUnitScheme(sourceUnit, newName) {
  const cloned = JSON.parse(JSON.stringify(sourceUnit));
  const newId = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  return {
    ...cloned,
    id: newId,
    name: newName || `${sourceUnit.name} (複本)`,
    visible: true,
    isLocked: false,
  };
}

