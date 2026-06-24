import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { WORK_TYPE_LABELS } from '../components/StatusBadge'
import { todayString } from '../utils/dateUtils'
import { formatDateShort } from '../utils/dateUtils'

const WORK_TYPES = [
  ...Object.entries(WORK_TYPE_LABELS).filter(([v]) => !['remodelacao','construcao','instalacoes','outro'].includes(v)),
  ['outro', 'Outro (especificar)'],
]

const EMPTY_CLIENT = { salutation: '', name: '', phone: '', email: '', address: { street: '', number: '', floor: '', city: '', postalCode: '' }, workType: 'telhados', workTypeOther: '', notes: '' }
const EMPTY_VISIT  = { date: todayString(), time: '09:00', timeEnd: '', address: { street: '', number: '', floor: '', city: '', postalCode: '' }, workType: 'telhados', workTypeOther: '', observations: '', status: 'agendado' }

export default function NovaVisita() {
  const { clients, addVisit, addClient, findDuplicateClient, getClientVisits } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1) // 1=client, 2=visit details
  const [clientMode, setClientMode] = useState('search') // 'search' | 'new'
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [newClientForm, setNewClientForm] = useState(EMPTY_CLIENT)
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT)
  const [noTime, setNoTime] = useState(false)
  const [duplicateAlert, setDuplicateAlert] = useState(null)
  const [sameAddressAsClient, setSameAddressAsClient] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Pre-select client if coming from client detail
  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId) {
      const c = clients.find((cl) => cl.id === clientId)
      if (c) { setSelectedClient(c); setStep(2) }
    }
  }, [searchParams, clients])

  // Pre-fill visit address from client address when toggled on
  useEffect(() => {
    if (!sameAddressAsClient) return
    if (selectedClient) {
      setVisitForm((f) => ({ ...f, address: { ...selectedClient.address }, workType: selectedClient.workType ?? f.workType, workTypeOther: selectedClient.workTypeOther ?? f.workTypeOther }))
    } else if (clientMode === 'new' && newClientForm.address.street) {
      setVisitForm((f) => ({ ...f, address: { ...newClientForm.address } }))
    }
  }, [selectedClient, sameAddressAsClient, clientMode, newClientForm.address])

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
  })

  function handleSelectClient(c) {
    setSelectedClient(c)
    const history = getClientVisits(c.id)
    if (history.length > 0) setDuplicateAlert({ client: c, history })
    else setDuplicateAlert(null)
    setStep(2)
  }

  function handleNewClientChange(key, value, sub) {
    if (sub) setNewClientForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }))
    else setNewClientForm((f) => ({ ...f, [key]: value }))

    // Check duplicate on phone/email change
    if (key === 'phone' || key === 'email') {
      const dup = findDuplicateClient(
        key === 'phone' ? value : newClientForm.phone,
        key === 'email' ? value : newClientForm.email,
      )
      if (dup) {
        const history = getClientVisits(dup.id)
        setDuplicateAlert({ client: dup, history, isNewClientMatch: true })
      } else {
        setDuplicateAlert(null)
      }
    }
  }

  function handleVisitChange(key, value, sub) {
    if (sub) setVisitForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }))
    else setVisitForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    let client = selectedClient
    if (!client && clientMode === 'new') {
      client = await addClient(newClientForm)
    }

    if (!client) { setSaving(false); return }

    const displayName = client.salutation ? `${client.salutation} ${client.name}` : client.name
    await addVisit({
      clientId: client.id,
      clientName: displayName,
      clientPhone: client.phone,
      clientEmail: client.email,
      ...visitForm,
      time: noTime ? '' : visitForm.time,
    })

    setSaving(false)
    setSuccess(true)
    setTimeout(() => navigate('/agenda'), 1200)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Visita agendada!</h2>
        <p className="text-slate-500 mt-2">E-mail de confirmação enviado (se configurado).</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-6">
        <StepDot n={1} active={step === 1} done={step > 1} label="Cliente" />
        <div className={`flex-1 h-px ${step > 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <StepDot n={2} active={step === 2} done={false} label="Detalhes da Visita" />
      </div>

      {/* ── STEP 1: Client ── */}
      {step === 1 && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-800">Selecionar Cliente</h2>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {[['search', 'Cliente existente'], ['new', 'Novo cliente']].map(([m, l]) => (
              <button
                key={m}
                onClick={() => { setClientMode(m); setDuplicateAlert(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${clientMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {clientMode === 'search' ? (
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Pesquisar por nome, telefone ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-72 overflow-y-auto space-y-2">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.phone} · {c.address.city}</p>
                    </div>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum cliente encontrado.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Duplicate alert */}
              {duplicateAlert && duplicateAlert.isNewClientMatch && (
                <DuplicateAlert alert={duplicateAlert} onUseExisting={() => handleSelectClient(duplicateAlert.client)} />
              )}

              <div>
                <label className="label">Tratamento</label>
                <select className="input" value={newClientForm.salutation} onChange={(e) => handleNewClientChange('salutation', e.target.value)}>
                  <option value="">—</option>
                  <option value="Sr.">Sr.</option>
                  <option value="Sra.">Sra.</option>
                </select>
              </div>
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={newClientForm.name} onChange={(e) => handleNewClientChange('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Telefone *</label>
                <input className="input" type="tel" value={newClientForm.phone} onChange={(e) => handleNewClientChange('phone', e.target.value)} required />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={newClientForm.email} onChange={(e) => handleNewClientChange('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Tipo de Obra</label>
                <select className="input" value={newClientForm.workType} onChange={(e) => handleNewClientChange('workType', e.target.value)}>
                  {WORK_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {newClientForm.workType === 'outro' && (
                <div className="sm:col-span-2">
                  <label className="label">Descrição do serviço *</label>
                  <input className="input" placeholder="Descreva o serviço pretendido" value={newClientForm.workTypeOther} onChange={(e) => handleNewClientChange('workTypeOther', e.target.value)} />
                </div>
              )}
              <div className="sm:col-span-2 grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="label">Rua</label>
                  <input className="input" value={newClientForm.address.street} onChange={(e) => handleNewClientChange('address', e.target.value, 'street')} />
                </div>
                <div>
                  <label className="label">Nº</label>
                  <input className="input" value={newClientForm.address.number} onChange={(e) => handleNewClientChange('address', e.target.value, 'number')} />
                </div>
                <div>
                  <label className="label">Andar</label>
                  <input className="input" placeholder="3º Esq." value={newClientForm.address.floor} onChange={(e) => handleNewClientChange('address', e.target.value, 'floor')} />
                </div>
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" value={newClientForm.address.city} onChange={(e) => handleNewClientChange('address', e.target.value, 'city')} />
              </div>
              <div>
                <label className="label">Código Postal</label>
                <input className="input" value={newClientForm.address.postalCode} onChange={(e) => handleNewClientChange('address', e.target.value, 'postalCode')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notas</label>
                <textarea className="input h-20 resize-none" value={newClientForm.notes} onChange={(e) => handleNewClientChange('notes', e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={() => {
                    if (!newClientForm.name || !newClientForm.phone) return alert('Nome e telefone são obrigatórios.')
                    setStep(2)
                  }}
                  className="btn-primary"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Visit details ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Detalhes da Visita</h2>
            <button type="button" onClick={() => setStep(1)} className="text-sm text-brand-600 hover:underline">
              ← Alterar cliente
            </button>
          </div>

          {/* Selected client badge */}
          {(selectedClient || clientMode === 'new') && (
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-brand-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                {(selectedClient?.name ?? newClientForm.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-brand-800 text-sm">{selectedClient?.name ?? newClientForm.name}</p>
                <p className="text-xs text-brand-600">{selectedClient?.phone ?? newClientForm.phone}</p>
              </div>
            </div>
          )}

          {/* Duplicate alert */}
          {duplicateAlert && !duplicateAlert.isNewClientMatch && (
            <DuplicateAlert alert={duplicateAlert} />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input className="input" type="date" value={visitForm.date} onChange={(e) => handleVisitChange('date', e.target.value)} required min={todayString()} />
            </div>
            <div>
              <label className="label">Hora de início {noTime ? '' : '*'}</label>
              <input className="input" type="time" value={visitForm.time} onChange={(e) => handleVisitChange('time', e.target.value)} required={!noTime} disabled={noTime} />
              <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noTime}
                  onChange={(e) => setNoTime(e.target.checked)}
                  className="rounded accent-brand-700"
                />
                Sem horário definido (ajustar depois na Rota do Dia)
              </label>
            </div>
            <div>
              <label className="label">Hora de fim</label>
              <input className="input" type="time" value={visitForm.timeEnd || ''} onChange={(e) => handleVisitChange('timeEnd', e.target.value)} disabled={noTime} />
              <p className="mt-2 text-xs text-slate-400">Opcional — aparece no SMS ao cliente</p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tipo de Obra</label>
              <select className="input" value={visitForm.workType} onChange={(e) => handleVisitChange('workType', e.target.value)}>
                {WORK_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {visitForm.workType === 'outro' && (
              <div className="sm:col-span-2">
                <label className="label">Descrição do serviço *</label>
                <input className="input" placeholder="Descreva o serviço pretendido" value={visitForm.workTypeOther} onChange={(e) => handleVisitChange('workTypeOther', e.target.value)} />
              </div>
            )}

            {/* Visit address */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Morada da Visita</label>
                {(selectedClient || (clientMode === 'new' && newClientForm.address.street)) && (
                  <label className="flex items-center gap-2 text-xs text-brand-700 font-medium cursor-pointer select-none bg-brand-50 border border-brand-200 rounded-lg px-2.5 py-1">
                    <input
                      type="checkbox"
                      checked={sameAddressAsClient}
                      onChange={(e) => setSameAddressAsClient(e.target.checked)}
                      className="rounded accent-brand-700"
                    />
                    Usar morada do cliente
                  </label>
                )}
              </div>
              <div className={`grid grid-cols-4 gap-2 ${sameAddressAsClient ? 'opacity-60' : ''}`}>
                <div className="col-span-2">
                  <input className="input" placeholder="Rua" value={visitForm.address.street} readOnly={sameAddressAsClient} onChange={(e) => handleVisitChange('address', e.target.value, 'street')} />
                </div>
                <input className="input" placeholder="Nº" value={visitForm.address.number} readOnly={sameAddressAsClient} onChange={(e) => handleVisitChange('address', e.target.value, 'number')} />
                <input className="input" placeholder="Andar" value={visitForm.address.floor ?? ''} readOnly={sameAddressAsClient} onChange={(e) => handleVisitChange('address', e.target.value, 'floor')} />
              </div>
              <div className={`grid grid-cols-2 gap-2 mt-2 ${sameAddressAsClient ? 'opacity-60' : ''}`}>
                <input className="input" placeholder="Cidade" value={visitForm.address.city} readOnly={sameAddressAsClient} onChange={(e) => handleVisitChange('address', e.target.value, 'city')} required />
                <input className="input" placeholder="Código Postal" value={visitForm.address.postalCode} readOnly={sameAddressAsClient} onChange={(e) => handleVisitChange('address', e.target.value, 'postalCode')} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Observações</label>
              <textarea className="input h-24 resize-none" placeholder="Notas sobre a visita..." value={visitForm.observations} onChange={(e) => handleVisitChange('observations', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
              {saving ? 'A guardar...' : 'Agendar Visita'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function DuplicateAlert({ alert, onUseExisting }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 col-span-2">
      <div className="flex items-start gap-3">
        <span className="text-amber-500 flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </span>
        <div className="flex-1">
          <p className="font-semibold text-amber-800 text-sm">Cliente já registado</p>
          <p className="text-amber-700 text-xs mt-1">
            <strong>{alert.client.name}</strong> já tem {alert.history.length} visita(s) registada(s).
          </p>
          {alert.history.slice(0, 2).map((v) => (
            <p key={v.id} className="text-xs text-amber-600 mt-0.5">
              · {formatDateShort(v.date)} — {v.address.city} ({v.status})
            </p>
          ))}
          {onUseExisting && (
            <button onClick={onUseExisting} className="mt-2 text-xs font-medium text-amber-800 underline">
              Usar este cliente existente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepDot({ n, active, done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        active ? 'bg-brand-700 text-white' : done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

function CheckIcon() {
  return <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
}
