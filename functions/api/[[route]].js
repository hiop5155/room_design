import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

const app = new Hono().basePath('/api');

// 啟用 CORS
app.use('*', cors());

// JWT 認證中介層
const auth = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: '未授權', code: 'UNAUTHORIZED' }, 401);

  let payload;
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const secret = c.env.JWT_SECRET || 'floorplan_taste_jwt_secret_key_2026_xyz';
    payload = await verify(token, secret, 'HS256');
  } catch (err) {
    return c.json({ error: '憑證無效或已過期', code: 'INVALID_TOKEN' }, 401);
  }

  c.set('userId', payload.id || payload.userId);
  c.set('userEmail', payload.email);
  await next();
};

// ==========================================
// 1. Google OAuth 登入 & 自動帳號綁定
// ==========================================
app.post('/auth/google', async (c) => {
  try {
    const { credential } = await c.req.json();
    if (!credential) return c.json({ error: '缺少 Google 憑證', code: 'MISSING_CREDENTIAL' }, 400);

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!resp.ok) return c.json({ error: 'Google 驗證無效', code: 'INVALID_GOOGLE_AUTH' }, 400);
    const gUser = await resp.json();

    const db = c.env.DB;
    const email = (gUser.email || '').toLowerCase().trim();
    const googleId = gUser.sub;
    const name = gUser.name || email.split('@')[0];
    const avatar = gUser.picture || '';

    // 檢查 email 或 google_id 是否已有用戶
    const existing = await db.prepare('SELECT * FROM users WHERE email = ? OR google_id = ?').bind(email, googleId).first();

    let userId;
    if (existing) {
      userId = existing.id;
      await db.prepare(
        'UPDATE users SET google_id = ?, name = COALESCE(NULLIF(?, ""), name), avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(googleId, name, avatar, userId).run();
    } else {
      userId = crypto.randomUUID();
      await db.prepare(
        'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
      ).bind(userId, googleId, email, name, avatar).run();
    }

    const secret = c.env.JWT_SECRET || 'floorplan_taste_jwt_secret_key_2026_xyz';
    const token = await sign({ id: userId, email }, secret, 'HS256');
    return c.json({
      token,
      user: { id: userId, email, name, avatar },
      code: 'LOGIN_SUCCESS',
    });
  } catch (err) {
    return c.json({ error: '登入失敗: ' + err.message, code: 'LOGIN_FAILED' }, 500);
  }
});

// 取得當前使用者資料
app.get('/auth/me', auth, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  const user = await db.prepare('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: '用戶不存在' }, 404);
  return c.json({ user });
});

// ==========================================
// 2. 專案管理 API (Projects CRUD)
// ==========================================

