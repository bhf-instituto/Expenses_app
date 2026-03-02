/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, healthApi } from '../lib/apiClient.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';
import { clearCachedUser, getCachedUser, setCachedUser } from '../lib/localCache.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const restoreSession = async () => {
      if (!isOnline) {
        setUser(getCachedUser());
        setBooting(false);
        return;
      }

      try {
        const data = await healthApi.me();
        const nextUser = data?.user || null;
        setUser(nextUser);
        if (nextUser) {
          setCachedUser(nextUser);
        } else {
          clearCachedUser();
        }
      } catch {
        setUser(null);
        clearCachedUser();
      } finally {
        setBooting(false);
      }
    };

    restoreSession();
  }, [isOnline]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    const nextUser = data?.user || null;
    setUser(nextUser);
    if (nextUser) {
      setCachedUser(nextUser);
    }
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    const nextUser = data?.user || null;
    setUser(nextUser);
    if (nextUser) {
      setCachedUser(nextUser);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    if (isOnline) {
      try {
        await authApi.logout();
      } catch {
        // session cleanup still happens client-side
      }
    }
    setUser(null);
    clearCachedUser();
  }, [isOnline]);

  const value = useMemo(
    () => ({
      user,
      isOnline,
      booting,
      login,
      register,
      logout,
    }),
    [user, isOnline, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
