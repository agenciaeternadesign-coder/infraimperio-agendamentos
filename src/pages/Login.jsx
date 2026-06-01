import { useState } from 'react'

const CORRECT_CODE = import.meta.env.VITE_ACCESS_CODE ?? 'infraimperio'

export default function Login({ onSuccess }) {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (code === CORRECT_CODE) {
        localStorage.setItem('infraimperio_auth', '1')
        onSuccess()
      } else {
        setError(true)
        setCode('')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BuildingIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Infraimpério</h1>
          <p className="text-slate-500 text-sm mt-1">Gestão de Agendamentos</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Código de acesso</label>
              <input
                type="password"
                className={`input text-center text-lg tracking-widest ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="••••••••"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(false) }}
                autoFocus
                autoComplete="current-password"
              />
              {error && (
                <p className="text-red-500 text-xs mt-1 text-center">Código incorreto. Tenta novamente.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!code || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <SpinIcon /> : <LockIcon />}
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Acesso restrito — Infraimpério &copy; 2026
        </p>
      </div>
    </div>
  )
}

function BuildingIcon() { return <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
function LockIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
function SpinIcon()     { return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> }
