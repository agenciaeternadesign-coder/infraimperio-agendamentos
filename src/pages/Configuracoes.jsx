import { useState, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { toExportFormat, downloadJson, readJsonFile, fromExportFormat, requestAutoSyncFile, hasAutoSync } from '../utils/exportUtils'
import { applyBrandColors } from '../utils/brandColors'

const PRESET_THEMES = [
  { label: 'Vermelho & Dourado',  primary: '#b91c1c', accent: '#d97706' },
  { label: 'Azul & Ouro',         primary: '#1e3a5f', accent: '#ca8a04' },
  { label: 'Verde & Dourado',     primary: '#14532d', accent: '#d97706' },
  { label: 'Roxo & Rosa',         primary: '#6d28d9', accent: '#db2777' },
  { label: 'Cinzento & Vermelho', primary: '#374151', accent: '#dc2626' },
  { label: 'Laranja & Azul',      primary: '#c2410c', accent: '#1d4ed8' },
]

export default function Configuracoes() {
  const { settings, updateSettings, visits, clients, addVisit } = useApp()
  const [company,  setCompany]  = useState(settings.company)
  const [emailjs,  setEmailjs]  = useState(settings.emailjs)
  const [hours,    setHours]    = useState(settings.workingHours)
  const [mapsKey,  setMapsKey]  = useState(settings.googleMaps?.apiKey ?? '')
  const [twilio,   setTwilio]   = useState(settings.whatsapp?.twilio ?? { accountSid: '', authToken: '', fromNumber: '' })
  const [branding, setBranding] = useState(settings.branding ?? { primaryColor: '#b91c1c', accentColor: '#d97706', logoUrl: '' })
  const [saved,    setSaved]    = useState(false)
  const [showMapsKey, setShowMapsKey]   = useState(false)
  const [showTwilioKey, setShowTwilioKey] = useState(false)
  const [autoSync, setAutoSync] = useState(hasAutoSync())
  const [importStatus, setImportStatus] = useState(null)
  const importRef = useRef(null)
  const logoRef   = useRef(null)

  function setC(k, v) { setCompany((f) => ({ ...f, [k]: v })) }
  function setE(k, v) { setEmailjs((f) => ({ ...f, [k]: v })) }
  function setH(k, v) { setHours((f) => ({ ...f, [k]: v })) }
  function setT(k, v) { setTwilio((f) => ({ ...f, [k]: v })) }
  function setB(k, v) {
    setBranding((f) => {
      const next = { ...f, [k]: v }
      applyBrandColors(next.primaryColor, next.accentColor)
      return next
    })
  }

  function applyPreset(theme) {
    setBranding((f) => ({ ...f, primaryColor: theme.primary, accentColor: theme.accent }))
    applyBrandColors(theme.primary, theme.accent)
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const logoUrl = ev.target.result
      setBranding((f) => ({ ...f, logoUrl }))
      updateSettings({ branding: { ...branding, logoUrl } })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleRemoveLogo() {
    setBranding((f) => ({ ...f, logoUrl: '' }))
    updateSettings({ branding: { ...branding, logoUrl: '' } })
  }

  function handleSave(e) {
    e.preventDefault()
    updateSettings({
      company,
      emailjs,
      workingHours: hours,
      googleMaps: { apiKey: mapsKey },
      whatsapp: { twilio },
      branding,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleExport() {
    const data = toExportFormat(visits, clients)
    downloadJson(data, 'appointments.json')
  }

  async function handleEnableAutoSync() {
    const ok = await requestAutoSyncFile()
    setAutoSync(ok)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus(null)
    try {
      const raw  = await readJsonFile(file)
      const data = fromExportFormat(raw)
      data.forEach((v) => addVisit(v))
      setImportStatus({ ok: true, count: data.length })
    } catch (err) {
      setImportStatus({ ok: false, error: err.message })
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Company ── */}
        <Section title="Dados da Empresa" icon={<BuildingIcon />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome da empresa</label>
              <input className="input" value={company.name} onChange={(e) => setC('name', e.target.value)} />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="label">Rua (sede)</label>
                <input className="input" value={company.street} onChange={(e) => setC('street', e.target.value)} />
              </div>
              <div>
                <label className="label">Número</label>
                <input className="input" value={company.number} onChange={(e) => setC('number', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={company.city} onChange={(e) => setC('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Código Postal</label>
              <input className="input" value={company.postalCode ?? ''} onChange={(e) => setC('postalCode', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" type="tel" value={company.phone} onChange={(e) => setC('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={company.email} onChange={(e) => setC('email', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── Working hours ── */}
        <Section title="Horário de Trabalho" icon={<ClockIcon />}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Abertura</label>
              <input className="input" type="time" value={hours.start} onChange={(e) => setH('start', e.target.value)} />
            </div>
            <span className="text-slate-400 mt-5">até</span>
            <div className="flex-1">
              <label className="label">Fecho</label>
              <input className="input" type="time" value={hours.end} onChange={(e) => setH('end', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── Google Maps ── */}
        <Section title="Google Maps" icon={<MapsIcon />}>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-xs text-blue-800">
            <p className="font-semibold mb-2">Como obter a API Key (gratuita até 200 USD/mês)</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Aceda ao <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a> e crie/seleccione um projecto</li>
              <li>Active a <strong>Maps JavaScript API</strong></li>
              <li>Active a <strong>Directions API</strong></li>
              <li>Vá a <strong>Credenciais → Criar credencial → Chave de API</strong></li>
              <li>Copie a chave e cole abaixo — recomenda-se restringir por domínio</li>
            </ol>
          </div>
          <div className="relative">
            <label className="label">Google Maps API Key</label>
            <input
              className="input font-mono text-sm pr-10"
              type={showMapsKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={mapsKey}
              onChange={(e) => setMapsKey(e.target.value)}
            />
            <button type="button" onClick={() => setShowMapsKey((v) => !v)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
              <EyeIcon />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Com a API Key configurada, a Rota do Dia mostrará um mapa interactivo e tempos de deslocação reais (em vez de estimativas).
          </p>
        </Section>

        {/* ── EmailJS ── */}
        <Section title="E-mail Automático (EmailJS)" icon={<MailIcon />}>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-xs text-blue-800">
            <p className="font-semibold mb-1">Variáveis nos templates EmailJS:</p>
            <p className="font-mono text-blue-600">
              {'{{to_name}}'} · {'{{visit_date}}'} · {'{{visit_address}}'} · {'{{work_type}}'} · {'{{company_name}}'} · {'{{company_phone}}'} · {'{{reminder_type}}'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Service ID</label>
              <input className="input font-mono text-sm" placeholder="service_xxxxxxx" value={emailjs.serviceId} onChange={(e) => setE('serviceId', e.target.value)} />
            </div>
            <div className="relative">
              <label className="label">Public Key</label>
              <input className="input font-mono text-sm pr-10" type="password" placeholder="xxxxxxxx" value={emailjs.publicKey} onChange={(e) => setE('publicKey', e.target.value)} />
            </div>
            <div>
              <label className="label">Template ID — Confirmação</label>
              <input className="input font-mono text-sm" placeholder="template_xxxxxxx" value={emailjs.templateIdConfirmation} onChange={(e) => setE('templateIdConfirmation', e.target.value)} />
            </div>
            <div>
              <label className="label">Template ID — Lembrete</label>
              <input className="input font-mono text-sm" placeholder="template_xxxxxxx" value={emailjs.templateIdReminder} onChange={(e) => setE('templateIdReminder', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── WhatsApp ── */}
        <Section title="WhatsApp" icon={<WAIcon />}>
          {/* Level 1 */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="font-semibold text-green-800 text-sm mb-1">Nível 1 — Disponível já (sem configuração)</p>
            <p className="text-green-700 text-xs">
              Em cada visita, o botão <strong>Enviar por WhatsApp</strong> abre automaticamente o WhatsApp com a mensagem já preenchida — a proprietária só clica em Enviar.
              Funciona com qualquer número de telefone do cliente registado.
            </p>
          </div>

          {/* Level 2 — Twilio */}
          <div>
            <p className="font-medium text-slate-700 text-sm mb-3">Nível 2 — Envio automático via Twilio (opcional)</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-xs text-amber-800">
              <p className="font-semibold mb-2">Como configurar o Twilio WhatsApp Sandbox</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Crie conta gratuita em <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">twilio.com</a></li>
                <li>No painel, aceda a <strong>Messaging → Try it out → Send a WhatsApp message</strong></li>
                <li>Active o sandbox e envie a mensagem de activação do seu telemóvel para o número Twilio</li>
                <li>Copie o <strong>Account SID</strong> e <strong>Auth Token</strong> da página principal do Console</li>
                <li>O número Twilio WhatsApp Sandbox é normalmente <code>+14155238886</code></li>
              </ol>
              <p className="mt-2 text-amber-600">
                ⚠️ Em produção (Vercel), o Twilio requer um backend proxy por questões de CORS. Em desenvolvimento local pode funcionar directamente.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Account SID</label>
                <input className="input font-mono text-sm" placeholder="ACxxxxxxxxxxxxxxxx" value={twilio.accountSid} onChange={(e) => setT('accountSid', e.target.value)} />
              </div>
              <div className="relative">
                <label className="label">Auth Token</label>
                <input
                  className="input font-mono text-sm pr-10"
                  type={showTwilioKey ? 'text' : 'password'}
                  placeholder="xxxxxxxxxxxxxxxx"
                  value={twilio.authToken}
                  onChange={(e) => setT('authToken', e.target.value)}
                />
                <button type="button" onClick={() => setShowTwilioKey((v) => !v)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
                  <EyeIcon />
                </button>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Número WhatsApp Twilio (com código de país)</label>
                <input className="input font-mono text-sm" placeholder="+14155238886" value={twilio.fromNumber} onChange={(e) => setT('fromNumber', e.target.value)} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Export / Import ── */}
        <Section title="Exportar / Importar Dados" icon={<DatabaseIcon />}>
          <p className="text-xs text-slate-500 mb-4">
            Os dados são guardados no browser (localStorage). Exporte regularmente para ter uma cópia de segurança.
            O formato exportado é compatível com scripts externos de notificação.
          </p>

          <div className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-700 text-sm">Exportar agendamentos</p>
                <p className="text-xs text-slate-500 mt-0.5">Descarrega <code>appointments.json</code> com todos os agendamentos actuais</p>
              </div>
              <button type="button" onClick={handleExport} className="btn-primary text-sm flex items-center gap-2">
                <DownloadIcon /> Exportar
              </button>
            </div>

            {/* Auto-sync */}
            {typeof window !== 'undefined' && window.showSaveFilePicker && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-medium text-slate-700 text-sm">Sincronização automática</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {autoSync
                      ? 'Activa — o ficheiro é actualizado automaticamente a cada alteração (sessão actual)'
                      : 'Escolha um ficheiro local para sincronização automática nesta sessão'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnableAutoSync}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${autoSync ? 'bg-green-100 text-green-700' : 'btn-secondary'}`}
                >
                  {autoSync ? '✓ Activa' : 'Activar'}
                </button>
              </div>
            )}

            {/* Import */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 text-sm">Importar agendamentos</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Carrega um ficheiro <code>appointments.json</code> previamente exportado.
                  Os agendamentos importados são <strong>adicionados</strong> aos existentes.
                </p>
                {importStatus && (
                  <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${importStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {importStatus.ok
                      ? `✓ ${importStatus.count} agendamento(s) importado(s) com sucesso`
                      : `✗ ${importStatus.error}`}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                <button type="button" onClick={() => importRef.current?.click()} className="btn-secondary text-sm flex items-center gap-2">
                  <UploadIcon /> Importar
                </button>
              </div>
            </div>

            {/* Format preview */}
            <details className="rounded-xl border border-slate-200 overflow-hidden">
              <summary className="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                Ver formato do ficheiro JSON
              </summary>
              <pre className="p-4 text-xs text-slate-600 bg-white overflow-x-auto">
{`[
  {
    "id": "v123",
    "cliente": {
      "nome": "Maria Santos",
      "telefone": "+351 912 345 678",
      "email": "maria@exemplo.pt",
      "morada": "Rua Augusta 45, Lisboa"
    },
    "data": "2026-05-20",
    "hora": "09:00",
    "moradaVisita": "Rua Augusta 45, Lisboa",
    "tipoObra": "remodelacao",
    "estado": "agendado",
    "notificacoes": {
      "confirmacao": true,
      "lembrete3dias": false,
      "lembrete1dia": false,
      "lembreteNoDia": false
    },
    "observacoes": "Remodelação da cozinha"
  }
]`}
              </pre>
            </details>
          </div>
        </Section>

        {/* ── Branding ── */}
        <Section title="Personalização" icon={<PaletteIcon />}>
          {/* Logo */}
          <div>
            <label className="label">Logótipo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                {branding.logoUrl
                  ? <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  : <ImageIcon />}
              </div>
              <div className="space-y-2">
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button type="button" onClick={() => logoRef.current?.click()} className="btn-secondary text-sm flex items-center gap-2">
                  <UploadIcon /> {branding.logoUrl ? 'Substituir logótipo' : 'Carregar logótipo'}
                </button>
                {branding.logoUrl && (
                  <button type="button" onClick={handleRemoveLogo} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    Remover logótipo
                  </button>
                )}
                <p className="text-xs text-slate-400">PNG, JPG ou SVG — recomendado fundo transparente</p>
              </div>
            </div>
          </div>

          {/* Preset themes */}
          <div>
            <label className="label">Temas pré-definidos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_THEMES.map((theme) => {
                const active = branding.primaryColor === theme.primary && branding.accentColor === theme.accent
                return (
                  <button
                    key={theme.label}
                    type="button"
                    onClick={() => applyPreset(theme)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      active ? 'border-brand-600 bg-brand-50 font-medium' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex gap-1 flex-shrink-0">
                      <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.primary }} />
                      <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.accent }} />
                    </span>
                    <span className="text-slate-700 truncate">{theme.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom color pickers */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cor principal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setB('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setB('primaryColor', e.target.value) }}
                  className="input font-mono text-sm max-w-[110px]"
                />
                <span className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0" style={{ backgroundColor: branding.primaryColor }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Botões, links e elementos de destaque</p>
            </div>
            <div>
              <label className="label">Cor de acento</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setB('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setB('accentColor', e.target.value) }}
                  className="input font-mono text-sm max-w-[110px]"
                />
                <span className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0" style={{ backgroundColor: branding.accentColor }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">"Nova Visita" e elementos secundários</p>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-slate-100 p-4 space-y-2 bg-slate-50">
            <p className="text-xs font-medium text-slate-500 mb-3">Pré-visualização</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="btn-primary text-sm pointer-events-none">Botão principal</button>
              <button type="button" className="text-sm px-4 py-2 rounded-lg font-medium pointer-events-none"
                style={{ backgroundColor: branding.accentColor + '20', color: branding.accentColor }}>
                Acento
              </button>
              <span className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: branding.primaryColor + '12', color: branding.primaryColor }}>
                Badge
              </span>
            </div>
          </div>
        </Section>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Guardado com sucesso
            </span>
          )}
          <button type="submit" className="btn-primary px-8">Guardar configurações</button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <span className="text-brand-700">{icon}</span>
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function BuildingIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
function ClockIcon()     { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function MapsIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> }
function MailIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
function DatabaseIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> }
function EyeIcon()       { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> }
function DownloadIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> }
function UploadIcon()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> }
function WAIcon()        { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.112 1.532 5.836L.053 23.447l5.761-1.51A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.91 0-3.693-.518-5.22-1.42l-.37-.22-3.842 1.007 1.025-3.742-.24-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> }
function PaletteIcon()   { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> }
function ImageIcon()     { return <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
