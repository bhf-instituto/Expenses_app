const SETS_CACHE_KEY = 'expenses_mobile_sets_v1';
const CATEGORIES_CACHE_KEY = 'expenses_mobile_categories_v1';
const SET_USERS_CACHE_KEY = 'expenses_mobile_set_users_v1';
const USER_CACHE_KEY = 'expenses_mobile_user_v1';
const SCOPE_KEY_PREFIX = 'scope:';
const DEFAULT_SCOPE_KEY = `${SCOPE_KEY_PREFIX}global`;
const ALL_EXPENSE_TYPES_KEY = 'all';

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

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const hasScopedEntries = (value) =>
  isObject(value) && Object.keys(value).some((key) => String(key).startsWith(SCOPE_KEY_PREFIX));

const normalizeScopeKey = (scope) => {
  const normalizedScope = String(scope || '').trim();
  return normalizedScope ? `${SCOPE_KEY_PREFIX}${normalizedScope}` : DEFAULT_SCOPE_KEY;
};

const readScopedRoot = (storageKey, legacyType) => {
  const legacyFallback = legacyType === 'array' ? [] : {};
  const raw = read(storageKey, legacyFallback);

  if (hasScopedEntries(raw)) {
    return raw;
  }

  if (legacyType === 'array' && Array.isArray(raw)) {
    return {
      [DEFAULT_SCOPE_KEY]: raw,
    };
  }

  if (legacyType === 'object' && isObject(raw)) {
    return {
      [DEFAULT_SCOPE_KEY]: raw,
    };
  }

  return {};
};

const readScopedValue = (storageKey, scope, legacyType, fallbackValue) => {
  const scopedRoot = readScopedRoot(storageKey, legacyType);
  const scopeKey = normalizeScopeKey(scope);
  const scopedValue = scopedRoot[scopeKey];

  if (scopedValue !== undefined) {
    return scopedValue;
  }

  const defaultScopedValue = scopedRoot[DEFAULT_SCOPE_KEY];
  if (defaultScopedValue !== undefined) {
    return defaultScopedValue;
  }

  return fallbackValue;
};

const writeScopedValue = (storageKey, scope, legacyType, scopedValue) => {
  const scopedRoot = readScopedRoot(storageKey, legacyType);
  const scopeKey = normalizeScopeKey(scope);
  const nextRoot = {
    ...scopedRoot,
    [scopeKey]: scopedValue,
  };

  write(storageKey, nextRoot);
};

const normalizeExpenseTypeKey = (expenseType) => {
  if (expenseType === undefined || expenseType === null || expenseType === '') {
    return ALL_EXPENSE_TYPES_KEY;
  }

  const normalizedType = Number(expenseType);
  return Number.isInteger(normalizedType) ? String(normalizedType) : String(expenseType);
};

export const getCachedUser = () => read(USER_CACHE_KEY, null);

export const setCachedUser = (user) => {
  write(USER_CACHE_KEY, user);
};

export const clearCachedUser = () => {
  localStorage.removeItem(USER_CACHE_KEY);
};

export const getCachedSets = (scope) => {
  const cachedSets = readScopedValue(SETS_CACHE_KEY, scope, 'array', []);
  return Array.isArray(cachedSets) ? cachedSets : [];
};

export const setCachedSets = (sets, scope) => {
  writeScopedValue(SETS_CACHE_KEY, scope, 'array', Array.isArray(sets) ? sets : []);
};

export const getCachedCategories = (setId, expenseType, scope) => {
  const scopedCategories = readScopedValue(CATEGORIES_CACHE_KEY, scope, 'object', {});
  if (!isObject(scopedCategories)) {
    return [];
  }

  const setCache = scopedCategories[String(setId)];
  if (!isObject(setCache)) {
    return [];
  }

  const categoryList = setCache[normalizeExpenseTypeKey(expenseType)];
  return Array.isArray(categoryList) ? categoryList : [];
};

export const setCachedCategories = (setId, expenseType, categories, scope) => {
  const scopedCategories = readScopedValue(CATEGORIES_CACHE_KEY, scope, 'object', {});
  const currentScopedCategories = isObject(scopedCategories) ? scopedCategories : {};
  const setKey = String(setId);
  const expenseTypeKey = normalizeExpenseTypeKey(expenseType);

  const nextScopedCategories = {
    ...currentScopedCategories,
    [setKey]: {
      ...(isObject(currentScopedCategories[setKey]) ? currentScopedCategories[setKey] : {}),
      [expenseTypeKey]: Array.isArray(categories) ? categories : [],
    },
  };

  writeScopedValue(CATEGORIES_CACHE_KEY, scope, 'object', nextScopedCategories);
};

export const getCachedSetUsers = (setId, scope) => {
  const scopedUsers = readScopedValue(SET_USERS_CACHE_KEY, scope, 'object', {});
  if (!isObject(scopedUsers)) {
    return [];
  }

  const users = scopedUsers[String(setId)];
  return Array.isArray(users) ? users : [];
};

export const setCachedSetUsers = (setId, users, scope) => {
  const scopedUsers = readScopedValue(SET_USERS_CACHE_KEY, scope, 'object', {});
  const currentScopedUsers = isObject(scopedUsers) ? scopedUsers : {};
  const nextScopedUsers = {
    ...currentScopedUsers,
    [String(setId)]: Array.isArray(users) ? users : [],
  };

  writeScopedValue(SET_USERS_CACHE_KEY, scope, 'object', nextScopedUsers);
};
