// 幾何矩形生成輔助工具
export const R = (x0, y0, x1, y1) => [
  [x0, y0], [x1, y0], [x1, y1], [x0, y1]
];

/* ============================================================
 *  通用空白空間生成器 (可適配任何空間尺寸)
 * ============================================================ */
export function generateEmptySpace({
  name = '全新空白空間',
  length = 10000, // X 軸總長 (mm)
  width = 6000,   // Y 軸總寬 (mm)
  height = 2800,  // 室內挑高 (mm)
  wallThickness = 200,
  dimHorizontal = null,
  dimVertical = null,
  includeDefaultDoor = true,
  includeDefaultWindow = true,
} = {}) {
  const L = Number(length) || 10000;
  const W = Number(width) || 6000;
  const H = Number(height) || 2800;
  const T = Number(wallThickness) || 200;

  const dimH = (dimHorizontal && dimHorizontal.length > 0) ? dimHorizontal : [L];
  const dimV = (dimVertical && dimVertical.length > 0) ? dimVertical : [W];

  const walls = [
    [0, -T, L, 0, 'e'],
    [0, W, L, W + T, 'e'],
    [-T, 0, 0, W, 'e'],
    [L, 0, L + T, W, 'e'],
    [-T, -T, 0, 0, 'b'],
    [L, -T, L + T, 0, 'b'],
    [-T, W, 0, W + T, 'b'],
    [L, W, L + T, W + T, 'b'],
  ];

  const doors = [];
  const windows = [];

  if (includeDefaultDoor) {
    const doorX = Math.min(Math.max(L * 0.4, 1200), L - 1500);
    doors.push({
      id: 'd_entry',
      name: '入戶大門',
      rect: [doorX, W, doorX + 900, W + T],
      h: [doorX, W],
      c: [1, 0],
      o: [0, -1],
      len: 900,
      entry: true
    });
  }

  if (includeDefaultWindow) {
    const winW = Math.min(2400, L * 0.4);
    const winX = (L - winW) / 2;
    windows.push([winX, -T, winX + winW, 0]);
  }

  const areaM2 = (L * W) / 1000000;
  const areaPing = (areaM2 * 0.3025).toFixed(1);

  return {
    id: 'space_' + Date.now(),
    name: name || `自訂空間 (${(L/1000).toFixed(1)}m × ${(W/1000).toFixed(1)}m · ${areaPing}坪)`,
    length: L,
    width: W,
    height: H,
    wallThickness: T,
    dimHorizontal: dimH,
    dimVertical: dimV,
    walls,
    windows,
    doors,
    rooms: [
      {
        id: 'main_space',
        name: '自訂開放空間',
        poly: R(0, 0, L, W),
        mat: 'wood',
        at: [L / 2, W / 2],
        note: '可自由配置隔間牆、真實品牌衛浴、廚具及家具'
      }
    ],
    furniture: []
  };
}

/* ============================================================
 *  本案最新長條複層預設資料 (5.3m × 19.83m) - 依據 IMG_0042.JPG 完美還原
 *  - 寬度 (X): 5300 mm (寬 約 5.3m)
 *  - 長度 (Y): 19830 mm (總長 約 19.8m)
 *  - 垂直分段 (左側標註)：
 *    3900 mm (起居室 10.3m² & 戶外樓梯)
 *    2100 mm (儲藏 3.1m²、過道 0.9m & 戶外梯下段至大門)
 *    4130 mm (主臥 9.3m²、走道、玄關落塵 1.2m²、收納 5.8m²)
 *    1700 mm (玄關收納 4.4m² / 高櫃)
 *    5000 mm (客餐廳 24.5m² / 電視櫃、L型沙發、餐桌)
 *    3000 mm (日本三分離衛浴群：馬桶、洗面、浴室 1.6m²、洗衣 1.6m² & 廚房 10.5m²)
 * ============================================================ */
