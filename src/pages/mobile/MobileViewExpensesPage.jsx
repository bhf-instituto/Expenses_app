import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { EXPENSE_TYPE, getExpenseTypeLabel } from '../../constants/expenseTypes.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { getSetNameFromSnapshot } from '../../lib/setsFlow.js'
import { viewFiltersStorage } from '../../lib/viewFiltersStorage.js'
import { loadOfflineSetData, syncCatalog } from '../../offline/syncService.js'
import { listExpenses } from '../../services/expensesApi.js'

const PAGE_SIZE = 50

const initialFilters = {
  enableType: false,
  expenseType: '',
  enableCategory: false,
  categoryId: '',
  enableProvider: false,
  providerId: '',
  enableDateRange: false,
  fromDate: '',
  toDate: '',
}

function getTodayDate() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

function getDefaultDraftFilters() {
  return {
    ...initialFilters,
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
  }
}

function sanitizeFilters(filters) {
  const next = { ...filters }

  if (!next.enableType) next.expenseType = ''
  if (!next.enableCategory) next.categoryId = ''
  if (!next.enableProvider) next.providerId = ''
  if (!next.enableDateRange) {
    next.fromDate = ''
    next.toDate = ''
  }

  return next
}

function validateFilters(filters) {
  if (filters.enableType && !filters.expenseType) {
    return 'Selecciona un tipo de gasto.'
  }

  if (filters.enableCategory && !filters.categoryId) {
    return 'Selecciona una categoria.'
  }

  if (filters.enableProvider && !filters.providerId) {
    return 'Selecciona un proveedor.'
  }

  if (filters.enableDateRange) {
    if (!filters.fromDate || !filters.toDate) {
      return 'Debes completar fecha desde y fecha hasta.'
    }

    if (filters.fromDate > filters.toDate) {
      return 'La fecha desde no puede ser mayor que la fecha hasta.'
    }
  }

  return ''
}

function applyFiltersToLocalExpenses(expenses, filters) {
  return expenses.filter((expense) => {
    if (filters.enableType && filters.expenseType) {
      if (Number(expense.expenseType) !== Number(filters.expenseType)) return false
    }

    if (filters.enableCategory && filters.categoryId) {
      if (Number(expense.categoryId) !== Number(filters.categoryId)) return false
    }

    if (filters.enableProvider && filters.providerId) {
      if (Number(expense.providerId) !== Number(filters.providerId)) return false
    }

    if (filters.enableDateRange && filters.fromDate && filters.toDate) {
      const expenseDate = String(expense.expenseDate ?? '')
      if (expenseDate < filters.fromDate || expenseDate > filters.toDate) return false
    }

    return true
  })
}

function buildQueryOptions(filters, page) {
  const options = {
    page,
    limit: PAGE_SIZE,
  }

  if (filters.enableType && filters.expenseType) {
    options.expenseType = Number(filters.expenseType)
  }

  if (filters.enableCategory && filters.categoryId) {
    options.categoryId = Number(filters.categoryId)
  }

  if (filters.enableProvider && filters.providerId) {
    options.providerId = Number(filters.providerId)
  }

  if (filters.enableDateRange && filters.fromDate && filters.toDate) {
    options.fromDate = filters.fromDate
    options.toDate = filters.toDate
  }

  return options
}

