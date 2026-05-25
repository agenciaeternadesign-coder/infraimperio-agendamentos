import { formatDateTime } from './dateUtils'

const WORK_TYPE_LABELS = {
  remodelacao: 'Remodelação',
  construcao: 'Construção Nova',
  pintura: 'Pintura',
  instalacoes: 'Instalações',
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

  const form = new URLSearchParams({
    From: `whatsapp:+${fromClean}`,
    To:   `whatsapp:+${toNumber}`,
    Body: body,
  })

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    )
    if (res.ok) return { success: true }
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.message ?? `Erro HTTP ${res.status}` }
  } catch {
    return {
      success: false,
      error: 'Falha de rede. Em produção o Twilio requer um backend proxy (CORS). Em localhost pode funcionar com extensão CORS.',
    }
  }
}
