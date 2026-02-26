import { API_PATHS } from '../config/api.js'
import { ensureApiOk, pickArray, pickFirst } from '../lib/apiResult.js'
import { httpClient } from '../lib/httpClient.js'

function normalizeSet(raw) {
  return {
    id: Number(raw?.id),
    name: String(raw?.name ?? ''),
    role: raw?.role === undefined || raw?.role === null ? null : Number(raw.role),
  }
}

export async function listSets() {
  const { data } = await httpClient.get(API_PATHS.sets)
  const payload = ensureApiOk(data)
  const sets = pickArray(payload, ['sets', 'data.sets', 'data'])
  return sets.map(normalizeSet).filter((item) => Number.isInteger(item.id))
}

export async function createSet(setName) {
  const { data } = await httpClient.post(API_PATHS.sets, { set_name: setName })
  const payload = ensureApiOk(data)
  const rawSet = pickFirst(payload, ['data.set', 'set'], null)

  if (!rawSet) {
    return null
  }

  return normalizeSet(rawSet)
}
