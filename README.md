# 🏠 Floorplan Taste (空間規劃師)

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages%20%26%20D1-orange.svg)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

> 現代高質感 2D/3D 空間格局與室內設計規劃平台，支援**多套方案同屏對比**、**Dollhouse 動態近牆剖透**、**人體第一人稱漫遊出發選房**，以及基於 **Cloudflare Pages + D1 + Google OAuth** 的 Local-First 雲端同步架構。

---

## ✨ 核心特色

### 1. 📐 2D / 3D 多方案同屏渲染與直觀對比 (Multi-Scheme Layout)
- **多戶型並排引擎**：支援橫向並排（`horizontal`）與直向並列（`vertical`）排列，各方案獨立保存幾何格局、牆體與家具拓撲。
- **可見性勾選開關**：可在控制列中獨立開關任一方案的可見性（`👁️` / `🚫`），自由組合欲對照的格局方案。
- **方案克隆與切換**：支援一鍵複製當前方案產生衍生版本（方案 C/D），點選對照方案銘牌即可即時切換當前編輯戶型。

### 2. 🚶‍♂️ 第一人稱人體漫遊與出發選房 (First-Person Walkthrough)
- **出發選房彈窗**：畫布上載入多套方案時，點擊漫遊會彈出選房卡片，列出所有方案的房間（客餐廳、大主臥、三分離衛浴、客房等），一鍵直達。
- **擬真物理與流暢通行**：
  - 標準體態人體碰撞（直徑 24cm 虛擬膠囊碰撞體）。
  - 門洞通行優先判斷（0.85m 寬容通行範圍，進出房門如絲般順暢）。
  - 分軸滑動碰撞（沿實體隔間牆與大型家具邊緣自然滑行）。
  - 擬真人體步態微動（Head Bobbing，步態起伏 0.012m）。
- **實時雷達小地圖 (Minimap HUD)**：
  - 毫秒級追蹤人物當前坐標與視野扇形朝向。
  - 自動偵測並顯示當前所在房間名稱與面積。
  - 支援點擊小地圖任意位置即刻瞬移（Teleport）。

### 3. 🛸 Dollhouse 3D 動態近牆剖透 (Cutaway Walls)
- 參考頂級空間可視化規範：靠近相機視角的近牆動態自動降低至 0.95m，遠景背牆保持 2.8m 全高立體包覆，兼顧空間開闊度與真實尺度感。
- 支援固定矮牆（1.2m）與真實全高（2.8m）一鍵切換。
- PBR 擬真材質庫（木地板、義大利大理石、灰磁磚、紅磚牆、發光 OLED 電視、TAKARA 水槽等）。

### 4. ☁️ Local-First 架構 & Cloudflare D1 雲端同步
- **離線可用**：未登入狀態下，所有設計方案無縫持久化保存於瀏覽器 **IndexedDB**（無容量上限）。
- **Google OAuth 登入**：使用 `@react-oauth/google` 與 Cloudflare Pages Functions 後端簽發 JWT。
- **Cloudflare D1 邊緣資料庫**：登入後自動雙向同步多方案至全球分佈式關聯資料庫 D1。

---

## 🛠️ 技術棧

- **前端核心**：React 18 + Vite 5
- **3D 渲染引擎**：Three.js (WebGL, PBR 柔和陰影, ACESFilmic 色調)
- **2D 互動畫布**：向量 SVG（支援 50mm 網格吸附、正交牆對齊、360° 旋轉手柄）
- **離線儲存**：`idb-keyval` (IndexedDB) + `localStorage`
- **邊緣後端**：Cloudflare Pages Functions + Hono v4 + JWT
- **邊緣資料庫**：Cloudflare D1 (SQLite-compatible)
- **身份驗證**：Google OAuth 2.0 / Google Identity Services

---

## 📂 專案結構

