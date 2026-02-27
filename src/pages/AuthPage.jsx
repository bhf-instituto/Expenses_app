import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../lib/getErrorMessage.js'

const AUTH_TAB = {
  LOGIN: 'login',
  REGISTER: 'register',
}

const initialForm = {
  email: '',
  password: '',
}

function resolveTabFromPath(pathname) {
  if (pathname === '/register') return AUTH_TAB.REGISTER
  return AUTH_TAB.LOGIN
}

function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()
  const isOnline = useOnlineStatus()

  const [activeTab, setActiveTab] = useState(() => resolveTabFromPath(location.pathname))
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setActiveTab(resolveTabFromPath(location.pathname))
  }, [location.pathname])

  const submitLabel = useMemo(() => {
    if (activeTab === AUTH_TAB.REGISTER) {
      return isSubmitting ? 'Creando cuenta...' : 'Registrarse'
    }

    return isSubmitting ? 'Ingresando...' : 'Iniciar sesion'
  }, [activeTab, isSubmitting])

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab)
    setError('')
    navigate(nextTab === AUTH_TAB.REGISTER ? '/register' : '/login', { replace: true })
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isOnline) {
      const message = activeTab === AUTH_TAB.LOGIN
        ? 'Sin internet. El inicio de sesion requiere conexion.'
        : 'Sin internet. El registro requiere conexion.'

      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      if (activeTab === AUTH_TAB.LOGIN) {
        await login(form)
        showSuccess('Sesion iniciada.')
        navigate('/app', { replace: true })
        return
      }

      const createdUser = await register(form)

      if (createdUser) {
        showSuccess('Cuenta creada e inicio de sesion correcto.')
        navigate('/app', { replace: true })
      } else {
        showSuccess('Cuenta creada. Inicia sesion.')
        handleTabChange(AUTH_TAB.LOGIN)
      }
    } catch (requestError) {
      const fallback = activeTab === AUTH_TAB.LOGIN
        ? 'No se pudo iniciar sesion.'
        : 'No se pudo crear la cuenta.'

      const message = getErrorMessage(requestError, fallback)
      setError(message)
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-screen">
      <article className="panel auth-panel">
        <h1>Expenses App</h1>
        <p>Accede o crea tu cuenta para continuar.</p>

        <div className="auth-tabs" role="tablist">
          <button
            className={`auth-tabs__button ${activeTab === AUTH_TAB.LOGIN ? 'is-active' : ''}`}
            onClick={() => handleTabChange(AUTH_TAB.LOGIN)}
            type="button"
          >
            Iniciar sesion
          </button>
          <button
            className={`auth-tabs__button ${activeTab === AUTH_TAB.REGISTER ? 'is-active' : ''}`}
            onClick={() => handleTabChange(AUTH_TAB.REGISTER)}
            type="button"
          >
            Registrarse
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={handleInputChange}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="field">
            <span>Contrasena</span>
            <input
              autoComplete={activeTab === AUTH_TAB.REGISTER ? 'new-password' : 'current-password'}
              minLength={activeTab === AUTH_TAB.REGISTER ? 6 : undefined}
              name="password"
              onChange={handleInputChange}
              required
              type="password"
              value={form.password}
            />
          </label>

          {error && <p className="alert alert--error">{error}</p>}
          {!isOnline && (
            <p className="alert alert--info">
              Estas sin internet. Si ya tenias sesion, abre la app con una sesion guardada.
            </p>
          )}

          <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
            {submitLabel}
          </button>
        </form>
      </article>
    </section>
  )
}

export default AuthPage
