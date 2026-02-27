import { listSets } from '../services/setsApi.js'
import { setsSnapshotStorage } from './setsSnapshotStorage.js'

function normalizeActiveSetId(sets, activeSetId) {
  if (!Array.isArray(sets) || sets.length === 0) return ''

  const requested = String(activeSetId ?? '')
  const hasRequested = sets.some((setItem) => String(setItem.id) === requested)
  return hasRequested ? requested : String(sets[0].id)
}

export async function loadSetsForFlow(activeSetId = '') {
  try {
    const sets = await listSets()
    const nextActiveSetId = normalizeActiveSetId(sets, activeSetId)

    if (sets.length === 0) {
      setsSnapshotStorage.clear()
    } else {
      setsSnapshotStorage.set({ sets, activeSetId: nextActiveSetId })
    }

    return {
      sets,
      activeSetId: nextActiveSetId,
      fromCache: false,
    }
  } catch (error) {
    const cached = setsSnapshotStorage.get()

    if (!error?.response && cached?.sets?.length) {
      return {
        sets: cached.sets,
        activeSetId: cached.activeSetId,
        fromCache: true,
      }
    }

    throw error
  }
}

export function persistActiveSet(sets, activeSetId) {
  if (!Array.isArray(sets) || sets.length === 0) {
    setsSnapshotStorage.clear()
    return ''
  }

  const nextActiveSetId = normalizeActiveSetId(sets, activeSetId)
  setsSnapshotStorage.set({ sets, activeSetId: nextActiveSetId })
  return nextActiveSetId
}

export function getSetNameFromSnapshot(setId) {
  const snapshot = setsSnapshotStorage.get()
  if (!snapshot?.sets?.length) return ''

  const current = snapshot.sets.find((item) => Number(item.id) === Number(setId))
  return current?.name ?? ''
}
