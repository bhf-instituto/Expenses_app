import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { EXPENSE_TYPE } from '../../constants/expenseTypes.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { fromExpenseTypeSlug, getExpenseTypePageTitle } from '../../lib/expenseTypeRoute.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { getSetNameFromSnapshot } from '../../lib/setsFlow.js'
import { loadOfflineSetData, syncCatalog } from '../../offline/syncService.js'

function MobileCategoryListPage() {
  const navigate = useNavigate()
  const { setId, expenseType } = useParams()
  const { isAuthenticated } = useAuth()
  const { showError } = useToast()
  const isOnline = useOnlineStatus()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [screenMessage, setScreenMessage] = useState('')

  const parsedExpenseType = useMemo(() => fromExpenseTypeSlug(expenseType), [expenseType])
  const setName = getSetNameFromSnapshot(setId)

  useEffect(() => {
    if (!setId || !parsedExpenseType) return

    let isCancelled = false

    async function loadCategories() {
      setIsLoading(true)
      setScreenMessage('')

      try {
        if (isOnline) {
          await syncCatalog(setId)
        }

        const localData = await loadOfflineSetData(setId)
        const filtered = localData.catalog.categories.filter(
          (item) => Number(item.expenseType) === Number(parsedExpenseType),
        )

        if (isCancelled) return
        setCategories(filtered)

        if (!isOnline) {
          setScreenMessage('Sin conexion. Mostrando categorias guardadas localmente.')
        } else if (filtered.length === 0) {
          setScreenMessage('No hay categorias de este tipo en el grupo.')
        }
      } catch (error) {
        if (isCancelled) return
        const message = getErrorMessage(error, 'No se pudieron cargar las categorias.')
        setScreenMessage(message)
        showError(message)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isCancelled = true
    }
  }, [isOnline, parsedExpenseType, setId, showError])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId || !parsedExpenseType) {
    return <Navigate to="/app/crear" replace />
  }

  function handleOpenExpenseForm(categoryId) {
    navigate(
      `/app/grupos/${setId}/gastos/nuevo?categoryId=${categoryId}&expenseType=${expenseType}`,
    )
  }

  function handleOpenCreateCategory() {
    navigate(`/app/grupos/${setId}/categorias/${expenseType}/nueva`)
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={setName ? { label: setName } : null}
        title={getExpenseTypePageTitle(parsedExpenseType)}
      />

      <article className="mobile-card mobile-card-fixed-expense">
        {parsedExpenseType === EXPENSE_TYPE.VARIABLE && (
          <p className="mobile-caption">
            Categoria variable: el proveedor se elige al crear el gasto.
          </p>
        )}

        <div className="mobile-scroll-list">
          {isLoading && <p>Cargando categorias...</p>}

          {!isLoading && categories.length === 0 && (
            <p>No hay categorias disponibles.</p>
          )}

          {!isLoading && categories.length > 0 && (
            <ul className="mobile-option-list">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    className="mobile-option-button"
                    onClick={() => handleOpenExpenseForm(category.id)}
                    type="button"
                  >
                    <strong>{category.name}</strong>
                    {/* <span>{getExpenseTypeLabel(category.expenseType)}</span> */}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {screenMessage && (
          <p className="alert alert--info">{screenMessage}</p>
        )}

        <div className="mobile-sticky-actions">
          <button className="btn btn--primary mobile-wide-btn" onClick={handleOpenCreateCategory} type="button">
            Crear categoria
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileCategoryListPage
