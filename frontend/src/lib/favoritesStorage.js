const GROUP_FAVORITES_KEY = 'expenses_mobile_favorite_groups_v1';
const CATEGORY_FAVORITES_KEY = 'expenses_mobile_favorite_categories_v1';
const STARTUP_GROUP_KEY = 'expenses_mobile_startup_group_v1';
const SCOPE_KEY_PREFIX = 'scope:';
const DEFAULT_SCOPE_KEY = `${SCOPE_KEY_PREFIX}global`;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const hasScopedEntries = (value) =>
  isObject(value) && Object.keys(value).some((key) => String(key).startsWith(SCOPE_KEY_PREFIX));

const normalizeScopeKey = (scope) => {
  const normalizedScope = String(scope || '').trim();
  return normalizedScope ? `${SCOPE_KEY_PREFIX}${normalizedScope}` : DEFAULT_SCOPE_KEY;
};

const normalizeGroupFavorite = (rawValue) => {
  if (Array.isArray(rawValue)) {
    const [first] = rawValue.map(Number).filter(Number.isInteger);
    return Number.isInteger(first) ? first : null;
  }

  const normalized = Number(rawValue);
  return Number.isInteger(normalized) ? normalized : null;
};

const readScopedGroupFavorites = () => {
  const raw = readJson(GROUP_FAVORITES_KEY, null);

  if (hasScopedEntries(raw)) {
    return raw;
  }

  const legacy = normalizeGroupFavorite(raw);
  if (legacy === null) {
    return {};
  }

  return {
    [DEFAULT_SCOPE_KEY]: legacy,
  };
};

const writeScopedGroupFavorites = (value) => {
  if (!isObject(value) || Object.keys(value).length === 0) {
    localStorage.removeItem(GROUP_FAVORITES_KEY);
    return;
  }
  writeJson(GROUP_FAVORITES_KEY, value);
};

export const getFavoriteGroupId = (scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedFavorites = readScopedGroupFavorites();
  const current = scopedFavorites[scopeKey];
  if (current !== undefined) {
    return normalizeGroupFavorite(current);
  }
  return normalizeGroupFavorite(scopedFavorites[DEFAULT_SCOPE_KEY]);
};

export const setFavoriteGroupId = (groupId, scope) => {
  const normalizedId = Number(groupId);
  const scopeKey = normalizeScopeKey(scope);
  const scopedFavorites = readScopedGroupFavorites();

  if (!Number.isInteger(normalizedId)) {
    const nextScopedFavorites = { ...scopedFavorites };
    delete nextScopedFavorites[scopeKey];
    writeScopedGroupFavorites(nextScopedFavorites);
    return null;
  }

  writeScopedGroupFavorites({
    ...scopedFavorites,
    [scopeKey]: normalizedId,
  });

  return normalizedId;
};

export const clearFavoriteGroup = (scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedFavorites = readScopedGroupFavorites();
  const nextScopedFavorites = { ...scopedFavorites };
  delete nextScopedFavorites[scopeKey];
  writeScopedGroupFavorites(nextScopedFavorites);
  return null;
};

export const toggleFavoriteGroup = (groupId, scope) => {
  const normalizedId = Number(groupId);
  if (!Number.isInteger(normalizedId)) return getFavoriteGroupId(scope);

  const current = getFavoriteGroupId(scope);
  if (current === normalizedId) {
    return clearFavoriteGroup(scope);
  }

  return setFavoriteGroupId(normalizedId, scope);
};

const normalizeStartupGroup = (raw) => {
  const normalized = Number(raw);
  return Number.isInteger(normalized) ? normalized : null;
};

const readScopedStartupGroups = () => {
  const raw = readJson(STARTUP_GROUP_KEY, null);

  if (hasScopedEntries(raw)) {
    return raw;
  }

  const legacy = normalizeStartupGroup(raw);
  if (legacy === null) {
    return {};
  }

  return {
    [DEFAULT_SCOPE_KEY]: legacy,
  };
};

