const GROUP_FAVORITES_KEY = 'expenses_mobile_favorite_groups_v1';
const CATEGORY_FAVORITES_KEY = 'expenses_mobile_favorite_categories_v1';

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

export const getFavoriteGroupIds = () => {
  const ids = readJson(GROUP_FAVORITES_KEY, []);
  return Array.isArray(ids) ? ids.map(Number).filter(Number.isInteger) : [];
};

export const toggleFavoriteGroup = (groupId) => {
  const normalizedId = Number(groupId);
  const ids = getFavoriteGroupIds();
  const next = ids.includes(normalizedId)
    ? ids.filter((id) => id !== normalizedId)
    : [...ids, normalizedId];
  writeJson(GROUP_FAVORITES_KEY, next);
  return next;
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
