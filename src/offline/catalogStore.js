import { getOfflineDb, STORE_NAMES } from './db.js'

export async function getCatalog(setId) {
  const db = await getOfflineDb()
  const row = await db.get(STORE_NAMES.catalogs, Number(setId))

  if (!row) {
    return {
      setId: Number(setId),
      categories: [],
      providers: [],
      updatedAt: null,
    }
  }

  return row
}

export async function upsertCatalog(setId, categories, providers) {
  const db = await getOfflineDb()
  const row = {
    setId: Number(setId),
    categories,
    providers,
    updatedAt: new Date().toISOString(),
  }
  await db.put(STORE_NAMES.catalogs, row)
  return row
}
