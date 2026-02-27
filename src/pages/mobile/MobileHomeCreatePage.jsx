import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { loadSetsForFlow, persistActiveSet } from '../../lib/setsFlow.js'

function MobileHomeCreatePage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()

  const [sets, setSets] = useState([])
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [screenMessage, setScreenMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadSets() {
      setIsLoadingSets(true)
      setScreenMessage('')

      try {
        const result = await loadSetsForFlow()

        if (isCancelled) return
        setSets(result.sets)

        if (result.fromCache) {
          setScreenMessage('Sin conexion. Mostrando grupos guardados en este dispositivo.')
        }
      } catch (error) {
        if (isCancelled) return
        const message = getErrorMessage(error, 'No se pudieron cargar los grupos.')
        setScreenMessage(message)
        showError(message)
      } finally {
        if (!isCancelled) {
          setIsLoadingSets(false)
        }
      }
    }

    loadSets()

    return () => {
      isCancelled = true
    }
  }, [showError])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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

  function handleOpenSet(setItem) {
    const nextActiveSetId = persistActiveSet(sets, String(setItem.id))
    navigate(`/app/grupos/${nextActiveSetId}/tipo-gasto`)
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{
          label: isLoggingOut ? 'Saliendo...' : 'Salir',
          disabled: isLoggingOut,
          onClick: handleLogout,
          variant: 'danger',
        }}
        rightAction={{
          label: user?.email ?? 'Cuenta',
          onClick: () => navigate('/app/sincronizacion'),
        }}
        title="Inicio"
      />

      <article className="mobile-card">
        <div className="mobile-tabs">
          <button className="mobile-tabs__button is-active" type="button">
            Crear
          </button>
          <button className="mobile-tabs__button" disabled type="button">
            Editar (PC)
          </button>
        </div>

        <div className="mobile-scroll-list">
          {isLoadingSets && <p>Cargando grupos...</p>}
          {!isLoadingSets && sets.length === 0 && (
            <p>No tienes grupos todavia. Crea el primero para empezar.</p>
          )}
          {!isLoadingSets && sets.length > 0 && (
            <ul className="mobile-option-list">
              {sets.map((setItem) => (
                <li key={setItem.id}>
                  <button
                    className="mobile-option-button"
                    onClick={() => handleOpenSet(setItem)}
                    type="button"
                  >
                    {setItem.name}
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
          <button className="btn btn--primary mobile-wide-btn" onClick={() => navigate('/app/grupos/nuevo')} type="button">
            Crear grupo
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileHomeCreatePage
