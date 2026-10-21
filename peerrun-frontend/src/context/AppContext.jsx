import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';
import { connectRealtime } from '../realtime';
import { PLACES } from '../utils';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!localStorage.getItem('pr_token'));
  const [loc, setLoc] = useState(PLACES[0]); // where the user is, used for browsing
  const [toasts, setToasts] = useState([]);
  const [tick, setTick] = useState(0); // bump to make pages refetch

  const toast = useCallback((msg, kind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('pr_token')) return;
    api.getMe().then(setUser).catch(() => localStorage.removeItem('pr_token')).finally(() => setBooting(false));
  }, []);

  // Real-time: the requester hears about accepted / in-progress / completed instantly
  useEffect(() => {
    if (!user) return;
    return connectRealtime(localStorage.getItem('pr_token'), (event, p) => {
      setTick((t) => t + 1);
      if (p.requesterId && p.requesterId !== user._id) return;
      toast(event === 'errand:accepted' ? `${p.runnerName} accepted "${p.title}"` : `"${p.title}" is now ${p.status}`, 'live');
    });
  }, [user, toast]);

  const auth = ({ user, token }) => { localStorage.setItem('pr_token', token); setUser(user); };
  const logout = () => { localStorage.removeItem('pr_token'); setUser(null); };
  const refresh = () => setTick((t) => t + 1);

  return (
    <Ctx.Provider value={{ user, booting, auth, logout, loc, setLoc, toasts, toast, tick, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
