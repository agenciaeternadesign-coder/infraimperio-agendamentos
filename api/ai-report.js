// Função serverless (Vercel) que gera relatório de produtividade com IA.
// A chave API Anthropic fica no servidor — nunca é exposta ao browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const API_KEY = process.env.ANTHROPIC_API_KEY
  if (!API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { resumo, month, year, empNome } = body

  if (!resumo && resumo !== '') return res.status(400).json({ error: 'Dados em falta' })

  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesLabel = MONTHS[parseInt(month)] || month

  const prompt = `És um assistente de gestão para uma empresa chamada ${empNome || 'a empresa'}. Com base nos dados abaixo, cria um relatório mensal de produtividade profissional e motivador em português europeu (PT-PT).

Mês: ${mesLabel} ${year}
Dados de produtividade (fotos enviadas do WhatsApp como prova de trabalho):
${resumo || 'Sem registos neste mês.'}

O relatório deve incluir:
1. Avaliação geral da produtividade do mês
2. Destaque para os colaboradores com mais registos (com reconhecimento genuíno)
3. Obras com maior atividade
4. Sugestão de prémio/bónus para o colaborador com melhor desempenho
5. Mensagem motivadora para o próximo mês

Tom: profissional, direto e motivador. Escreve em parágrafos. Máximo 300 palavras.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'Erro Anthropic' })
    return res.status(200).json({ text: data.content?.[0]?.text || '' })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
