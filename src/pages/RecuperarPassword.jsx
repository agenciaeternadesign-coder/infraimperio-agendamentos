import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/redefinir-password',
      })
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar email de recuperação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold">GestãoPro</h1>
          <p className="text-brand-300 text-sm mt-1">Recuperar Password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-slate-800 text-xl font-semibold mb-2">Email enviado!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Verifique o seu email — enviámos um link para redefinir a password.
              </p>
              <Link to="/login" className="text-brand-600 text-sm hover:underline">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-slate-800 text-xl font-semibold mb-2">Recuperar password</h2>
              <p className="text-slate-500 text-sm mb-6">
                Insira o seu email e enviaremos um link para redefinir a password.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input
                    className="input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.pt"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'A enviar...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                <Link to="/login" className="text-brand-700 font-medium hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
