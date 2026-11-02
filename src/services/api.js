import { get, set, del } from 'idb-keyval';

const API_BASE = '/api';
const TOKEN_KEY = 'floorplan_auth_token';
const USER_KEY = 'floorplan_auth_user';
const IDB_PROJECT_KEY = 'floorplan_local_project_v1';

// 取得儲存的 JWT Token
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// 取得儲存的使用者資料
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 儲存登入認證資訊
export function setAuthSession(token, user) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// 清除登入認證
export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 通用 Fetch 封裝
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errData = {};
    try {
      errData = await res.json();
    } catch {}
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ==========================================
// 1. 認證相關 API
// ==========================================

export async function loginWithGoogleCredential(credential) {
  const data = await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  if (data.token && data.user) {
    setAuthSession(data.token, data.user);
  }
  return data;
}

export async function fetchCurrentUser() {
  return request('/auth/me');
}

// ==========================================
// 2. 雲端專案管理 API (D1)
// ==========================================

export async function listCloudProjects() {
  return request('/projects');
}

export async function getCloudProject(projectId) {
  return request(`/projects/${projectId}`);
}

export async function createCloudProject(projectData) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function updateCloudProject(projectId, updates) {
  return request(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function updateCloudUnit(projectId, unitId, unitData) {
  return request(`/projects/${projectId}/units/${unitId}`, {
    method: 'PUT',
    body: JSON.stringify(unitData),
  });
}

export async function toggleCloudUnitVisibility(projectId, unitId, visible) {
  return request(`/projects/${projectId}/units/${unitId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visible }),
  });
}

// 智慧雙向同步整個專案至雲端 D1
export async function syncProjectToCloud(projectData) {
  try {
    return await updateCloudProject(projectData.id, projectData);
  } catch (err) {
    return await createCloudProject(projectData);
  }
}

// ==========================================
// 3. Local-First 本地離線儲存 (IndexedDB 無容量上限)
// ==========================================

export async function loadLocalProject() {
  try {
    const data = await get(IDB_PROJECT_KEY);
    return data || null;
  } catch (err) {
    console.warn('從 IndexedDB 載入本地專案失敗:', err);
    return null;
  }
}

export async function saveLocalProject(project) {
  try {
    if (project) {
      await set(IDB_PROJECT_KEY, project);
    }
  } catch (err) {
    console.warn('儲存本地專案至 IndexedDB 失敗:', err);
  }
}