export const BLUEPRINT_PROJECT = {
  id: 'preset_blueprint',
  name: '本案最新長條複層戶型 (5.3m × 19.83m · 戶外梯進大門 · 起居客房/主臥/客餐廳/正統三分離衛浴+獨立洗衣陽台/獨立大廚房)',
  length: 5300,
  width: 19830,
  height: 2800,
  wallThickness: 150,
  dimHorizontal: [2650, 2650],
  dimVertical: [3900, 2100, 5830, 4170, 3830],

  walls: [
    // ========== 🔒 四面建築外牆 (Exterior Walls: 結構主體固定不可動) ==========
    [0, -150, 5300, 0, 'e', 'w_ext_north', '北側外牆 (起居室大採光景觀窗面)', true],
    [0, 19830, 5300, 19980, 'e', 'w_ext_south', '南側外牆 (廚房與洗衣陽台採光通風窗面)', true],
    [-150, 0, 0, 19830, 'e', 'w_ext_west', '西側建築外牆 (起居/主臥/客廳全線採光通風面)', true],
    [5300, 6000, 5450, 19830, 'e', 'w_ext_east_lower', '東側建築外牆 (收納/客餐廳/廚房)', true],
    [5300, 0, 5450, 6000, 'e', 'w_ext_stair_east', '東側戶外樓梯外邊界', true],

    // ========== 🔒 建築角端承重柱 (Bearing Columns) ==========
    [-150, -150, 250, 0, 'b', 'col_nw', '西北承重角柱', true],
    [5150, -150, 5450, 0, 'b', 'col_ne', '東北承重角柱', true],
    [-150, 19830, 250, 19980, 'b', 'col_sw', '西南承重角柱', true],
    [5150, 19830, 5450, 19980, 'b', 'col_se', '東南承重角柱', true],

    // ========== 🪜 戶外樓梯隔間 (包在戶外) ==========
    [2650, 0, 2770, 6000, 'n', 'w_stair_west', '戶外樓梯西側結構隔牆 (包在戶外)', true],
    [2650, 6000, 5300, 6120, 'n', 'w_stair_south', '戶外梯入戶大門隔間牆 (綠色大門)', true],

    // ========== ✨ 室內輕隔間牆 (Moveable Partitions · 支援任意 2D 位移與編輯) ==========
    // 1. 客房南隔間牆 (橫向：區隔客房與儲藏室/過道，含客房房門)
    [0, 3900, 2650, 4020, 'n', 'w_living_south', '客房南隔間牆', false],

    // 2. 儲藏室東隔間牆 (縱向：區隔儲藏室與 0.9m 過道，含儲藏室門)
    [1750, 4020, 1870, 6000, 'n', 'w_storage_east', '儲藏室東隔間牆', false],

    // 3. 大主臥北側隔間牆 (水平段：連接儲藏室與斜角動線牆)
    [0, 6000, 1600, 6120, 'n', 'w_master_north', '大主臥北側隔間牆', false],

    // 4. 大主臥東北斜角隔間牆 (斜向：導引用行動線，開闊走道視野)
    [1600, 6000, 2650, 7500, 'n', 'w_master_chamfer', '大主臥東北斜角隔間牆', false],

    // 5. 大主臥東側隔間牆 (縱向：大主臥與走道分界，合併原玄關收納，直貫至電視牆)
    [2650, 7500, 2770, 11710, 'n', 'w_master_east', '大主臥東側走道隔間牆', false],

    // 6. 客餐廳北側電視主牆 (橫向：大主臥與客餐廳分界牆，電視背景靜音實體牆)
    [0, 11710, 2650, 11830, 'n', 'w_tv_wall', '客餐廳北側電視主牆 (大主臥南牆)', false],

    // 7. 收納室 (5.8m²) 西側隔間牆 (縱向：走道與收納室分界，含收納室房門)
    [3800, 6120, 3920, 11830, 'n', 'w_storage58_west', '5.8m²收納室西隔間牆', false],

    // 8. 客餐廳與衛浴/廚房北側分界牆 (外推至 y=15900~16020)
    [0, 15900, 2530, 16020, 'n', 'w_bath_north', '衛浴北隔間牆 (實體封閉無門)', false],
    [2650, 15900, 5300, 16020, 'n', 'w_kitchen_north', '廚房北隔間牆 (客廳大推拉門)', false],

    // 9. 廚房與衛浴/家政分界牆 (縱向垂直牆：向廚房擴張至 x=2530~2650，衛浴洗衣大擴展)
    [2530, 16020, 2650, 19830, 'n', 'w_kitchen_west', '廚房與衛浴/家政垂直隔間牆', false],

    // 10. 日本正統三分離衛浴內部隔間牆
    // (1) 獨立便所東隔間牆 (縱向：便所與洗面室分界)
    [1150, 16020, 1270, 17150, 'n', 'w_toilet_east', '獨立便所東隔間牆', false],
    // (2) 獨立便所南隔間牆 (橫向：便所與浴室分界)
    [0, 17050, 1150, 17150, 'n', 'w_toilet_south', '獨立便所南隔間牆', false],
    // (3) 獨立風呂浴室東隔間牆 (縱向：浴室與脫衣更衣室分界)
    [1400, 17150, 1500, 18550, 'n', 'w_bath_east', '獨立風呂浴室東隔間牆', false],

    // 11. 衛浴與洗衣曬衣分界隔間牆 (橫向分界：分隔北側三分離衛浴與南側獨立洗衣曬衣間)
    [0, 18550, 2530, 18670, 'n', 'w_bath_laundry_h', '衛浴與洗衣曬衣分界隔間牆', false],
  ],

  windows: [
    [500, -150, 2150, 0],         // 客房北景觀採光窗 (1.65m)
    [-150, 900, 0, 2700],         // 客房西採光窗 (1.8m)
    [-150, 6500, 0, 7700],        // 主臥西採光窗 1 (1.2m)
    [-150, 8500, 0, 9700],        // 主臥西採光窗 2 (1.2m)
    [-150, 12400, 0, 13800],      // 客餐廳西採光窗 1 (1.4m)
    [-150, 14200, 0, 15600],      // 客餐廳西採光窗 2 (1.4m)
    [2600, 19830, 4600, 19980],   // 廚房南向排煙採光窗 (2.0m)
    [150, 19830, 850, 19980],     // 洗衣陽台南向採光通風窗 (0.7m)
  ],

  doors: [
    // 🟢 大門 (主要入戶大門：位於戶外樓梯底端，綠色大門，開向玄關落塵區)
    {
      id: 'd_entry',
      name: '入戶大門',
      cx: 3350,
      cy: 6060,
      rot: 0,
      rect: [2850, 6000, 3850, 6120],
      leaf: [2850, 6120, 2850, 7120],
      arc: 'M 3850 6120 A 1000 1000 0 0 1 2850 7120',
      len: 1000,
      thickness: 120,
      entry: true,
      flipH: false,
      flipV: true,
      color: '#16a34a',
    },

    // 🟤 客房房門 (單開房門)
    {
      id: 'd_living',
      name: '客房房門',
      cx: 2100,
      cy: 3960,
      rot: 0,
      rect: [1650, 3900, 2550, 4020],
      leaf: [2550, 3900, 2550, 3000],
      arc: 'M 1650 3900 A 900 900 0 0 1 2550 3000',
      len: 900,
      thickness: 120,
      flipH: true,
      flipV: false,
    },

    // 🟤 儲藏室門 (單開房門，門寬 0.9m)
    {
      id: 'd_storage',
      name: '儲藏室門 (0.9m)',
      cx: 1810,
      cy: 4750,
      rot: 90,
      rect: [1750, 4300, 1870, 5200],
      leaf: [1750, 4300, 850, 4300],
      arc: 'M 1750 5200 A 900 900 0 0 1 850 4300',
      len: 900,
      thickness: 120,
      flipH: false,
      flipV: false,
    },

    // 🟤 收納室門 (5.8m² 大容量收納間)
    {
      id: 'd_storage58',
      name: '收納室門 (5.8m²)',
      cx: 3860,
      cy: 6800,
      rot: 90,
      rect: [3800, 6400, 3920, 7200],
      leaf: [3920, 6400, 4720, 6400],
      arc: 'M 3920 7200 A 800 800 0 0 0 4720 6400',
      len: 800,
      thickness: 120,
      flipH: true,
      flipV: true,
    },

    // 🟤 大主臥房門 (東側動線走道進入)
    {
      id: 'd_master',
      name: '大主臥房門',
      cx: 2710,
      cy: 8200,
      rot: 90,
      rect: [2650, 7800, 2770, 8600],
      leaf: [2650, 8600, 1850, 8600],
      arc: 'M 2650 7800 A 800 800 0 0 1 1850 8600',
      len: 800,
      thickness: 120,
      flipH: false,
      flipV: false,
    },

    // 🟤 衛浴入口門 (由廚房垂直牆進入洗面脫衣更衣中樞)
    {
      id: 'd_wash_entry',
      name: '衛浴入口門',
      cx: 2590,
      cy: 16700,
      rot: 90,
      rect: [2530, 16300, 2650, 17100],
      leaf: [2530, 16300, 1730, 16300],
      arc: 'M 2530 17100 A 800 800 0 0 1 1730 16300',
      len: 800,
      thickness: 120,
      flipH: false,
      flipV: false,
    },

    // 🟤 獨立便所門 (由洗面室進入獨立馬桶間)
    {
      id: 'd_toilet',
      name: '便所門 (0.7m)',
      cx: 1210,
      cy: 16700,
      rot: 90,
      rect: [1150, 16350, 1270, 17050],
      leaf: [1150, 16350, 450, 16350],
      arc: 'M 1150 17050 A 700 700 0 0 1 450 16350',
      len: 700,
      thickness: 120,
      flipH: false,
      flipV: false,
    },

    // 🔵 獨立風呂浴室推拉門 (由洗面脫衣更衣室進入浴室)
    {
      id: 'd_bath_door',
      name: '浴室防水拉門',
      cx: 1450,
      cy: 17750,
      rot: 90,
      rect: [1400, 17350, 1500, 18150],
      len: 800,
      thickness: 100,
      isSliding: true,
      isGlass: true,
      color: '#0284c7',
    },

    // 🟤 洗衣曬衣陽台門 (由廚房垂直牆直接進入獨立洗衣曬衣間)
    {
      id: 'd_laundry',
      name: '洗衣曬衣門',
      cx: 2590,
      cy: 19200,
      rot: 90,
      rect: [2530, 18800, 2650, 19600],
      leaf: [2530, 18800, 1730, 18800],
      arc: 'M 2530 19600 A 800 800 0 0 1 1730 18800',
      len: 800,
      thickness: 120,
      flipH: false,
      flipV: false,
    },

    // 🔵 廚房玻璃推拉門 (客廳進入廚房核心入口)
    {
      id: 'd_kitchen_slide',
      name: '廚房玻璃拉門',
      cx: 3950,
      cy: 15960,
      rot: 0,
      rect: [3050, 15900, 4850, 16020],
      len: 1800,
      thickness: 120,
      isSliding: true,
      isGlass: true,
      color: '#0284c7',
    },
  ],

  rooms: [
    {
      id: 'living_room_upper',
      name: '客房 10.3m²',
      poly: R(0, 0, 2650, 3900),
      mat: 'wood',
      at: [1325, 1950],
      note: '★ 獨立客房 (10.3 m²)：無印良品標準單人床、床頭櫃、衣櫃與靠窗工作書桌椅'
    },
    {
      id: 'stairs_outdoor',
      name: '樓梯 包在戶外',
      poly: R(2770, 0, 5300, 6000),
      mat: 'stone',
      at: [4035, 3000],
      note: '★ 戶外樓梯 (包在戶外)：斜紋階梯，向下直通入戶大門'
    },
    {
      id: 'storage_upper',
      name: '儲藏 3.1m²',
      poly: R(0, 4020, 1750, 6000),
      mat: 'wood',
      at: [875, 5010],
      note: '獨立儲藏室 (3.1 m²)：門寬 0.9m，大件行李與雜物收納'
    },
    {
      id: 'vestibule_09',
      name: '0.9',
      poly: R(1870, 4020, 2650, 6000),
      mat: 'wood',
      at: [2260, 5010],
      note: '過道走廊 (寬 0.9m)'
    },
    {
      id: 'foyer_entry',
      name: '1.2m²',
      poly: R(2770, 6120, 3800, 7200),
      mat: 'tile800',
      at: [3285, 6660],
      note: '★ 入戶玄關落塵區 (1.2 m²)：自戶外梯推開大門進入室內第一站'
    },
    {
      id: 'storage_walkin',
      name: '收納 5.8m²',
      poly: R(3920, 6120, 5300, 11710),
      mat: 'wood',
      at: [4610, 8915],
      note: '★ 大容量儲藏收納間 (5.8 m²)：獨立門扇，換季衣物與日常備品庫'
    },
    {
      id: 'master_bedroom',
      name: '大主臥 13.7m²',
      poly: [
        [0, 6120],
        [1600, 6120],
        [2650, 7500],
        [2650, 11710],
        [0, 11710],
      ],
      mat: 'lavender',
      at: [1325, 8915],
      note: '★ 景觀大主臥 (13.7 m²)：合併玄關收納，加大雙人床、雙 120×75 獨立辦公桌椅組、大容量衣櫃與開闊無拘動線'
    },
    {
      id: 'corridor_mid',
      name: '走道',
      poly: [
        [2770, 7500],
        [3800, 7200],
        [3800, 11710],
        [2770, 11710],
      ],
      mat: 'wood',
      at: [3285, 9455],
      note: '室內主動線走道：串聯玄關大門、大主臥、收納室與客餐廳'
    },
    {
      id: 'living_dining',
      name: '客餐廳 22.1m²',
      poly: R(0, 11830, 5300, 15900),
      mat: 'mint',
      at: [2650, 13865],
      note: '★ 核心生活大客餐廳 (22.1 m²)：電視櫃、朝向電視的L型沙發、實木餐桌，雙大窗採光'
    },
    {
      id: 'toilet',
      name: '馬桶 1.2m²',
      poly: R(0, 16020, 1150, 17050),
      mat: 'antislip',
      at: [575, 16535],
      note: '日本三分離①：完全獨立便所，TOTO GG1 水箱洗手免治馬桶，衛生無異味'
    },
    {
      id: 'wash',
      name: '洗面脫衣 2.6m²',
      poly: [
        [1270, 16020],
        [2530, 16020],
        [2530, 18550],
        [1500, 18550],
        [1500, 17150],
        [1270, 17150],
      ],
      mat: 'antislip',
      at: [1950, 17200],
      note: '日本三分離②：洗面化妝檯＋乾爽脫衣更衣中樞，直接分流便所與風呂浴室'
    },
    {
      id: 'bath',
      name: '浴室 2.0m²',
      poly: R(0, 17150, 1400, 18550),
      mat: 'marble',
      at: [700, 17850],
      note: '日本三分離③：獨立風呂浴室 (2.0 m²)，深浸保溫風呂浴缸與坐洗淋浴區'
    },
    {
      id: 'laundry',
      name: '洗衣曬衣 2.9m²',
      poly: R(0, 18670, 2530, 19830),
      mat: 'tile600',
      at: [1265, 19250],
      note: '★ 獨立家政洗衣曬衣間 (2.9 m²)：由廚房直接進入，Panasonic 熱泵滾筒洗脫烘、不鏽鋼洗衣水槽、南向採光通風窗與大曬衣空間'
    },
    {
      id: 'kitchen',
      name: '廚房 10.1m²',
      poly: R(2650, 16020, 5300, 19830),
      mat: 'mint',
      at: [3975, 17925],
      note: '★ 獨立大廚房 (10.1 m²)：客廳推拉門進入，分流衛浴與洗衣間，配置大容量冰箱、2.4m料理檯面與南向大通風窗'
    },
  ],

  // 100% 真實格局家具配置 (人因工程學、通暢動線與真實朝向)
  furniture: [
    // ---------- 1. 北側獨立客房 (10.3 m²) ----------
    {
      id: 'f_guest_bed',
      type: 'bed',
      brand: 'MUJI',
      model: '無垢材標準單人床 (105×190)',
      name: '客房 標準單人床',
      cx: 1700,
      cy: 1100,
      w: 1050,
      d: 1900,
      rot: 90,
      color: '#93c5fd',
      rule: '床頭靠東側實牆，面朝西側景觀窗，舒適安穩'
    },
    {
      id: 'f_guest_nightstand',
      type: 'cabinet',
      brand: 'MUJI',
      model: '橡木實木單抽床頭櫃',
      name: '客房 床頭櫃',
      cx: 2350,
      cy: 300,
      w: 450,
      d: 400,
      rot: 90,
      color: '#d4b996',
      rule: '靠東側實牆床頭置物櫃'
    },
    {
      id: 'f_guest_wardrobe',
      type: 'wardrobe',
      brand: 'MUJI',
      model: '組合式雙門實木衣櫃 120',
      name: '客房 雙門衣櫃',
      cx: 2300,
      cy: 2500,
      w: 1200,
      d: 600,
      rot: 90,
      color: '#78716c',
      rule: '靠東側實牆，避開房門出入動線'
    },
    {
      id: 'f_guest_desk',
      type: 'desk',
      brand: 'MUJI',
      model: '橡木工作書桌 (100×60)',
      name: '客房 工作書桌',
      cx: 350,
      cy: 2700,
      w: 1000,
      d: 600,
      rot: 90,
      color: '#a16207',
      rule: '靠西側外牆大採光窗，採光極佳'
    },
    {
      id: 'f_guest_chair',
      type: 'chair',
      brand: 'MUJI',
      model: '橡木旋轉工作椅',
      name: '客房 工作椅',
      cx: 800,
      cy: 2700,
      w: 500,
      d: 500,
      rot: 270,
      color: '#57534e',
      rule: '面朝書桌與西窗'
    },

    // ---------- 2. 儲藏室 (3.1 m²) ----------
    {
      id: 'f_storage_rack',
      type: 'wardrobe',
      brand: '訂製木作',
      model: '全高收納置物層架 120',
      name: '儲藏置物層架',
      cx: 300,
      cy: 5010,
      w: 1200,
      d: 500,
      rot: 90,
      color: '#78716c',
      rule: '靠西側外牆，走道留白便於搬運行李'
    },

    // ---------- 3. 景觀大主臥 (13.7 m² · 合併玄關收納) ----------
    // (1) 加大雙人床 (Simmons Queen Size 1800×2000 mm)
    {
      id: 'f_master_bed',
      type: 'bed',
      brand: 'Simmons 席夢思',
      model: 'Beautyrest 加大雙人床 (Queen 180×200)',
      name: '大主臥 加大雙人床',
      cx: 1325,
      cy: 10600,
      w: 1800,
      d: 2000,
      rot: 180,
      color: '#3b82f6',
      rule: '用戶指定：加大雙人床 (Queen 1800×2000mm)，床頭端正靠南實牆，面朝北室內，雙側動線極度寬敞'
    },
    {
      id: 'f_master_nightstand_l',
      type: 'cabinet',
      brand: 'MUJI',
      model: '橡木實木單抽床頭櫃(西)',
      name: '主臥 床頭櫃(西)',
      cx: 220,
      cy: 11450,
      w: 420,
      d: 400,
      rot: 180,
      color: '#d4b996',
      rule: '主臥西側床頭置物櫃'
    },
    {
      id: 'f_master_nightstand_r',
      type: 'cabinet',
      brand: 'MUJI',
      model: '橡木實木單抽床頭櫃(東)',
      name: '主臥 床頭櫃(東)',
      cx: 2430,
      cy: 11450,
      w: 420,
      d: 400,
      rot: 180,
      color: '#d4b996',
      rule: '主臥東側床頭置物櫃'
    },
    // (2) 兩組 (120*75 書桌 + Aeron 椅子)
    {
      id: 'f_master_desk_1',
      type: 'desk',
      brand: 'MUJI',
      model: '橡木無垢材工作書桌 (120×75)',
      name: '主臥 120×75 書桌(北)',
      cx: 700,
      cy: 6500,
      w: 1200,
      d: 750,
      rot: 0,
      color: '#a16207',
      rule: '靠北側水平隔間牆，寬 1200 × 深 750mm'
    },
    {
      id: 'f_master_chair_1',
      type: 'officechair',
      brand: 'Herman Miller',
      model: 'Aeron 旗艦人體工學椅(北)',
      name: 'Aeron 工學椅(北)',
      cx: 700,
      cy: 7150,
      w: 685,
      d: 685,
      rot: 180,
      color: '#292524',
      rule: '面朝北側書桌'
    },
    {
      id: 'f_master_desk_2',
      type: 'desk',
      brand: 'MUJI',
      model: '橡木無垢材工作書桌 (120×75)',
      name: '主臥 120×75 書桌(西)',
      cx: 400,
      cy: 8000,
      w: 1200,
      d: 750,
      rot: 90,
      color: '#a16207',
      rule: '靠西側大採光窗，寬 1200 × 深 750mm，採光開闊，絕不碰撞斜角牆'
    },
    {
      id: 'f_master_chair_2',
      type: 'officechair',
      brand: 'Herman Miller',
      model: 'Aeron 旗艦人體工學椅(西)',
      name: 'Aeron 工學椅(西)',
      cx: 1020,
      cy: 8000,
      w: 685,
      d: 685,
      rot: 270,
      color: '#292524',
      rule: '面朝西側採光書桌'
    },
    // (3) 主臥專屬收納櫃
    {
      id: 'f_master_wardrobe',
      type: 'wardrobe',
      brand: '訂製頂天系統櫃',
      model: '主臥頂天全高大衣櫃 180',
      name: '主臥 頂天大衣櫃',
      cx: 2350,
      cy: 9500,
      w: 1800,
      d: 550,
      rot: 90,
      color: '#57534e',
      rule: '大主臥東側牆收納，大容量掛衣與疊衣空間'
    },
    {
      id: 'f_master_bookcase',
      type: 'bookcase',
      brand: 'MUJI',
      model: '多層收納書架 80',
      name: '主臥 收納書架',
      cx: 2200,
      cy: 6750,
      w: 800,
      d: 350,
      rot: 90,
      color: '#78716c',
      rule: '動線走廊置物書架'
    },

    // ---------- 4. 集中收納區 (5.8 m²) ----------
    {
      id: 'f_storage_east',
      type: 'wardrobe',
      brand: '訂製系統櫃',
      model: '東側全高收納儲物櫃 (3.6m)',
      name: '東側長向收納櫃',
      cx: 4550,
      cy: 8900,
      w: 1100,
      d: 3600,
      rot: 0,
      color: '#78716c',
      rule: '5.8 m² 集中收納區：深 1100mm、長 3600mm 超大進深儲物庫'
    },

    // ---------- 5. 客餐廳 (22.1 m²) ----------
    {
      id: 'f_tv_bench',
      type: 'tvstand',
      brand: '訂製石材',
      model: '懸空大理石電視矮櫃 220',
      name: '客廳電視櫃',
      cx: 1325,
      cy: 12150,
      w: 2200,
      d: 450,
      rot: 0,
      color: '#44403c',
      rule: '客餐廳北向隔間牆矮櫃：標註「電視櫃」'
    },
    {
      id: 'f_tv',
      type: 'tv',
      brand: 'Sony',
      model: 'BRAVIA XR-75A80L (75吋 OLED)',
      name: 'Sony 75吋 4K 電視',
      cx: 1325,
      cy: 12020,
      w: 1675,
      d: 80,
      rot: 0,
      color: '#1c1917',
      rule: '75 吋 4K 大螢幕'
    },
    {
      id: 'f_sofa_l',
      type: 'sofa_l',
      brand: 'B&B Italia / HAY',
      model: 'Mags Soft 現代布藝L型轉角沙發 (270×160)',
      name: '客廳 L型布藝沙發',
      cx: 1450,
      cy: 14500,
      w: 2700,
      d: 1600,
      rot: 180,
      color: '#57534e',
      rule: '標準客廳大沙發：主座寬2.7m、貴妃長1.6m，朝向北方電視櫃，高級暖灰棉麻布藝'
    },
    {
      id: 'f_coffee',
      type: 'coffeetable',
      brand: 'MUJI',
      model: '橡木低實木茶几 110',
      name: '無印良品 實木茶几',
      cx: 1300,
      cy: 13400,
      w: 1100,
      d: 550,
      rot: 0,
      color: '#b45309',
      rule: '沙發前實木茶几'
    },
    {
      id: 'f_dining_table',
      type: 'dining_table',
      brand: 'Carl Hansen & Søn',
      model: 'CH327 實木長餐桌 (160×85)',
      name: '客餐廳 餐桌組',
      cx: 3900,
      cy: 13800,
      w: 1600,
      d: 850,
      rot: 0,
      color: '#d97706',
      rule: '標註「餐桌」：東側 4~6 人座原木餐桌，緊鄰廚房玻璃推拉門'
    },

    // ---------- 6. 日本正統三分離衛浴 ----------
    // ① 獨立便所 (馬桶 1.2m²)
    {
      id: 'f_toilet',
      type: 'toilet_wash_tank',
      brand: 'TOTO',
      model: 'GG1 一體型水箱洗手免治馬桶',
      name: 'TOTO 免治馬桶',
      cx: 575,
      cy: 16500,
      w: 420,
      d: 680,
      rot: 180,
      color: '#ffffff',
      rule: '西北側獨立便所：標註「馬桶」，靠北牆朝南，安靜舒適衛生無異味'
    },
    // ② 獨立洗面脫衣更衣室 (2.6m²)
    {
      id: 'f_vanity',
      type: 'vanity',
      brand: 'Panasonic',
      model: 'C-Line 750 LED 三面鏡洗面化妝台',
      name: '日式洗面化妝台',
      cx: 1900,
      cy: 16400,
      w: 750,
      d: 500,
      rot: 180,
      color: '#ffffff',
      rule: '東北側洗面脫衣室：標註「洗面」，進門即洗手脫衣，直通便所與風呂浴室'
    },
    // ③ 獨立風呂浴室 (浴室 2.0m²)
    {
      id: 'f_bathtub',
      type: 'japan_tub',
      brand: 'TOTO',
      model: 'Sazan 1216 日式深浸保溫風呂',
      name: '日式深浸風呂浴缸',
      cx: 700,
      cy: 17550,
      w: 1150,
      d: 750,
      rot: 0,
      color: '#0284c7',
      rule: '西南側獨立浴室：標註「浴缸」，深浸保溫風呂'
    },
    {
      id: 'f_shower',
      type: 'shower_bench',
      brand: 'TOTO',
      model: 'Comfort Wave 恆溫淋浴花灑',
      name: '日式坐洗淋浴區',
      cx: 700,
      cy: 18150,
      w: 750,
      d: 700,
      rot: 0,
      color: '#0ea5e9',
      rule: '浴室坐洗淋浴與泡澡乾濕分離'
    },

    // ---------- 7. 獨立家政洗衣曬衣間 (2.9 m²) ----------
    // (1) Panasonic 洗脫烘滾筒洗衣機 (西南側臨窗排熱)
    {
      id: 'f_washer',
      type: 'washer',
      brand: 'Panasonic',
      model: 'NA-LX129BL 熱泵滾筒洗脫烘',
      name: '洗脫烘洗衣機',
      cx: 500,
      cy: 19250,
      w: 640,
      d: 640,
      rot: 0,
      color: '#e2e8f0',
      rule: '洗衣間西南側：標註「洗衣」，緊鄰南向大通風窗，排熱乾燥極佳'
    },
    // (2) 不鏽鋼深型洗衣水槽
    {
      id: 'f_laundry_sink',
      type: 'laundry_sink',
      brand: '訂製不鏽鋼',
      model: '深型洗衣水槽 50',
      name: '不鏽鋼洗衣水槽',
      cx: 1250,
      cy: 19300,
      w: 550,
      d: 500,
      rot: 0,
      color: '#cbd5e1',
      rule: '洗衣間水槽，便於手洗與浸泡衣物'
    },

    // ---------- 8. 獨立大廚房 (10.1 m²) ----------
    // (1) 大容量六門變頻冰箱 (東側靠東牆)
    {
      id: 'f_fridge',
      type: 'fridge',
      brand: 'Hitachi 日立',
      model: 'R-HW620NT 六門變頻琉璃冰箱',
      name: '大容量雙門冰箱',
      cx: 4850,
      cy: 16500,
      w: 700,
      d: 700,
      rot: 270,
      color: '#cbd5e1',
      rule: '廚房東北側：進出客廳與廚房拿取食材最便捷位置'
    },
    // (2) Takara standard 琺瑯整體料理檯面 (南側正對大採光排煙窗)
    {
      id: 'f_kitchen_counter',
      type: 'kitchen_counter',
      brand: 'Takara standard',
      model: 'Lemure 琺瑯連動廚具 (水槽/雙口爐)',
      name: '整體料理檯面',
      cx: 3950,
      cy: 19450,
      w: 2400,
      d: 650,
      rot: 0,
      color: '#e2e8f0',
      rule: '廚房南側大操作檯：含靜音大水槽與雙口瓦斯爐，面向南向大窗'
    },
  ]
};

