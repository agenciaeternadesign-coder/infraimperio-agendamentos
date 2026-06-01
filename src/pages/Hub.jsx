import { useNavigate, NavLink, Link } from 'react-router-dom'
import { useState } from 'react'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

function dataFormatada() {
  const d = new Date()
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

const MODULOS = [
  {
    id: 'pagamentos',
    icon: '💰',
    titulo: 'Pagamentos',
    desc: 'Folha de ponto mensal, gestão de funcionários, geração e envio de recibos salariais.',
    cor: 'from-red-500 to-orange-400',
    corAbrir: '#ef4444',
    rota: '/pagamentos',
  },
  {
    id: 'entregas',
    icon: '💵',
    titulo: 'Entregas de Dinheiro',
    desc: 'Registo e controlo do dinheiro entregue pelo chefe a cada funcionário.',
    cor: 'from-emerald-500 to-teal-400',
    corAbrir: '#10b981',
    rota: '/entregas',
  },
  {
    id: 'agendamentos',
    icon: '📅',
    titulo: 'Agendamentos',
    desc: 'Agenda de visitas a clientes, gestão de rotas diárias e histórico de visitas realizadas.',
    cor: 'from-orange-500 to-amber-400',
    corAbrir: '#f59e0b',
    rota: '/agenda',
  },
  {
    id: 'configuracoes',
    icon: '⚙️',
    titulo: 'Configurações',
    desc: 'Definições da empresa, preferências do sistema e dados de conta.',
    cor: 'from-slate-500 to-slate-400',
    corAbrir: '#94a3b8',
    rota: '/configuracoes',
  },
]

const NAV_LINKS = [
  { label: 'Início',       rota: '/',              end: true },
  { label: 'Pagamentos',   rota: '/pagamentos' },
  { label: 'Entregas',     rota: '/entregas' },
  { label: 'Agendamentos', rota: '/agenda' },
  { label: 'Configurações',rota: '/configuracoes' },
]

export default function Hub() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const dataHoje = dataFormatada()

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f1f36 100%)' }}>

      {/* ── Navbar ── */}
      <header style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                🏢
              </div>
              <div>
                <p className="text-white font-bold text-base leading-none tracking-wide">INFRAIMPÉRIO</p>
                <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Suite de Gestão — Obras &amp; Remodelações</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, rota, end }) => (
                <NavLink
                  key={rota}
                  to={rota}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button className="md:hidden text-white/70 hover:text-white p-2" onClick={() => setMenuOpen(v => !v)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-3 flex flex-wrap gap-1">
              {NAV_LINKS.map(({ label, rota, end }) => (
                <NavLink key={rota} to={rota} end={end} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-medium ${isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 text-center px-4">
        {/* Logo grande */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
          🏢
        </div>

        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          BEM-VINDA DE VOLTA
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
          Seja bem-vinda, <span style={{ color: '#e74c3c' }}>Alayane!</span> 👋
        </h1>
        <p className="text-base mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Suite de Gestão Infraimpério — Obras &amp; Remodelações
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          📅 {dataHoje}
        </div>
      </section>

      {/* ── Cards ── */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {MODULOS.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(m.rota)}
              className="text-left rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Barra colorida topo */}
              <div className={`h-1 bg-gradient-to-r ${m.cor} w-full`} />
              <div className="p-6">
                <div className="text-3xl mb-4">{m.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{m.titulo}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{m.desc}</p>
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: m.corAbrir }}>ABRIR →</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
