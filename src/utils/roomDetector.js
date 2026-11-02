/**
 * 空間格局智慧辨識與自訂區域引擎 (Auto Room Detection & Custom Space Partition Engine)
 * 1. 支援依據任意室內隔間牆（包含使用者自訂牆體）一鍵自動提取閉合房間多邊形 (Room Polygons)
 * 2. 結合區域內家具特徵進行智慧命名 (主臥、客房、三分離衛浴、洗衣曬衣、客餐廳、廚房、梯間等)
 * 3. 精確計算各房間面積 (m² 與坪數) 與重心標籤坐標
 */

import { calculatePolygonAreaM2 } from './layoutSync';

/**
 * 射線法判斷點 (px, py) 是否在多邊形 poly 內
 */
export function isPointInPolygon(px, py, poly) {
  if (!poly || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 從連通網格單元提取外部多邊形頂點序列 (帶共線化簡)
 */
function extractPolygonFromCells(cellSet, cols, rows, step) {
  // 1. 收集所有單元格的 4 條邊，方向統一
  // 每條邊由 [x0, y0, x1, y1] 表示 (以小坐標在前排序作為 key)
  const edgeCount = new Map();

  const addEdge = (x0, y0, x1, y1, dirX, dirY) => {
    // 定向邊
    const key = `${x0},${y0}->${x1},${y1}`;
    const reverseKey = `${x1},${y1}->${x0},${y0}`;
    if (edgeCount.has(reverseKey)) {
      // 內部共享邊，相互抵消
      edgeCount.delete(reverseKey);
    } else {
      edgeCount.set(key, { x0, y0, x1, y1 });
    }
  };

  cellSet.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    const x0 = c * step;
    const y0 = r * step;
    const x1 = (c + 1) * step;
    const y1 = (r + 1) * step;

    // 順時針 4 邊
    addEdge(x0, y0, x1, y0); // 上: 左到右
    addEdge(x1, y0, x1, y1); // 右: 上到下
    addEdge(x1, y1, x0, y1); // 下: 右到左
    addEdge(x0, y1, x0, y0); // 左: 下到上
  });

  if (edgeCount.size === 0) return null;

  // 2. 建立鄰接表，順序串聯成封閉環
  const nextMap = new Map();
  for (const edge of edgeCount.values()) {
    nextMap.set(`${edge.x0},${edge.y0}`, [edge.x1, edge.y1]);
  }

  // 從第一個頂點開始走訪環路
  const startKey = nextMap.keys().next().value;
  if (!startKey) return null;

  const rawPoints = [];
  let curKey = startKey;
  const visitedKeys = new Set();

  while (curKey && !visitedKeys.has(curKey)) {
    visitedKeys.add(curKey);
    const [cx, cy] = curKey.split(',').map(Number);
    rawPoints.push([cx, cy]);
    const nextPt = nextMap.get(curKey);
    if (!nextPt) break;
    curKey = `${nextPt[0]},${nextPt[1]}`;
    if (curKey === startKey) break;
  }

  if (rawPoints.length < 3) return null;

  // 3. 化簡水平/垂直共線點 (Collinear Reduction)
  const simplified = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const prev = rawPoints[(i - 1 + rawPoints.length) % rawPoints.length];
    const curr = rawPoints[i];
    const next = rawPoints[(i + 1) % rawPoints.length];

    const isHorizontalCollinear = prev[1] === curr[1] && curr[1] === next[1];
    const isVerticalCollinear = prev[0] === curr[0] && curr[0] === next[0];

    if (!isHorizontalCollinear && !isVerticalCollinear) {
      simplified.push(curr);
    }
  }

  return simplified.length >= 3 ? simplified : rawPoints;
}

/**
 * 核心演算法：根據隔間牆自動辨識並分割出所有房間格局
 * @param {Object} space 空間整體資料
 * @returns {Array} 辨識後的房間清單 (rooms)
 */
