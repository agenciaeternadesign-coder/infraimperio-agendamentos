import { useEffect, useState } from 'react'

// Sistema de toast global e leve: qualquer módulo (mesmo fora do React)
// chama showToast(msg, type) — o ToastContainer montado no Layout mostra-o.
let _listener = null
let _id = 0

export function showToast(message, type = 'info') {
  if (_listener) {
    _listener({ id: ++_id, message, type })
  } else {
    // Container ainda não montado — fallback silencioso para consola
    if (type === 'error') console.error('[Toast]', message)
    else console.log('[Toast]', message)
  }
}

const STYLES = {
  error:   'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  info:    'bg-slate-800 text-white',
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _listener = (t) => {
      setToasts((prev) => [...prev.slice(-3), t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 4500)
    }
    return () => { _listener = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type] ?? STYLES.info} px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-start gap-2 pointer-events-auto animate-[fadeIn_.2s_ease-out]`}
          role="alert"
        >
          <span className="flex-shrink-0">
            {t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}
          </span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-70 hover:opacity-100 flex-shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
