import { useNavigate, useLocation, Outlet, Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

const MODULOS = [
  {
    id: 'pagamentos',
    icon: '💰',
    titulo: 'Pagamentos',
    desc: 'Folha de ponto mensal, gestão de funcionários, geração e envio de recibos salariais.',
    cor: 'from-red-500 to-orange-400',
    rota: '/pagamentos',
  },
  {
    id: 'equipa',
    icon: '👤',
    titulo: 'Equipa',
    desc: 'Fichas de funcionários, vales, premiação e histórico por colaborador.',
    cor: 'from-teal-500 to-cyan-400',
    rota: '/equipa',
  },
  {
    id: 'ponto',
    icon: '⏰',
    titulo: 'Registo de Ponto',
    desc: 'Controlo de entradas e saídas diárias. Regista horas trabalhadas por funcionário.',
    cor: 'from-blue-500 to-indigo-400',
    rota: '/ponto',
  },
  {
    id: 'recibos',
    icon: '🧾',
    titulo: 'Gerador de Recibos',
    desc: 'Crie recibos de prestação de serviços personalizados e imprima-os em PDF com um clique.',
    cor: 'from-green-500 to-emerald-400',
    rota: '/recibos',
  },
  {
    id: 'agendamentos',
    icon: '📅',
    titulo: 'Agendamentos',
    desc: 'Agenda de visitas a clientes, gestão de rotas diárias e histórico de visitas realizadas.',
    cor: 'from-orange-500 to-amber-400',
    rota: '/agenda',
  },
  {
    id: 'lembretes',
    icon: '📌',
    titulo: 'Lembretes Diários',
    desc: 'Notas e tarefas do dia para não esquecer nada importante durante o trabalho.',
    cor: 'from-pink-500 to-fuchsia-400',
    rota: '/lembretes',
  },
  {
    id: 'instrucoes',
    icon: '📋',
    titulo: 'Instruções',
    desc: 'Bloco de notas interno da empresa. Regras, procedimentos e informações importantes da equipa.',
    cor: 'from-teal-500 to-green-400',
    rota: '/instrucoes',
  },
  {
    id: 'premiacao',
    icon: '🏆',
    titulo: 'Premiação',
    desc: 'Ranking mensal de fotos, entregas de chaves e reclamações. Regista pontos por funcionário.',
    cor: 'from-orange-500 to-yellow-400',
    rota: '/premiacao',
  },
  {
    id: 'orcamentos',
    icon: '📄',
    titulo: 'Orçamentos',
    desc: 'Crie e envie orçamentos detalhados para clientes. Controlo de aprovações e histórico.',
    cor: 'from-cyan-500 to-blue-400',
    rota: '/orcamentos',
  },
  {
    id: 'obras',
    icon: '🏗️',
    titulo: 'Obras',
    desc: 'Gestão de obras em curso. Acompanhe progresso, materiais e equipas por projeto.',
    cor: 'from-purple-500 to-violet-400',
    rota: '/obras',
  },
  {
    id: 'entregas',
    icon: '💵',
    titulo: 'Entregas de Dinheiro',
    desc: 'Registo e controlo do dinheiro entregue pelo chefe a cada funcionário. Confirmações e resumos mensais.',
    cor: 'from-emerald-500 to-teal-400',
    rota: '/entregas',
  },
]

const NAV_LINKS = [
  { label: 'Início',       rota: '/',           end: true },
  { label: 'Pagamentos',   rota: '/pagamentos'  },
  { label: 'Equipa',       rota: '/equipa'      },
  { label: 'Ponto',        rota: '/ponto'       },
  { label: 'Recibos',      rota: '/recibos'     },
  { label: 'Agendamentos', rota: '/agenda'      },
  { label: 'Lembretes',    rota: '/lembretes'   },
  { label: 'Instruções',   rota: '/instrucoes'  },
  { label: 'Premiação',    rota: '/premiacao'   },
  { label: 'Orçamentos',   rota: '/orcamentos'  },
  { label: 'Obras',        rota: '/obras'       },
  { label: 'Entregas',     rota: '/entregas'    },
]

function dataFormatada() {
  const d = new Date()
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export default function Hub() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dataHoje] = useState(dataFormatada)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f1f36 100%)' }}>
      {/* ── Navbar ── */}
      <header style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                🏢
              </div>
              <div>
                <p className="text-white font-bold text-base leading-none tracking-wide">INFRAIMPÉRIO</p>
                <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Suite de Gestão — Obras & Remodelações</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ label, rota, end }) => (
                <NavLink
                  key={rota}
                  to={rota}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-white/70 hover:text-white p-2"
              onClick={() => setMenuOpen(v => !v)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden pb-3 flex flex-wrap gap-1">
              {NAV_LINKS.map(({ label, rota, end }) => (
                <NavLink
                  key={rota}
                  to={rota}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`
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
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          🏢 INFRAIMPÉRIO
        </p>
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>BEM-VINDA DE VOLTA</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
          Bem-vinda, <span style={{ color: '#e74c3c' }}>Infraimpério!</span> 👋
        </h1>
        <p className="text-base mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Suite de Gestão Infraimpério — Obras &amp; Remodelações
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          📅 {dataHoje}
        </div>
      </section>

      {/* ── Cards grid ── */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MODULOS.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(m.rota)}
              className="text-left rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] group"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Colored top bar */}
              <div className={`h-1 rounded-full bg-gradient-to-r ${m.cor} mb-5 -mx-6 -mt-6 rounded-t-2xl`} />

              <div className="text-3xl mb-4">{m.icon}</div>
              <h3 className="text-white font-bold text-base mb-2">{m.titulo}</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{m.desc}</p>
              <p
                className="text-xs font-bold tracking-wide uppercase transition-colors"
                style={{ color: m.id === 'entregas' ? '#10b981' : getCorAbrir(m.cor) }}
              >
                ABRIR →
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

function getCorAbrir(gradiente) {
  if (gradiente.includes('red') || gradiente.includes('orange')) return '#ef4444'
  if (gradiente.includes('teal') || gradiente.includes('cyan')) return '#14b8a6'
  if (gradiente.includes('blue') || gradiente.includes('indigo')) return '#3b82f6'
  if (gradiente.includes('green') || gradiente.includes('emerald')) return '#10b981'
  if (gradiente.includes('pink') || gradiente.includes('fuchsia')) return '#ec4899'
  if (gradiente.includes('purple') || gradiente.includes('violet')) return '#8b5cf6'
  return '#f59e0b'
}