// 列出所有專案 (包含方案數量)
app.get('/projects', auth, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const { results: projects } = await db.prepare(`
    SELECT p.*, COUNT(u.id) as unit_count
    FROM projects p
    LEFT JOIN project_units u ON p.id = u.project_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).bind(userId).all();

  return c.json({ projects: projects || [] });
});

// 建立新專案
app.post('/projects', auth, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  const body = await c.req.json();

  const projectId = body.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const name = body.name || '全新空間設計專案';
  const description = body.description || '';
  const layoutMode = body.layoutMode || 'vertical';
  const spacingM = body.spacingM || 2.5;

  await db.prepare(`
    INSERT INTO projects (id, user_id, name, description, layout_mode, spacing_m)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(projectId, userId, name, description, layoutMode, spacingM).run();

  // 若建立時有附帶初始方案 (units)
  if (body.units && Array.isArray(body.units) && body.units.length > 0) {
    const stmts = body.units.map((u, idx) => {
      const uId = u.id || `unit_${Date.now()}_${idx}`;
      return db.prepare(`
        INSERT INTO project_units (id, project_id, name, order_index, is_visible, is_locked, offset_x, offset_y, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        uId,
        projectId,
        u.name || `方案 ${idx + 1}`,
        idx,
        u.visible !== false ? 1 : 0,
        u.isLocked ? 1 : 0,
        u.offset ? u.offset[0] : 0,
        u.offset ? u.offset[1] : 0,
        typeof u.data === 'string' ? u.data : JSON.stringify(u.data || u)
      );
    });
    await db.batch(stmts);
  }

  return c.json({ success: true, projectId, message: '專案建立成功' });
});

// 取得單一專案 (包含所有並排方案單元完整數據)
app.get('/projects/:id', async (c) => {
  const projectId = c.req.param('id');
  const db = c.env.DB;

  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
  if (!project) return c.json({ error: '專案不存在', code: 'NOT_FOUND' }, 404);

  // 檢查權限：若非公開則需驗證擁有者
  if (!project.is_public) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: '專案為私有，請先登入', code: 'UNAUTHORIZED' }, 401);
    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const secret = c.env.JWT_SECRET || 'floorplan_taste_jwt_secret_key_2026_xyz';
      const payload = await verify(token, secret, 'HS256');
      if (payload.id !== project.user_id) {
        return c.json({ error: '無存取權限', code: 'FORBIDDEN' }, 403);
      }
    } catch {
      return c.json({ error: '憑證無效', code: 'INVALID_TOKEN' }, 401);
    }
  }

  const { results: rawUnits } = await db.prepare(`
    SELECT id, name, order_index, is_visible, is_locked, offset_x, offset_y, data, updated_at
    FROM project_units
    WHERE project_id = ?
    ORDER BY order_index ASC
  `).bind(projectId).all();

  const units = (rawUnits || []).map((u) => {
    let parsedData = {};
    try {
      parsedData = typeof u.data === 'string' ? JSON.parse(u.data) : u.data;
    } catch (e) {
      parsedData = {};
    }
    return {
      id: u.id,
      name: u.name,
      orderIndex: u.order_index,
      visible: Boolean(u.is_visible),
      isLocked: Boolean(u.is_locked),
      offset: [u.offset_x || 0, u.offset_y || 0],
      ...parsedData, // 包含 length, width, height, walls, doors, rooms, furniture
    };
  });

  return c.json({
    project: {
      ...project,
      units,
    },
  });
});

// 更新專案主設定
app.put('/projects/:id', auth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.env.DB;
  const body = await c.req.json();

  await db.prepare(`
    UPDATE projects
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        active_unit_id = COALESCE(?, active_unit_id),
        layout_mode = COALESCE(?, layout_mode),
        spacing_m = COALESCE(?, spacing_m),
        is_public = COALESCE(?, is_public),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).bind(
    body.name || null,
    body.description || null,
    body.activeUnitId || null,
    body.layoutMode || null,
    body.spacingM !== undefined ? body.spacingM : null,
    body.isPublic !== undefined ? (body.isPublic ? 1 : 0) : null,
    projectId,
    userId
  ).run();

  return c.json({ success: true, message: '專案設定已更新' });
});

// 刪除專案
app.delete('/projects/:id', auth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.env.DB;

  await db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).run();
  return c.json({ success: true, message: '專案已刪除' });
});

// ==========================================
// 3. 方案/單元管理 API (Units CRUD)
// ==========================================

// 新增或複製方案
app.post('/projects/:id/units', auth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const db = c.env.DB;
  const body = await c.req.json();

  // 驗證擁有者
  const proj = await db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first();
  if (!proj) return c.json({ error: '無權限操作此專案' }, 403);

  const unitId = body.id || `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const name = body.name || '全新設計方案';
  const orderIndex = body.orderIndex || 0;
  const offsetX = body.offset ? body.offset[0] : (body.offsetX || 0);
  const offsetY = body.offset ? body.offset[1] : (body.offsetY || 0);
  const data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data || body);

  await db.prepare(`
    INSERT INTO project_units (id, project_id, name, order_index, is_visible, is_locked, offset_x, offset_y, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(unitId, projectId, name, orderIndex, 1, 0, offsetX, offsetY, data).run();

  await db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(projectId).run();

  return c.json({ success: true, unitId, message: '方案已成功加入專案' });
});

// 局部更新方案幾何數據與設定
app.put('/projects/:id/units/:unitId', auth, async (c) => {
  const { id: projectId, unitId } = c.req.param();
  const userId = c.get('userId');
  const db = c.env.DB;
  const body = await c.req.json();

  // 驗證擁有者
  const proj = await db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first();
  if (!proj) return c.json({ error: '無權限操作此專案' }, 403);

  const dataStr = body.data ? (typeof body.data === 'string' ? body.data : JSON.stringify(body.data)) : null;

  await db.prepare(`
    UPDATE project_units
    SET name = COALESCE(?, name),
        is_visible = COALESCE(?, is_visible),
        is_locked = COALESCE(?, is_locked),
        offset_x = COALESCE(?, offset_x),
        offset_y = COALESCE(?, offset_y),
        data = COALESCE(?, data),
        updated_at = CURRENT_TIMESTAMP
    WHERE project_id = ? AND id = ?
  `).bind(
    body.name || null,
    body.visible !== undefined ? (body.visible ? 1 : 0) : null,
    body.isLocked !== undefined ? (body.isLocked ? 1 : 0) : null,
    body.offset ? body.offset[0] : (body.offsetX !== undefined ? body.offsetX : null),
    body.offset ? body.offset[1] : (body.offsetY !== undefined ? body.offsetY : null),
    dataStr,
    projectId,
    unitId
  ).run();

  await db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(projectId).run();

  return c.json({ success: true, message: '方案數據已同步儲存' });
});

// 快速切換方案可見性
app.patch('/projects/:id/units/:unitId/visibility', auth, async (c) => {
  const { id: projectId, unitId } = c.req.param();
  const { visible } = await c.req.json();
  const db = c.env.DB;

  await db.prepare('UPDATE project_units SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND id = ?')
    .bind(visible ? 1 : 0, projectId, unitId).run();

  return c.json({ success: true, visible });
});

// 刪除方案
app.delete('/projects/:id/units/:unitId', auth, async (c) => {
  const { id: projectId, unitId } = c.req.param();
  const userId = c.get('userId');
  const db = c.env.DB;

  const proj = await db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first();
  if (!proj) return c.json({ error: '無權限' }, 403);

  await db.prepare('DELETE FROM project_units WHERE project_id = ? AND id = ?').bind(projectId, unitId).run();
  return c.json({ success: true, message: '方案已刪除' });
});

export default app;

