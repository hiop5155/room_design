-- ========================================================
-- Floorplan Taste 空間設計與多方案對比平台 D1 資料庫結構
-- ========================================================

-- 1. 使用者表 (支援 Google OAuth 登入)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                   -- 使用者 UUID
    google_id TEXT UNIQUE,                 -- Google Sub ID (首次 Google 登入時填入)
    email TEXT UNIQUE NOT NULL,            -- Email 唯一識別
    name TEXT DEFAULT '',                  -- 使用者姓名
    avatar_url TEXT DEFAULT '',            -- Google 頭像網址
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. 空間設計專案主表 (支援多租戶與公開分享)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,                   -- 專案 ID (例如 proj_1983m_xinyi)
    user_id TEXT NOT NULL,                 -- 關聯 users.id (多租戶隔離)
    name TEXT NOT NULL,                    -- 專案名稱 (例如 "長條透天改裝全案規劃")
    description TEXT DEFAULT '',
    active_unit_id TEXT,                   -- 當前編輯選中的方案 ID
    layout_mode TEXT DEFAULT 'vertical',   -- 方案並排方式: 'horizontal' (左右並排) | 'vertical' (上下並排)
    spacing_m REAL DEFAULT 2.5,            -- 方案間隔距離 (公尺)
    thumbnail_url TEXT DEFAULT '',         -- 2D/3D 自動生成的預覽縮圖
    is_public BOOLEAN DEFAULT FALSE,       -- 是否開放免登入查看 3D
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- 3. 設計方案/戶型單元表 (一個專案內的多套並排對比方案)
CREATE TABLE IF NOT EXISTS project_units (
    id TEXT NOT NULL,                      -- 單元 ID (例如 unit_scheme_a, unit_scheme_b)
    project_id TEXT NOT NULL,              -- 關聯 projects.id
    name TEXT NOT NULL,                    -- 方案名稱 (例如 "方案 A：三分離衛浴", "方案 B：大客餐廚")
    order_index INTEGER DEFAULT 0,         -- 排序順序
    is_visible BOOLEAN DEFAULT TRUE,       -- 是否在 2D/3D 同時渲染 (可見性勾選開關)
    is_locked BOOLEAN DEFAULT FALSE,       -- 方案編輯鎖定狀態
    offset_x INTEGER DEFAULT 0,            -- 2D/3D 世界坐標偏移 X (mm)
    offset_y INTEGER DEFAULT 0,            -- 2D/3D 世界坐標偏移 Y (mm)
    data JSON NOT NULL,                    -- 核心幾何數據 (包含 walls, doors, rooms, furniture, length, width, height, spawnPoint)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_units_project ON project_units(project_id);

