import { getOfflineDb, STORE_NAMES } from './db.js'

export const LOCAL_STATUS = {
  SYNCED: 'synced',
  PENDING_CREATE: 'pending_create',
  PENDING_UPDATE: 'pending_update',
  PENDING_DELETE: 'pending_delete',
  CONFLICT: 'conflict',
}

function sortExpenses(expenses) {
  return [...expenses].sort((a, b) => {
    if (a.expenseDate !== b.expenseDate) {
      return String(b.expenseDate).localeCompare(String(a.expenseDate))
    }

    return String(b.updatedAt).localeCompare(String(a.updatedAt))
  })
}

export async function listExpensesBySet(setId) {
  const db = await getOfflineDb()
  const expenses = await db.getAllFromIndex(STORE_NAMES.expenses, 'bySet', Number(setId))
  return sortExpenses(expenses)
}

export async function getExpense(setId, expenseId) {
  const db = await getOfflineDb()
  return db.get(STORE_NAMES.expenses, [Number(setId), expenseId])
}

export async function putExpense(expense) {
  const db = await getOfflineDb()
  await db.put(STORE_NAMES.expenses, {
    ...expense,
    setId: Number(expense.setId),
  })
}

export async function putExpenses(expenses) {
  const db = await getOfflineDb()
  const tx = db.transaction(STORE_NAMES.expenses, 'readwrite')
  for (const expense of expenses) {
    await tx.store.put({
      ...expense,
      setId: Number(expense.setId),
    })
  }
  await tx.done
}

export async function deleteExpenseLocal(setId, expenseId) {
  const db = await getOfflineDb()
  await db.delete(STORE_NAMES.expenses, [Number(setId), expenseId])
}

export async function deleteExpensesByIds(setId, expenseIds) {
  if (expenseIds.length === 0) return

  const db = await getOfflineDb()
  const tx = db.transaction(STORE_NAMES.expenses, 'readwrite')
  for (const expenseId of expenseIds) {
    await tx.store.delete([Number(setId), expenseId])
  }
  await tx.done
}

export async function replaceExpenseId(setId, previousId, nextId) {
  const existing = await getExpense(setId, previousId)
  if (!existing) return

  const db = await getOfflineDb()
  const tx = db.transaction(STORE_NAMES.expenses, 'readwrite')
  await tx.store.delete([Number(setId), previousId])
  await tx.store.put({
    ...existing,
    id: Number(nextId),
    isLocalOnly: false,
    localStatus: LOCAL_STATUS.SYNCED,
    updatedAt: new Date().toISOString(),
  })
  await tx.done
}
