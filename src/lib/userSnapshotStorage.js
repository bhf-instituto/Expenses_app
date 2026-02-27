const USER_SNAPSHOT_KEY = 'expenses_user_snapshot'

function readSnapshot() {
  try {
    const raw = localStorage.getItem(USER_SNAPSHOT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeSnapshot(user) {
  try {
    localStorage.setItem(USER_SNAPSHOT_KEY, JSON.stringify(user))
  } catch {
    // no-op
  }
}

function clearSnapshot() {
  try {
    localStorage.removeItem(USER_SNAPSHOT_KEY)
  } catch {
    // no-op
  }
}

export const userSnapshotStorage = {
  get: readSnapshot,
  set: writeSnapshot,
  clear: clearSnapshot,
}
