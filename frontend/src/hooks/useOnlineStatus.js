import { useEffect, useState } from 'react';

const PROBE_PATH = '/health/db';
const PROBE_TIMEOUT_MS = 3500;
const PROBE_INTERVAL_MS = 15000;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

const resolveProbeUrl = () => {
  const baseUrl = API_BASE_URL || window.location.origin;
  return new URL(PROBE_PATH, baseUrl).toString();
};

const probeBackendReachability = async () => {
  if (!navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(resolveProbeUrl(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
};

export default function useOnlineStatus() {
  const [status, setStatus] = useState(() => ({
    isOnline: navigator.onLine,
    browserOnline: navigator.onLine,
    backendReachable: navigator.onLine,
    lastCheckedAt: null,
  }));

  useEffect(() => {
    let cancelled = false;

    const syncOnlineState = async () => {
      const browserOnline = navigator.onLine;
      const reachable = await probeBackendReachability();
      if (!cancelled) {
        setStatus((prev) => ({
          ...prev,
          isOnline: reachable,
          browserOnline,
          backendReachable: reachable,
          lastCheckedAt: Date.now(),
        }));
      }
    };

    const goOnline = () => {
      void syncOnlineState();
    };

    const goOffline = () =>
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        browserOnline: false,
        backendReachable: false,
        lastCheckedAt: Date.now(),
      }));
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncOnlineState();
      }
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncOnlineState();
      }
    }, PROBE_INTERVAL_MS);

    void syncOnlineState();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return status;
}
