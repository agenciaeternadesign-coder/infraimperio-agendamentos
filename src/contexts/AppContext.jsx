import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { storage } from '../utils/storage'
import { sampleClients, sampleVisits, defaultSettings } from '../data/sampleData'
import { sendConfirmationEmail, sendReminderEmail } from '../utils/emailUtils'
import { daysUntilVisit, todayString } from '../utils/dateUtils'
import { toExportFormat, autoSyncToFile } from '../utils/exportUtils'

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
  }
}

export function AppProvider({ children }) {
  const [visits,      setVisits]      = useState([])
  const [clients,     setClients]     = useState([])
  const [settings,    setSettings]    = useState(defaultSettings)
  const [initialized, setInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedVisits   = storage.getVisits()
    const savedClients  = storage.getClients()
    const savedSettings = storage.getSettings()

    setVisits(savedVisits)
    setClients(savedClients)
    setSettings(mergeSettings(defaultSettings, savedSettings))
    setInitialized(true)
  }, [])

  // Persist visits
  useEffect(() => {
    if (!initialized) return
    storage.saveVisits(visits)
    // Auto-sync to local file if user activated it
    autoSyncToFile(toExportFormat(visits, clients))
  }, [visits, initialized, clients])

  // Persist clients
  useEffect(() => {
    if (!initialized) return
    storage.saveClients(clients)
  }, [clients, initialized])

  // Persist settings
  useEffect(() => {
    if (!initialized) return
    storage.saveSettings(settings)
  }, [settings, initialized])

  // Check and send pending reminders on load
  useEffect(() => {
    if (!initialized) return
    const today = todayString()
    const updated = visits.map((v) => {
      if (v.status === 'cancelado' || v.status === 'realizado') return v
      const days = daysUntilVisit(v.date)
      let changed = false
      let copy = { ...v, emailsSent: { ...v.emailsSent } }

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
      })
      return changed ? copy : v
    })

    const anyChanged = updated.some((v, i) => v !== visits[i])
    if (anyChanged) setVisits(updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  const genId = (p) => `${p}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const addVisit = useCallback(async (visitData) => {
    const newVisit = {
      ...visitData,
      id: visitData.id ?? genId('v'),
      emailsSent: visitData.emailsSent ?? { confirmation: false, reminder3days: false, reminder1day: false, reminderDay: false },
      createdAt: visitData.createdAt ?? new Date().toISOString(),
    }
    // Try sending confirmation email
    if (!newVisit.emailsSent.confirmation) {
      const sent = await sendConfirmationEmail(newVisit, settings)
      if (sent) newVisit.emailsSent = { ...newVisit.emailsSent, confirmation: true }
    }
    setVisits((prev) => [...prev, newVisit])
    return newVisit
  }, [settings])

  const updateVisit   = useCallback((id, updates) => setVisits((prev) => prev.map((v) => v.id === id ? { ...v, ...updates } : v)), [])
  const deleteVisit   = useCallback((id) => setVisits((prev) => prev.filter((v) => v.id !== id)), [])

  const addClient = useCallback((clientData) => {
    const newClient = { ...clientData, id: clientData.id ?? genId('c'), createdAt: clientData.createdAt ?? new Date().toISOString() }
    setClients((prev) => [...prev, newClient])
    return newClient
  }, [])
  const updateClient  = useCallback((id, updates) => setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c)), [])
  const deleteClient  = useCallback((id) => setClients((prev) => prev.filter((c) => c.id !== id)), [])

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => mergeSettings(prev, updates))
  }, [])

  const findDuplicateClient = useCallback((phone, email, excludeId = null) => {
    return clients.find((c) =>
      c.id !== excludeId &&
      ((phone && c.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')) ||
       (email && c.email.toLowerCase() === email.toLowerCase()))
    ) ?? null
  }, [clients])

  const getClientVisits  = useCallback((clientId) => visits.filter((v) => v.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)), [visits])
  const getTodayVisits   = useCallback(() => { const t = todayString(); return visits.filter((v) => v.date === t).sort((a, b) => a.time.localeCompare(b.time)) }, [visits])
  const getVisitsByDate  = useCallback((d) => visits.filter((v) => v.date === d).sort((a, b) => a.time.localeCompare(b.time)), [visits])

  return (
    <AppContext.Provider value={{
      visits, clients, settings,
      addVisit, updateVisit, deleteVisit,
      addClient, updateClient, deleteClient,
      updateSettings,
      findDuplicateClient, getClientVisits,
      getTodayVisits, getVisitsByDate,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
