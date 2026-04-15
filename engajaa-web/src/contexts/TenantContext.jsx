import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [igAccount, setIgAccount] = useState(null);
  const [plan, setPlan] = useState(null);

  const load = () => {
    api.get('/instagram/status').then(({ data }) => setIgAccount(data)).catch(() => {});
    api.get('/tenant/plan').then(({ data }) => setPlan(data)).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  return (
    <TenantContext.Provider value={{ igAccount, plan, setIgAccount, refresh: load }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