const writeScopedStartupGroups = (value) => {
  if (!isObject(value) || Object.keys(value).length === 0) {
    localStorage.removeItem(STARTUP_GROUP_KEY);
    return;
  }
  writeJson(STARTUP_GROUP_KEY, value);
};

export const getStartupGroupId = (scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedStartupGroups = readScopedStartupGroups();
  if (scopedStartupGroups[scopeKey] !== undefined) {
    return normalizeStartupGroup(scopedStartupGroups[scopeKey]);
  }

  return normalizeStartupGroup(scopedStartupGroups[DEFAULT_SCOPE_KEY]);
};

export const setStartupGroupId = (groupId, scope) => {
  const normalizedId = Number(groupId);
  const scopeKey = normalizeScopeKey(scope);
  const scopedStartupGroups = readScopedStartupGroups();

  if (!Number.isInteger(normalizedId)) {
    const nextScopedStartupGroups = { ...scopedStartupGroups };
    delete nextScopedStartupGroups[scopeKey];
    writeScopedStartupGroups(nextScopedStartupGroups);
    return null;
  }

  writeScopedStartupGroups({
    ...scopedStartupGroups,
    [scopeKey]: normalizedId,
  });

  return normalizedId;
};

export const clearStartupGroup = (scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedStartupGroups = readScopedStartupGroups();
  const nextScopedStartupGroups = { ...scopedStartupGroups };
  delete nextScopedStartupGroups[scopeKey];
  writeScopedStartupGroups(nextScopedStartupGroups);
  return null;
};

const getScopedCategoryFavorites = () => {
  const raw = readJson(CATEGORY_FAVORITES_KEY, {});

  if (hasScopedEntries(raw)) {
    return raw;
  }

  if (isObject(raw) && Object.keys(raw).length > 0) {
    return {
      [DEFAULT_SCOPE_KEY]: raw,
    };
  }

  return {};
};

const categoryScopeKey = (setId, expenseTypeId) => `${Number(setId)}:${Number(expenseTypeId)}`;

const writeScopedCategoryFavorites = (value) => {
  if (!isObject(value) || Object.keys(value).length === 0) {
    localStorage.removeItem(CATEGORY_FAVORITES_KEY);
    return;
  }
  writeJson(CATEGORY_FAVORITES_KEY, value);
};

const getSessionCategoryFavorites = (scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedFavorites = getScopedCategoryFavorites();
  const scopedMap = scopedFavorites[scopeKey];

  if (isObject(scopedMap)) {
    return scopedMap;
  }

  const defaultMap = scopedFavorites[DEFAULT_SCOPE_KEY];
  return isObject(defaultMap) ? defaultMap : {};
};

export const getFavoriteCategoryIds = (setId, expenseTypeId, scope) => {
  const scopedFavorites = getSessionCategoryFavorites(scope);
  const scoped = scopedFavorites[categoryScopeKey(setId, expenseTypeId)] || [];
  return Array.isArray(scoped) ? scoped.map(Number).filter(Number.isInteger) : [];
};

export const toggleFavoriteCategory = (setId, expenseTypeId, categoryId, scope) => {
  const scopeKey = normalizeScopeKey(scope);
  const scopedFavorites = getScopedCategoryFavorites();
  const currentSessionFavorites = getSessionCategoryFavorites(scope);
  const categoryKey = categoryScopeKey(setId, expenseTypeId);
  const normalizedId = Number(categoryId);
  const current = getFavoriteCategoryIds(setId, expenseTypeId, scope);
  const next = current.includes(normalizedId)
    ? current.filter((id) => id !== normalizedId)
    : [...current, normalizedId];

  const nextSessionFavorites = {
    ...currentSessionFavorites,
    [categoryKey]: next,
  };

  writeScopedCategoryFavorites({
    ...scopedFavorites,
    [scopeKey]: nextSessionFavorites,
  });

  return next;
};

export const sortByFavorites = (items, isFavorite) => {
  const favorites = [];
  const regular = [];

  items.forEach((item) => {
    if (isFavorite(item)) {
      favorites.push(item);
    } else {
      regular.push(item);
    }
  });

  return [...favorites, ...regular];
};
