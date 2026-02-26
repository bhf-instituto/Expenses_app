import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../lib/getErrorMessage.js'
import { getHealth } from '../services/authApi.js'

function DashboardPage() {
  const navigate = useNavigate()
  const { user, refreshMe, logout } = useAuth()
  const { showError, showSuccess } = useToast()
  const [meError, setMeError] = useState('')
  const [healthResult, setHealthResult] = useState(null)
  const [healthError, setHealthError] = useState('')
  const [isLoadingMe, setIsLoadingMe] = useState(false)
  const [isLoadingHealth, setIsLoadingHealth] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleRefreshMe() {
    setMeError('')
    setIsLoadingMe(true)

    try {
      await refreshMe()
    } catch (requestError) {
      setMeError(getErrorMessage(requestError, 'No se pudo consultar /health/me.'))
    } finally {
      setIsLoadingMe(false)
    }
  }

  async function handleCheckHealth() {
    setHealthError('')
    setHealthResult(null)
    setIsLoadingHealth(true)

    try {
      const data = await getHealth()
      setHealthResult(data)
    } catch (requestError) {
      setHealthError(getErrorMessage(requestError, 'No se pudo consultar /health/me.'))
    } finally {
      setIsLoadingHealth(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
      showSuccess('Sesion cerrada.')
    } catch (requestError) {
      showError(getErrorMessage(requestError, 'La sesion local se cerro con aviso del servidor.'))
    } finally {
      navigate('/login', { replace: true })
      setIsLoggingOut(false)
    }
  }

  return (
    <section className="panel">
      <h1>Sesion activa</h1>
      <p>Desde aca validamos `health/me` y `logout`.</p>

      <div className="actions">
        <button className="btn" disabled={isLoadingMe} onClick={handleRefreshMe} type="button">
          {isLoadingMe ? 'Consultando health/me...' : 'Refrescar sesion (health/me)'}
        </button>

        <button
          className="btn"
          disabled={isLoadingHealth}
          onClick={handleCheckHealth}
          type="button"
        >
          {isLoadingHealth ? 'Consultando health/me...' : 'Probar health/me'}
        </button>

        <button
          className="btn btn--danger"
          disabled={isLoggingOut}
          onClick={handleLogout}
          type="button"
        >
          {isLoggingOut ? 'Cerrando sesion...' : 'Logout'}
        </button>
      </div>

      {meError && <p className="alert alert--error">{meError}</p>}
      {healthError && <p className="alert alert--error">{healthError}</p>}

      <div className="card">
        <h2>Respuesta de sesion (health/me)</h2>
        {user ? (
          <pre>{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <p>Sin datos de usuario. Proba con "Refrescar me".</p>
        )}
      </div>

      <div className="card">
        <h2>Respuesta de health/me (manual)</h2>
        {healthResult ? (
          <pre>{JSON.stringify(healthResult, null, 2)}</pre>
        ) : (
          <p>Aun no se ejecuto health.</p>
        )}
      </div>
    </section>
  )
}

export default DashboardPage
