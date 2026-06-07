import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { storage } from '../utils/storage'
import { supabase, isCloudEnabled } from '../utils/supabase'
import { sampleClients, sampleVisits, defaultSettings, sampleFuncionarios, sampleAcoes } from '../data/sampleData'
import { sendConfirmationEmail, sendReminderEmail } from '../utils/emailUtils'
import { sendTwilioWhatsApp, buildConfirmationMessage, buildReminderMessage } from '../utils/whatsappUtils'
import { daysUntilVisit, todayString } from '../utils/dateUtils'
import { toExportFormat, autoSyncToFile } from '../utils/exportUtils'

// Flag localStorage para saber se o app já foi inicializado antes
const APP_INIT_KEY = 'infraimperio_app_inited'

const AppContext = createContext(null)

function mergeSettings(defaults, saved) {
  if (!saved) return { ...defaults }
  return {
    ...defaults,
    ...saved,
    company:      { ...defaults.company,      ...saved.company },
    emailjs:      { ...defaults.emailjs,      ...saved.emailjs },
    workingHours: { ...defaults.workingHours, ...saved.workingHours },
    googleMaps:   { ...defaults.googleMaps,   ...saved.googleMaps },
    whatsapp: {
      ...defaults.whatsapp,
      ...saved.whatsapp,
      twilio: { ...defaults.whatsapp.twilio, ...saved.whatsapp?.twilio },
    },
    branding: { ...defaults.branding, ...saved.branding },
  }
}