// 系統預設戶型庫
export const PRESET_SPACES = [
  {
    id: 'preset_blueprint',
    title: '本案專屬格局 (5.3m × 19.83m)',
    description: '標準六段進深 (3.9+2.1+4.13+1.7+5.0+3.0m)，含戶外梯、起居室、獨立主臥、大客餐廳、三分離衛浴與獨立大廚房。',
    tag: '本案專屬 · 31.8坪',
    data: BLUEPRINT_PROJECT
  },
  {
    id: 'preset_standard_home',
    title: '現代標準三房兩廳 (12m × 8m)',
    description: '方正大格局，預設 96 平方公尺 (約 29 坪)，適配家庭自訂規劃。',
    tag: '標準方正 · 29坪',
    data: generateEmptySpace({
      name: '現代標準住宅 (12m × 8m · 29坪)',
      length: 12000,
      width: 8000,
      dimHorizontal: [4000, 4000, 4000],
      dimVertical: [4000, 4000]
    })
  },
  {
    id: 'preset_studio',
    title: '精緻日光單身套房 (7m × 5m)',
    description: '小坪數極簡開放格局，預設 35 平方公尺 (約 10.6 坪)，靈活好佈局。',
    tag: '小坪數極簡 · 10.6坪',
    data: generateEmptySpace({
      name: '精緻日光套房 (7m × 5m · 10.6坪)',
      length: 7000,
      width: 5000,
      dimHorizontal: [3500, 3500],
      dimVertical: [2500, 2500]
    })
  }
];

// 地面材質清單
export const FLOOR_MATERIALS = {
  wood: { name: '溫潤橡木實木地板', price: 3200, color: '#fef08a', pattern: 'wood' },
  walnut: { name: '北美胡桃木地板', price: 3800, color: '#9b7250', pattern: 'walnut' },
  tile800: { name: '800 霧面淺灰地磚', price: 2200, color: '#ebe6dc', pattern: 'tile' },
  tile600: { name: '600 啞光石紋地磚', price: 1600, color: '#dfe3e1', pattern: 'tile' },
  marble: { name: '天然卡拉拉白大理石', price: 6500, color: '#f1eee8', pattern: 'marble' },
  antislip: { name: '300 日式防滑風呂地磚', price: 1800, color: '#d3d8d4', pattern: 'tile' },
  tatami: { name: '日式天然草織榻榻米', price: 4200, color: '#c5c99e', pattern: 'tatami' },
  lavender: { name: '主臥舒眠薰衣草紫', price: 3500, color: '#ede9fe', pattern: 'wood' },
  mint: { name: '廚房清新薄荷綠', price: 2400, color: '#d1fae5', pattern: 'tile' },
  foyer_teal: { name: '玄關耐磨水青磚', price: 2100, color: '#cffafe', pattern: 'tile' },
  stone: { name: '戶外耐磨岩板石材', price: 2600, color: '#f4f4f5', pattern: 'tile' },
};

