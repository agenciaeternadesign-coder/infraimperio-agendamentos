import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Hub from './pages/Hub'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import RotaDia from './pages/RotaDia'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import NovaVisita from './pages/NovaVisita'
import Configuracoes from './pages/Configuracoes'
import Pagamentos from './pages/Pagamentos'
import EntregaNotas from './pages/EntregaNotas'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Hub — página inicial com tema escuro, sem sidebar */}
            <Route path="/" element={<Hub />} />

            {/* Módulos internos com layout sidebar */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/rota" element={<RotaDia />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="/nova-visita" element={<NovaVisita />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/entregas" element={<EntregaNotas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  )
}
