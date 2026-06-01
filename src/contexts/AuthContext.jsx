import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  async function fetchEmpresa(userId) {
    if (!userId) { setEmpresa(null); return }
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .eq('owner_id', userId)
      .single()
    setEmpresa(data || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      fetchEmpresa(u?.id).finally(() => setLoadingAuth(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      fetchEmpresa(u?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchEmpresa(data.user?.id)
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setEmpresa(null)
  }

  async function register(nome, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const userId = data.user?.id
    if (userId) {
      const { data: empData } = await supabase
        .from('empresas')
        .insert({ owner_id: userId, nome, email })
        .select()
        .single()
      setEmpresa(empData || null)
    }
    return data
  }

  return (
    <AuthContext.Provider value={{ user, empresa, loadingAuth, login, logout, register, setEmpresa }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
