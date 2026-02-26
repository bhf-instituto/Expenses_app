import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXPENSE_TYPE, getExpenseTypeLabel } from '../constants/expenseTypes.js'
import { SET_ROLE, getSetRoleLabel } from '../constants/setRoles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../lib/getErrorMessage.js'
import {
  dismissConflict,
  downloadSetOffline,
  enqueueCreateExpense,
  enqueueDeleteExpense,
  enqueueUpdateExpense,
  flushQueueAndSync,
  loadOfflineSetData,
  syncSet,
} from '../offline/syncService.js'
import { createSet, listSets } from '../services/setsApi.js'

function getTodayDate() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

const initialExpenseForm = {
  categoryId: '',
  providerId: '',
  amount: '',
  description: '',
  expenseDate: getTodayDate(),
}

function WorkspacePage() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const { user, logout } = useAuth()
  const { showError, showSuccess } = useToast()

  const [sets, setSets] = useState([])
  const [activeSetId, setActiveSetId] = useState('')
  const [setNameInput, setSetNameInput] = useState('')
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
  const [editingExpenseId, setEditingExpenseId] = useState(null)

  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [syncState, setSyncState] = useState(null)
  const [catalog, setCatalog] = useState({ categories: [], providers: [] })
  const [expenses, setExpenses] = useState([])
  const [queueItems, setQueueItems] = useState([])
  const [conflicts, setConflicts] = useState([])

  const [screenError, setScreenError] = useState('')

  const selectedSet = useMemo(
    () => sets.find((item) => item.id === Number(activeSetId)) ?? null,
    [sets, activeSetId],
  )

  const selectedCategory = useMemo(
    () => catalog.categories.find((item) => item.id === Number(expenseForm.categoryId)) ?? null,
    [catalog.categories, expenseForm.categoryId],
  )

  const selectedExpenseType = selectedCategory?.expenseType ?? null
  const providersEnabled = selectedExpenseType === EXPENSE_TYPE.VARIABLE

  useEffect(() => {
    if (!providersEnabled && expenseForm.providerId) {
      setExpenseForm((prev) => ({ ...prev, providerId: '' }))
    }
  }, [providersEnabled, expenseForm.providerId])

  async function loadSetList() {
    setIsLoadingSets(true)
    setScreenError('')

    try {
      const nextSets = await listSets()
      setSets(nextSets)

      if (nextSets.length === 0) {
        setActiveSetId('')
        return
      }

      const hasCurrent = nextSets.some((setItem) => setItem.id === Number(activeSetId))
      if (!hasCurrent) {
        setActiveSetId(String(nextSets[0].id))
      }
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudieron cargar los grupos.')
      setScreenError(message)
      showError(message)
    } finally {
      setIsLoadingSets(false)
    }
  }

  async function loadLocalSetData(setId) {
    const payload = await loadOfflineSetData(Number(setId))
    setExpenses(payload.expenses)
    setQueueItems(payload.queue)
    setConflicts(payload.conflicts)
    setCatalog(payload.catalog)
    setSyncState(payload.syncState)
  }

  useEffect(() => {
    loadSetList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeSetId) {
      setExpenses([])
      setQueueItems([])
      setConflicts([])
      setCatalog({ categories: [], providers: [] })
      setSyncState(null)
      return
    }

    loadLocalSetData(activeSetId).catch((error) => {
      showError(getErrorMessage(error, 'No se pudo abrir la base local.'))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSetId])

  async function handleCreateSet(event) {
    event.preventDefault()
    const setName = setNameInput.trim()

    if (!setName) {
      showError('Ingresa un nombre de grupo.')
      return
    }

    setIsCreatingSet(true)
    try {
      const created = await createSet(setName)
      setSetNameInput('')
      showSuccess('Grupo creado.')
      await loadSetList()
      if (created?.id) {
        setActiveSetId(String(created.id))
      }
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo crear el grupo.'))
    } finally {
      setIsCreatingSet(false)
    }
  }

  async function handleDownloadOffline() {
    if (!activeSetId) return

    setIsDownloading(true)
    try {
      const result = await downloadSetOffline(activeSetId)
      await loadLocalSetData(activeSetId)
      showSuccess(
        `Grupo descargado. Gastos: ${result.upserted}, eliminados: ${result.deleted}.`,
      )
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo descargar el grupo en modo offline.'))
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleSyncNow() {
    if (!activeSetId) return

    setIsSyncing(true)
    try {
      const { queueResult, syncResult } = await flushQueueAndSync(activeSetId)
      await loadLocalSetData(activeSetId)
      showSuccess(
        `Sync ok. Cola procesada: ${queueResult.processed}, conflictos: ${queueResult.conflicts}, actualizados: ${syncResult.upserted}.`,
      )
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo sincronizar.'))
    } finally {
      setIsSyncing(false)
    }
  }

  async function handlePullDelta() {
    if (!activeSetId) return

    setIsSyncing(true)
    try {
      const syncResult = await syncSet(activeSetId, { includeCatalog: true })
      await loadLocalSetData(activeSetId)
      showSuccess(`Actualizado. Gastos: ${syncResult.upserted}, eliminados: ${syncResult.deleted}.`)
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo actualizar desde servidor.'))
    } finally {
      setIsSyncing(false)
    }
  }

  function resetExpenseForm() {
    setExpenseForm(initialExpenseForm)
    setEditingExpenseId(null)
  }

  function parseExpensePayloadFromForm() {
    const categoryId = Number(expenseForm.categoryId)
    const amount = Number(expenseForm.amount)
    const expenseDate = expenseForm.expenseDate

    if (!Number.isInteger(categoryId)) {
      throw new Error('Selecciona una categoria.')
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('El monto debe ser un entero mayor a 0.')
    }

    if (!expenseDate) {
      throw new Error('La fecha es obligatoria.')
    }

    const payload = {
      category_id: categoryId,
      amount,
      description: expenseForm.description.trim() || null,
      expense_date: expenseDate,
      provider_id: null,
    }

    if (selectedExpenseType === EXPENSE_TYPE.VARIABLE && expenseForm.providerId) {
      payload.provider_id = Number(expenseForm.providerId)
    }

    return payload
  }

  async function handleSaveExpense(event) {
    event.preventDefault()
    if (!activeSetId) return

    setIsSavingExpense(true)
    try {
      const payload = parseExpensePayloadFromForm()

      if (editingExpenseId) {
        const patch = {
          amount: payload.amount,
          description: payload.description,
          expense_date: payload.expense_date,
        }
        await enqueueUpdateExpense(activeSetId, editingExpenseId, patch)
        showSuccess('Cambio guardado localmente.')
      } else {
        await enqueueCreateExpense(activeSetId, payload, user)
        showSuccess('Gasto creado localmente.')
      }

      if (isOnline) {
        await flushQueueAndSync(activeSetId)
      }

      await loadLocalSetData(activeSetId)
      resetExpenseForm()
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo guardar el gasto.'))
    } finally {
      setIsSavingExpense(false)
    }
  }

  function startEditExpense(expense) {
    setEditingExpenseId(expense.id)
    setExpenseForm({
      categoryId: String(expense.categoryId),
      providerId: expense.providerId ? String(expense.providerId) : '',
      amount: String(expense.amount),
      description: expense.description ?? '',
      expenseDate: expense.expenseDate,
    })
  }

  async function handleDeleteExpense(expense) {
    if (!activeSetId) return

    const confirmed = window.confirm('Eliminar gasto?')
    if (!confirmed) return

    try {
      await enqueueDeleteExpense(activeSetId, expense.id)

      if (isOnline) {
        await flushQueueAndSync(activeSetId)
      }

      await loadLocalSetData(activeSetId)
      showSuccess('Gasto eliminado.')
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo eliminar el gasto.'))
    }
  }

  async function handleDismissConflict(conflictId) {
    await dismissConflict(conflictId)
    if (activeSetId) {
      await loadLocalSetData(activeSetId)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      showSuccess('Sesion cerrada.')
      navigate('/login', { replace: true })
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo cerrar sesion.'))
    } finally {
      setIsLoggingOut(false)
    }
  }

  const pendingQueueCount = queueItems.filter((item) => item.status === 'pending').length

  return (
    <section className="workspace">
      <article className="panel">
        <div className="workspace__header">
          <div>
            <h1>Workspace de Gastos</h1>
            <p>
              Estado de red:{' '}
              <strong className={isOnline ? 'status status--online' : 'status status--offline'}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </strong>
            </p>
          </div>
          <button className="btn btn--danger" disabled={isLoggingOut} onClick={handleLogout} type="button">
            {isLoggingOut ? 'Cerrando...' : 'Logout'}
          </button>
        </div>

        <div className="workspace__grid">
          <div className="workspace__col">
            <h2>Grupos</h2>
            <form className="inline-form" onSubmit={handleCreateSet}>
              <input
                name="setName"
                onChange={(event) => setSetNameInput(event.target.value)}
                placeholder="Nombre del grupo"
                type="text"
                value={setNameInput}
              />
              <button className="btn btn--primary" disabled={isCreatingSet} type="submit">
                {isCreatingSet ? 'Creando...' : 'Crear'}
              </button>
            </form>

            <div className="list-card">
              {isLoadingSets && <p>Cargando grupos...</p>}
              {!isLoadingSets && sets.length === 0 && <p>No tienes grupos.</p>}
              {!isLoadingSets && sets.length > 0 && (
                <ul className="set-list">
                  {sets.map((setItem) => (
                    <li key={setItem.id}>
                      <button
                        className={`set-item ${String(setItem.id) === String(activeSetId) ? 'is-active' : ''}`}
                        onClick={() => setActiveSetId(String(setItem.id))}
                        type="button"
                      >
                        <strong>{setItem.name}</strong>
                        <span>{getSetRoleLabel(setItem.role ?? SET_ROLE.PARTICIPANT)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="workspace__col">
            <h2>Sincronizacion</h2>
            <div className="actions">
              <button className="btn" disabled={!activeSetId || isDownloading} onClick={handleDownloadOffline} type="button">
                {isDownloading ? 'Descargando...' : 'Descargar grupo offline'}
              </button>
              <button className="btn" disabled={!activeSetId || isSyncing} onClick={handlePullDelta} type="button">
                {isSyncing ? 'Actualizando...' : 'Traer delta'}
              </button>
              <button className="btn btn--primary" disabled={!activeSetId || isSyncing} onClick={handleSyncNow} type="button">
                {isSyncing ? 'Sincronizando...' : 'Subir cola + Sync'}
              </button>
            </div>
            <div className="list-card">
              <p>Grupo activo: <strong>{selectedSet?.name ?? '-'}</strong></p>
              <p>Ultima descarga: {syncState?.downloadedAt ?? 'sin descarga'}</p>
              <p>Ultimo sync: {syncState?.lastSyncAt ?? 'sin sync'}</p>
              <p>Cola pendiente: <strong>{pendingQueueCount}</strong></p>
              <p>Conflictos: <strong>{conflicts.length}</strong></p>
            </div>
          </div>
        </div>
      </article>

      <article className="panel">
        <h2>{editingExpenseId ? 'Editar gasto (monto/descripcion/fecha)' : 'Nuevo gasto'}</h2>
        <form className="form" onSubmit={handleSaveExpense}>
          <div className="field">
            <span>Categoria</span>
            <select
              disabled={Boolean(editingExpenseId)}
              name="categoryId"
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              required
              value={expenseForm.categoryId}
            >
              <option value="">Selecciona categoria</option>
              {catalog.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({getExpenseTypeLabel(category.expenseType)})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span>Proveedor (solo variable)</span>
            <select
              disabled={!providersEnabled || Boolean(editingExpenseId)}
              name="providerId"
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, providerId: event.target.value }))}
              value={expenseForm.providerId}
            >
              <option value="">Sin proveedor</option>
              {catalog.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Monto</span>
              <input
                inputMode="numeric"
                min="1"
                name="amount"
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                required
                type="number"
                value={expenseForm.amount}
              />
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                name="expenseDate"
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, expenseDate: event.target.value }))}
                required
                type="date"
                value={expenseForm.expenseDate}
              />
            </label>
          </div>

          <label className="field">
            <span>Descripcion</span>
            <input
              name="description"
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Detalle del gasto"
              type="text"
              value={expenseForm.description}
            />
          </label>

          <div className="actions">
            <button className="btn btn--primary" disabled={!activeSetId || isSavingExpense} type="submit">
              {isSavingExpense ? 'Guardando...' : editingExpenseId ? 'Guardar cambios' : 'Crear gasto'}
            </button>
            {editingExpenseId && (
              <button className="btn" onClick={resetExpenseForm} type="button">
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="panel">
        <h2>Gastos locales ({expenses.length})</h2>
        {expenses.length === 0 && <p>No hay gastos descargados. Usa "Descargar grupo offline".</p>}
        {expenses.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={`${expense.setId}-${expense.id}`}>
                    <td>{expense.expenseDate}</td>
                    <td>{expense.amount}</td>
                    <td>{getExpenseTypeLabel(expense.expenseType)}</td>
                    <td>{expense.categoryName}</td>
                    <td>{expense.providerName ?? '-'}</td>
                    <td>
                      <span className={`pill pill--${expense.localStatus}`}>
                        {expense.localStatus}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn" onClick={() => startEditExpense(expense)} type="button">
                          Editar
                        </button>
                        <button className="btn btn--danger" onClick={() => handleDeleteExpense(expense)} type="button">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="panel">
        <h2>Conflictos ({conflicts.length})</h2>
        {conflicts.length === 0 && <p>Sin conflictos.</p>}
        {conflicts.length > 0 && (
          <ul className="conflict-list">
            {conflicts.map((conflict) => (
              <li className="conflict-item" key={conflict.id}>
                <div>
                  <strong>{conflict.type.toUpperCase()}</strong> - gasto {String(conflict.expenseId)}
                  <p>{conflict.reason}</p>
                </div>
                <button className="btn" onClick={() => handleDismissConflict(conflict.id)} type="button">
                  Marcar visto
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      {screenError && <p className="alert alert--error">{screenError}</p>}
    </section>
  )
}

export default WorkspacePage
