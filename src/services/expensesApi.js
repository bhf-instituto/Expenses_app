import { API_PATHS } from '../config/api.js'
import { ensureApiOk, pickArray, pickFirst } from '../lib/apiResult.js'
import { httpClient } from '../lib/httpClient.js'

export function normalizeExpense(raw, setId) {
  return {
    setId: Number(setId),
    id: Number(raw?.id),
    amount: Number(raw?.amount),
    description: raw?.description ?? '',
    expenseDate: raw?.expense_date ?? '',
    expenseType: Number(raw?.expense_type),
    userId: Number(raw?.user_id),
    userEmail: raw?.user_email ?? '',
    categoryId: Number(raw?.category_id),
    categoryName: raw?.category_name ?? '',
    providerId:
      raw?.provider_id === null || raw?.provider_id === undefined
        ? null
        : Number(raw.provider_id),
    providerName: raw?.provider_name ?? null,
    updatedAt: raw?.updated_at ?? new Date().toISOString(),
    localStatus: 'synced',
    isLocalOnly: false,
  }
}

export async function listExpenses(setId, options = {}) {
  const params = {}

  if (options.updatedAfter) params.updated_after = options.updatedAfter
  if (options.page) params.page = options.page
  if (options.limit) params.limit = options.limit
  if (options.categoryId) params.category_id = options.categoryId
  if (options.expenseType) params.expense_type = options.expenseType
  if (options.userId) params.user_id = options.userId
  if (options.fromDate) params.from_date = options.fromDate
  if (options.toDate) params.to_date = options.toDate

  const { data } = await httpClient.get(`${API_PATHS.sets}/${setId}/expenses`, { params })
  const payload = ensureApiOk(data)
  const rows = pickArray(payload, ['data', 'expenses', 'result'])

  return rows
    .map((row) => normalizeExpense(row, setId))
    .filter((expense) => Number.isInteger(expense.id))
}

export async function listDeletedExpenses(setId, options = {}) {
  const params = {}

  if (options.deletedAfter) params.deleted_after = options.deletedAfter
  if (options.page) params.page = options.page
  if (options.limit) params.limit = options.limit

  const { data } = await httpClient.get(`${API_PATHS.sets}/${setId}/expenses/deleted`, { params })
  const payload = ensureApiOk(data)
  const rows = pickArray(payload, ['data', 'deleted', 'result'])

  return rows
    .map((row) => ({
      setId: Number(row?.set_id ?? setId),
      expenseId: Number(row?.expense_id),
      deletedAt: row?.deleted_at ?? new Date().toISOString(),
    }))
    .filter((row) => Number.isInteger(row.expenseId))
}

export async function createExpense(setId, payload) {
  const { data } = await httpClient.post(`${API_PATHS.sets}/${setId}/expenses`, payload)
  const response = ensureApiOk(data)
  const createdId = pickFirst(response, ['data.id', 'id', 'expense_id'], null)
  return createdId === null ? null : Number(createdId)
}

export async function updateExpense(expenseId, payload) {
  const { data } = await httpClient.put(`${API_PATHS.expenses}/${expenseId}`, payload)
  return ensureApiOk(data)
}

export async function deleteExpense(expenseId) {
  const { data } = await httpClient.delete(`${API_PATHS.expenses}/${expenseId}`)
  return ensureApiOk(data)
}
