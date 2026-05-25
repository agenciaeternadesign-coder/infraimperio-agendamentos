import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/agenda':        'Agenda',
  '/rota':          'Rota do Dia',
  '/clientes':      'Clientes',
  '/nova-visita':   'Nova Visita de Orçamento',
  '/configuracoes': 'Configurações',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'Infraimpério'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            className="md:hidden text-slate-500 hover:text-slate-700 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MenuIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
}
