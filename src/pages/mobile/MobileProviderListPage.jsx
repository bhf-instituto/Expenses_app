import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { getSetNameFromSnapshot } from '../../lib/setsFlow.js'
import { loadOfflineSetData, syncCatalog } from '../../offline/syncService.js'

function MobileProviderListPage() {
  const navigate = useNavigate()
  const { setId } = useParams()
  const { isAuthenticated } = useAuth()
  const { showError } = useToast()
  const isOnline = useOnlineStatus()

  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [screenMessage, setScreenMessage] = useState('')

  const setName = getSetNameFromSnapshot(setId)

  useEffect(() => {
    if (!setId) return

    let isCancelled = false

    async function loadProviders() {
      setIsLoading(true)
      setScreenMessage('')

      try {
        if (isOnline) {
          await syncCatalog(setId)
        }

        const localData = await loadOfflineSetData(setId)

        if (isCancelled) return

        const nextProviders = localData.catalog.providers
        setProviders(nextProviders)

        if (!isOnline) {
          setScreenMessage('Sin conexion. Mostrando proveedores guardados localmente.')
        } else if (nextProviders.length === 0) {
          setScreenMessage('No hay proveedores en este grupo.')
        }
      } catch (error) {
        if (isCancelled) return
        const message = getErrorMessage(error, 'No se pudieron cargar los proveedores.')
        setScreenMessage(message)
        showError(message)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      isCancelled = true
    }
  }, [isOnline, setId, showError])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId) {
    return <Navigate to="/app/crear" replace />
  }

  function handlePickProvider(providerId) {
    navigate(`/app/grupos/${setId}/categorias/variable?providerId=${providerId}`)
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={setName ? { label: setName } : null}
        title="Proveedores"
      />

      <article className="mobile-card">
        <p className="mobile-caption">
          Elige proveedor para cargar un gasto variable.
        </p>

        <div className="mobile-scroll-list">
          {isLoading && <p>Cargando proveedores...</p>}

          {!isLoading && providers.length === 0 && (
            <p>No hay proveedores disponibles.</p>
          )}

          {!isLoading && providers.length > 0 && (
            <ul className="mobile-option-list">
              {providers.map((provider) => (
                <li key={provider.id}>
                  <button
                    className="mobile-option-button"
                    onClick={() => handlePickProvider(provider.id)}
                    type="button"
                  >
                    <strong>{provider.name}</strong>
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
          <button className="btn btn--primary mobile-wide-btn" onClick={() => navigate(`/app/grupos/${setId}/proveedores/nuevo`)} type="button">
            Crear proveedor
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileProviderListPage
