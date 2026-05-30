import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import RotaDia from './pages/RotaDia'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import NovaVisita from './pages/NovaVisita'
import Configuracoes from './pages/Configuracoes'
import Pagamentos from './pages/Pagamentos'
import Login from './pages/Login'
import Registo from './pages/Registo'

function PrivateRoute({ children }) {
  const { user, loadingAuth } = useAuth()
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-900">
        <div className="text-brand-300 text-sm">A carregar...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/registo" element={<Registo />} />

            {/* Protected routes */}
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/rota" element={<RotaDia />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="/nova-visita" element={<NovaVisita />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}
