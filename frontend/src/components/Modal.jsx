import { X } from 'lucide-react'

export function Modal({ open, title, children, onClose, width = '720px' }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: width }} onClick={(event) => event.stopPropagation()}>
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
