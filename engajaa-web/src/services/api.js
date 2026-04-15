import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  withCredentials: true,
});

// Attach access token from memory
let _accessToken = null;
export const setAccessToken = (t) => { _accessToken = t; };
export const getAccessToken = () => _accessToken;

api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// Auto-refresh on 401 — never retry the refresh endpoint itself
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isRefreshEndpoint = original.url?.includes('/auth/refresh');

    if (err.response?.status === 401 && !original._retry && !isRefreshEndpoint) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
