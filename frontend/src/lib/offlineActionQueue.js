const OFFLINE_ACTION_QUEUE_KEY = 'expenses_mobile_offline_actions_v1';
const LEGACY_OFFLINE_EXPENSE_QUEUE_KEY = 'expenses_mobile_offline_queue_v1';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeAction = (action) => {
  if (!action || typeof action !== 'object') return null;
  const type = String(action.type || '').trim();
  if (!type) return null;

  const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};
  const queuedAt = action.queuedAt || new Date().toISOString();
  const id = action.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return { id, type, payload, queuedAt };
};

const readActionQueue = () => {
  const raw = readJson(OFFLINE_ACTION_QUEUE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeAction).filter(Boolean);
};

const readLegacyExpenseQueue = () => {
  const raw = readJson(LEGACY_OFFLINE_EXPENSE_QUEUE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      return normalizeAction({
        id: entry.id,
        type: 'expense.create',
        payload: {
          setId: Number(entry.setId),
          payload: entry.payload || {},
        },
        queuedAt: entry.queuedAt,
      });
    })
    .filter(Boolean);
};

const migrateLegacyQueueIfNeeded = () => {
  const currentQueue = readActionQueue();
  if (currentQueue.length > 0) {
    return currentQueue;
  }

  const legacyQueue = readLegacyExpenseQueue();
  if (legacyQueue.length === 0) {
    return currentQueue;
  }

  writeJson(OFFLINE_ACTION_QUEUE_KEY, legacyQueue);
  localStorage.removeItem(LEGACY_OFFLINE_EXPENSE_QUEUE_KEY);
  return legacyQueue;
};

export const getPendingActions = () => migrateLegacyQueueIfNeeded();

export const enqueueAction = ({ type, payload }) => {
  const queue = getPendingActions();
  const entry = normalizeAction({ type, payload });
  if (!entry) return null;
  queue.push(entry);
  writeJson(OFFLINE_ACTION_QUEUE_KEY, queue);
  return entry;
};

export const replaceActionQueue = (queue) => {
  if (!Array.isArray(queue)) {
    writeJson(OFFLINE_ACTION_QUEUE_KEY, []);
    return;
  }
  writeJson(
    OFFLINE_ACTION_QUEUE_KEY,
    queue.map(normalizeAction).filter(Boolean)
  );
};
