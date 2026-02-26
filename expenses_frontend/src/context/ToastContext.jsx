/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

const DEFAULT_DURATION = 3200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = crypto.randomUUID()
    const toast = { id, message, type }

    setToasts((prev) => [...prev, toast])

    window.setTimeout(() => {
      dismissToast(id)
    }, duration)

    return id
  }, [dismissToast])

  const value = useMemo(() => ({
    toasts,
    dismissToast,
    showToast,
    showSuccess(message, duration) {
      return showToast(message, 'success', duration)
    },
    showError(message, duration) {
      return showToast(message, 'error', duration)
    },
  }), [toasts, dismissToast, showToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
