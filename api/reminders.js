// Vercel Cron (diário) — envia lembretes SMS via Twilio:
//   • 2 dias antes da visita (com o horário)
//   • no próprio dia da visita
// Lê os agendamentos do Supabase, evita duplicados (flag smsSent) e marca os enviados.

function fmtDatePT(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function dateStr(offsetDays) {
  const t = new Date()
  t.setUTCDate(t.getUTCDate() + offsetDays)
  return t.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  const SUPA_URL = process.env.VITE_SUPABASE_URL
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const SID = process.env.TWILIO_ACCOUNT_SID
  const TOKEN = process.env.TWILIO_AUTH_TOKEN
  const FROM = process.env.TWILIO_SMS_SENDER || 'Infraimp'
  if (!SUPA_URL || !SUPA_KEY || !SID || !TOKEN) {
    return res.status(500).json({ error: 'Variáveis de ambiente em falta' })
  }

  const today = dateStr(0)
  const in2 = dateStr(2)
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }

  let rows = []
  try {
    const url = `${SUPA_URL}/rest/v1/visits?select=id,data&or=(data->>date.eq.${today},data->>date.eq.${in2})`
    const r = await fetch(url, { headers })
    rows = await r.json()
  } catch (e) {
    return res.status(502).json({ error: 'Falha a ler Supabase', detail: String(e) })
  }

  const results = []
  for (const row of (Array.isArray(rows) ? rows : [])) {
    const v = row.data || {}
    if (!v.clientPhone || v.status === 'cancelado' || v.status === 'realizado') continue

    let key, when
    if (v.date === today) { key = 'reminderDay'; when = 'hoje' }
    else if (v.date === in2) { key = 'reminder2days'; when = 'daqui a 2 dias' }
    else continue
    if (v.smsSent && v.smsSent[key]) continue // já enviado

    const nome = (v.clientName || '').split(' ')[0]
    const addr = v.address || {}
    const morada = `${addr.street || ''} ${addr.number || ''}, ${addr.city || ''}`.replace(/\s+/g, ' ').trim()
    const hora = v.time || 'a confirmar'
    const text = `Ola ${nome}! Lembrete: a sua visita de orcamento com a Infraimperio e ${when} (${fmtDatePT(v.date)} as ${hora}) em ${morada}. Duvidas: ligue +351 212 345 678 ou WhatsApp https://wa.me/351936279926 . Ate breve!`
    const form = new URLSearchParams({
      To: '+' + String(v.clientPhone).replace(/[^\d]/g, ''),
      From: FROM,
      Body: text,
    })

    let ok = false, sid = null, err = null
    try {
      const tr = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      })
      const td = await tr.json()
      if (tr.ok) { ok = true; sid = td.sid } else { err = td.message }
    } catch (e) { err = String(e) }

    if (ok) {
      const newData = { ...v, smsSent: { ...(v.smsSent || {}), [key]: true } }
      try {
        await fetch(`${SUPA_URL}/rest/v1/visits?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ data: newData, updated_at: new Date().toISOString() }),
        })
      } catch (e) { /* ignora — reenvio fica protegido pelo flag na próxima */ }
    }
    results.push({ to: v.clientPhone, key, ok, sid, err })
  }

  return res.status(200).json({ today, in2, enviados: results.filter(r => r.ok).length, results })
}
