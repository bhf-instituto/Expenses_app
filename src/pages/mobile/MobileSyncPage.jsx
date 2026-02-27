import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { loadSetsForFlow, persistActiveSet } from '../../lib/setsFlow.js'
import { downloadSetOffline, flushQueueAndSync, loadOfflineSetData, syncSet } from '../../offline/syncService.js'

function MobileSyncPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()
  const isOnline = useOnlineStatus()

  const [sets, setSets] = useState([])
  const [activeSetId, setActiveSetId] = useState('')
  const [syncState, setSyncState] = useState(null)
  const [queueItems, setQueueItems] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [isActionRunning, setIsActionRunning] = useState(false)
  const [screenMessage, setScreenMessage] = useState('')

  const pendingQueueCount = useMemo(
    () => queueItems.filter((item) => item.status === 'pending').length,
    [queueItems],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadSets() {
      setIsLoadingSets(true)
      setScreenMessage('')

      try {
        const result = await loadSetsForFlow()
        if (isCancelled) return

        setSets(result.sets)
        setActiveSetId(result.activeSetId)

        if (result.fromCache) {
          setScreenMessage('Sin conexion. Mostrando grupos guardados localmente.')
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

  useEffect(() => {
    if (!activeSetId) {
      setQueueItems([])
      setConflicts([])
      setSyncState(null)
      return
    }

    persistActiveSet(sets, activeSetId)

    loadOfflineSetData(activeSetId)
      .then((data) => {
        setQueueItems(data.queue)
        setConflicts(data.conflicts)
        setSyncState(data.syncState)
      })
      .catch((error) => {
        showError(getErrorMessage(error, 'No se pudieron leer los datos locales del grupo.'))
      })
  }, [activeSetId, sets, showError])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  async function runAction(action) {
    if (!activeSetId) return
    setIsActionRunning(true)

    try {
      await action()
      const data = await loadOfflineSetData(activeSetId)
      setQueueItems(data.queue)
      setConflicts(data.conflicts)
      setSyncState(data.syncState)
    } finally {
      setIsActionRunning(false)
    }
  }

  async function handleDownloadOffline() {
    if (!isOnline) {
      showError('Descargar grupo offline requiere conexion.')
      return
    }

    try {
      await runAction(async () => {
        const result = await downloadSetOffline(activeSetId)
        showSuccess(
          `Grupo descargado. Gastos: ${result.upserted}, eliminados: ${result.deleted}.`,
        )
      })
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo descargar el grupo.'))
    }
  }

  async function handlePullDelta() {
    if (!isOnline) {
      showError('Traer delta requiere conexion.')
      return
    }

    try {
      await runAction(async () => {
        const result = await syncSet(activeSetId, { includeCatalog: true })
        showSuccess(`Delta aplicado. Gastos: ${result.upserted}, eliminados: ${result.deleted}.`)
      })
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo traer el delta.'))
    }
  }

  async function handleSyncNow() {
    if (!isOnline) {
      showError('Subir cola + sync requiere conexion.')
      return
    }

    try {
      await runAction(async () => {
        const { queueResult, syncResult } = await flushQueueAndSync(activeSetId)
        showSuccess(
          `Sync ok. Cola procesada: ${queueResult.processed}, conflictos: ${queueResult.conflicts}, actualizados: ${syncResult.upserted}.`,
        )
      })
    } catch (error) {
      showError(getErrorMessage(error, 'No se pudo sincronizar.'))
    }
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={user?.email ? { label: user.email } : null}
        title="Sincronizacion"
      />

      <article className="mobile-card">
        <p className="mobile-caption">
          Estado de red: <strong>{isOnline ? 'ONLINE' : 'OFFLINE'}</strong>
        </p>

        {isLoadingSets && <p>Cargando grupos...</p>}

        {!isLoadingSets && sets.length > 0 && (
          <div className="mobile-select-group">
            <span>Grupo activo</span>
            <select
              name="activeSetId"
              onChange={(event) => setActiveSetId(event.target.value)}
              value={activeSetId}
            >
              {sets.map((setItem) => (
                <option key={setItem.id} value={setItem.id}>
                  {setItem.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isLoadingSets && sets.length === 0 && (
          <p>No hay grupos para sincronizar.</p>
        )}

        {screenMessage && (
          <p className="alert alert--info">{screenMessage}</p>
        )}

        <div className="mobile-sync-grid">
          <p>Ultima descarga: {syncState?.downloadedAt ?? 'sin descarga'}</p>
          <p>Ultimo sync: {syncState?.lastSyncAt ?? 'sin sync'}</p>
          <p>Cola pendiente: <strong>{pendingQueueCount}</strong></p>
          <p>Conflictos: <strong>{conflicts.length}</strong></p>
        </div>

        <div className="mobile-actions-stack">
          <button
            className="btn"
            disabled={!activeSetId || isActionRunning || !isOnline}
            onClick={handleDownloadOffline}
            type="button"
          >
            {isActionRunning ? 'Procesando...' : 'Descargar grupo offline'}
          </button>
          <button
            className="btn"
            disabled={!activeSetId || isActionRunning || !isOnline}
            onClick={handlePullDelta}
            type="button"
          >
            {isActionRunning ? 'Procesando...' : 'Traer delta'}
          </button>
          <button
            className="btn btn--primary"
            disabled={!activeSetId || isActionRunning || !isOnline}
            onClick={handleSyncNow}
            type="button"
          >
            {isActionRunning ? 'Procesando...' : 'Subir cola + Sync'}
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileSyncPage
