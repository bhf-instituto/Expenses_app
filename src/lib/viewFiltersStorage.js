const VIEW_FILTERS_KEY = 'expenses_view_filters_snapshot'

function readMap() {
  try {
    const raw = localStorage.getItem(VIEW_FILTERS_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(value) {
  try {
    localStorage.setItem(VIEW_FILTERS_KEY, JSON.stringify(value))
  } catch {
    // no-op
  }
}

function getBySet(setId) {
  const map = readMap()
  const key = String(setId ?? '')
  if (!key || !(key in map)) return null

  const row = map[key]
  return row && typeof row === 'object' ? row : null
}

function setBySet(setId, value) {
  const key = String(setId ?? '')
  if (!key) return

  const map = readMap()
  map[key] = {
    ...value,
    updatedAt: new Date().toISOString(),
  }
  writeMap(map)
}

function clearAll() {
  try {
    localStorage.removeItem(VIEW_FILTERS_KEY)
  } catch {
    // no-op
  }
}

export const viewFiltersStorage = {
  getBySet,
  setBySet,
  clear: clearAll,
}
