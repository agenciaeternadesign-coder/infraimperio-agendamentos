import { useNavigate, useLocation } from 'react-router-dom'

const NOMES = {
  '/equipa':     { titulo: 'Equipa',             icon: '👤' },
  '/ponto':      { titulo: 'Registo de Ponto',   icon: '⏰' },
  '/recibos':    { titulo: 'Gerador de Recibos', icon: '🧾' },
  '/lembretes':  { titulo: 'Lembretes Diários',  icon: '📌' },
  '/instrucoes': { titulo: 'Instruções',          icon: '📋' },
  '/premiacao':  { titulo: 'Premiação',           icon: '🏆' },
  '/orcamentos': { titulo: 'Orçamentos',          icon: '📄' },
  '/obras':      { titulo: 'Obras',               icon: '🏗️' },
}

export default function EmBreve() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const info = NOMES[pathname] || { titulo: 'Módulo', icon: '🔧' }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">{info.icon}</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{info.titulo}</h1>
      <p className="text-slate-500 mb-6 max-w-sm">
        Este módulo está em desenvolvimento e estará disponível em breve.
      </p>
      <button onClick={() => navigate('/')} className="btn-primary">
        ← Voltar ao Início
      </button>
    </div>
  )
}
