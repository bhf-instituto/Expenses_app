import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { getErrorMessage } from '../../lib/getErrorMessage.js'
import { createProvider } from '../../services/catalogApi.js'
import { syncCatalog } from '../../offline/syncService.js'

const initialForm = {
  name: '',
  contactName: '',
  phone: '',
}

function MobileCreateProviderPage() {
  const navigate = useNavigate()
  const { setId } = useParams()
  const isOnline = useOnlineStatus()
  const { isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()

  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId) {
    return <Navigate to="/app/crear" replace />
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isOnline) {
      const message = 'Sin internet. Crear proveedores requiere conexion.'
      setError(message)
      showError(message)
      return
    }

    const providerName = form.name.trim()

    if (!providerName) {
      const message = 'El nombre del proveedor es obligatorio.'
      setError(message)
      showError(message)
      return
    }

    setIsSubmitting(true)

    try {
      await createProvider(setId, form)
      await syncCatalog(setId)
      showSuccess('Proveedor creado.')
      navigate(-1)
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo crear el proveedor.')
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
        title="Crear proveedor"
      />

      <article className="mobile-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre</span>
            <input
              name="name"
              onChange={handleInputChange}
              placeholder="Ej: Supermercado X"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label className="field">
            <span>Contacto (opcional)</span>
            <input
              name="contactName"
              onChange={handleInputChange}
              placeholder="Persona de contacto"
              type="text"
              value={form.contactName}
            />
          </label>

          <label className="field">
            <span>Telefono (opcional)</span>
            <input
              name="phone"
              onChange={handleInputChange}
              placeholder="Numero de telefono"
              type="text"
              value={form.phone}
            />
          </label>

          {error && <p className="alert alert--error">{error}</p>}
          {!isOnline && (
            <p className="alert alert--info">Conectate a internet para crear proveedores.</p>
          )}

          <button className="btn btn--primary" disabled={isSubmitting || !isOnline} type="submit">
            {isSubmitting ? 'Guardando...' : 'Guardar proveedor'}
          </button>
        </form>
      </article>
    </section>
  )
}

export default MobileCreateProviderPage
