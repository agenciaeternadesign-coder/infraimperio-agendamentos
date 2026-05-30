export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accountSid, authToken, fromNumber, toNumber, body } = req.body ?? {}

  if (!accountSid || !authToken || !fromNumber || !toNumber || !body) {
    return res.status(400).json({ error: 'Parâmetros em falta' })
  }

  const form = new URLSearchParams({
    From: `whatsapp:+${fromNumber}`,
    To:   `whatsapp:+${toNumber}`,
    Body: body,
  })

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    )

    const data = await twilioRes.json().catch(() => ({}))

    if (twilioRes.ok) {
      return res.status(200).json({ success: true, sid: data.sid })
    }
    return res.status(twilioRes.status).json({ success: false, error: data.message ?? `Erro ${twilioRes.status}` })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
