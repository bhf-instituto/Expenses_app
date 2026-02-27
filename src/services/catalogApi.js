import { API_PATHS } from '../config/api.js'
import { ensureApiOk, pickArray } from '../lib/apiResult.js'
import { httpClient } from '../lib/httpClient.js'

function normalizeCategory(raw) {
  return {
    id: Number(raw?.id),
    name: String(raw?.name ?? ''),
    expenseType: Number(raw?.expense_type),
  }
}

function normalizeProvider(raw) {
  return {
    id: Number(raw?.id),
    name: String(raw?.name ?? ''),
    contactName: raw?.contact_name ?? null,
    phone: raw?.phone ?? null,
  }
}

export async function listCategories(setId, expenseType = null) {
  const params = {}

  if (expenseType !== null && expenseType !== undefined) {
    params.expense_type = expenseType
  }

  const { data } = await httpClient.get(`${API_PATHS.sets}/${setId}/categories`, { params })
  const payload = ensureApiOk(data)
  const categories = pickArray(payload, ['categories', 'data.categories', 'data'])

  return categories
    .map(normalizeCategory)
    .filter((category) => Number.isInteger(category.id))
}

export async function listProviders(setId) {
  const { data } = await httpClient.get(`${API_PATHS.sets}/${setId}/providers`)
  const payload = ensureApiOk(data)
  const providers = pickArray(payload, ['result', 'providers', 'data.providers', 'data'])

  return providers
    .map(normalizeProvider)
    .filter((provider) => Number.isInteger(provider.id))
}

export async function createCategory(setId, payload) {
  const requestPayload = {
    category_name: String(payload.categoryName ?? '').trim(),
    expense_type: Number(payload.expenseType),
  }

  const { data } = await httpClient.post(`${API_PATHS.sets}/${setId}/categories`, requestPayload)
  return ensureApiOk(data)
}

export async function createProvider(setId, payload) {
  const requestPayload = {
    name: String(payload.name ?? '').trim(),
    contactName: payload.contactName ? String(payload.contactName).trim() : '',
    contact_name: payload.contactName ? String(payload.contactName).trim() : '',
    phone: payload.phone ? String(payload.phone).trim() : '',
  }

  const { data } = await httpClient.post(`${API_PATHS.sets}/${setId}/providers`, requestPayload)
  return ensureApiOk(data)
}
