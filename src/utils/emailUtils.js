import emailjs from '@emailjs/browser'
import { formatDateTime } from './dateUtils'

function buildParams(visit, settings, type) {
  const { company } = settings
  return {
    to_name: visit.clientName,
    to_email: visit.clientEmail,
    visit_date: formatDateTime(visit.date, visit.time),
    visit_address: `${visit.address.street} ${visit.address.number}, ${visit.address.city}`,
    work_type: WORK_TYPES[visit.workType] ?? visit.workType,
    company_name: company.name,
    company_phone: company.phone,
    company_email: company.email,
    reminder_type: type,
  }
}

const WORK_TYPES = {
  remodelacao: 'Remodelação',
  construcao: 'Construção Nova',
  pintura: 'Pintura',
  instalacoes: 'Instalações',
  outro: 'Outro',
}

export async function sendConfirmationEmail(visit, settings) {
  const { emailjs: ejs } = settings
  if (!ejs.serviceId || !ejs.templateIdConfirmation || !ejs.publicKey) return false
  if (!visit.clientEmail) return false

  try {
    await emailjs.send(
      ejs.serviceId,
      ejs.templateIdConfirmation,
      buildParams(visit, settings, 'confirmação'),
      { publicKey: ejs.publicKey }
    )
    return true
  } catch (err) {
    console.error('EmailJS confirmation error:', err)
    return false
  }
}

export async function sendReminderEmail(visit, settings, type) {
  const { emailjs: ejs } = settings
  if (!ejs.serviceId || !ejs.templateIdReminder || !ejs.publicKey) return false
  if (!visit.clientEmail) return false

  const typeLabel = { reminder3days: '3 dias', reminder1day: '1 dia', reminderDay: 'hoje' }[type] ?? type

  try {
    await emailjs.send(
      ejs.serviceId,
      ejs.templateIdReminder,
      buildParams(visit, settings, typeLabel),
      { publicKey: ejs.publicKey }
    )
    return true
  } catch (err) {
    console.error('EmailJS reminder error:', err)
    return false
  }
}
