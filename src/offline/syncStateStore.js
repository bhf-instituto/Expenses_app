import { getOfflineDb, STORE_NAMES } from './db.js'

const DEFAULT_SYNC_STATE = {
  updatedAfter: null,
  deletedAfter: null,
  downloadedAt: null,
  lastSyncAt: null,
}

export async function getSyncState(setId) {
  const db = await getOfflineDb()
  const state = await db.get(STORE_NAMES.syncState, Number(setId))

  return {
    setId: Number(setId),
    ...DEFAULT_SYNC_STATE,
    ...(state ?? {}),
  }
}

export async function upsertSyncState(setId, partialState) {
  const current = await getSyncState(setId)
  const db = await getOfflineDb()

  const nextState = {
    ...current,
    ...partialState,
    setId: Number(setId),
  }

  await db.put(STORE_NAMES.syncState, nextState)
  return nextState
}
