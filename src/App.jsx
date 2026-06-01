import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Hub from './pages/Hub'
import EmBreve from './pages/EmBreve'
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
            {/* Página inicial — Hub escuro */}
            <Route path="/" element={<Hub />} />

            {/* Módulos com sidebar */}
            <Route element={<Layout />}>
              <Route path="/pagamentos"   element={<Pagamentos />} />
              <Route path="/entregas"     element={<EntregaNotas />} />
              <Route path="/agenda"       element={<Agenda />} />
              <Route path="/rota"         element={<RotaDia />} />
              <Route path="/clientes"     element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="/nova-visita"  element={<NovaVisita />} />
              <Route path="/configuracoes" element={<Configuracoes />} />

              {/* Módulos em desenvolvimento */}
              <Route path="/equipa"     element={<EmBreve />} />
              <Route path="/ponto"      element={<EmBreve />} />
              <Route path="/recibos"    element={<EmBreve />} />
              <Route path="/lembretes"  element={<EmBreve />} />
              <Route path="/instrucoes" element={<EmBreve />} />
              <Route path="/premiacao"  element={<EmBreve />} />
              <Route path="/orcamentos" element={<EmBreve />} />
              <Route path="/obras"      element={<EmBreve />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  )
}
