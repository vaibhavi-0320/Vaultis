import { X, BadgeCheck, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const icons = {
  success: BadgeCheck,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert
}

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ type = 'info', title, message, link }) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, type, title, message, link }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  useEffect(() => {
    const handleApiError = (event) => {
      pushToast({
        type: event.detail?.type || 'error',
        title: event.detail?.title || 'Request failed',
        message: event.detail?.message || 'Something went wrong. Please try again.'
      })
    }

    window.addEventListener('vaultis:api-error', handleApiError)
    return () => window.removeEventListener('vaultis:api-error', handleApiError)
  }, [pushToast])

  const value = useMemo(() => ({ pushToast, dismiss }), [pushToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <Icon size={18} />
              <div className="toast-copy">
                <strong>{toast.title}</strong>
                {toast.message ? <span>{toast.message}</span> : null}
                {toast.link ? (
                  <a href={toast.link.href} target="_blank" rel="noreferrer">
                    {toast.link.label}
                  </a>
                ) : null}
              </div>
              <button className="icon-button subtle" onClick={() => dismiss(toast.id)} aria-label="Dismiss toast">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
