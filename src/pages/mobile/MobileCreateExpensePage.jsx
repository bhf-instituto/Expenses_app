import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { EXPENSE_TYPE, getExpenseTypeLabel } from '../../constants/expenseTypes.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { fromExpenseTypeSlug } from '../../lib/expenseTypeRoute.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { getSetNameFromSnapshot } from '../../lib/setsFlow.js'
import { enqueueCreateExpense, flushQueueAndSync, loadOfflineSetData, syncCatalog } from '../../offline/syncService.js'

function getTodayDate() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

const initialForm = {
  amount: '',
  description: '',
  expenseDate: getTodayDate(),
  providerId: '',
}

function MobileCreateExpensePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setId } = useParams()
  const isOnline = useOnlineStatus()
  const { user, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()

  const [form, setForm] = useState(initialForm)
  const [category, setCategory] = useState(null)
  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenMessage, setScreenMessage] = useState('')
  const [screenMessageType, setScreenMessageType] = useState('info')

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const categoryId = Number(searchParams.get('categoryId'))
  const expenseTypeSlug = searchParams.get('expenseType') ?? 'variable'
  const expectedExpenseType = fromExpenseTypeSlug(expenseTypeSlug)
  const setName = getSetNameFromSnapshot(setId)

  useEffect(() => {
    if (!setId || !Number.isInteger(categoryId)) return

    let isCancelled = false

    async function loadFormData() {
      setIsLoading(true)
      setScreenMessage('')
      setScreenMessageType('info')

      try {
        if (isOnline) {
          await syncCatalog(setId)
        }

        const localData = await loadOfflineSetData(setId)
        const selectedCategory = localData.catalog.categories.find(
          (item) => Number(item.id) === Number(categoryId),
        )

        if (isCancelled) return

        setCategory(selectedCategory ?? null)
        setProviders(localData.catalog.providers)

        if (!selectedCategory) {
          setScreenMessage('No se encontro la categoria seleccionada en datos locales.')
          setScreenMessageType('error')
        } else if (!isOnline) {
          setScreenMessage('Sin conexion. El gasto quedara en cola hasta reconectar.')
          setScreenMessageType('info')
        }
      } catch (error) {
        if (isCancelled) return
        const message = getErrorMessage(error, 'No se pudieron cargar los datos del formulario.')
        setScreenMessage(message)
        setScreenMessageType('error')
        showError(message)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadFormData()

    return () => {
      isCancelled = true
    }
  }, [categoryId, isOnline, setId, showError])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId || !Number.isInteger(categoryId)) {
    return <Navigate to="/app/crear" replace />
  }

  const resolvedExpenseType = Number(category?.expenseType ?? expectedExpenseType)
  const isVariableExpense = resolvedExpenseType === EXPENSE_TYPE.VARIABLE

  async function handleSubmit(event) {
    event.preventDefault()

    if (!category) {
      const message = 'Selecciona una categoria valida antes de guardar.'
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
      return
    }

    const amount = Number(form.amount)

    if (!Number.isInteger(amount) || amount <= 0) {
      const message = 'El monto debe ser un entero mayor a 0.'
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
      return
    }

    if (!form.expenseDate) {
      const message = 'La fecha es obligatoria.'
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
      return
    }

    const payload = {
      category_id: Number(category.id),
      amount,
      description: form.description.trim() || null,
      expense_date: form.expenseDate,
      provider_id: null,
    }

    if (isVariableExpense && form.providerId) {
      payload.provider_id = Number(form.providerId)
    }

    setIsSubmitting(true)

    try {
      await enqueueCreateExpense(setId, payload, user)

      if (isOnline) {
        await flushQueueAndSync(setId)
        showSuccess('Gasto creado.')
      } else {
        showSuccess('Gasto guardado en cola para sincronizar despues.')
      }

      navigate(`/app/grupos/${setId}/tipo-gasto`, { replace: true })
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo guardar el gasto.')
      setScreenMessage(message)
      setScreenMessageType('error')
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={setName ? { label: setName } : null}
        title="Nuevo gasto"
      />

      <article className="mobile-card">
        <p className="mobile-caption">
          Categoria: <strong>{category?.name ?? '-'}</strong>
        </p>
        <p className="mobile-caption">
          Tipo: <strong>{getExpenseTypeLabel(resolvedExpenseType)}</strong>
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Monto</span>
            <input
              inputMode="numeric"
              min="1"
              name="amount"
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              required
              type="number"
              value={form.amount}
            />
          </label>

          <label className="field">
            <span>Fecha</span>
            <input
              name="expenseDate"
              onChange={(event) => setForm((prev) => ({ ...prev, expenseDate: event.target.value }))}
              required
              type="date"
              value={form.expenseDate}
            />
          </label>

          {isVariableExpense && (
            <div className="field">
              <span>Proveedor (opcional)</span>
              <select
                name="providerId"
                onChange={(event) => setForm((prev) => ({ ...prev, providerId: event.target.value }))}
                value={form.providerId}
              >
                <option value="">Sin proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>

              <button
                className="btn"
                disabled={!isOnline}
                onClick={() => navigate(`/app/grupos/${setId}/proveedores/nuevo`)}
                type="button"
              >
                Crear proveedor
              </button>
            </div>
          )}

          <label className="field">
            <span>Descripcion</span>
            <input
              name="description"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Detalle opcional"
              type="text"
              value={form.description}
            />
          </label>

          {screenMessage && (
            <p className={`alert ${screenMessageType === 'error' ? 'alert--error' : 'alert--info'}`}>
              {screenMessage}
            </p>
          )}

          <button className="btn btn--primary" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default MobileCreateExpensePage
