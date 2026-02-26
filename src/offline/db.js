import { openDB } from 'idb'

const DB_NAME = 'expenses_app_offline'
const DB_VERSION = 1

export const STORE_NAMES = {
  expenses: 'expenses',
  syncState: 'sync_state',
  syncQueue: 'sync_queue',
  conflicts: 'conflicts',
  catalogs: 'catalogs',
}

let dbPromise = null

function createStores(db) {
  if (!db.objectStoreNames.contains(STORE_NAMES.expenses)) {
    const expenses = db.createObjectStore(STORE_NAMES.expenses, { keyPath: ['setId', 'id'] })
    expenses.createIndex('bySet', 'setId')
    expenses.createIndex('bySetUpdated', ['setId', 'updatedAt'])
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.syncState)) {
    db.createObjectStore(STORE_NAMES.syncState, { keyPath: 'setId' })
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.syncQueue)) {
    const queue = db.createObjectStore(STORE_NAMES.syncQueue, { keyPath: 'id' })
    queue.createIndex('bySet', 'setId')
    queue.createIndex('bySetStatus', ['setId', 'status'])
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.conflicts)) {
    const conflicts = db.createObjectStore(STORE_NAMES.conflicts, { keyPath: 'id' })
    conflicts.createIndex('bySet', 'setId')
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.catalogs)) {
    db.createObjectStore(STORE_NAMES.catalogs, { keyPath: 'setId' })
  }
}

export function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        createStores(db)
      },
    })
  }

  return dbPromise
}
