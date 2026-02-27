import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { fromExpenseTypeSlug, getExpenseTypePageTitle } from '../../lib/expenseTypeRoute.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { createCategory } from '../../services/catalogApi.js'
import { syncCatalog } from '../../offline/syncService.js'

function MobileCreateCategoryPage() {
  const navigate = useNavigate()
  const { setId, expenseType } = useParams()
  const isOnline = useOnlineStatus()
  const { isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()

  const [categoryName, setCategoryName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parsedExpenseType = useMemo(() => fromExpenseTypeSlug(expenseType), [expenseType])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId || !parsedExpenseType) {
    return <Navigate to="/app/crear" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isOnline) {
      const message = 'Sin internet. Crear categorias requiere conexion.'
      setError(message)
      showError(message)
      return
    }

    const trimmedName = categoryName.trim()

    if (!trimmedName) {
      const message = 'Ingresa un nombre de categoria.'
      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      await createCategory(setId, {
        categoryName: trimmedName,
        expenseType: parsedExpenseType,
      })
      await syncCatalog(setId)
      showSuccess('Categoria creada.')
      navigate(-1)
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo crear la categoria.')
      setError(message)
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        title={`Nueva categoria (${getExpenseTypePageTitle(parsedExpenseType).toLowerCase()})`}
      />

      <article className="mobile-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre de la categoria</span>
            <input
              name="categoryName"
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ej: Alquiler, Supermercado..."
              required
              type="text"
              value={categoryName}
            />
          </label>

          {error && <p className="alert alert--error">{error}</p>}
          {!isOnline && (
            <p className="alert alert--info">Conectate para crear categorias.</p>
          )}

          <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
            {isSubmitting ? 'Guardando...' : 'Guardar categoria'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default MobileCreateCategoryPage