// 100% 真實商品數據與安裝規則目錄
export const FURNITURE_CATALOG = [
  {
    category: '工作陽台與家政洗衣 (Panasonic / 訂製)',
    items: [
      {
        type: 'washer',
        name: 'Panasonic 洗脫烘洗衣機',
        brand: 'Panasonic',
        model: 'NA-LX129BL 熱泵滾筒',
        w: 640,
        d: 640,
        color: '#e2e8f0',
        desc: '★ 原圖工作陽台：寬 639 × 深 722 × 高 1060mm。附 640×640 底盤，需靠給排水孔',
        zone: '工作陽台'
      },
      {
        type: 'laundry_sink',
        name: '訂製 不鏽鋼洗衣水槽',
        brand: '訂製不鏽鋼',
        model: '深型洗衣槽＋高身花灑 55',
        w: 550,
        d: 450,
        color: '#cbd5e1',
        desc: '★ 工作陽台專用：寬 550 × 深 450mm。手洗貼身衣物、浸泡與清潔專用',
        zone: '工作陽台'
      },
    ]
  },
  {
    category: '日本三分離衛浴 (TOTO / Panasonic)',
    items: [
      {
        type: 'toilet_wash_tank',
        name: 'TOTO 水箱洗手馬桶',
        brand: 'TOTO',
        model: 'GG-800 水箱洗手一體機 (CES9380)',
        w: 420,
        d: 790,
        color: '#ffffff',
        desc: '★ 日本經典水箱頂置洗手盆：沖水時水箱頂部自動出水洗手，流入水箱二次利用，超環保零浪費！',
        zone: '獨立便所'
      },
      {
        type: 'toilet',
        name: 'TOTO 免治馬桶',
        brand: 'TOTO',
        model: 'NEOREST AS (CES85300)',
        w: 386,
        d: 725,
        color: '#ffffff',
        desc: '寬 386 × 深 725 × 高 530mm。獨立便所專用，前方需保留 ≥500mm 淨空',
        zone: '獨立便所'
      },
      {
        type: 'vanity',
        name: 'Panasonic 化妝洗面台',
        brand: 'Panasonic',
        model: 'C-Line 900 (XGQC90C5)',
        w: 900,
        d: 530,
        color: '#f1f5f9',
        desc: '寬 900 × 深 530 × 高 800mm。獨立洗面脫衣所，前方需留 700mm 站立動線',
        zone: '洗面脫衣所'
      },
      {
        type: 'washer',
        name: 'Panasonic 洗脫烘洗衣機',
        brand: 'Panasonic',
        model: 'NA-LX129BL 熱泵滾筒',
        w: 640,
        d: 720,
        color: '#e2e8f0',
        desc: '寬 639 × 深 722 × 高 1060mm。附 640×640 底盤，需靠給排水孔',
        zone: '洗面脫衣所'
      },
      {
        type: 'cabinet',
        name: '無印良品 脫衣置物櫃',
        brand: 'MUJI',
        model: '橡木收納高櫃 40',
        w: 380,
        d: 500,
        color: '#e7e5e4',
        desc: '寬 380 × 深 500 × 高 1800mm。洗衣機旁毛巾與更衣置物',
        zone: '洗面脫衣所'
      },
      {
        type: 'japan_tub',
        name: 'Panasonic 保溫深浴缸',
        brand: 'Panasonic',
        model: 'Oflora 1616 浴缸套件',
        w: 1150,
        d: 750,
        color: '#ffffff',
        desc: '長 1150 × 寬 750 × 深 550mm。日式深浸泡澡保溫，限定於獨立風呂濕區',
        zone: '獨立風呂浴室'
      },
      {
        type: 'shower_bench',
        name: 'TOTO 坐式沖洗花灑',
        brand: 'TOTO',
        model: 'TBV03401J 坐洗套件',
        w: 900,
        d: 850,
        color: '#e0f2fe',
        desc: '寬 900 × 深 850mm。日式風呂坐洗沖澡專區，需配專用地漏',
        zone: '獨立風呂浴室'
      },
    ]
  },
  {
    category: '獨立主臥室 (Simmons / MUJI / Herman Miller)',
    items: [
      {
        type: 'bed',
        name: '席夢思 加大雙人床',
        brand: 'SIMMONS',
        model: 'Beautyrest 旗艦加大雙人床 (Queen 180×200)',
        w: 1840,
        d: 2040,
        color: '#94a3b8',
        desc: '★ 加大雙人床 (Queen Size)：長 2040 × 寬 1840 × 高 1050mm。床頭靠北外牆，床尾需留 ≥800mm 走道',
        zone: '主臥室'
      },
      {
        type: 'desk',
        name: '無印良品 70×120 書桌',
        brand: 'MUJI',
        model: '橡木無垢材工作書桌 (70×120)',
        w: 1200,
        d: 700,
        color: '#a16207',
        desc: '★ 用戶指定：寬 1200 × 深 700 × 高 720mm (70×120)。兩張水平並排，形成 2.4 米超長工作檯！',
        zone: '主臥室'
      },
      {
        type: 'officechair',
        name: 'Aeron 人體工學椅',
        brand: 'Herman Miller',
        model: 'Aeron B Size 旗艦版',
        w: 685,
        d: 685,
        color: '#292524',
        desc: '寬 685 × 深 685 × 高 1040mm。頂級人體工學旗艦椅',
        zone: '主臥室'
      },
      {
        type: 'wardrobe',
        name: '頂天立地大衣櫃 2.4m',
        brand: '訂製系統',
        model: '大容量滑門系統衣櫃 2.4m',
        w: 2400,
        d: 600,
        color: '#57534e',
        desc: '★ 主臥大容量衣櫃：寬 2400 × 深 600 × 高 2400mm。靠南側隔牆，四季衣物與行李箱收納',
        zone: '主臥室'
      },
      {
        type: 'bookcase',
        name: '無印良品 組合書架',
        brand: 'MUJI',
        model: '橡木多層組合書架 120',
        w: 1200,
        d: 380,
        color: '#78716c',
        desc: '★ 收納空間：寬 1200 × 深 380 × 高 1800mm。緊鄰水平雙書桌旁，放置專業書籍與收納盒',
        zone: '主臥室'
      },
      {
        type: 'cabinet',
        name: '無印良品 四層斗櫃',
        brand: 'MUJI',
        model: '橡木四層抽屜收納斗櫃 80',
        w: 800,
        d: 450,
        color: '#d4b996',
        desc: '★ 收納空間：寬 800 × 深 450 × 高 900mm。主臥私人物品與貼身衣物收納',
        zone: '主臥室'
      },
      {
        type: 'cabinet',
        name: '無印良品 實木床頭櫃',
        brand: 'MUJI',
        model: '橡木實木單抽床頭櫃',
        w: 450,
        d: 400,
        color: '#d4b996',
        desc: '寬 450 × 深 400 × 高 450mm。放置於床頭兩側',
        zone: '主臥室'
      },
    ]
  },
  {
    category: '獨立客房 (MUJI)',
    items: [
      {
        type: 'bed',
        name: '無印良品 雙人床',
        brand: 'MUJI',
        model: '橡木無垢材標準雙人床 (150×200)',
        w: 1540,
        d: 2020,
        color: '#cbd5e1',
        desc: '標準雙人床：長 2020 × 寬 1540 × 床頭高 820mm。靠北側採光窗',
        zone: '獨立客房'
      },
      {
        type: 'wardrobe',
        name: '無印良品 三門衣櫃',
        brand: 'MUJI',
        model: '組合式三門實木大衣櫃 150',
        w: 1500,
        d: 600,
        color: '#e7e5e4',
        desc: '寬 1500 × 深 600 × 高 2000mm。客房專屬掛衣與棉被收納',
        zone: '獨立客房'
      },
      {
        type: 'desk',
        name: '無印良品 簡約書桌',
        brand: 'MUJI',
        model: '橡木簡約工作書桌 100',
        w: 1000,
        d: 600,
        color: '#a16207',
        desc: '寬 1000 × 深 600 × 高 720mm。提供賓客辦公閱讀',
        zone: '獨立客房'
      },
      {
        type: 'chair',
        name: '無印良品 工作椅',
        brand: 'MUJI',
        model: '實木舒適旋轉工作椅',
        w: 500,
        d: 500,
        color: '#78716c',
        desc: '寬 500 × 深 500 × 高 780mm',
        zone: '獨立客房'
      },
    ]
  },
  {
    category: '料理廚房水區 (Cleanup / 林內 / 櫻花)',
    items: [
      {
        type: 'ksink',
        name: 'Cleanup 靜音大單槽',
        brand: 'Cleanup',
        model: 'CENTRO 900 流理台',
        w: 900,
        d: 650,
        color: '#cbd5e1',
        desc: '寬 900 × 深 650mm。保留原排水立管，靜音水槽 760×420mm',
        zone: '料理廚房'
      },
      {
        type: 'counter',
        name: 'Cleanup 延伸備餐台',
        brand: 'Cleanup',
        model: '切菜備料平台 700',
        w: 700,
        d: 650,
        color: '#e7e5e4',
        desc: '寬 700 × 深 650mm。水槽與瓦斯爐之間黃金備餐區',
        zone: '料理廚房'
      },
      {
        type: 'stove',
        name: '林內 雙口瓦斯爐',
        brand: 'Rinnai',
        model: 'RB-201GH 玻璃爐',
        w: 730,
        d: 500,
        color: '#334155',
        desc: '寬 730 × 深 420mm。需鄰近通風窗排煙管牆面',
        zone: '料理廚房'
      },
      {
        type: 'fridge',
        name: '國際牌 500L 電冰箱',
        brand: 'Panasonic',
        model: 'NR-F507HX 六門變頻',
        w: 700,
        d: 685,
        color: '#94a3b8',
        desc: '寬 685 × 深 699 × 高 1828mm。背部留 50mm 散熱距',
        zone: '料理廚房'
      },
      {
        type: 'ovencol',
        name: '櫻花 蒸烤電器高櫃',
        brand: 'SAKURA',
        model: 'E600 電器收納櫃',
        w: 600,
        d: 600,
        color: '#d6d3d1',
        desc: '寬 600 × 深 600 × 高 2000mm。需 220V 專迴插座',
        zone: '料理廚房'
      },
      {
        type: 'island',
        name: '石材出餐料理中島',
        brand: '訂製石材',
        model: '多功能中島吧台 1.5m',
        w: 1500,
        d: 750,
        color: '#e2e8f0',
        desc: '寬 1500 × 深 750 × 高 900mm。備餐、出餐與吧台多功能',
        zone: '中島餐飲區'
      },
      {
        type: 'table',
        name: '無印良品 實木長餐桌',
        brand: 'MUJI',
        model: '無垢材橡木餐桌 150',
        w: 1500,
        d: 800,
        color: '#d4b996',
        desc: '長 1500 × 寬 800 × 高 720mm。4人舒適共餐',
        zone: '中島餐飲區'
      },
      {
        type: 'chair',
        name: '無印良品 實木餐椅',
        brand: 'MUJI',
        model: '橡木圓弧餐椅',
        w: 450,
        d: 480,
        color: '#a8a29e',
        desc: '寬 450 × 深 480 × 高 780mm。搭配實木餐桌',
        zone: '中島餐飲區'
      },
    ]
  },
  {
    category: '客餐廳起居 (MUJI / Sony)',
    items: [
      {
        type: 'cornersofa',
        name: '無印良品 羽毛沙發',
        brand: 'MUJI',
        model: '羽毛獨立筒沙發 2P',
        w: 2000,
        d: 900,
        color: '#78716c',
        desc: '長 2000 × 寬 900 × 高 750mm。舒適高密度羽毛座包',
        zone: '客廳起居'
      },
      {
        type: 'coffeetable',
        name: '無印良品 實木茶几',
        brand: 'MUJI',
        model: '橡木低實木茶几 100',
        w: 1000,
        d: 500,
        color: '#b45309',
        desc: '長 1000 × 寬 500 × 高 350mm。日式低矮動線',
        zone: '客廳起居'
      },
      {
        type: 'tvstand',
        name: '實木電視矮櫃',
        brand: '訂製懸浮',
        model: '1.8m 實木電視矮櫃',
        w: 1800,
        d: 400,
        color: '#44403c',
        desc: '寬 1800 × 深 400 × 高 380mm。與沙發保持 1.6m 視距',
        zone: '客廳起居'
      },
      {
        type: 'tv',
        name: 'Sony 65吋 4K 電視',
        brand: 'Sony',
        model: 'BRAVIA XR-65X90L',
        w: 1450,
        d: 50,
        color: '#1c1917',
        desc: '寬 1450 × 高 836 × 厚 50mm。4K 超極真影像處理',
        zone: '客廳起居'
      },
      {
        type: 'rug',
        name: '羊毛防滑地毯',
        brand: '手織羊毛',
        model: '北歐極簡羊毛地毯 2.4m',
        w: 2400,
        d: 1600,
        color: '#e7e5e4',
        desc: '長 2400 × 寬 1600mm。定義客廳起居領域',
        zone: '客廳起居'
      },
    ]
  },
  {
    category: '結構與隔間構件',
    items: [
      {
        type: 'wall_brick_v',
        name: '4吋紅磚實心縱牆 (150mm)',
        w: 150,
        d: 3000,
        thickness: 150,
        color: '#854d0e',
        isWall: true,
        desc: '標準 4 吋紅磚實心牆 (完成面厚 150mm)，吊掛力極強、隔音優異'
      },
      {
        type: 'wall_brick_h',
        name: '4吋紅磚實心橫牆 (150mm)',
        w: 3000,
        d: 150,
        thickness: 150,
        color: '#854d0e',
        isWall: true,
        desc: '標準 4 吋紅磚實心牆 (完成面厚 150mm)，吊掛力極強、隔音優異'
      },
      {
        type: 'wall_slurry_v',
        name: '濕式灌漿實心縱牆 (120mm)',
        w: 120,
        d: 2500,
        thickness: 120,
        color: '#57534e',
        isWall: true,
        desc: '輕鋼架雙面水泥板灌注砂漿發泡實心牆 (厚 120mm)，現代大樓主流'
      },
      {
        type: 'wall_slurry_h',
        name: '濕式灌漿實心橫牆 (120mm)',
        w: 2500,
        d: 120,
        thickness: 120,
        color: '#57534e',
        isWall: true,
        desc: '輕鋼架雙面水泥板灌注砂漿發泡實心牆 (厚 120mm)，現代大樓主流'
      },
      {
        type: 'wall_dry_v',
        name: '輕鋼架乾式縱向隔間 (100mm)',
        w: 100,
        d: 2000,
        thickness: 100,
        color: '#71717a',
        isWall: true,
        desc: '輕鋼架 C 型立柱填 60K 吸音岩棉雙面矽酸鈣板 (厚 100mm)，施工輕巧快速'
      },
      {
        type: 'wall_dry_h',
        name: '輕鋼架乾式橫向隔間 (100mm)',
        w: 2000,
        d: 100,
        thickness: 100,
        color: '#71717a',
        isWall: true,
        desc: '輕鋼架 C 型立柱填 60K 吸音岩棉雙面矽酸鈣板 (厚 100mm)，施工輕巧快速'
      },
      { type: 'door_swing', name: '單開室內木門 (900mm)', w: 900, d: 120, thickness: 120, color: '#c2410c', isDoor: true, desc: '標準 900mm 房間木門，自動打通隔間牆面並顯示 90° 開啟虛線軌跡' },
      { type: 'door_slide', name: '滑動推拉門 (1000mm)', w: 1000, d: 120, thickness: 120, color: '#ea580c', isDoor: true, desc: '雙軌重疊滑動推拉門，省迴旋空間，自動打通牆面白邊' },
      { type: 'window_bay', name: '採光窗 (1.8m)', w: 1800, d: 150, color: '#60a5fa', isWindow: true, desc: '外牆通風採光窗' },
      { type: 'stairs', name: '雙向折返樓梯 (保留)', w: 5000, d: 1100, color: '#a57c56', desc: '原圖核心保留雙跑樓梯' },
    ]
  }
];

