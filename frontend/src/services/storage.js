const KEYS = {
  AUTH: 'expenses_auth',
  OFFLINE_QUEUE: 'expenses_offline_queue'
};

export const storage = {
  getAuth() {
    return JSON.parse(localStorage.getItem(KEYS.AUTH) || 'null');
  },
  setAuth(payload) {
    localStorage.setItem(KEYS.AUTH, JSON.stringify(payload));
  },
  clearAuth() {
    localStorage.removeItem(KEYS.AUTH);
  },
  getOfflineQueue() {
    return JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]');
  },
  setOfflineQueue(queue) {
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  }
};
