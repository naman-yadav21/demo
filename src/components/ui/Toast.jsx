import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

const toastDurations = {
  success: 4000,
  info: 4500,
  warning: 5500,
  error: 7000,
}

export function Toast({ id, message, tone = 'success', onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), toastDurations[tone] || 4500)
    return () => window.clearTimeout(timer)
  }, [id, onDismiss, tone])

  const Icon = toastIcons[tone] || Info
  const urgent = tone === 'error'
  return <div className={`toast toast-${tone}`} role={urgent ? 'alert' : 'status'} aria-live={urgent ? 'assertive' : 'polite'} aria-atomic="true" tabIndex="0">
    <span className="toast-icon" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
    <span className="toast-message">{message}</span>
    <button type="button" onClick={() => onDismiss(id)} aria-label="Dismiss notification"><X size={16} /></button>
  </div>
}