```
floorplan-taste/
├── functions/                     # Cloudflare Pages Functions 後端
│   └── api/
│       └── [[route]].js          # Hono.js RESTful API (Auth, Projects, Units)
├── src/
│   ├── components/               # React 視圖元件
│   │   ├── FloorPlan2D.jsx       # 2D 向量平面圖畫布 (多方案對照、隔間牆繪製)
│   │   ├── Viewport3D.jsx        # 3D 立體視圖 (Dollhouse、第一人稱漫遊)
│   │   ├── MinimapHUD.jsx        # 實時雷達小地圖與房間辨識 HUD
│   │   ├── SchemeManagerBar.jsx  # 多方案切換與可見性控制條
│   │   ├── WalkRoomPickerModal.jsx # 第一人稱漫遊出發選房彈窗
│   │   ├── Header.jsx            # 頂部操作導航列
│   │   └── ...
│   ├── utils/
│   │   ├── schemeLayout.js       # 多方案坐標偏移與排版計算
│   │   ├── roomDetector.js       # 隔間牆自動閉合分區智慧辨識
│   │   ├── layoutSync.js         # 格局坐標同步與門窗幾何演算法
│   │   └── threeTextures.js      # Three.js 程式化質感貼圖生成
│   ├── services/
│   │   └── api.js                # Local-First 離線儲存與 Cloudflare D1 API
│   ├── App.jsx                   # 應用程式主邏輯與全域狀態
│   └── main.jsx                  # 應用程式入口 (掛載 GoogleOAuthProvider)
├── schema.sql                    # Cloudflare D1 資料庫遷移腳本
├── wrangler.toml                 # Cloudflare 部署設定
└── package.json
```

---

## 🚀 快速開始

### 1. 安裝相依套件

```bash
npm install
```

### 2. 本地開發伺服器

```bash
npm run dev
```

開啟瀏覽器造訪 `http://localhost:8899`。

### 3. 編譯生產版本

```bash
npm run build
```

---

## 🌐 部署至 Cloudflare Pages

### 1. 建立 Cloudflare D1 資料庫

```bash
npx wrangler d1 create floorplan-db
```

將終端機輸出的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "floorplan-db"
database_id = "<你的 DATABASE_ID>"
```

### 2. 執行資料庫遷移腳本

```bash
npx wrangler d1 execute floorplan-db --file=./schema.sql --remote -y
```

### 3. 設定 GitHub 自動構建 (CI/CD)

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages**。
2. 綁定此 GitHub 儲存庫：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. 在專案 **Settings** > **Functions** > **D1 database bindings** 中：
   - **Variable name**: `DB`
   - **D1 database**: 選擇 `floorplan-db`
4. 在 **Custom domains** 綁定自訂網域（例如 `room.money-tracker.xyz`）。

---

## 🎮 操作控制指引

| 視角模式 | 操作方式 | 效果說明 |
| :--- | :--- | :--- |
| **2D 平面圖** | 單指 / 滑鼠左鍵拖曳 | 平移畫布 |
| | 滾輪 / 雙指捏合 | 畫布縮放 (Zoom In / Out) |
| | 點擊隔間牆 / 家具 | 選取物件，可旋轉、拖曳或微調尺寸 |
| | 點擊對照方案銘牌 | 切換該方案為當前編輯方案 |
| **3D 鳥瞰模式** | 滑鼠左鍵拖曳 | 360° 圍繞焦點旋轉視角 |
| | 滑鼠右鍵拖曳 | 平移焦點位置 |
| | 滾輪縮放 | 推進 / 遠離焦點 |
| **第一人稱漫遊** | `W` / `A` / `S` / `D` | 前後左右行走 |
| | `Shift` (按住) | 加速奔跑 |
| | 滑鼠拖曳 | 360° 環顧四周視角 |
| | 手機螢幕左側 / 右側 | 左側虛擬搖桿移動 · 右側滑動轉向 |
| | 點擊右下角小地圖 | 即刻瞬移至點選房間位置 |

---

## 📄 License

MIT License.

