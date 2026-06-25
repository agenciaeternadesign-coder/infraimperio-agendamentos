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

// Normaliza para E.164. Números nacionais PT (9 dígitos) recebem o indicativo 351.
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 9) d = '351' + d
  return '+' + d
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

  const in3 = dateStr(3)
  const in1 = dateStr(1)
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }

  // Ler config da empresa do Supabase (suite_kv) para white-label
  let empresa = {}
  try {
    const kvUrl = `${SUPA_URL}/rest/v1/suite_kv?key=eq.infraimperio_recibos_v1&select=value`
    const kvRes = await fetch(kvUrl, { headers })
    const kvData = await kvRes.json()
    if (Array.isArray(kvData) && kvData[0]?.value) {
      const parsed = JSON.parse(kvData[0].value)
      empresa = parsed.empresa || {}
    }
  } catch (e) { /* usa defaults */ }

  const empNome     = empresa.nome      || process.env.EMPRESA_NOME      || 'Infraimperio'
  const empTel      = empresa.tel       || process.env.EMPRESA_TEL       || '214 098 779'
  const empWa       = empresa.whatsapp  || process.env.EMPRESA_WHATSAPP  || '351936279926'

  let rows = []
  try {
    const url = `${SUPA_URL}/rest/v1/visits?select=id,data&or=(data->>date.eq.${in3},data->>date.eq.${in1})`
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
    if (v.date === in1) { key = 'reminder1day'; when = 'amanha' }
    else if (v.date === in3) { key = 'reminder3days'; when = 'daqui a 3 dias' }
    else continue
    if (v.smsSent && v.smsSent[key]) continue // já enviado

    const TITULOS_MAP = { 'sr.': 'Sr.', 'sra.': 'Sra.', 'dr.': 'Dr.', 'dra.': 'Dra.', 'prof.': 'Prof.', 'eng.': 'Eng.' }
    const nomeRaw  = (v.clientName || v.name || '').trim()
    const palavras = nomeRaw.split(/\s+/).filter(Boolean)
    const p0lower  = (palavras[0] || '').toLowerCase()
    const tratamento   = TITULOS_MAP[p0lower] || ''
    const primeiroNome = tratamento ? (palavras[1] || '') : (palavras[0] || '')
    const addr    = v.address || {}
    const moradaPartes = [
      [addr.street, addr.number].filter(Boolean).join(' '),
      addr.floor,
      addr.city,
      addr.postalCode,
    ].filter(Boolean)
    const morada  = moradaPartes.length ? moradaPartes.join(', ').replace(/\s+/g, ' ').trim() : ''
    const hora    = v.time    || ''
    const horaFim = v.timeEnd || ''
    const WORK_LABELS = {
      telhados: 'Telhados e Coberturas', claraboias: 'Claraboias', canalizacao: 'Canalizacao',
      carpintaria: 'Carpintaria', eletricidade: 'Eletricidade', estores: 'Estores e Persianas',
      isolamento: 'Isolamento', manutencao: 'Manutencao', montagens: 'Montagens',
      coluna_agua: 'Coluna de Agua de Predios', obras_construcao: 'Obras e Construcao',
      pavimentos: 'Pavimentos', pintura: 'Pintura', piscinas: 'Piscinas',
      reabilitacao: 'Reabilitacao', remodelacoes: 'Remodelacoes', serralharia: 'Serralharia',
      vidros: 'Vidros e Janelas', pladur: 'Obras em Pladur',
    }
    const tipoObra = (v.workType === 'outro' && v.workTypeOther?.trim())
      ? v.workTypeOther.trim()
      : (WORK_LABELS[v.workType] || v.workType || '')
    const temNome     = !!(tratamento && primeiroNome) || !!primeiroNome
    const saudacao    = tratamento && primeiroNome ? `${tratamento} ${primeiroNome}, `
                      : primeiroNome               ? `${primeiroNome}, `
                      : ''
    const tipoTexto   = tipoObra ? ` para - ${tipoObra},` : ''
    const horaTexto   = hora && horaFim ? `, entre as ${hora} e as ${horaFim}`
                      : hora            ? `, a partir das ${hora}`
                      : ''
    const moradaTexto = morada ? `, na ${morada}.` : '.'
    const inicio      = temNome ? 'lembrete: a sua visita de orçamento,' : 'Lembrete: a sua visita de orçamento,'
    const text = `${saudacao}${inicio}${tipoTexto} esta marcada para ${when} (${fmtDatePT(v.date)}${horaTexto})${moradaTexto}\nTeremos todo o gosto em ajudar. Para qualquer esclarecimento adicional podera contactar-nos atraves do numero ${empTel} ou do whatsapp https://wa.me/${empWa}.\nAte breve!`
    const form = new URLSearchParams({
      To: normalizePhone(v.clientPhone),
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

  return res.status(200).json({ in1, in3, enviados: results.filter(r => r.ok).length, results })
}
