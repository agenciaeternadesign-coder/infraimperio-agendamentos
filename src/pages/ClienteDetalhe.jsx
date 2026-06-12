import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import StatusBadge, { workTypeLabel } from '../components/StatusBadge'
import VisitModal from '../components/VisitModal'
import { formatDate, formatDateShort } from '../utils/dateUtils'

const WORK_TYPES = [
  { value: 'telhados', label: 'Telhados e Coberturas' },
  { value: 'claraboias', label: 'Claraboias' },
  { value: 'canalizacao', label: 'Canalização' },
  { value: 'carpintaria', label: 'Carpintaria' },
  { value: 'eletricidade', label: 'Eletricidade' },
  { value: 'estores', label: 'Estores e Persianas' },
  { value: 'isolamento', label: 'Isolamento' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'montagens', label: 'Montagens' },
  { value: 'coluna_agua', label: 'Coluna de Água de Prédios' },
  { value: 'obras_construcao', label: 'Obras e Construção' },
  { value: 'pavimentos', label: 'Pavimentos' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'piscinas', label: 'Piscinas' },
  { value: 'reabilitacao', label: 'Reabilitação' },
  { value: 'remodelacoes', label: 'Remodelações' },
  { value: 'serralharia', label: 'Serralharia' },
  { value: 'vidros', label: 'Vidros e Janelas' },
  { value: 'pladur', label: 'Obras em Pladur' },
  { value: 'outro', label: 'Outro (especificar)' },
]

export default function ClienteDetalhe() {
  const { id } = useParams()
  const { clients, updateClient, deleteClient, getClientVisits } = useApp()
  const navigate = useNavigate()

  const client = clients.find((c) => c.id === id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(client ?? {})
  const [selectedVisit, setSelectedVisit] = useState(null)

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Cliente não encontrado.</p>
        <button onClick={() => navigate('/clientes')} className="btn-primary mt-4 text-sm">
          Voltar
        </button>
      </div>
    )
  }

  const visitHistory = getClientVisits(id)

  function handleSave() {
    updateClient(id, form)
    setEditing(false)
  }

  function handleDelete() {
    if (window.confirm(`Eliminar cliente "${client.name}"? Esta ação é irreversível.`)) {
      deleteClient(id)
      navigate('/clientes')
    }
  }

  function field(key, sub) {
    if (sub) return form[key]?.[sub] ?? ''
    return form[key] ?? ''
  }

  function setField(key, value, sub) {
    if (sub) {
      setForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }))
    } else {
      setForm((f) => ({ ...f, [key]: value }))
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/clientes')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ChevronLeftIcon /> Voltar a clientes
      </button>

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-700 text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{client.salutation ? `${client.salutation} ${client.name}` : client.name}</h2>
              <p className="text-slate-500 text-sm">{client.address.city} · Cliente desde {formatDateShort(client.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setForm(client) }} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={handleSave} className="btn-primary text-sm">Guardar</button>
              </>
            ) : (
              <>
                <button onClick={handleDelete} className="btn-secondary text-sm text-red-500 border-red-200 hover:bg-red-50">Eliminar</button>
                <button onClick={() => setEditing(true)} className="btn-primary text-sm">Editar</button>
              </>
            )}
          </div>
        </div>

        {/* Info / Edit form */}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div>
                <label className="label">Tratamento</label>
                <select className="input" value={field('salutation')} onChange={(e) => setField('salutation', e.target.value)}>
                  <option value="">—</option>
                  <option value="Sr.">Sr.</option>
                  <option value="Sra.">Sra.</option>
                </select>
              </div>
              <div>
                <label className="label">Nome completo</label>
                <input className="input" value={field('name')} onChange={(e) => setField('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" type="tel" value={field('phone')} onChange={(e) => setField('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={field('email')} onChange={(e) => setField('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Tipo de Obra</label>
                <select className="input" value={field('workType')} onChange={(e) => setField('workType', e.target.value)}>
                  {WORK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {field('workType') === 'outro' && (
                <div className="sm:col-span-2">
                  <label className="label">Descrição do serviço</label>
                  <input className="input" placeholder="Descreva o serviço" value={field('workTypeOther')} onChange={(e) => setField('workTypeOther', e.target.value)} />
                </div>
              )}
              <div className="sm:col-span-2 grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="label">Rua</label>
                  <input className="input" value={field('address', 'street')} onChange={(e) => setField('address', e.target.value, 'street')} />
                </div>
                <div>
                  <label className="label">Número</label>
                  <input className="input" value={field('address', 'number')} onChange={(e) => setField('address', e.target.value, 'number')} />
                </div>
                <div>
                  <label className="label">Andar</label>
                  <input className="input" placeholder="3º Esq." value={field('address', 'floor')} onChange={(e) => setField('address', e.target.value, 'floor')} />
                </div>
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" value={field('address', 'city')} onChange={(e) => setField('address', e.target.value, 'city')} />
              </div>
              <div>
                <label className="label">Código Postal</label>
                <input className="input" value={field('address', 'postalCode')} onChange={(e) => setField('address', e.target.value, 'postalCode')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notas</label>
                <textarea className="input h-20 resize-none" value={field('notes')} onChange={(e) => setField('notes', e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <InfoRow icon={<PhoneIcon />} label="Telefone">
                <a href={`tel:${client.phone}`} className="text-brand-600 hover:underline">{client.phone}</a>
              </InfoRow>
              <InfoRow icon={<MailIcon />} label="E-mail">
                <a href={`mailto:${client.email}`} className="text-brand-600 hover:underline truncate block">{client.email}</a>
              </InfoRow>
              <InfoRow icon={<MapIcon />} label="Morada">
                {client.address.street} {client.address.number}
                {client.address.floor && `, ${client.address.floor}`}
                {', '}{client.address.city}
                {client.address.postalCode && ` — ${client.address.postalCode}`}
              </InfoRow>
              <InfoRow icon={<HammerIcon />} label="Tipo de Obra">
                {workTypeLabel(client.workType, client.workTypeOther)}
              </InfoRow>
              {client.notes && (
                <div className="sm:col-span-2">
                  <InfoRow icon={<NoteIcon />} label="Notas">{client.notes}</InfoRow>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schedule visit */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/nova-visita?clientId=${id}`)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon /> Nova Visita para este Cliente
        </button>
      </div>

      {/* Visit history */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">
          Histórico de Visitas ({visitHistory.length})
        </h3>
        {visitHistory.length === 0 ? (
          <p className="text-sm text-slate-400">Sem visitas registadas.</p>
        ) : (
          <div className="space-y-3">
            {visitHistory.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVisit(v)}
                className="w-full text-left flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex-shrink-0 text-center w-20">
                  <p className="text-xs text-slate-500">{formatDateShort(v.date)}</p>
                  <p className="font-bold text-brand-700 text-sm">{v.time || 's/ hora'}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{v.address.street} {v.address.number}, {v.address.city}</p>
                  <p className="text-xs text-slate-500">{workTypeLabel(v.workType, v.workTypeOther)}</p>
                  {v.observations && <p className="text-xs text-slate-400 truncate mt-0.5">{v.observations}</p>}
                </div>
                <StatusBadge status={v.status} size="xs" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedVisit && <VisitModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />}
    </div>
  )
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-slate-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

function ChevronLeftIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> }
function PhoneIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> }
function MailIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
function MapIcon()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function HammerIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> }
function NoteIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
function PlusIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
