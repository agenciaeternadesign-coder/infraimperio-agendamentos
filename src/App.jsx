import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import Layout from './components/Layout'
import { applyBrandColors } from './utils/brandColors'

// Lazy load: cada página só carrega quando for aberta pela 1ª vez
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Agenda         = lazy(() => import('./pages/Agenda'))
const RotaDia        = lazy(() => import('./pages/RotaDia'))
const Clientes       = lazy(() => import('./pages/Clientes'))
const ClienteDetalhe = lazy(() => import('./pages/ClienteDetalhe'))
const NovaVisita     = lazy(() => import('./pages/NovaVisita'))
const Configuracoes  = lazy(() => import('./pages/Configuracoes'))
const Premiacao      = lazy(() => import('./pages/Premiacao'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )
}

function BrandSync() {
  const { settings } = useApp()
  useEffect(() => {
    const primary = settings.branding?.primaryColor ?? '#b91c1c'
    const accent  = settings.branding?.accentColor  ?? '#d97706'
    applyBrandColors(primary, accent)
  }, [settings.branding])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <BrandSync />
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/rota" element={<RotaDia />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="/nova-visita" element={<NovaVisita />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/premiacao" element={<Premiacao />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </AppProvider>
  )
}
