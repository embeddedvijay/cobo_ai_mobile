const API_URL = String(import.meta.env.VITE_COBO_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error { constructor(message, status = 0) { super(message); this.status = status; } }
async function request(path, { token, method = 'GET', body } = {}) {
  if (!API_URL) throw new ApiError('Cloud API URL is not configured. Set VITE_COBO_API_URL before building the Android app.');
  const response = await fetch(`${API_URL}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.detail || data.message || `Request failed (${response.status})`, response.status);
  return data;
}

export const api = {
  login: credentials => request('/mobile/auth/login', { method: 'POST', body: credentials }),
  me: token => request('/mobile/me', { token }),
  dashboard: (token, date) => request(`/mobile/dashboard?date=${encodeURIComponent(date)}`, { token }),
  config: token => request('/mobile/config', { token }),
  saveConfig: (token, config) => request('/mobile/config', { token, method: 'PUT', body: config }),
  transactions: (token, date) => request(`/mobile/transactions?date=${encodeURIComponent(date)}`, { token }),
  hisab: (token, date) => request(`/mobile/hisab?date=${encodeURIComponent(date)}`, { token }),
  finalOptions: token => request('/mobile/final-options', { token }),
  runFinal: (token, output_group) => request('/mobile/run-final', { token, method: 'POST', body: { output_group } }),
  serviceStatus: token => request('/mobile/service/status', { token }),
  serviceAction: (token, action) => request(`/mobile/service/${action}`, { token, method: 'POST' })
};
