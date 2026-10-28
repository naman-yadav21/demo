import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal.jsx'

export function ConfirmationDialog({ open, title, message, confirmLabel = 'Confirm', busy = false, tone = 'danger', onConfirm, onCancel }) {
  const isDanger = tone === 'danger'
  const Icon = isDanger ? AlertTriangle : CheckCircle2
  const cancel = busy ? undefined : onCancel
  return <Modal open={open} title={title} onClose={cancel} className="modal-confirmation">
    <div className={`confirmation-content${isDanger ? ' is-danger' : ''}`}>
      <span><Icon size={20} /></span>
      <p>{message}</p>
    </div>
    <footer className="confirmation-actions">
      <button type="button" className="button button-secondary" onClick={cancel} disabled={busy}>Cancel</button>
      <button type="button" className={isDanger ? 'confirmation-danger-button' : 'button button-primary'} onClick={onConfirm} disabled={busy}>
        {busy ? 'Please wait…' : confirmLabel}
      </button>
    </footer>
  </Modal>
}
