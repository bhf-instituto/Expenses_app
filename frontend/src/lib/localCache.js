const SETS_CACHE_KEY = 'expenses_mobile_sets_v1';
const CATEGORIES_CACHE_KEY = 'expenses_mobile_categories_v1';
const SET_USERS_CACHE_KEY = 'expenses_mobile_set_users_v1';
const USER_CACHE_KEY = 'expenses_mobile_user_v1';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getCachedUser = () => read(USER_CACHE_KEY, null);

export const setCachedUser = (user) => {
  write(USER_CACHE_KEY, user);
};

export const clearCachedUser = () => {
  localStorage.removeItem(USER_CACHE_KEY);
};

export const getCachedSets = () => read(SETS_CACHE_KEY, []);

export const setCachedSets = (sets) => {
  write(SETS_CACHE_KEY, sets);
};

export const getCachedCategories = (setId, expenseType) => {
  const cache = read(CATEGORIES_CACHE_KEY, {});
  return cache?.[setId]?.[expenseType] || [];
};

export const setCachedCategories = (setId, expenseType, categories) => {
  const cache = read(CATEGORIES_CACHE_KEY, {});
  const nextCache = {
    ...cache,
    [setId]: {
      ...(cache[setId] || {}),
      [expenseType]: categories,
    },
  };

  write(CATEGORIES_CACHE_KEY, nextCache);
};

export const getCachedSetUsers = (setId) => {
  const cache = read(SET_USERS_CACHE_KEY, {});
  return cache?.[setId] || [];
};

export const setCachedSetUsers = (setId, users) => {
  const cache = read(SET_USERS_CACHE_KEY, {});
  const nextCache = {
    ...cache,
    [setId]: users,
  };
  write(SET_USERS_CACHE_KEY, nextCache);
};