/* ============================================================
 *  台灣/東亞室內隔間工法標準參考規範
 * ============================================================ */
export const WALL_CONSTRUCTION_STANDARDS = [
  {
    type: 'drywall_100',
    thickness: 100,
    name: '輕鋼架矽酸鈣板 (100mm)',
    label: '10cm 乾式輕隔間',
    material: '65型 C 型立柱 + 雙面 9mm 矽酸鈣板 + 內填 60K 岩棉',
    weight: '35 ~ 45 kg/m²',
    soundProof: '約 42 ~ 45 dB',
    hanging: '一般吊掛需預埋木心板或使用空心膨脹螺絲',
    usage: '臥室/書房/客房室內乾區隔間'
  },
  {
    type: 'slurry_120',
    thickness: 120,
    name: '濕式輕質灌漿實心牆 (120mm)',
    label: '12cm 灌漿實心牆',
    material: '輕鋼架立柱 + 雙面防潮水泥板 + 灌注水泥砂漿發泡抗震顆粒 (100%實心)',
    weight: '110 ~ 130 kg/m²',
    soundProof: '約 46 ~ 48 dB',
    hanging: '實心質地，可直接打排釘與塑料膨脹螺絲吊掛中重型物品',
    usage: '現代集合住宅、新成屋主流實心隔間'
  },
  {
    type: 'brick_150',
    thickness: 150,
    name: '標準 4 吋紅磚實心牆 (150mm)',
    label: '15cm 4吋紅磚實心',
    material: '10cm 紅磚砌築 + 雙面水泥砂漿打底粗底 + 粉光油漆 (完成面 14~15cm)',
    weight: '220 ~ 250 kg/m²',
    soundProof: '約 48 ~ 52 dB (重質阻隔低頻佳)',
    hanging: '極強！可直接以金屬膨脹螺絲 (壁虎) 鎖固電視、重型收納吊櫃、熱水器',
    usage: '浴室水區 (防水最佳)、廚房重油煙區、需高承重吊掛牆面'
  },
  {
    type: 'rc_brick_200',
    thickness: 200,
    name: '8 吋磚牆 / RC 結構厚牆 (200mm)',
    label: '20cm 結構/RC厚牆',
    material: '8吋全磚或鋼筋混凝土澆置 (完成面 20~24cm)',
    weight: '400+ kg/m²',
    soundProof: '約 55+ dB',
    hanging: '極高結構載重',
    usage: '分戶隔音牆、電梯梯間、外牆與剪力結構主體'
  }
];
