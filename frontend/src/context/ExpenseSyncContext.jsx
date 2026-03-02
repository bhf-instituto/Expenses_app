/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, expensesApi } from '../lib/apiClient.js';
import { enqueueExpense, getPendingExpenses, replaceQueue } from '../lib/offlineExpenseQueue.js';
import { useAuth } from './AuthContext.jsx';

const ExpenseSyncContext = createContext(null);

export const ExpenseSyncProvider = ({ children }) => {
  const { user, isOnline } = useAuth();
  const [pendingCount, setPendingCount] = useState(() => getPendingExpenses().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSummary, setLastSyncSummary] = useState('');
  const syncingRef = useRef(false);

  const queueExpense = useCallback(({ setId, payload }) => {
    enqueueExpense({ setId, payload });
    const nextCount = getPendingExpenses().length;
    setPendingCount(nextCount);
    return nextCount;
  }, []);

  const syncPendingExpenses = useCallback(async () => {
    if (!user || !isOnline || syncingRef.current) return;

    const queue = getPendingExpenses();
    setPendingCount(queue.length);

    if (queue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    let synced = 0;
    let dropped = 0;
    const remaining = [];

    for (const entry of queue) {
      try {
        await expensesApi.create(entry.setId, entry.payload);
        synced += 1;
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          dropped += 1;
        } else {
          remaining.push(entry);
        }
      }
    }

    replaceQueue(remaining);
    setPendingCount(remaining.length);

    if (synced > 0 || dropped > 0) {
      setLastSyncSummary(`Sincronizados: ${synced}. Descargados por error de validacion: ${dropped}.`);
    }

    setIsSyncing(false);
    syncingRef.current = false;
  }, [user, isOnline]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncPendingExpenses();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [syncPendingExpenses]);

  const value = useMemo(
    () => ({
      pendingCount,
      isSyncing,
      lastSyncSummary,
      queueExpense,
      syncPendingExpenses,
    }),
    [pendingCount, isSyncing, lastSyncSummary, queueExpense, syncPendingExpenses]
  );

  return <ExpenseSyncContext.Provider value={value}>{children}</ExpenseSyncContext.Provider>;
};

export const useExpenseSync = () => {
  const context = useContext(ExpenseSyncContext);
  if (!context) {
    throw new Error('useExpenseSync must be used inside ExpenseSyncProvider');
  }
  return context;
};
