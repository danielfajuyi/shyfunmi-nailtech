import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [site, setSite] = useState(null);
  const [user, setUser] = useState(undefined); // undefined = still loading, null = signed out

  const reload = useCallback(() => api.get('/api/public').then(setSite)
    .catch(() => setSite((p) => p || { settings: { hours: {}, blockedDates: [] }, services: [], photos: [], reviews: [] })), []);

  useEffect(() => {
    reload();
    api.get('/api/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null));
  }, [reload]);

  const logout = async () => { await api.post('/api/auth/logout').catch(() => {}); setUser(null); };
  return <Ctx.Provider value={{ site, reload, user, setUser, logout }}>{children}</Ctx.Provider>;
}
