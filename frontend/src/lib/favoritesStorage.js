const GROUP_FAVORITES_KEY = 'expenses_mobile_favorite_groups_v1';
const CATEGORY_FAVORITES_KEY = 'expenses_mobile_favorite_categories_v1';
const STARTUP_GROUP_KEY = 'expenses_mobile_startup_group_v1';

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

const normalizeGroupFavorite = (rawValue) => {
  if (Array.isArray(rawValue)) {
    const [first] = rawValue.map(Number).filter(Number.isInteger);
    return Number.isInteger(first) ? first : null;
  }

  const normalized = Number(rawValue);
  return Number.isInteger(normalized) ? normalized : null;
};

export const getFavoriteGroupId = () => {
  const raw = readJson(GROUP_FAVORITES_KEY, null);
  return normalizeGroupFavorite(raw);
};

export const setFavoriteGroupId = (groupId) => {
  const normalizedId = Number(groupId);
  if (!Number.isInteger(normalizedId)) {
    localStorage.removeItem(GROUP_FAVORITES_KEY);
    return null;
  }
  writeJson(GROUP_FAVORITES_KEY, normalizedId);
  return normalizedId;
};

export const clearFavoriteGroup = () => {
  localStorage.removeItem(GROUP_FAVORITES_KEY);
  return null;
};

export const toggleFavoriteGroup = (groupId) => {
  const normalizedId = Number(groupId);
  if (!Number.isInteger(normalizedId)) return getFavoriteGroupId();

  const current = getFavoriteGroupId();
  if (current === normalizedId) {
    return clearFavoriteGroup();
  }

  return setFavoriteGroupId(normalizedId);
};

export const getStartupGroupId = () => {
  const raw = readJson(STARTUP_GROUP_KEY, null);
  const normalized = Number(raw);
  return Number.isInteger(normalized) ? normalized : null;
};

export const setStartupGroupId = (groupId) => {
  const normalizedId = Number(groupId);
  if (!Number.isInteger(normalizedId)) {
    localStorage.removeItem(STARTUP_GROUP_KEY);
    return null;
  }
  writeJson(STARTUP_GROUP_KEY, normalizedId);
  return normalizedId;
};

export const clearStartupGroup = () => {
  localStorage.removeItem(STARTUP_GROUP_KEY);
  return null;
};

const getCategoryFavoritesMap = () => {
  const map = readJson(CATEGORY_FAVORITES_KEY, {});
  return map && typeof map === 'object' ? map : {};
};

const categoryScopeKey = (setId, expenseTypeId) => `${Number(setId)}:${Number(expenseTypeId)}`;

export const getFavoriteCategoryIds = (setId, expenseTypeId) => {
  const map = getCategoryFavoritesMap();
  const scoped = map[categoryScopeKey(setId, expenseTypeId)] || [];
  return Array.isArray(scoped) ? scoped.map(Number).filter(Number.isInteger) : [];
};

export const toggleFavoriteCategory = (setId, expenseTypeId, categoryId) => {
  const map = getCategoryFavoritesMap();
  const scope = categoryScopeKey(setId, expenseTypeId);
  const normalizedId = Number(categoryId);
  const current = getFavoriteCategoryIds(setId, expenseTypeId);
  const next = current.includes(normalizedId)
    ? current.filter((id) => id !== normalizedId)
    : [...current, normalizedId];

  const nextMap = {
    ...map,
    [scope]: next,
  };
  writeJson(CATEGORY_FAVORITES_KEY, nextMap);
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
