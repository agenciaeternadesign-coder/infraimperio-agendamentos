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

// Estado da confirmação por WhatsApp (independente do estado da agenda acima).
// Cores: pendente=cinza, confirmado=verde, remarcado=âmbar, cancelado=vermelho.
export const CONFIRM_CONFIG = {
  pendente:   { label: 'Pendente',   cls: 'bg-slate-100 text-slate-600' },
  confirmado: { label: 'Confirmado', cls: 'bg-green-100 text-green-700' },
  remarcado:  { label: 'Remarcado',  cls: 'bg-amber-100 text-amber-700' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
}

export const CONFIRM_STATUSES = Object.keys(CONFIRM_CONFIG)

export function ConfirmBadge({ status, size = 'sm', withIcon = true }) {
  const cfg = CONFIRM_CONFIG[status] ?? CONFIRM_CONFIG.pendente
  const pad = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${pad} ${cfg.cls}`} title="Estado da confirmação por WhatsApp">
      {withIcon && (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z" /></svg>
      )}
      {cfg.label}
    </span>
  )
}

export const WORK_TYPE_LABELS = {
  telhados: 'Telhados e Coberturas',
  claraboias: 'Claraboias',
  canalizacao: 'Canalização',
  carpintaria: 'Carpintaria',
  eletricidade: 'Eletricidade',
  estores: 'Estores e Persianas',
  isolamento: 'Isolamento',
  manutencao: 'Manutenção',
  montagens: 'Montagens',
  coluna_agua: 'Coluna de Água de Prédios',
  obras_construcao: 'Obras e Construção',
  pavimentos: 'Pavimentos',
  pintura: 'Pintura',
  piscinas: 'Piscinas',
  reabilitacao: 'Reabilitação',
  remodelacoes: 'Remodelações',
  serralharia: 'Serralharia',
  vidros: 'Vidros e Janelas',
  pladur: 'Obras em Pladur',
  // backward compat
  remodelacao: 'Remodelações',
  construcao: 'Obras e Construção',
  instalacoes: 'Instalações',
  outro: 'Outro',
}

// Devolve o rótulo do tipo de obra; se for "outro" e houver descrição, usa-a
export function workTypeLabel(workType, workTypeOther) {
  if (workType === 'outro' && workTypeOther?.trim()) return workTypeOther.trim()
  return WORK_TYPE_LABELS[workType] ?? workType
}

export function WorkTypeBadge({ type, other }) {
  const label = workTypeLabel(type, other)
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
      {label}
    </span>
  )
}
