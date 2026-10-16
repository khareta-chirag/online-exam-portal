const API = '/api';

function getToken() { return localStorage.getItem('exam_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('exam_user') || 'null'); } catch { return null; } }
function saveSession(data) { localStorage.setItem('exam_token', data.token); localStorage.setItem('exam_user', JSON.stringify(data.user)); }
function logout() { localStorage.removeItem('exam_token'); localStorage.removeItem('exam_user'); location.href = 'login.html'; }
function requireAuth() { if (!getToken()) location.href = 'login.html'; }
function redirectByRole() { const user = getUser(); if (!user) return location.href = 'login.html'; location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html'; }

async function apiFetch(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