export function detectRoomsFromWalls(space) {
  if (!space || !space.length || !space.width) return space?.rooms || [];

  const L = space.length;
  const W = space.width;

  // 適應性網格步長 (約 100mm ~ 120mm，兼顧極速與精準度)
  const maxDim = Math.max(L, W);
  const STEP = maxDim > 30000 ? 150 : 100;
  const cols = Math.ceil(L / STEP);
  const rows = Math.ceil(W / STEP);

  // 1. 建立二維網格阻擋標記 (Grid Solid Mask)
  // 0: 空地, 1: 隔間牆障礙
  const grid = new Uint8Array(cols * rows);

  const setWall = (c, r) => {
    if (c >= 0 && c < cols && r >= 0 && r < rows) {
      grid[r * cols + c] = 1;
    }
  };

  // 外牆四周已自然做為網格邊界 [0, cols-1] 與 [0, rows-1]
  // 標記所有室內隔間牆 (w[4] === 'n' 或非承重外牆)
  (space.walls || []).forEach((w) => {
    const [x0, y0, x1, y1, type] = w;
    if (type === 'e' || type === 'b') return; // 外牆與獨立柱暫不干擾內部連通

    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    const isH = (maxX - minX) >= (maxY - minY);

    if (isH) {
      // 水平隔間牆：以其 Y 軸中心線覆蓋對應行
      const midY = (minY + maxY) / 2;
      const r = Math.round(midY / STEP);
      const c0 = Math.max(0, Math.floor(minX / STEP));
      const c1 = Math.min(cols - 1, Math.ceil(maxX / STEP));
      for (let c = c0; c <= c1; c++) {
        setWall(c, r);
      }
    } else {
      // 垂直隔間牆：以其 X 軸中心線覆蓋對應列
      const midX = (minX + maxX) / 2;
      const c = Math.round(midX / STEP);
      const r0 = Math.max(0, Math.floor(minY / STEP));
      const r1 = Math.min(rows - 1, Math.ceil(maxY / STEP));
      for (let r = r0; r <= r1; r++) {
        setWall(c, r);
      }
    }
  });

  // 2. BFS 泛洪連通分支提取 (Connected Component Labeling)
  const visited = new Uint8Array(cols * rows);
  const components = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (grid[idx] === 1 || visited[idx] === 1) continue;

      // 發現新區域，啟動 BFS
      const compCells = new Set();
      const queue = [[c, r]];
      visited[idx] = 1;

      let sumX = 0;
      let sumY = 0;

      while (queue.length > 0) {
        const [currC, currR] = queue.pop();
        compCells.add(`${currC},${currR}`);
        sumX += (currC + 0.5) * STEP;
        sumY += (currR + 0.5) * STEP;

        // 4 向鄰居探索
        const neighbors = [
          [currC + 1, currR],
          [currC - 1, currR],
          [currC, currR + 1],
          [currC, currR - 1],
        ];

        for (const [nc, nr] of neighbors) {
          if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
            const nIdx = nr * cols + nc;
            if (grid[nIdx] === 0 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queue.push([nc, nr]);
            }
          }
        }
      }

      // 排除微小縫隙 (面積 < 0.8 m²，即小於 80 個 100mm 網格)
      const minCellsThreshold = Math.round(800000 / (STEP * STEP));
      if (compCells.size >= minCellsThreshold) {
        components.push({
          cells: compCells,
          centroid: [sumX / compCells.size, sumY / compCells.size],
        });
      }
    }
  }

  // 3. 為每個連通區域產生多邊形與智慧標籤
  const detectedRooms = [];
  const furnitureList = space.furniture || [];

  components.forEach((comp, compIdx) => {
    const poly = extractPolygonFromCells(comp.cells, cols, rows, STEP);
    if (!poly || poly.length < 3) return;

    const areaM2 = calculatePolygonAreaM2(poly);
    if (areaM2 < 0.6) return;

    // 計算標籤中心點：優先使用重心，若重心落在多邊形外則取最接近重心的單元點
    let labelAt = [Math.round(comp.centroid[0]), Math.round(comp.centroid[1])];
    if (!isPointInPolygon(labelAt[0], labelAt[1], poly)) {
      // 尋找最近的內部 cell
      let bestDist = Infinity;
      comp.cells.forEach((key) => {
        const [c, r] = key.split(',').map(Number);
        const ptX = (c + 0.5) * STEP;
        const ptY = (r + 0.5) * STEP;
        const d = Math.hypot(ptX - comp.centroid[0], ptY - comp.centroid[1]);
        if (d < bestDist) {
          bestDist = d;
          labelAt = [Math.round(ptX), Math.round(ptY)];
        }
      });
    }

    // 4. 智慧空間命名與材質推薦
    // 找出多邊形內包含的所有家具
    const containedFurniture = furnitureList.filter((f) =>
      isPointInPolygon(f.cx, f.cy, poly)
    );

    let roomName = '';
    let roomMat = 'wood'; // 預設溫潤木地板
    let note = '';

    const types = containedFurniture.map((f) => f.type);
    const names = containedFurniture.map((f) => f.name || '');

    const hasKitchen = types.includes('kitchen_counter') || types.includes('fridge') || types.includes('sink');
    const hasLiving = types.includes('sofa') || types.includes('sofa_l') || types.includes('tvstand') || types.includes('tv') || types.includes('dining_table');

    if (types.includes('bed') || types.includes('bed_queen') || types.includes('bed_single')) {
      if (areaM2 >= 12 || names.some((n) => n.includes('加大') || n.includes('主臥'))) {
        roomName = '👑 景觀大主臥';
      } else {
        roomName = '🛏️ 獨立客房';
      }
      roomMat = 'wood';
      note = `配置優質雙人床與舒適臥室起居，面積約 ${areaM2.toFixed(1)} m²`;
    } else if (hasKitchen && hasLiving) {
      roomName = '🛋️ 景觀客餐廚生活區';
      roomMat = 'wood';
      note = '整合客廳、餐廳與開放廚房之核心開闊生活空間';
    } else if (
      types.includes('toilet') ||
      types.includes('toilet_wash_tank') ||
      types.includes('bathtub') ||
      types.includes('japan_tub') ||
      types.includes('shower') ||
      types.includes('vanity')
    ) {
      if ((types.includes('toilet') || types.includes('toilet_wash_tank')) && !types.includes('bathtub') && !types.includes('shower')) {
        roomName = '🚽 獨立馬桶間';
      } else if (types.includes('bathtub') || types.includes('japan_tub') || types.includes('shower')) {
        roomName = '🛁 景觀泡澡衛浴';
      } else if (types.includes('vanity')) {
        roomName = '🪞 化妝洗漱區';
      } else {
        roomName = '🛁 三分離衛浴';
      }
      roomMat = 'tile_gray';
      note = '日式乾濕分離衛浴，配備防滑防水地磚';
    } else if (types.includes('washer') || types.includes('laundry_sink')) {
      roomName = '🧺 洗衣曬衣區';
      roomMat = 'tile';
      note = '獨立家政洗衣與生活陽台動線';
    } else if (hasKitchen) {
      roomName = '🍳 開放/獨立大廚房';
      roomMat = 'tile_gray';
      note = '流暢料理檯動線與耐髒耐磨地磚';
    } else if (types.includes('stairs')) {
      roomName = '🪜 折返樓梯/梯間';
      roomMat = 'tile_gray';
      note = '垂直動線樓梯空間';
    } else if (hasLiving) {
      roomName = '🛋️ 景觀客餐廳';
      roomMat = 'wood';
      note = '家庭核心起居活動區';
    } else if (types.includes('desk') || types.includes('officechair')) {
      roomName = '💻 獨立多功能書房';
      roomMat = 'wood';
      note = '專屬工作閱覽辦公空間';
    } else if (types.includes('wardrobe') && areaM2 < 7.5) {
      roomName = '📦 獨立收納更衣室';
      roomMat = 'wood';
      note = '大容量收納與更衣空間';
    } else {
      // 無家具時，依面積與長寬比推斷
      if (areaM2 >= 15) {
        roomName = `📐 開放主生活區 (${areaM2.toFixed(1)}m²)`;
        roomMat = 'wood';
      } else if (areaM2 >= 8) {
        roomName = `📐 多功能起居室 (${areaM2.toFixed(1)}m²)`;
        roomMat = 'wood';
      } else if (areaM2 < 4.5) {
        roomName = `🚶 廊道/走道 (${areaM2.toFixed(1)}m²)`;
        roomMat = 'wood';
      } else {
        roomName = `📐 自訂多功能空間 (${areaM2.toFixed(1)}m²)`;
        roomMat = 'wood';
      }
      note = '可依需求自由配置家具與機能';
    }

    detectedRooms.push({
      id: `room_auto_${compIdx + 1}`,
      name: roomName,
      poly,
      mat: roomMat,
      at: labelAt,
      areaM2: Number(areaM2.toFixed(1)),
      areaPing: Number((areaM2 * 0.3025).toFixed(1)),
      note,
      isAuto: true,
    });
  });

  // 排序：主要生活區放前面，衛浴與梯間放後面
  return detectedRooms.length > 0 ? detectedRooms : (space.rooms || []);
}

/**
 * 手動新增一個自訂區域 (矩形初始多邊形)
 */
export function createCustomRoom(space, customName = '自訂全新區域', mat = 'wood') {
  const safeName = (typeof customName === 'string' && customName.trim()) ? customName.trim() : '自訂全新區域';
  const safeMat = (typeof mat === 'string' && mat.trim()) ? mat.trim() : 'wood';

  const L = space.length;
  const W = space.width;

  const roomW = Math.min(3000, Math.round(L * 0.25));
  const roomH = Math.min(2500, Math.round(W * 0.5));
  const cx = Math.round(L / 2);
  const cy = Math.round(W / 2);

  const x0 = cx - roomW / 2;
  const y0 = cy - roomH / 2;
  const x1 = cx + roomW / 2;
  const y1 = cy + roomH / 2;

  const poly = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];

  const areaM2 = calculatePolygonAreaM2(poly);

  return {
    id: `room_user_${Date.now()}`,
    name: safeName,
    poly,
    mat: safeMat,
    at: [cx, cy],
    areaM2: Number(areaM2.toFixed(1)),
    areaPing: Number((areaM2 * 0.3025).toFixed(1)),
    note: '使用者自訂劃分之獨立功能區域',
    isCustom: true,
  };
}
