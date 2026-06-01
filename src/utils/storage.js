const KEYS = {
  visits: 'infraimperio_visits',
  clients: 'infraimperio_clients',
  settings: 'infraimperio_settings',
  funcionarios: 'infraimperio_funcionarios',
  acoes: 'infraimperio_acoes',
}

function get(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('localStorage write failed')
  }
}

export const storage = {
  getVisits: () => get(KEYS.visits) ?? [],
  saveVisits: (v) => set(KEYS.visits, v),
  getClients: () => get(KEYS.clients) ?? [],
  saveClients: (c) => set(KEYS.clients, c),
  getSettings: () => get(KEYS.settings),
  saveSettings: (s) => set(KEYS.settings, s),
  getFuncionarios: () => get(KEYS.funcionarios),
  saveFuncionarios: (f) => set(KEYS.funcionarios, f),
  getAcoes: () => get(KEYS.acoes),
  saveAcoes: (a) => set(KEYS.acoes, a),
}
