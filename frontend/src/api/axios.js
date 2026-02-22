import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/** Base URL for media - Django serves uploads at /media/ */
export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:8000';
  const clean = path.startsWith('/') ? path.slice(1) : path;
  const mediaPath = clean.startsWith('media/') ? `/${clean}` : `/media/${clean}`;
  return `${base}${mediaPath}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;
    const msg = err.response?.data?.detail || err.response?.data?.error || '';
    const msgStr = String(msg).toLowerCase();

    // 403 with suspended/banned: clear session and redirect
    if (status === 403 && (msgStr.includes('suspended') || msgStr.includes('banned'))) {
      sessionStorage.setItem('authError', 'Your account has been suspended or banned. Please contact support.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // 401: try token refresh
    if (status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
          localStorage.setItem('accessToken', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (e) {
          const refreshMsg = e.response?.data?.detail || e.response?.data?.error || '';
          if (String(refreshMsg).toLowerCase().includes('suspended') || String(refreshMsg).toLowerCase().includes('banned')) {
            sessionStorage.setItem('authError', 'Your account has been suspended or banned. Please contact support.');
          }
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
