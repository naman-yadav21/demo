import { useCallback, useRef, useState } from 'react'
import { Toast } from '../components/ui/Toast.jsx'
import { ToastContext } from './toastContextValue.js'

const VALID_TONES = new Set(['success', 'error', 'warning', 'info'])

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const recentMessages = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, tone = 'success') => {
    const safeMessage = String(message || '').trim()
    if (!safeMessage) return null

    const safeTone = VALID_TONES.has(tone) ? tone : 'info'
    const key = `${safeTone}:${safeMessage}`
    const now = Date.now()
    const lastShownAt = recentMessages.current.get(key) || 0
    if (now - lastShownAt < 1400) return null
    recentMessages.current.set(key, now)
    for (const [recentKey, shownAt] of recentMessages.current) {
      if (now - shownAt > 15_000) recentMessages.current.delete(recentKey)
    }

    const toast = { id: ++nextId.current, message: safeMessage, tone: safeTone }
    setToasts((current) => [...current.slice(-2), toast])
    return toast.id
  }, [])

  return <ToastContext.Provider value={notify}>
    {children}
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => <Toast key={toast.id} {...toast} onDismiss={dismiss} />)}
    </div>
  </ToastContext.Provider>
}
