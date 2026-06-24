// Função serverless (Vercel) que envia a confirmação de agendamento por SMS
// via Twilio. Corre no servidor — as credenciais nunca chegam ao browser.
// Usa um remetente alfanumérico ("Infraimp") em Portugal, por isso não precisa
// de número dedicado, verificação Meta nem templates. A app chama
// POST /api/send-confirmation { visit }.

function formatDatePT(iso) {
  // "2026-06-18" -> "18/06/2026"
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Normaliza para E.164. Números nacionais PT (9 dígitos) recebem o indicativo 351.
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 9) d = '351' + d
  return '+' + d
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SID   = process.env.TWILIO_ACCOUNT_SID
  const TOKEN = process.env.TWILIO_AUTH_TOKEN
  // Remetente alfanumérico (máx. 11 caracteres). Configurável por env.
  const FROM  = process.env.TWILIO_SMS_SENDER || 'Infraimp'

  if (!SID || !TOKEN) return res.status(500).json({ success: false, error: 'Twilio não configurado no servidor' })

  const body  = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const visit = body.visit || body.data || body
  if (!visit?.clientPhone) return res.status(400).json({ success: false, error: 'sem telefone' })

  const phone  = normalizePhone(visit.clientPhone)
  const addr   = visit.address || {}
  // Morada — omite partes vazias
  const moradaParts = [addr.street, addr.number, addr.city].filter(Boolean)
  const morada = moradaParts.length ? moradaParts.join(' ').replace(/\s+/g, ' ').trim() : ''
  const data   = formatDatePT(visit.date)
  const hora   = visit.time || ''
  // Nome — ignora títulos de cortesia na 1ª palavra
  const TITULOS = new Set(['sr', 'sra', 'dr', 'dra', 'prof', 'eng'])
  const nomeRaw = (visit.clientName || visit.name || '').trim()
  const palavras = nomeRaw.split(/\s+/).filter(Boolean)
  const primeiroNome = palavras.find(p => !TITULOS.has(p.toLowerCase().replace(/\.$/, ''))) || ''
  const kind   = body.kind || 'confirmacao'
  // Empresa config — pode vir no body (white-label) ou usa fallback de env/default
  const empresa     = body.empresa || {}
  const telContacto = empresa.tel      || process.env.EMPRESA_TEL      || '214 098 779'
  const waNumero    = empresa.whatsapp || process.env.EMPRESA_WHATSAPP || '351936279926'
  const contacto    = `Duvidas: ${telContacto} ou WhatsApp https://wa.me/${waNumero}. Ate breve!`

  // Partes opcionais da mensagem
  const saudacao    = primeiroNome ? `Ola ${primeiroNome}! ` : ''
  const horaTexto   = hora   ? `, as ${hora}` : ''
  const moradaTexto = morada ? `, em ${morada}` : ''

  const text = `${saudacao}Esta confirmada a visita para orcamento no dia ${data}${horaTexto}${moradaTexto}. Teremos todo o gosto em ajuda-lo.\n\n${contacto}`

  const form = new URLSearchParams({ To: phone, From: FROM, Body: text })

  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const out = await r.json()
    if (r.ok) return res.status(200).json({ success: true, sid: out.sid, status: out.status })
    return res.status(502).json({ success: false, error: out.message, code: out.code })
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) })
  }
}
