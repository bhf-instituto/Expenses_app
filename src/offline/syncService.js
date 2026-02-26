import { EXPENSE_TYPE } from '../constants/expenseTypes.js'
import { listCategories, listProviders } from '../services/catalogApi.js'
import {
  createExpense,
  deleteExpense,
  listDeletedExpenses,
  listExpenses,
  updateExpense,
} from '../services/expensesApi.js'
import { getCatalog, upsertCatalog } from './catalogStore.js'
import {
  deleteExpenseLocal,
  deleteExpensesByIds,
  getExpense,
  listExpensesBySet,
  LOCAL_STATUS,
  putExpense,
  replaceExpenseId,
} from './expenseStore.js'
import {
  addConflict,
  deleteConflict,
  deleteQueueItem,
  listConflictsBySet,
  listPendingQueueItemsBySet,
  listQueueItemsBySet,
  putQueueItem,
  QUEUE_STATUS,
} from './queueStore.js'
import { getSyncState, upsertSyncState } from './syncStateStore.js'

const PAGE_SIZE = 100

function nowIso() {
  return new Date().toISOString()
}

function sameExpense(a, b) {
  return String(a) === String(b)
}

function maxIsoTimestamp(a, b) {
  if (!a) return b ?? null
  if (!b) return a

  return Date.parse(b) > Date.parse(a) ? b : a
}

function getErrorReason(error, fallback) {
  return (
    error?.response?.data?.data?.message
    ?? error?.response?.data?.message
    ?? error?.message
    ?? fallback
  )
}

function isRetryableError(error) {
  const status = error?.response?.status
  return !status || status >= 500
}

function isConflictStatus(status) {
  return status === 400 || status === 403 || status === 404 || status === 409
}

