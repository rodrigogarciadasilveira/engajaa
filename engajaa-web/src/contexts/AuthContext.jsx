import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try silent refresh on mount
  useEffect(() => {
    api.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        // Decode user from token
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setUser({ userId: payload.userId, tenantId: payload.tenantId, role: payload.role });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
