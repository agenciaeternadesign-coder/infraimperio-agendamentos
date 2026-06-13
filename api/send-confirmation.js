// Função serverless (Vercel) que envia a confirmação de WhatsApp via Twilio,
// usando um template aprovado pela Meta. Corre no servidor — as credenciais
// nunca chegam ao browser. A app chama POST /api/send-confirmation { visit }.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SID      = process.env.TWILIO_ACCOUNT_SID
  const TOKEN    = process.env.TWILIO_AUTH_TOKEN
  const FROM     = process.env.TWILIO_FROM_NUMBER || '+15559628126'
  const TEMPLATE = process.env.TWILIO_CONFIRM_TEMPLATE || 'HX406205197d504d5509b37d290c37ca0e'

  if (!SID || !TOKEN) return res.status(500).json({ success: false, error: 'Twilio não configurado no servidor' })

  // Aceita { visit: {...} } ou o objeto da visita diretamente
  const body  = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const visit = body.visit || body.data || body
  if (!visit?.clientPhone) return res.status(400).json({ success: false, error: 'sem telefone' })

  const phone  = '+' + String(visit.clientPhone).replace(/[^\d]/g, '')
  const addr   = visit.address || {}
  const morada = `${addr.street || ''} ${addr.number || ''}, ${addr.city || ''}`.replace(/\s+/g, ' ').trim()
  const hora   = visit.time || 'a confirmar'

  // URLSearchParams codifica corretamente o "+" (→ %2B) e o JSON das variáveis
  const form = new URLSearchParams({
    To: `whatsapp:${phone}`,
    From: `whatsapp:${FROM}`,
    ContentSid: TEMPLATE,
    ContentVariables: JSON.stringify({
      1: visit.clientName || '',
      2: visit.date || '',
      3: hora,
      4: morada,
    }),
  })

  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const data = await r.json()
    if (r.ok) return res.status(200).json({ success: true, sid: data.sid, status: data.status })
    return res.status(502).json({ success: false, error: data.message, code: data.code })
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) })
  }
}
