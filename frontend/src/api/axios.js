import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/** Base URL for media (no /api) so image paths like /media/products/x.jpg work */
export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:8000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
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
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
          localStorage.setItem('accessToken', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (e) {
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
