import { getOfflineDb, STORE_NAMES } from './db.js'

export const QUEUE_STATUS = {
  PENDING: 'pending',
  CONFLICT: 'conflict',
}

function sortByDateAsc(items) {
  return [...items].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
}

export async function listQueueItemsBySet(setId) {
  const db = await getOfflineDb()
  const items = await db.getAllFromIndex(STORE_NAMES.syncQueue, 'bySet', Number(setId))
  return sortByDateAsc(items)
}

export async function listPendingQueueItemsBySet(setId) {
  const db = await getOfflineDb()
  const items = await db.getAllFromIndex(
    STORE_NAMES.syncQueue,
    'bySetStatus',
    [Number(setId), QUEUE_STATUS.PENDING],
  )
  return sortByDateAsc(items)
}

export async function putQueueItem(item) {
  const db = await getOfflineDb()
  await db.put(STORE_NAMES.syncQueue, item)
}

export async function deleteQueueItem(queueItemId) {
  const db = await getOfflineDb()
  await db.delete(STORE_NAMES.syncQueue, queueItemId)
}

export async function listConflictsBySet(setId) {
  const db = await getOfflineDb()
  const rows = await db.getAllFromIndex(STORE_NAMES.conflicts, 'bySet', Number(setId))
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function addConflict(conflict) {
  const db = await getOfflineDb()
  await db.put(STORE_NAMES.conflicts, conflict)
}

export async function deleteConflict(conflictId) {
  const db = await getOfflineDb()
  await db.delete(STORE_NAMES.conflicts, conflictId)
}
