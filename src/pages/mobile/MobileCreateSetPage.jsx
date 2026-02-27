import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { loadSetsForFlow } from '../../lib/setsFlow.js'
import { createSet } from '../../services/setsApi.js'

function MobileCreateSetPage() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const { isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()

  const [setName, setSetName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isOnline) {
      const message = 'Sin internet. Crear grupos requiere conexion.'
      setError(message)
      showError(message)
      return
    }

    const trimmed = setName.trim()

    if (!trimmed) {
      const message = 'Ingresa un nombre de grupo.'
      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      await createSet(trimmed)
      await loadSetsForFlow()
      showSuccess('Grupo creado correctamente.')
      navigate(-1)
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo crear el grupo.')
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
        title="Crear grupo"
      />

      <article className="mobile-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre del grupo</span>
            <input
              name="setName"
              onChange={(event) => setSetName(event.target.value)}
              placeholder="Ej: Casa, Trabajo, Viajes..."
              required
              type="text"
              value={setName}
            />
          </label>

          {error && <p className="alert alert--error">{error}</p>}
          {!isOnline && (
            <p className="alert alert--info">Conectate a internet para crear el grupo.</p>
          )}

          <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
            {isSubmitting ? 'Creando...' : 'Guardar grupo'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default MobileCreateSetPage
