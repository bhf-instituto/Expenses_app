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

function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
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
      const message = 'Sin internet. El registro requiere conexion.'
      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      const createdUser = await register(form)

      if (createdUser) {
        showSuccess('Registro y sesion iniciada.')
        navigate('/app', { replace: true })
      } else {
        showSuccess('Registro correcto. Inicia sesion.')
        navigate('/login', { replace: true })
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo crear la cuenta.')
      setError(message)
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h1>Crear cuenta</h1>
      <p>Registrate para empezar a usar la app.</p>

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
            autoComplete="new-password"
            minLength={6}
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
            Registro deshabilitado en modo offline.
          </p>
        )}

        <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
          {isSubmitting ? 'Creando...' : 'Register'}
        </button>
      </form>

      <p className="helper">
        Ya tenes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </section>
  )
}

export default RegisterPage