function MobileViewExpensesPage() {
  const navigate = useNavigate()
  const { setId } = useParams()
  const isOnline = useOnlineStatus()
  const { isAuthenticated } = useAuth()
  const { showError } = useToast()

  const [catalog, setCatalog] = useState({ categories: [], providers: [] })
  const [expenses, setExpenses] = useState([])
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [draftFilters, setDraftFilters] = useState(() => getDefaultDraftFilters())
  const [screenMessage, setScreenMessage] = useState('')
  const [screenMessageType, setScreenMessageType] = useState('info')
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const pageRef = useRef(1)
  const offlineFilteredPoolRef = useRef([])
  const localExpensesRef = useRef([])

  const setName = getSetNameFromSnapshot(setId)

  const filteredCategoryOptions = useMemo(() => {
    if (!draftFilters.enableType || !draftFilters.expenseType) {
      return catalog.categories
    }

    return catalog.categories.filter(
      (category) => Number(category.expenseType) === Number(draftFilters.expenseType),
    )
  }, [catalog.categories, draftFilters.enableType, draftFilters.expenseType])

  const providerOptions = useMemo(() => catalog.providers, [catalog.providers])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }),
    [],
  )

  useEffect(() => {
    if (!draftFilters.enableCategory) return

    const exists = filteredCategoryOptions.some(
      (category) => Number(category.id) === Number(draftFilters.categoryId),
    )

    if (!exists) {
      setDraftFilters((prev) => ({ ...prev, categoryId: '' }))
    }
  }, [draftFilters.categoryId, draftFilters.enableCategory, filteredCategoryOptions])

  useEffect(() => {
    if (!setId) return

    let isCancelled = false

    async function bootstrap() {
      const persistedFilters = viewFiltersStorage.getBySet(setId)
      const restoredAppliedFilters = persistedFilters?.appliedFilters
        ? sanitizeFilters({ ...initialFilters, ...persistedFilters.appliedFilters })
        : initialFilters
      const restoredDraftFilters = persistedFilters?.draftFilters
        ? sanitizeFilters({ ...getDefaultDraftFilters(), ...persistedFilters.draftFilters })
        : getDefaultDraftFilters()
      const restoredFiltersOpen = Boolean(persistedFilters?.isFiltersOpen)

      setAppliedFilters(restoredAppliedFilters)
      setDraftFilters(restoredDraftFilters)
      setIsFiltersOpen(restoredFiltersOpen)

      setIsLoadingExpenses(true)
      setScreenMessage('')
      setScreenMessageType('info')

      try {
        if (isOnline) {
          await syncCatalog(setId)
        }

        const localData = await loadOfflineSetData(setId)

        if (isCancelled) return

        setCatalog(localData.catalog)
        localExpensesRef.current = localData.expenses

        if (isOnline) {
          await fetchOnlineExpenses({ reset: true, filters: restoredAppliedFilters, setId })
          if (isCancelled) return
          setScreenMessage('Mostrando gastos del servidor.')
          setScreenMessageType('info')
        } else {
          applyLocalExpenses({
            source: localData.expenses,
            filters: restoredAppliedFilters,
            reset: true,
          })
          if (isCancelled) return
          setScreenMessage('Sin conexion. Mostrando gastos guardados localmente.')
          setScreenMessageType('info')
        }
      } catch (error) {
        if (isCancelled) return
        const message = getErrorMessage(error, 'No se pudieron cargar los gastos.')
        setScreenMessage(message)
        setScreenMessageType('error')
        showError(message)
      } finally {
        if (!isCancelled) {
          setIsLoadingExpenses(false)
        }
      }
    }

    bootstrap()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId, isOnline])

  useEffect(() => {
    if (!setId) return

    viewFiltersStorage.setBySet(setId, {
      draftFilters,
      appliedFilters,
      isFiltersOpen,
    })
  }, [setId, draftFilters, appliedFilters, isFiltersOpen])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId) {
    return <Navigate to="/app/crear" replace />
  }

  async function fetchOnlineExpenses({ reset, filters, setId: targetSetId }) {
    const nextPage = reset ? 1 : pageRef.current + 1
    const options = buildQueryOptions(filters, nextPage)
    const rows = await listExpenses(targetSetId, options)

    if (reset) {
      setExpenses(rows)
    } else {
      setExpenses((prev) => [...prev, ...rows])
    }

    pageRef.current = nextPage
    setHasMore(rows.length === PAGE_SIZE)
  }

  function applyLocalExpenses({ source, filters, reset }) {
    const filtered = applyFiltersToLocalExpenses(source, filters)

    if (reset) {
      offlineFilteredPoolRef.current = filtered
      pageRef.current = 1
      setExpenses(filtered.slice(0, PAGE_SIZE))
      setHasMore(filtered.length > PAGE_SIZE)
      return
    }

    const nextPage = pageRef.current + 1
    const start = (nextPage - 1) * PAGE_SIZE
    const chunk = offlineFilteredPoolRef.current.slice(start, start + PAGE_SIZE)
    setExpenses((prev) => [...prev, ...chunk])
    pageRef.current = nextPage
    setHasMore(offlineFilteredPoolRef.current.length > nextPage * PAGE_SIZE)
  }

  async function handleApplyFilters() {
    const normalized = sanitizeFilters(draftFilters)
    const validationError = validateFilters(normalized)

    if (validationError) {
      setScreenMessage(validationError)
      setScreenMessageType('error')
      showError(validationError)
      return
    }

    setAppliedFilters(normalized)
    setIsFiltersOpen(false)
    setIsLoadingExpenses(true)
    setScreenMessage('')
    setScreenMessageType('info')

    try {
      if (isOnline) {
        await fetchOnlineExpenses({ reset: true, filters: normalized, setId })
      } else {
        applyLocalExpenses({
          source: localExpensesRef.current,
          filters: normalized,
          reset: true,
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudieron aplicar los filtros.')
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  async function handleClearFilters() {
    const cleared = getDefaultDraftFilters()

    setDraftFilters(cleared)
    setAppliedFilters(initialFilters)
    setIsFiltersOpen(false)
    setIsLoadingExpenses(true)
    setScreenMessage('')
    setScreenMessageType('info')

    try {
      if (isOnline) {
        await fetchOnlineExpenses({ reset: true, filters: initialFilters, setId })
      } else {
        applyLocalExpenses({
          source: localExpensesRef.current,
          filters: initialFilters,
          reset: true,
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudieron limpiar los filtros.')
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  async function handleLoadMore() {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)

    try {
      if (isOnline) {
        await fetchOnlineExpenses({
          reset: false,
          filters: appliedFilters,
          setId,
        })
      } else {
        applyLocalExpenses({
          source: localExpensesRef.current,
          filters: appliedFilters,
          reset: false,
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudieron cargar mas gastos.')
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
    } finally {
      setIsLoadingMore(false)
    }
  }

  function toggleFilterField(field, enabled) {
    setDraftFilters((prev) => sanitizeFilters({ ...prev, [field]: enabled }))
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={setName ? { label: setName } : null}
        title="Ver gastos"
      />

      <article className="mobile-card">
        <p className="mobile-caption">
          Estado de red: <strong>{isOnline ? 'ONLINE' : 'OFFLINE'}</strong>
        </p>

        <div className="mobile-filter-box">
          <button
            className="btn mobile-filter-toggle"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            type="button"
          >
            {isFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>

          {isFiltersOpen && (
            <div className="mobile-filter-panel">
              <label className="mobile-filter-check">
                <input
                  checked={draftFilters.enableType}
                  onChange={(event) => toggleFilterField('enableType', event.target.checked)}
                  type="checkbox"
                />
                <span>Filtrar por tipo de gasto</span>
              </label>

              {draftFilters.enableType && (
                <select
                  name="expenseType"
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, expenseType: event.target.value }))}
                  value={draftFilters.expenseType}
                >
                  <option value="">Selecciona tipo</option>
                  <option value={EXPENSE_TYPE.FIXED}>Fijo</option>
                  <option value={EXPENSE_TYPE.VARIABLE}>Variable</option>
                </select>
              )}

              <label className="mobile-filter-check">
                <input
                  checked={draftFilters.enableCategory}
                  onChange={(event) => toggleFilterField('enableCategory', event.target.checked)}
                  type="checkbox"
                />
                <span>Filtrar por categoria</span>
              </label>

              {draftFilters.enableCategory && (
                <select
                  name="categoryId"
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, categoryId: event.target.value }))}
                  value={draftFilters.categoryId}
                >
                  <option value="">Selecciona categoria</option>
                  {filteredCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="mobile-filter-check">
                <input
                  checked={draftFilters.enableProvider}
                  onChange={(event) => toggleFilterField('enableProvider', event.target.checked)}
                  type="checkbox"
                />
                <span>Filtrar por proveedor</span>
              </label>

              {draftFilters.enableProvider && (
                <select
                  name="providerId"
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, providerId: event.target.value }))}
                  value={draftFilters.providerId}
                >
                  <option value="">Selecciona proveedor</option>
                  {providerOptions.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="mobile-filter-check">
                <input
                  checked={draftFilters.enableDateRange}
                  onChange={(event) => toggleFilterField('enableDateRange', event.target.checked)}
                  type="checkbox"
                />
                <span>Filtrar por rango de fechas</span>
              </label>

              {draftFilters.enableDateRange && (
                <div className="mobile-filter-dates">
                  <label className="field">
                    <span>Desde</span>
                    <input
                      name="fromDate"
                      onChange={(event) => setDraftFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
                      type="date"
                      value={draftFilters.fromDate}
                    />
                  </label>

                  <label className="field">
                    <span>Hasta</span>
                    <input
                      name="toDate"
                      onChange={(event) => setDraftFilters((prev) => ({ ...prev, toDate: event.target.value }))}
                      type="date"
                      value={draftFilters.toDate}
                    />
                  </label>
                </div>
              )}

              <div className="mobile-filter-actions">
                <button className="btn btn--primary" onClick={handleApplyFilters} type="button">
                  Aplicar
                </button>
                <button className="btn" onClick={handleClearFilters} type="button">
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {screenMessage && (
          <p className={`alert ${screenMessageType === 'error' ? 'alert--error' : 'alert--info'}`}>
            {screenMessage}
          </p>
        )}

        <div className="mobile-scroll-list">
          {isLoadingExpenses && <p>Cargando gastos...</p>}

          {!isLoadingExpenses && expenses.length === 0 && (
            <p>No hay gastos para los filtros seleccionados.</p>
          )}

          {!isLoadingExpenses && expenses.length > 0 && (
            <ul className="mobile-expense-list">
              {expenses.map((expense) => (
                <li className="mobile-expense-item" key={`${expense.setId}-${expense.id}`}>
                  <div className="mobile-expense-item__row">
                    <strong>{currencyFormatter.format(Number(expense.amount ?? 0))}</strong>
                    <span>{expense.expenseDate}</span>
                  </div>

                  <p>{getExpenseTypeLabel(expense.expenseType)} - {expense.categoryName}</p>
                  <p>Proveedor: {expense.providerName ?? 'Sin proveedor'}</p>
                  {expense.description && <p>{expense.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mobile-sticky-actions">
          <button className="btn mobile-wide-btn" disabled={!hasMore || isLoadingMore} onClick={handleLoadMore} type="button">
            {isLoadingMore ? 'Cargando...' : hasMore ? 'Cargar mas' : 'No hay mas resultados'}
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileViewExpensesPage
