/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, healthApi, profileApi } from '../lib/apiClient.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';
import { clearCachedUser, getCachedUser, setCachedUser } from '../lib/localCache.js';
import { clearStoredTokens, setStoredTokens } from '../lib/tokenStorage.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import {
  applyUiColorSettingsToDocument,
  getScopedUiColorSettings,
  setScopedUiColorSettings,
} from '../lib/uiColorSettings.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const onlineStatus = useOnlineStatus();
  const isOnline = Boolean(onlineStatus?.isOnline);

  const applyCachedUiColors = useCallback((targetUser) => {
    const scope = resolveSessionScope(targetUser);
    applyUiColorSettingsToDocument(getScopedUiColorSettings(scope));
  }, []);

  const hydrateUiColorsFromServer = useCallback(async (targetUser) => {
    const scope = resolveSessionScope(targetUser);
    try {
      const data = await profileApi.getColorProfile();
      const serverSettings = data?.profile?.settings;
      if (serverSettings && typeof serverSettings === 'object') {
        const normalized = setScopedUiColorSettings(serverSettings, scope);
        applyUiColorSettingsToDocument(normalized);
        return;
      }
    } catch {
      // fall back to cache when request fails
    }
    applyUiColorSettingsToDocument(getScopedUiColorSettings(scope));
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const cachedUser = getCachedUser();

      if (!isOnline) {
        setUser(cachedUser);
        applyCachedUiColors(cachedUser);
        setBooting(false);
        return;
      }

      try {
        const data = await healthApi.me();
        const nextUser = data?.user || null;
        setUser(nextUser);
        if (nextUser) {
          setCachedUser(nextUser);
          await hydrateUiColorsFromServer(nextUser);
        } else {
          clearCachedUser();
          clearStoredTokens();
          applyCachedUiColors(null);
        }
      } catch {
        if (cachedUser) {
          setUser(cachedUser);
          applyCachedUiColors(cachedUser);
        } else {
          setUser(null);
          clearCachedUser();
          clearStoredTokens();
          applyCachedUiColors(null);
        }
      } finally {
        setBooting(false);
      }
    };

    restoreSession();
  }, [applyCachedUiColors, hydrateUiColorsFromServer, isOnline]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    const nextUser = data?.user || null;
    setUser(nextUser);
    if (nextUser) {
      setCachedUser(nextUser);
    }
    if (data?.access_token || data?.refresh_token) {
      setStoredTokens({
        accessToken: data?.access_token || '',
        refreshToken: data?.refresh_token || '',
      });
    }
    if (nextUser) {
      if (isOnline) {
        await hydrateUiColorsFromServer(nextUser);
      } else {
        applyCachedUiColors(nextUser);
      }
    } else {
      applyCachedUiColors(null);
    }
    return data;
  }, [applyCachedUiColors, hydrateUiColorsFromServer, isOnline]);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    const nextUser = data?.user || null;
    setUser(nextUser);
    if (nextUser) {
      setCachedUser(nextUser);
    }
    if (data?.access_token || data?.refresh_token) {
      setStoredTokens({
        accessToken: data?.access_token || '',
        refreshToken: data?.refresh_token || '',
      });
    }
    if (nextUser) {
      if (isOnline) {
        await hydrateUiColorsFromServer(nextUser);
      } else {
        applyCachedUiColors(nextUser);
      }
    } else {
      applyCachedUiColors(null);
    }
    return data;
  }, [applyCachedUiColors, hydrateUiColorsFromServer, isOnline]);

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
    clearStoredTokens();
    applyCachedUiColors(null);
  }, [applyCachedUiColors, isOnline]);

  const value = useMemo(
    () => ({
      user,
      isOnline,
      connectionDebug: {
        browserOnline: Boolean(onlineStatus?.browserOnline),
        backendReachable: Boolean(onlineStatus?.backendReachable),
        lastCheckedAt: Number(onlineStatus?.lastCheckedAt || 0) || null,
      },
      booting,
      login,
      register,
      logout,
    }),
    [user, isOnline, onlineStatus?.backendReachable, onlineStatus?.browserOnline, onlineStatus?.lastCheckedAt, booting, login, register, logout]
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
