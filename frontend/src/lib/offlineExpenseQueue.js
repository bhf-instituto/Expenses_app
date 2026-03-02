const OFFLINE_EXPENSE_QUEUE_KEY = 'expenses_mobile_offline_queue_v1';

const readQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_EXPENSE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  localStorage.setItem(OFFLINE_EXPENSE_QUEUE_KEY, JSON.stringify(queue));
};

export const getPendingExpenses = () => readQueue();

export const enqueueExpense = ({ setId, payload }) => {
  const queue = readQueue();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    setId: Number(setId),
    payload,
    queuedAt: new Date().toISOString(),
  };
  queue.push(entry);
  writeQueue(queue);
  return entry;
};

export const replaceQueue = (queue) => {
  writeQueue(queue);
};
