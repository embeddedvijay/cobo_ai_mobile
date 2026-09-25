const configuredUrl = String(import.meta.env.VITE_COBO_API_URL || '').trim().replace(/\/$/, '');
const isNativeAndroid = typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === 'android');
const API_URL = configuredUrl || (isNativeAndroid ? 'http://10.0.3.2:8015' : 'http://127.0.0.1:8015');

export class ApiError extends Error { constructor(message, status = 0) { super(message); this.status = status; } }
async function request(path, { token, method = 'GET', body } = {}) {
  if (!API_URL) throw new ApiError('Cloud API URL is not configured. Set VITE_COBO_API_URL before building the Android app.');
  try {
    const response = await fetch(`${API_URL}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data.detail || data.message || `Request failed (${response.status})`, response.status);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to reach Cobo API at ${API_URL}: ${error?.message || 'network error'}`);
  }
}

export const api = {
  apiUrl: API_URL,
  login: credentials => request('/mobile/auth/login', { method: 'POST', body: credentials }),
  me: token => request('/mobile/me', { token }),
  dashboard: (token, date) => request(`/mobile/dashboard?date=${encodeURIComponent(date)}`, { token }),
  config: token => request('/mobile/config', { token }),
  groups: token => request('/mobile/groups', { token }),
  results: (token, date) => request(`/mobile/results?date=${encodeURIComponent(date)}`, { token }),
  saveConfig: (token, config) => request('/mobile/config', { token, method: 'PUT', body: config }),
  saveResult: (token, row) => request('/mobile/results', { token, method: 'PUT', body: row }),
  transactions: (token, date) => request(`/mobile/transactions?date=${encodeURIComponent(date)}`, { token }),
  saveTransaction: (token, row) => request('/mobile/transactions', { token, method: 'PUT', body: row }),
  rejectTransaction: (token, date, record_id) => request('/mobile/transactions/reject', { token, method: 'POST', body: { date, record_id } }),
  hisab: (token, date) => request(`/mobile/hisab?date=${encodeURIComponent(date)}`, { token }),
  finalOptions: token => request('/mobile/final-options', { token }),
  runFinal: (token, output_group) => request('/mobile/run-final', { token, method: 'POST', body: { output_group } }),
  serviceStatus: token => request('/mobile/service/status', { token }),
  serviceAction: (token, action) => request(`/mobile/service/${action}`, { token, method: 'POST' })
};
