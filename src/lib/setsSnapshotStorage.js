const SETS_SNAPSHOT_KEY = 'expenses_sets_snapshot'

function normalizeSet(raw) {
  return {
    id: Number(raw?.id),
    name: String(raw?.name ?? ''),
    role: raw?.role === undefined || raw?.role === null ? null : Number(raw.role),
  }
}

function normalizeSnapshot(rawSnapshot) {
  if (!rawSnapshot || typeof rawSnapshot !== 'object') return null

  const sets = Array.isArray(rawSnapshot.sets)
    ? rawSnapshot.sets.map(normalizeSet).filter((item) => Number.isInteger(item.id))
    : []

  if (sets.length === 0) return null

  const requestedActive = String(rawSnapshot.activeSetId ?? '')
  const hasRequestedActive = sets.some((item) => String(item.id) === requestedActive)
  const activeSetId = hasRequestedActive ? requestedActive : String(sets[0].id)

  return {
    sets,
    activeSetId,
    updatedAt: String(rawSnapshot.updatedAt ?? ''),
  }
}

function readSnapshot() {
  try {
    const raw = localStorage.getItem(SETS_SNAPSHOT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return normalizeSnapshot(parsed)
  } catch {
    return null
  }
}

function writeSnapshot(snapshot) {
  try {
    const normalized = normalizeSnapshot(snapshot)

    if (!normalized) {
      localStorage.removeItem(SETS_SNAPSHOT_KEY)
      return
    }

    localStorage.setItem(
      SETS_SNAPSHOT_KEY,
      JSON.stringify({
        sets: normalized.sets,
        activeSetId: normalized.activeSetId,
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // no-op
  }
}

function clearSnapshot() {
  try {
    localStorage.removeItem(SETS_SNAPSHOT_KEY)
  } catch {
    // no-op
  }
}

export const setsSnapshotStorage = {
  get: readSnapshot,
  set: writeSnapshot,
  clear: clearSnapshot,
}
