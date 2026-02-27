import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../lib/getErrorMessage.js'

const initialForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()
  const isOnline = useOnlineStatus()
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isOnline) {
      const message = 'Sin internet. El login requiere conexion.'
      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      await login(form)
      showSuccess('Login correcto.')
      navigate('/app', { replace: true })
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo iniciar sesion.')
      setError(message)
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h1>Iniciar sesion</h1>
      <p>Accede a tu cuenta para gestionar gastos.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        {error && <p className="alert alert--error">{error}</p>}
        {!isOnline && (
          <p className="alert alert--info">
            Estas offline. Puedes usar modo offline solo si ya iniciaste sesion antes.
          </p>
        )}

        <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
          {isSubmitting ? 'Ingresando...' : 'Login'}
        </button>
      </form>

      <p className="helper">
        No tenes cuenta? <Link to="/register">Registrate</Link>
      </p>
    </section>
  )
}

export default LoginPage
