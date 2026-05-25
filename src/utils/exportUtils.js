export function toExportFormat(visits, clients) {
  return visits.map((v) => {
    const client = clients.find((c) => c.id === v.clientId)
    return {
      id: v.id,
      cliente: {
        nome: v.clientName ?? '',
        telefone: v.clientPhone ?? '',
        email: v.clientEmail ?? '',
        morada: client
          ? `${client.address.street} ${client.address.number}, ${client.address.city}`
          : '',
      },
      data: v.date,
      hora: v.time,
      moradaVisita: `${v.address.street} ${v.address.number}, ${v.address.city}`,
      tipoObra: v.workType,
      estado: v.status,
      notificacoes: {
        confirmacao:   v.emailsSent?.confirmation   ?? false,
        lembrete3dias: v.emailsSent?.reminder3days  ?? false,
        lembrete1dia:  v.emailsSent?.reminder1day   ?? false,
        lembreteNoDia: v.emailsSent?.reminderDay    ?? false,
      },
      observacoes: v.observations ?? '',
      criadoEm: v.createdAt ?? new Date().toISOString(),
    }
  })
}

export function downloadJson(data, filename = 'appointments.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)) }
      catch { reject(new Error('Ficheiro JSON inválido')) }
    }
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'))
    reader.readAsText(file)
  })
}

function parseAddress(str) {
  const parts = (str ?? '').split(',')
  const city = parts.length > 1 ? parts[parts.length - 1].trim() : ''
  const street = parts[0]?.trim() ?? str
  const m = street.match(/^(.+?)\s+(\d+\S*)$/)
  return { street: m ? m[1] : street, number: m ? m[2] : '', city, postalCode: '' }
}

export function fromExportFormat(raw) {
  if (!Array.isArray(raw)) throw new Error('Formato inválido: esperado array JSON')
  return raw.map((item) => ({
    id: item.id ?? `v${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    clientId: '',
    clientName:  item.cliente?.nome     ?? '',
    clientPhone: item.cliente?.telefone ?? '',
    clientEmail: item.cliente?.email    ?? '',
    date: item.data ?? '',
    time: item.hora ?? '',
    address: parseAddress(item.moradaVisita),
    workType:     item.tipoObra    ?? 'outro',
    observations: item.observacoes ?? '',
    status:       item.estado      ?? 'agendado',
    emailsSent: {
      confirmation:   item.notificacoes?.confirmacao   ?? false,
      reminder3days:  item.notificacoes?.lembrete3dias ?? false,
      reminder1day:   item.notificacoes?.lembrete1dia  ?? false,
      reminderDay:    item.notificacoes?.lembreteNoDia ?? false,
    },
    createdAt: item.criadoEm ?? new Date().toISOString(),
  }))
}

// File System Access API — auto-sync to chosen local file (session-scoped)
let _fileHandle = null

export async function requestAutoSyncFile() {
  if (!window.showSaveFilePicker) return false
  try {
    _fileHandle = await window.showSaveFilePicker({
      suggestedName: 'appointments.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    })
    return true
  } catch {
    return false
  }
}

export async function autoSyncToFile(data) {
  if (!_fileHandle) return false
  try {
    const writable = await _fileHandle.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
    return true
  } catch {
    _fileHandle = null
    return false
  }
}

export function hasAutoSync() {
  return _fileHandle !== null
}