const genId = (p) => `${p}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function dbLoadAll() {
  const [vRes, cRes, sRes] = await Promise.all([
    supabase.from('visits').select('data'),
    supabase.from('clients').select('data'),
    supabase.from('app_settings').select('data').eq('id', 'main').maybeSingle(),
  ])
  return {
    visits:   (vRes.data ?? []).map((r) => r.data),
    clients:  (cRes.data ?? []).map((r) => r.data),
    settings: sRes.data?.data ?? null,
  }
}

async function dbSave(table, row) {
  const { error } = await supabase.from(table).upsert(row)
  if (error) console.error(`[Supabase] erro ao guardar em ${table}:`, error.message)
}

async function dbSaveVisit(visit) {
  await dbSave('visits', { id: visit.id, data: visit, updated_at: new Date().toISOString() })
}

async function dbDeleteVisit(id) {
  const { error } = await supabase.from('visits').delete().eq('id', id)
  if (error) console.error('[Supabase] erro ao apagar visita:', error)
}

async function dbSaveClient(client) {
  await dbSave('clients', { id: client.id, data: client, updated_at: new Date().toISOString() })
}

async function dbDeleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) console.error('[Supabase] erro ao apagar cliente:', error)
}

async function dbSaveSettings(settings) {
  await dbSave('app_settings', { id: 'main', data: settings, updated_at: new Date().toISOString() })
}

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [visits,        setVisits]        = useState([])
  const [clients,       setClients]       = useState([])
  const [settings,      setSettings]      = useState(defaultSettings)
  const [funcionarios,  setFuncionarios]  = useState([])
  const [acoes,         setAcoes]         = useState([])
  const [initialized,   setInitialized]   = useState(false)
  const [loading,       setLoading]       = useState(true)

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // Só usa dados de exemplo na PRIMEIRA abertura (quando nunca houve dados reais)
      const neverInited = !localStorage.getItem(APP_INIT_KEY)
      if (isCloudEnabled) {
        try {
          const { visits: v, clients: c, settings: s } = await dbLoadAll()
          // Se nunca abriu antes E não há dados, usa exemplos para mostrar como funciona
          setVisits(v.length  ? v : (neverInited ? sampleVisits  : []))
          setClients(c.length ? c : (neverInited ? sampleClients : []))
          setSettings(mergeSettings(defaultSettings, s))
        } catch (err) {
          console.error('[Supabase] erro no carregamento inicial:', err)
          const v = storage.getVisits()
          const c = storage.getClients()
          const s = storage.getSettings()
          setVisits(v.length  ? v : (neverInited ? sampleVisits  : []))
          setClients(c.length ? c : (neverInited ? sampleClients : []))
          setSettings(mergeSettings(defaultSettings, s))
        }
      } else {
        const v = storage.getVisits()
        const c = storage.getClients()
        const s = storage.getSettings()
        setVisits(v.length  ? v : (neverInited ? sampleVisits  : []))
        setClients(c.length ? c : (neverInited ? sampleClients : []))
        setSettings(mergeSettings(defaultSettings, s))
      }
      // Carregar funcionários e ações (sempre do localStorage, nunca do Supabase)
      const savedFunc = storage.getFuncionarios()
      const savedAcoes = storage.getAcoes()
      setFuncionarios(savedFunc ?? sampleFuncionarios)
      setAcoes(savedAcoes ?? sampleAcoes)

      // Marcar que o app já foi aberto pelo menos uma vez
      localStorage.setItem(APP_INIT_KEY, '1')
      setLoading(false)
      setInitialized(true)
    }
    load()
  }, [])

  // ── Real-time subscriptions (cloud only) ────────────────────────────────────
  useEffect(() => {
    if (!isCloudEnabled || !initialized) return

    const channel = supabase.channel('infraimperio_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setVisits((prev) => prev.filter((v) => v.id !== payload.old.id))
        } else {
          setVisits((prev) => {
            const without = prev.filter((v) => v.id !== payload.new.id)
            return [...without, payload.new.data]
          })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setClients((prev) => prev.filter((c) => c.id !== payload.old.id))
        } else {
          setClients((prev) => {
            const without = prev.filter((c) => c.id !== payload.new.id)
            return [...without, payload.new.data]
          })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        if (payload.new?.data) setSettings(mergeSettings(defaultSettings, payload.new.data))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialized])

  // ── Persist to localStorage (offline fallback) ──────────────────────────────
  useEffect(() => {
    if (!initialized) return
    storage.saveVisits(visits)
    autoSyncToFile(toExportFormat(visits, clients))
  }, [visits, initialized, clients])

  useEffect(() => { if (initialized) storage.saveClients(clients) }, [clients, initialized])
  useEffect(() => { if (initialized) storage.saveSettings(settings) }, [settings, initialized])
  useEffect(() => { if (initialized) storage.saveFuncionarios(funcionarios) }, [funcionarios, initialized])
  useEffect(() => { if (initialized) storage.saveAcoes(acoes) }, [acoes, initialized])

  // ── Auto-send pending email + WhatsApp reminders on load ───────────────────
  useEffect(() => {
    if (!initialized) return
    const today = todayString()
    const twilio   = settings.whatsapp?.twilio
    const hasTwilio = !!(twilio?.accountSid && twilio?.authToken && twilio?.fromNumber)
    const updated = visits.map((v) => {
      if (v.status === 'cancelado' || v.status === 'realizado') return v
      const days = daysUntilVisit(v.date)
      let copy = {
        ...v,
        emailsSent:    { ...v.emailsSent },
        whatsappSent:  { ...v.whatsappSent },
      }
      let changed = false
      const checks = [
        { key: 'reminderDay',   cond: v.date === today },
        { key: 'reminder1day',  cond: days === 1 },
        { key: 'reminder3days', cond: days === 3 },
      ]
      checks.forEach(({ key, cond }) => {
        if (cond && !copy.emailsSent?.[key]) {
          sendReminderEmail(copy, settings, key)
          copy.emailsSent[key] = true
          changed = true
        }
        if (cond && hasTwilio && copy.clientPhone && !copy.whatsappSent?.[key]) {
          const msg = buildReminderMessage(copy, settings.company, key)
          sendTwilioWhatsApp(copy.clientPhone, msg, twilio)
          copy.whatsappSent[key] = true
          changed = true
        }
      })
      return changed ? copy : v
    })
    const anyChanged = updated.some((v, i) => v !== visits[i])
    if (anyChanged) setVisits(updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const addVisit = useCallback(async (visitData) => {
    const newVisit = {
      ...visitData,
      id: visitData.id ?? genId('v'),
      emailsSent:   visitData.emailsSent   ?? { confirmation: false, reminder3days: false, reminder1day: false, reminderDay: false },
      whatsappSent: visitData.whatsappSent ?? { confirmation: false, reminder3days: false, reminder1day: false, reminderDay: false },
      createdAt: visitData.createdAt ?? new Date().toISOString(),
    }
    // ── Confirmação por email ──
    if (!newVisit.emailsSent.confirmation) {
      const sent = await sendConfirmationEmail(newVisit, settings)
      if (sent) newVisit.emailsSent = { ...newVisit.emailsSent, confirmation: true }
    }
    // ── Confirmação por WhatsApp (se Twilio configurado) ──
    const twilio = settings.whatsapp?.twilio
    if (!newVisit.whatsappSent.confirmation && newVisit.clientPhone &&
        twilio?.accountSid && twilio?.authToken && twilio?.fromNumber) {
      const msg = buildConfirmationMessage(newVisit, settings.company)
      const result = await sendTwilioWhatsApp(newVisit.clientPhone, msg, twilio)
      if (result.success) newVisit.whatsappSent = { ...newVisit.whatsappSent, confirmation: true }
    }
    setVisits((prev) => [...prev, newVisit])
    if (isCloudEnabled) await dbSaveVisit(newVisit)
    return newVisit
  }, [settings])

  const updateVisit = useCallback(async (id, updates) => {
    let updated
    setVisits((prev) => prev.map((v) => {
      if (v.id !== id) return v
      updated = { ...v, ...updates }
      return updated
    }))
    if (isCloudEnabled && updated) await dbSaveVisit(updated)
  }, [])

  const deleteVisit = useCallback(async (id) => {
    setVisits((prev) => prev.filter((v) => v.id !== id))
    if (isCloudEnabled) await dbDeleteVisit(id)
  }, [])

  const addClient = useCallback(async (clientData) => {
    const newClient = { ...clientData, id: clientData.id ?? genId('c'), createdAt: clientData.createdAt ?? new Date().toISOString() }
    setClients((prev) => [...prev, newClient])
    if (isCloudEnabled) await dbSaveClient(newClient)
    return newClient
  }, [])

  const updateClient = useCallback(async (id, updates) => {
    let updated
    setClients((prev) => prev.map((c) => {
      if (c.id !== id) return c
      updated = { ...c, ...updates }
      return updated
    }))
    if (isCloudEnabled && updated) await dbSaveClient(updated)
  }, [])

  const deleteClient = useCallback(async (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    if (isCloudEnabled) await dbDeleteClient(id)
  }, [])

  const updateSettings = useCallback(async (updates) => {
    setSettings((prev) => {
      const next = mergeSettings(prev, updates)
      if (isCloudEnabled) dbSaveSettings(next)
      return next
    })
  }, [])

  // ── Funcionários & Ações de Premiação ──────────────────────────────────────
  const addFuncionario = useCallback((data) => {
    const novo = { ...data, id: genId('f'), createdAt: new Date().toISOString().split('T')[0] }
    setFuncionarios((prev) => [...prev, novo])
  }, [])

  const deleteFuncionario = useCallback((id) => {
    setFuncionarios((prev) => prev.filter((f) => f.id !== id))
    setAcoes((prev) => prev.filter((a) => a.funcionarioId !== id))
  }, [])

  const addAcao = useCallback((data) => {
    const nova = { ...data, id: genId('a') }
    setAcoes((prev) => [...prev, nova])
  }, [])

  const deleteAcao = useCallback((id) => {
    setAcoes((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────

  const findDuplicateClient = useCallback((phone, email, excludeId = null) =>
    clients.find((c) =>
      c.id !== excludeId &&
      ((phone && c.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')) ||
       (email && c.email.toLowerCase() === email.toLowerCase()))
    ) ?? null
  , [clients])

  const getClientVisits  = useCallback((clientId) => visits.filter((v) => v.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)), [visits])
  const getTodayVisits   = useCallback(() => { const t = todayString(); return visits.filter((v) => v.date === t).sort((a, b) => a.time.localeCompare(b.time)) }, [visits])
  const getVisitsByDate  = useCallback((d) => visits.filter((v) => v.date === d).sort((a, b) => a.time.localeCompare(b.time)), [visits])

  // Memoizar o valor do contexto: evita re-renders em cascata quando o provider re-renderiza
  const contextValue = useMemo(() => ({
    visits, clients, settings, loading,
    funcionarios, acoes,
    addVisit, updateVisit, deleteVisit,
    addClient, updateClient, deleteClient,
    updateSettings,
    addFuncionario, deleteFuncionario,
    addAcao, deleteAcao,
    findDuplicateClient, getClientVisits,
    getTodayVisits, getVisitsByDate,
  }), [
    visits, clients, settings, loading,
    funcionarios, acoes,
    addVisit, updateVisit, deleteVisit,
    addClient, updateClient, deleteClient,
    updateSettings,
    addFuncionario, deleteFuncionario,
    addAcao, deleteAcao,
    findDuplicateClient, getClientVisits,
    getTodayVisits, getVisitsByDate,
  ])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