function toQueueItem(setId, type, expenseId, payload = null) {
  const timestamp = nowIso()
  return {
    id: crypto.randomUUID(),
    setId: Number(setId),
    type,
    expenseId,
    payload,
    status: QUEUE_STATUS.PENDING,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function buildLocalExpenseFromDraft({ setId, tempId, payload, catalog, currentUser }) {
  const category = catalog.categories.find((item) => item.id === Number(payload.category_id))
  const provider = catalog.providers.find((item) => item.id === Number(payload.provider_id))
  const expenseType = Number(category?.expenseType ?? EXPENSE_TYPE.VARIABLE)

  return {
    setId: Number(setId),
    id: tempId,
    amount: Number(payload.amount),
    description: payload.description ?? '',
    expenseDate: payload.expense_date,
    expenseType,
    userId: Number(currentUser?.id ?? 0),
    userEmail: currentUser?.email ?? 'local_user',
    categoryId: Number(payload.category_id),
    categoryName: category?.name ?? '',
    providerId:
      payload.provider_id === null || payload.provider_id === undefined
        ? null
        : Number(payload.provider_id),
    providerName: provider?.name ?? null,
    updatedAt: nowIso(),
    localStatus: LOCAL_STATUS.PENDING_CREATE,
    isLocalOnly: true,
  }
}

function applyPatchToLocalExpense(existingExpense, patch, catalog) {
  const next = { ...existingExpense }

  if (patch.amount !== undefined) next.amount = Number(patch.amount)
  if (patch.description !== undefined) next.description = patch.description ?? ''
  if (patch.expense_date !== undefined) next.expenseDate = patch.expense_date

  if (patch.category_id !== undefined) {
    const category = catalog.categories.find((item) => item.id === Number(patch.category_id))
    next.categoryId = Number(patch.category_id)
    next.categoryName = category?.name ?? ''
    next.expenseType = Number(category?.expenseType ?? next.expenseType)

    if (next.expenseType === EXPENSE_TYPE.FIXED) {
      next.providerId = null
      next.providerName = null
    }
  }

  if (patch.provider_id !== undefined) {
    if (patch.provider_id === null || patch.provider_id === '') {
      next.providerId = null
      next.providerName = null
    } else {
      const providerId = Number(patch.provider_id)
      const provider = catalog.providers.find((item) => item.id === providerId)
      next.providerId = providerId
      next.providerName = provider?.name ?? null
    }
  }

  next.updatedAt = nowIso()
  return next
}

async function markConflictFromQueueItem(setId, queueItem, error) {
  const reason = getErrorReason(error, 'Operacion rechazada por servidor.')
  await addConflict({
    id: crypto.randomUUID(),
    setId: Number(setId),
    expenseId: queueItem.expenseId,
    queueItemId: queueItem.id,
    type: queueItem.type,
    payload: queueItem.payload,
    reason,
    createdAt: nowIso(),
  })

  const expense = await getExpense(setId, queueItem.expenseId)
  if (expense) {
    await putExpense({
      ...expense,
      localStatus: LOCAL_STATUS.CONFLICT,
      updatedAt: nowIso(),
    })
  }

  await deleteQueueItem(queueItem.id)
}

async function upsertServerExpenses(setId, serverExpenses) {
  for (const serverExpense of serverExpenses) {
    const existing = await getExpense(setId, serverExpense.id)

    if (existing && existing.localStatus !== LOCAL_STATUS.SYNCED) {
      continue
    }

    await putExpense({
      ...serverExpense,
      setId: Number(setId),
      localStatus: LOCAL_STATUS.SYNCED,
      isLocalOnly: false,
    })
  }
}

async function applyDeletedFromServer(setId, deletedRows) {
  for (const deletedRow of deletedRows) {
    const existing = await getExpense(setId, deletedRow.expenseId)
    if (!existing) continue

    if (
      existing.localStatus === LOCAL_STATUS.PENDING_CREATE
      || existing.localStatus === LOCAL_STATUS.PENDING_UPDATE
      || existing.localStatus === LOCAL_STATUS.PENDING_DELETE
    ) {
      continue
    }

    await deleteExpenseLocal(setId, deletedRow.expenseId)
  }
}

export async function syncCatalog(setId) {
  const [categories, providers] = await Promise.all([
    listCategories(setId),
    listProviders(setId),
  ])

  return upsertCatalog(setId, categories, providers)
}

export async function syncExpensesDelta(setId, options = {}) {
  const { full = false } = options
  const currentState = await getSyncState(setId)

  let updatedAfter = full ? null : currentState.updatedAfter
  let deletedAfter = full ? null : currentState.deletedAfter
  let maxUpdatedAt = updatedAfter
  let maxDeletedAt = deletedAfter
  let upserted = 0
  let deleted = 0

  let expensesPage = 1
  while (true) {
    const rows = await listExpenses(setId, {
      updatedAfter,
      page: expensesPage,
      limit: PAGE_SIZE,
    })

    if (rows.length === 0) break

    await upsertServerExpenses(setId, rows)
    upserted += rows.length

    for (const row of rows) {
      maxUpdatedAt = maxIsoTimestamp(maxUpdatedAt, row.updatedAt)
    }

    if (rows.length < PAGE_SIZE) break
    expensesPage += 1
  }

  let deletedPage = 1
  while (true) {
    const rows = await listDeletedExpenses(setId, {
      deletedAfter,
      page: deletedPage,
      limit: PAGE_SIZE,
    })

    if (rows.length === 0) break

    await applyDeletedFromServer(setId, rows)
    deleted += rows.length

    for (const row of rows) {
      maxDeletedAt = maxIsoTimestamp(maxDeletedAt, row.deletedAt)
    }

    if (rows.length < PAGE_SIZE) break
    deletedPage += 1
  }

  const nextState = await upsertSyncState(setId, {
    updatedAfter: maxUpdatedAt,
    deletedAfter: maxDeletedAt,
    lastSyncAt: nowIso(),
    downloadedAt: currentState.downloadedAt ?? nowIso(),
  })

  return { upserted, deleted, state: nextState }
}

export async function downloadSetOffline(setId) {
  await syncCatalog(setId)
  const result = await syncExpensesDelta(setId, { full: true })
  await upsertSyncState(setId, { downloadedAt: nowIso() })
  return result
}

export async function enqueueCreateExpense(setId, payload, currentUser = null) {
  const catalog = await getCatalog(setId)
  const tempId = `tmp-${crypto.randomUUID()}`
  const localExpense = buildLocalExpenseFromDraft({
    setId,
    tempId,
    payload,
    catalog,
    currentUser,
  })

  const queueItem = toQueueItem(setId, 'create', tempId, payload)

  await Promise.all([
    putExpense(localExpense),
    putQueueItem(queueItem),
  ])

  return localExpense
}

export async function enqueueUpdateExpense(setId, expenseId, patch) {
  const [existing, queueItems, catalog] = await Promise.all([
    getExpense(setId, expenseId),
    listPendingQueueItemsBySet(setId),
    getCatalog(setId),
  ])

  if (!existing) {
    throw new Error('Expense not found in local storage.')
  }

  const createItem = queueItems.find((item) => item.type === 'create' && sameExpense(item.expenseId, expenseId))
  const updateItem = queueItems.find((item) => item.type === 'update' && sameExpense(item.expenseId, expenseId))

  const nextExpense = applyPatchToLocalExpense(existing, patch, catalog)

  if (createItem) {
    const nextCreateItem = {
      ...createItem,
      payload: {
        ...createItem.payload,
        ...patch,
      },
      updatedAt: nowIso(),
    }

    await Promise.all([
      putExpense({
        ...nextExpense,
        localStatus: LOCAL_STATUS.PENDING_CREATE,
      }),
      putQueueItem(nextCreateItem),
    ])

    return nextExpense
  }

  if (updateItem) {
    const nextUpdateItem = {
      ...updateItem,
      payload: {
        ...updateItem.payload,
        ...patch,
      },
      updatedAt: nowIso(),
    }

    await Promise.all([
      putExpense({
        ...nextExpense,
        localStatus: LOCAL_STATUS.PENDING_UPDATE,
      }),
      putQueueItem(nextUpdateItem),
    ])

    return nextExpense
  }

  await Promise.all([
    putExpense({
      ...nextExpense,
      localStatus: LOCAL_STATUS.PENDING_UPDATE,
    }),
    putQueueItem(toQueueItem(setId, 'update', expenseId, patch)),
  ])

  return nextExpense
}

export async function enqueueDeleteExpense(setId, expenseId) {
  const [existing, queueItems] = await Promise.all([
    getExpense(setId, expenseId),
    listPendingQueueItemsBySet(setId),
  ])

  if (!existing) {
    return { removed: false }
  }

  const itemsForExpense = queueItems.filter((item) => sameExpense(item.expenseId, expenseId))
  const hasPendingCreate = itemsForExpense.some((item) => item.type === 'create')
  const hasPendingDelete = itemsForExpense.some((item) => item.type === 'delete')

  if (existing.isLocalOnly || hasPendingCreate) {
    for (const item of itemsForExpense) {
      await deleteQueueItem(item.id)
    }

    await deleteExpenseLocal(setId, expenseId)
    return { removed: true }
  }

  const pendingUpdateItems = itemsForExpense.filter((item) => item.type === 'update')
  for (const item of pendingUpdateItems) {
    await deleteQueueItem(item.id)
  }

  if (!hasPendingDelete) {
    await putQueueItem(toQueueItem(setId, 'delete', expenseId))
  }

  await putExpense({
    ...existing,
    localStatus: LOCAL_STATUS.PENDING_DELETE,
    updatedAt: nowIso(),
  })

  return { removed: true }
}

export async function processPendingQueue(setId) {
  const queueItems = await listPendingQueueItemsBySet(setId)
  let processed = 0
  let conflicts = 0

  for (const queueItem of queueItems) {
    try {
      if (queueItem.type === 'create') {
        const serverExpenseId = await createExpense(setId, queueItem.payload)
        await deleteQueueItem(queueItem.id)

        if (Number.isInteger(serverExpenseId)) {
          await replaceExpenseId(setId, queueItem.expenseId, serverExpenseId)
        } else {
          await deleteExpenseLocal(setId, queueItem.expenseId)
        }
      }

      if (queueItem.type === 'update') {
        await updateExpense(queueItem.expenseId, queueItem.payload)
        await deleteQueueItem(queueItem.id)

        const existing = await getExpense(setId, queueItem.expenseId)
        if (existing) {
          await putExpense({
            ...existing,
            localStatus: LOCAL_STATUS.SYNCED,
            isLocalOnly: false,
            updatedAt: nowIso(),
          })
        }
      }

      if (queueItem.type === 'delete') {
        try {
          await deleteExpense(queueItem.expenseId)
        } catch (error) {
          if (error?.response?.status !== 404) throw error
        }

        await deleteQueueItem(queueItem.id)
        await deleteExpenseLocal(setId, queueItem.expenseId)
      }

      processed += 1
    } catch (error) {
      const status = error?.response?.status

      if (isRetryableError(error)) {
        break
      }

      if (isConflictStatus(status)) {
        await markConflictFromQueueItem(setId, queueItem, error)
        conflicts += 1
        continue
      }

      throw error
    }
  }

  return {
    processed,
    conflicts,
    pending: (await listPendingQueueItemsBySet(setId)).length,
  }
}

export async function syncSet(setId, options = {}) {
  const { includeCatalog = true } = options

  if (includeCatalog) {
    await syncCatalog(setId)
  }

  return syncExpensesDelta(setId, { full: false })
}

export async function flushQueueAndSync(setId) {
  const queueResult = await processPendingQueue(setId)
  const syncResult = await syncSet(setId, { includeCatalog: true })
  return { queueResult, syncResult }
}

export async function dismissConflict(conflictId) {
  await deleteConflict(conflictId)
}

export async function loadOfflineSetData(setId) {
  const [expenses, queue, conflicts, catalog, syncState] = await Promise.all([
    listExpensesBySet(setId),
    listQueueItemsBySet(setId),
    listConflictsBySet(setId),
    getCatalog(setId),
    getSyncState(setId),
  ])

  return {
    expenses,
    queue,
    conflicts,
    catalog,
    syncState,
  }
}

export async function clearSyncedExpensesForSet(setId) {
  const expenses = await listExpensesBySet(setId)
  const ids = expenses
    .filter((expense) => expense.localStatus === LOCAL_STATUS.SYNCED)
    .map((expense) => expense.id)

  await deleteExpensesByIds(setId, ids)
}
