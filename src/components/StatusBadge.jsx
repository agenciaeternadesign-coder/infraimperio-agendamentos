const CONFIG = {
  agendado:  { label: 'Agendado',  cls: 'bg-blue-100 text-blue-700' },
  confirmado: { label: 'Confirmado', cls: 'bg-green-100 text-green-700' },
  realizado:  { label: 'Realizado',  cls: 'bg-slate-100 text-slate-600' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = CONFIG[status] ?? CONFIG.agendado
  const pad = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${pad} ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export const WORK_TYPE_LABELS = {
  remodelacao: 'Remodelações',
  construcao: 'Obras e Construção',
  pintura: 'Pintura',
  instalacoes: 'Eletricidade',
  telhados: 'Telhados e Coberturas',
  claraboias: 'Claraboias',
  canalizacao: 'Canalização',
  desentupimentos: 'Desentupimentos',
  carpintaria: 'Carpintaria',
  estores: 'Estores e Persianas',
  isolamento: 'Isolamento',
  manutencao: 'Manutenção',
  montagens: 'Montagens',
  coluna_agua: 'Coluna de Água de Prédios',
  pavimentos: 'Pavimentos',
  piscinas: 'Piscinas',
  reabilitacao: 'Reabilitação',
  serralharia: 'Serralharia',
  vidros: 'Vidros e Janelas',
  pladur: 'Obras em Pladur',
  outro: 'Outro',
}

export function WorkTypeBadge({ type }) {
  const label = WORK_TYPE_LABELS[type] ?? type
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
      {label}
    </span>
  )
}
