import { formatDateTime } from './dateUtils'

const WORK_TYPE_LABELS = {
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
  fachada_frontal: 'Fachada Frontal',
  fachada_tardoz: 'Fachada Tardoz',
  fachada_empena: 'Fachada Empena',
  outro: 'Outro',
}

export function cleanPhone(phone) {
  const digits = (phone ?? '').replace(/[\s\-\(\)\+]/g, '')
  if (digits.startsWith('351') && digits.length >= 12) return digits
  if (digits.startsWith('00351')) return digits.slice(2)
  if (/^[29]\d{8}$/.test(digits)) return `351${digits}`
  return digits
}

export function buildWhatsAppUrl(phone, message) {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`
}

export function buildConfirmationMessage(visit, company) {
  return [
    `Olá ${visit.clientName.split(' ')[0]}! 👋`,
    ``,
    `A sua visita de orçamento com a *${company.name}* está confirmada:`,
    ``,
    `📅 ${formatDateTime(visit.date, visit.time)}`,
    `📍 ${visit.address.street} ${visit.address.number}, ${visit.address.city}`,
    `🔨 ${WORK_TYPE_LABELS[visit.workType] ?? visit.workType}`,
    ``,
    `Qualquer dúvida: ${company.phone}`,
    ``,
    `Até breve! 🏗️`,
  ].join('\n')
}

export function buildReminderMessage(visit, company, type) {
  const typeText = {
    reminder3days: 'daqui a *3 dias*',
    reminder1day:  '*amanhã*',
    reminderDay:   '*hoje*',
  }[type] ?? 'em breve'

  return [
    `Olá ${visit.clientName.split(' ')[0]}! 👋`,
    ``,
    `Lembrete: a sua visita de orçamento com a *${company.name}* é ${typeText}!`,
    ``,
    `📅 ${formatDateTime(visit.date, visit.time)}`,
    `📍 ${visit.address.street} ${visit.address.number}, ${visit.address.city}`,
    ``,
    `*${company.name}* — ${company.phone}`,
  ].join('\n')
}

export async function sendTwilioWhatsApp(phone, body, twilio) {
  const { accountSid, authToken, fromNumber } = twilio ?? {}
  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio não configurado' }
  }

  const toNumber = cleanPhone(phone)
  const fromClean = cleanPhone(fromNumber)

  try {
    // Use local proxy in dev, Vercel serverless function in production
    const proxyUrl = '/api/twilio-proxy'
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountSid, authToken, fromNumber: fromClean, toNumber, body }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success) return { success: true }
    return { success: false, error: data.error ?? `Erro HTTP ${res.status}` }
  } catch {
    return { success: false, error: 'Falha de rede ao contactar o proxy Twilio.' }
  }
}
