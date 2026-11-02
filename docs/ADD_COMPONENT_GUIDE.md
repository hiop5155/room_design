# 室內平面與 3D 空間元件開發手冊 (Component Development Guide)
> **本手冊規範如何為本系統新增具備真實人因工學尺寸、真實寫實商品圖與 3D 實物級外觀的高品質室內元件與隔間。**  
> ⚠️ **嚴格禁止粗製濫造**：嚴禁只建立一個單一灰色或純色方塊（`BoxGeometry`）卡在 3D 場景中！所有元件必須符合本手冊之「分層結構建模」與「PBR/紋理貼圖」標準。

---

## 目錄
1. [人因工學標準尺寸與動線預留規範表](#一人因工學標準尺寸與動線預留規範表)
2. [元件資料結構標準 (Schema Definition)](#二元件資料結構標準-schema-definition)
3. [2D 平面圖與寫實商品圖整合流程](#三2d-平面圖與寫實商品圖整合流程)
4. [3D 實物級渲染架構與防「方塊卡住」開發法則](#四3d-實物級渲染架構與防方塊卡住開發法則)
5. [實戰範例：新增「義大利真皮旋轉單椅」Step-by-Step](#五實戰範例新增義大利真皮旋轉單椅-step-by-step)
6. [品質驗收與發布清單 (Checklist)](#六品質驗收與發布清單-checklist)

---

## 一、人因工學標準尺寸與動線預留規範表

所有新增至系統的家具與隔間，必須基於真實市售商品規格（以毫米 `mm` 為單位），並兼顧人體工學操作淨空（Clearances）：

| 元件類別 | 建議類型識別碼 (`type`) | 寬度 W (mm) | 深度 D (mm) | 高度 H (mm) | 品牌/工法參考 | 人因工學動線與淨空要求 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **加大雙人床** | `bed_queen` / `bed` | 1820 | 2120 | 950 (床頭) | 席夢思 Simmons Beautyrest Black | 兩側下床通道淨寬 $\ge 600\text{mm}$，床尾走道 $\ge 750\text{mm}$ |
| **標準單人床** | `bed_single` | 1050 | 2000 | 850 (床頭) | 無印良品 MUJI 橡木收納床 | 單側靠牆時，開放側下床通道 $\ge 700\text{mm}$ |
| **L型轉角沙發** | `sofa_l` | 2800 | 1600 (貴妃) | 850 | B&B Italia Michel Club | 沙發前端至茶几距離 $400\text{mm}$，後方背牆走道 $\ge 800\text{mm}$ |
| **四人實木餐桌椅** | `dining_table` | 1600 | 850 | 740 | Carl Hansen & Søn CH327 + CH24 | 餐椅拉出就座深度 $750\text{mm}$，主動線淨寬 $\ge 900\text{mm}$ |
| **實木書桌** | `desk` | 1200 | 750 | 720 | 無印良品 鋼木複合書桌 | 椅子後方推拉退椅淨深 $\ge 800\text{mm}$ |
| **人體工學椅** | `chair` / `officechair` | 685 | 685 | 1040 | Herman Miller Aeron 2.0 | 五星輪迴轉半徑直徑 $700\text{mm}$ |
| **日系旗艦六門冰箱** | `fridge` | 750 | 735 | 1830 | 日立 HITACHI / Panasonic 頂級六門 | 冰箱門對開半徑 $450\text{mm}$，抽屜拉出淨深 $650\text{mm}$ |
| **琺瑯系統廚具料理檯**| `kitchen_counter` | 2700 | 650 | 850 | Takara standard 日本原裝琺瑯廚具 | 料理過道淨寬 $\ge 900\text{mm}$（雙人會車需 $\ge 1050\text{mm}$） |
| **水箱洗手免治馬桶** | `toilet_wash_tank` | 420 | 720 | 820 | TOTO GG-800 一體型水箱洗手便座 | 馬桶前方伸腿淨寬 $\ge 500\text{mm}$，兩側至牆距 $\ge 200\text{mm}$ |
| **深泡澡保溫浴缸** | `japan_tub` | 1200 | 750 | 600 | TOTO Sazan 暖浴深缸 | 踏入浴缸站立區淨寬 $\ge 600\text{mm}$ |
| **熱泵滾筒洗脫烘** | `washer` | 600 | 680 | 1020 | Panasonic 旗艦斜取滾筒 | 正面艙門開啓弧徑 $550\text{mm}$，上方預留檢修高 $150\text{mm}$ |
| **不鏽鋼獨立洗衣槽** | `laundry_sink` | 600 | 550 | 850 | 櫻花 SAKURA 戶外防潮洗衣槽 | 站立手搓衣物操作空間 $\ge 700\text{mm}$ |
| **頂天立地滑門衣櫃** | `wardrobe` | 1800 | 600 | 2400 | 德寶系統家具頂天高櫃 | 滑門免推開迴轉半徑，前方更衣通道 $\ge 600\text{mm}$ |
| **單開實木靜音門** | `wood_door` | 900 (門扇) | 45 (扇厚) | 2100 | 永大實木防噪門 | 90度開啟迴轉弧線內嚴禁堆放家具 |
| **鋁框細邊玻璃拉門** | `sliding_door` | 800~1600 | 35 (框厚) | 2100~2400 | 頂級窄邊黑框懸吊拉門 | 地面無下軌，上方需具備承重結構梁 |
| **4吋紅磚實心隔間牆** | `brick_wall` | 自訂 (L) | 150 (厚度) | 2800 (全高) | 台灣傳統 4 吋紅磚粉光 (10+2+2cm) | 水區首選、抗震吊掛力極強（可直吊 75" 電視與重吊櫃） |
| **濕式灌漿實心牆** | `grout_wall` | 自訂 (L) | 120 (厚度) | 2800 (全高) | 雙面纖維水泥板 + 輕質水泥發泡粒 | 新建大樓室內隔間主流，隔音平整抗震 |
| **乾式輕鋼架輕隔間** | `drywall` | 自訂 (L) | 100 (厚度) | 2800 (全高) | C型輕鋼架 + 岩棉 + 雙面矽酸鈣板 | 施工速度快、自重極輕，吊掛重物需事先預埋補強鍍鋅鋼板 |

---

## 二、元件資料結構標準 (Schema Definition)

在 `src/constants.js` 或系統狀態中，家具物件必須具備以下完整欄位：

```javascript
{
  id: 'f_unique_id',          // 唯一識別碼，格式如 f_bed_master, f_sofa_living
  type: 'sofa_l',             // 元件型別代碼 (對應 3D 幾何解析與圖片分類)
  name: 'B&B Italia 義式L型沙發', // 顯示名稱
  brand: 'B&B Italia',        // 品牌標記 (將展示於側邊欄與屬性預覽面板徽章)
  category: 'living',         // 所屬分類 ('living' | 'bedroom' | 'dining' | 'bath' | 'storage')
  w: 2800,                    // 寬度 (X軸方向，單位 mm)
  d: 1600,                    // 深度 (Y軸方向，單位 mm)
  cx: 1400,                   // 2D 中心點 X 座標 (mm)
  cy: 14000,                  // 2D 中心點 Y 座標 (mm)
  rot: 0,                     // 旋轉角度 (0, 90, 180, 270 度)
  color: '#57534e',           // 2D 平面代表色 (Hex 碼)
  description: '頂級鵝絨坐墊與深灰色科技布包覆', // 規格描述
}
```

---

## 三、2D 平面圖與寫實商品圖整合流程

為了保證使用者在「左側商品型錄抽屜」與「右側物件屬性檢視面板」都能看到**真實實物照片**，必須遵循以下三步整合：

### 步驟 1：在 `src/utils/productImages.js` 中定義寫實圖片
利用向量 SVG 或高解析 Data URI 定義真實商品外觀，並配置相應品牌標籤：
```javascript
// src/utils/productImages.js
export const PRODUCT_REAL_IMAGES = {
  // ... 原有品項
  my_component: {
    brand: '品牌名稱 (如 Carl Hansen)',
    src: 'data:image/svg+xml;utf8,<svg ...真實商品向量繪圖...</svg>',
  },
};
```

### 步驟 2：在 `getProductImage` 函式中加入自動匹配規則
確保無論是從型錄置入、點選編輯或是自訂匯入，系統都能精準匹配到正確的商品圖：
```javascript
export function getProductImage(item) {
  if (!item) return DEFAULT_IMAGE;
  const name = item.name || '';
  const type = item.type || '';

  if (type === 'my_component' || name.includes('我的元件關鍵字')) {
    return PRODUCT_REAL_IMAGES.my_component.src;
  }
  // ... 其餘匹配
}
```

---

## 四、3D 實物級渲染架構與防「方塊卡住」開發法則

> 🛑 **Anti-BoxGeometry 核心準則**：  
> 絕對不准在 `Viewport3D.jsx` 裡寫出形如 `new THREE.Mesh(new THREE.BoxGeometry(fw, h, fd), mat)` 的偷懶單立方體！  
> 任何真實家具都是由**多個具備真實材質、倒角、五金、分件與陰影的組件**構成。

### 1. 分層結構化建模心法 (Hierarchical Group Assembly)
每個元件必須依循下列 4 層次組裝：

```
THREE.Group (元件根容器，負責整體 posX, posZ, rotY)
 ├── Layer 1: 底座 / 框架 / 支撐腳 (如實木腳、黑鐵底座、滾輪)
 ├── Layer 2: 主體 / 檯面 / 櫃身 / 床墊 (如大理石檯面、加厚獨立筒床墊)
 ├── Layer 3: 功能五金 / 門片分縫 / 水龍頭 / 把手 (如金屬把手、鵝頸龍頭)
 └── Layer 4: 寫實點綴物 / 織品抱枕 / 實景發光畫面 (如 OLED 實景壁紙、蓬鬆枕頭)
```

### 2. PBR 材質與程序化動態紋理 (`src/utils/threeTextures.js`)
系統內建 5 大記憶體動態產生之高質感紋理，嚴格杜絕外網依賴與破圖問題：
1. **`createWoodTexture()`**：橡木實木地板與實木家具，具備直鋪板縫與深淺木紋纖維。
2. **`createMarbleTexture()`**：卡拉拉白大理石檯面與地磚，具備流雲墨韻。
3. **`createTileTexture(size, bgColor, lineColor)`**：衛浴防滑地磚與廚房磁磚，具備水泥勾縫與防滑顆粒。
4. **`createBrickTexture()`**：4吋紅磚實心牆，具備交錯排列之紅磚色差與灰泥填縫。
5. **`createTVScreenTexture()`**：Sony 4K OLED 電視實景畫面，配合 `emissiveMap` 與 `emissiveIntensity: 0.75` 呈現真實發光螢幕。

---

## 五、實戰範例：新增「義大利真皮旋轉單椅」Step-by-Step

以新增一張 **「義大利 Poltrona Frau 現代真皮旋轉單椅」** 為例：

### 1. 在 `src/constants.js` 的型錄清單中新增
```javascript
{
  type: 'leather_armchair',
  name: 'Poltrona Frau 旋轉扶手皮椅',
  brand: 'Poltrona Frau',
  w: 850,
  d: 850,
  color: '#92400e',
  category: 'living',
  description: '頂級托斯卡尼苯染牛皮與十字金屬旋轉底座',
}
```

### 2. 在 `src/components/Viewport3D.jsx` 的家具渲染迴圈中實作實物效果
```javascript
else if (f.type === 'leather_armchair') {
  // ★ Poltrona Frau 旋轉皮椅多組件精細 3D 模型
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, // 暖焦糖真皮
    roughness: 0.6,
    metalness: 0.1,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    metalness: 0.95,
    roughness: 0.1,
  });

  // Layer 1: 十字金屬旋轉腳座
  const footBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 4), chromeMat);
  footBase.position.y = 0.04;
  group.add(footBase);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), chromeMat);
  stem.position.y = 0.14;
  group.add(stem);

  // Layer 2: 圓弧加厚真皮座墊
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(fw * 0.42, fw * 0.38, 0.16, 24), leatherMat);
  seat.position.y = 0.32;
  seat.castShadow = true;
  group.add(seat);

  // Layer 3: 包覆型人體工學靠背
  const back = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.8, 0.58, 0.12), leatherMat);
  back.position.set(0, 0.58, -fd * 0.3);
  back.rotation.x = -0.15; // 向後微仰 8 度人因工學角度
  back.castShadow = true;
  group.add(back);

  // Layer 4: 左右真皮圓弧扶手
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, fd * 0.55), leatherMat);
  armL.position.set(-fw * 0.36, 0.45, -fd * 0.05);
  armL.castShadow = true;
  group.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, fd * 0.55), leatherMat);
  armR.position.set(fw * 0.36, 0.45, -fd * 0.05);
  armR.castShadow = true;
  group.add(armR);
}
```

---

## 六、品質驗收與發布清單 (Checklist)

每次新增或修改元件前，請逐一檢查下列項目：

- [ ] **真實尺寸檢驗**：寬度、深度、高度是否符合真實市售人因工學規格（單位 mm，不得隨意憑空捏造）。
- [ ] **動線淨空確認**：家具週邊走道是否保留 $\ge 600\text{mm}$（主動線 $\ge 900\text{mm}$）。
- [ ] **寫實照片覆蓋**：左側側邊欄、手機端抽屜、右側屬性面板是否皆能正確顯示真實商品照片與品牌標籤徽章。
- [ ] **拒絕方塊檢測**：切換至 3D 視角（鳥瞰與平視），該元件是否具備底座、本體、五金細節、倒角與材質紋理，無單純灰塊問題。
- [ ] **旋轉坐向驗證**：在 2D 與 3D 中執行 90° / 180° / 270° 旋轉，椅面/螢幕/門把之朝向是否完全正確。
- [ ] **自動化建置測試**：執行 `npm run build` 確認 Vite 編譯 exit code 為 0，無任何語法或模組引用錯誤。

---

## 七、3D 空間剖切與第一人稱漫遊適配規範 (參考 room-from-photos)

本專案借鏡了頂級建築空間視覺化技術，在 3D 空間中實作了以下兩大核心系統：

### 1. Dollhouse 動態近牆剖透 (Camera-facing Wall Cutaway)
- **原理**：傳統 3D 戶型圖若使用固定全高牆（2.8m），會遮蔽鏡頭前方所有內部家具；若使用固定矮牆（1.2m），則失去真實住宅的天花板空間包覆感。
- **作法**：
  - 幾何體原點平移至地面 Pivot (`geo.translate(0, H/2, 0)`)。
  - 動態計算相機到各面牆的水平前進點積（Dot Product）。
  - 靠近鏡頭、擋住視線的前景牆自動剖切降至 $0.95\text{m}$；遠端背景牆維持 $2.8\text{m}$ 全高，隨相機 360° 轉向平滑漸變。
  - 牆底增設 $80\text{mm}$ 深色踢腳線（Baseboard），強化邊界陰影與真實建築工藝層次。

### 2. 第一人稱漫遊系統 (First Person Walk Mode)
- **人眼視角**：恆定人眼高度 $1.6\text{m}$。
- **操作方式**：
  - 電腦端：`W / A / S / D` 行走、`Shift` 快跑、滑鼠左鍵拖曳 360° 環顧、滾輪微距進退。
  - 行動端：左下角虛擬搖桿（Touch Joystick）控制行走、右半部滑動旋轉視角。
- **房間一鍵直達 (Fly to Room)**：
  - 點選頂部藥丸即可平滑飛入客餐廳、大主臥、客房、大廚房、洗衣曬衣間、三分離衛浴或玄關入口，無縫在各房間內行走體驗。


