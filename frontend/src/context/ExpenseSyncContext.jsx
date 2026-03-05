/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, categoriesApi, expensesApi, incomesApi, setsApi } from '../lib/apiClient.js';
import { enqueueAction, getPendingActions, replaceActionQueue } from '../lib/offlineActionQueue.js';
import { useAuth } from './AuthContext.jsx';

const ExpenseSyncContext = createContext(null);

const replaceSetIdReferences = (queue, tempId, realId) =>
  queue.map((entry) => {
    const next = {
      ...entry,
      payload: { ...(entry.payload || {}) },
    };

    if (Number(next.payload.setId) === Number(tempId)) {
      next.payload.setId = Number(realId);
    }

    if (next.type === 'expense.create' && Number(next.payload.setId) === Number(tempId)) {
      next.payload.setId = Number(realId);
    }

    return next;
  });

const replaceCategoryIdReferences = (queue, tempId, realId) =>
  queue.map((entry) => {
    const next = {
      ...entry,
      payload: { ...(entry.payload || {}) },
    };

    if (Number(next.payload.categoryId) === Number(tempId)) {
      next.payload.categoryId = Number(realId);
    }

    if (next.type === 'expense.create') {
      const expensePayload = {
        ...(next.payload?.payload || {}),
      };
      if (Number(expensePayload.category_id) === Number(tempId)) {
        expensePayload.category_id = Number(realId);
      }
      next.payload.payload = expensePayload;
    }

    return next;
  });

const replaceExpenseIdReferences = (queue, tempId, realId) =>
  queue.map((entry) => {
    const next = {
      ...entry,
      payload: { ...(entry.payload || {}) },
    };

    if (Number(next.payload.expenseId) === Number(tempId)) {
      next.payload.expenseId = Number(realId);
    }

    return next;
  });

const processAction = async (entry) => {
  const payload = entry.payload || {};

  switch (entry.type) {
    case 'set.create': {
      const data = await setsApi.create({ set_name: payload.set_name });
      return {
        entity: 'set',
        tempId: Number(payload.tempId),
        realId: Number(data?.set?.id),
      };
    }

    case 'set.update':
      await setsApi.update(payload.setId, { set_name: payload.set_name });
      return null;

    case 'set.delete':
      await setsApi.delete(payload.setId);
      return null;

    case 'category.create': {
      const data = await categoriesApi.create(payload.setId, {
        category_name: payload.category_name,
        expense_type: payload.expense_type,
      });
      return {
        entity: 'category',
        tempId: Number(payload.tempCategoryId),
        realId: Number(data?.category_id),
      };
    }

    case 'category.update':
      await categoriesApi.update(payload.categoryId, {
        category_name: payload.category_name,
        expense_type: payload.expense_type,
      });
      return null;

    case 'category.delete':
      await categoriesApi.delete(payload.categoryId);
      return null;

    case 'expense.create': {
      const data = await expensesApi.create(payload.setId, payload.payload);
      return {
        entity: 'expense',
        tempId: Number(payload.tempExpenseId),
        realId: Number(data?.id),
      };
    }

    case 'income.create':
      await incomesApi.create(payload.setId, payload.payload);
      return null;

    case 'expense.update':
      await expensesApi.update(payload.expenseId, payload.payload);
      return null;

    case 'expense.delete':
      await expensesApi.delete(payload.expenseId);
      return null;

    case 'set.user.remove':
      await setsApi.removeUser(payload.setId, payload.userId, {
        delete_expenses: Boolean(payload.deleteExpenses),
      });
      return null;

    default:
      return null;
  }
};

export const ExpenseSyncProvider = ({ children }) => {
  const { user, isOnline } = useAuth();
  const [pendingActions, setPendingActions] = useState(() => getPendingActions());
  const syncingRef = useRef(false);

  const queueAction = useCallback(({ type, payload }) => {
    enqueueAction({ type, payload });
    const nextQueue = getPendingActions();
    setPendingActions(nextQueue);
    return nextQueue.length;
  }, []);

  const queueExpense = useCallback(
    ({ setId, payload, tempExpenseId = null }) =>
      queueAction({
        type: 'expense.create',
        payload: {
          setId: Number(setId),
          payload,
          tempExpenseId: tempExpenseId !== null ? Number(tempExpenseId) : null,
        },
      }),
    [queueAction]
  );

  const removePendingAction = useCallback((actionId) => {
    const normalizedId = String(actionId || '').trim();
    if (!normalizedId) return;
    const queue = getPendingActions();
    const nextQueue = queue.filter((entry) => String(entry.id) !== normalizedId);
    replaceActionQueue(nextQueue);
    setPendingActions(nextQueue);
  }, []);

  const updatePendingAction = useCallback((actionId, nextAction) => {
    const normalizedId = String(actionId || '').trim();
    if (!normalizedId) return null;

    const queue = getPendingActions();
    let updatedEntry = null;

    const nextQueue = queue.map((entry) => {
      if (String(entry.id) !== normalizedId) return entry;

      const nextType = String(nextAction?.type || entry.type || '').trim();
      const nextPayload =
        nextAction && typeof nextAction.payload === 'object' && nextAction.payload
          ? nextAction.payload
          : entry.payload;

      updatedEntry = {
        ...entry,
        type: nextType || entry.type,
        payload: nextPayload,
      };

      return updatedEntry;
    });

    replaceActionQueue(nextQueue);
    setPendingActions(nextQueue);
    return updatedEntry;
  }, []);

  const syncPendingExpenses = useCallback(async () => {
    if (!user || !isOnline || syncingRef.current) return;

    const queue = getPendingActions();
    setPendingActions(queue);

    if (queue.length === 0) return;

    syncingRef.current = true;
    let cursor = 0;

    while (cursor < queue.length) {
      const entry = queue[cursor];
      try {
        const result = await processAction(entry);

        queue.splice(cursor, 1);

        if (result?.entity === 'set' && Number.isInteger(result.tempId) && Number.isInteger(result.realId)) {
          const patched = replaceSetIdReferences(queue, result.tempId, result.realId);
          queue.splice(0, queue.length, ...patched);
        }

        if (
          result?.entity === 'category' &&
          Number.isInteger(result.tempId) &&
          Number.isInteger(result.realId)
        ) {
          const patched = replaceCategoryIdReferences(queue, result.tempId, result.realId);
          queue.splice(0, queue.length, ...patched);
        }

        if (
          result?.entity === 'expense' &&
          Number.isInteger(result.tempId) &&
          Number.isInteger(result.realId)
        ) {
          const patched = replaceExpenseIdReferences(queue, result.tempId, result.realId);
          queue.splice(0, queue.length, ...patched);
        }

        replaceActionQueue(queue);
        setPendingActions([...queue]);
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          queue.splice(cursor, 1);
          replaceActionQueue(queue);
          setPendingActions([...queue]);
        } else {
          cursor += 1;
        }
      }
    }

    replaceActionQueue(queue);
    setPendingActions([...queue]);
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
      pendingCount: pendingActions.length,
      pendingActions,
      queueAction,
      queueExpense,
      removePendingAction,
      updatePendingAction,
      syncPendingExpenses,
    }),
    [pendingActions, queueAction, queueExpense, removePendingAction, updatePendingAction, syncPendingExpenses]
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
