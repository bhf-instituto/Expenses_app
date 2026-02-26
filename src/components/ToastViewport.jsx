import { useToast } from '../context/ToastContext.jsx'

function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <aside className="toasts" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article className={`toast toast--${toast.type}`} key={toast.id} role="status">
          <p>{toast.message}</p>
          <button
            aria-label="Cerrar notificacion"
            className="toast__close"
            onClick={() => dismissToast(toast.id)}
            type="button"
          >
            x
          </button>
        </article>
      ))}
    </aside>
  )
}

export default ToastViewport
