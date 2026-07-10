import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, title, children, onClose, width = '720px' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const panel = panelRef.current
    const focusable = panel ? Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)) : []
    focusable[0]?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }

      if (event.key !== 'Tab' || focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmationModal({ open, title = 'Are you sure?', message, onCancel, onConfirm, confirmText = 'Delete' }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="420px">
      <div className="confirm-copy">
        <p>{message}</p>
        <div className="button-row">
          <button className="button ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="button danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
