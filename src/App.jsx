import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import RotaDia from './pages/RotaDia'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import NovaVisita from './pages/NovaVisita'
import Configuracoes from './pages/Configuracoes'
import Pagamentos from './pages/Pagamentos'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
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
  )
}
