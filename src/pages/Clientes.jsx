import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { WORK_TYPE_LABELS } from '../components/StatusBadge'
import { formatDateShort } from '../utils/dateUtils'

export default function Clientes() {
  const { clients, getClientVisits } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.city.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-4xl space-y-5">
      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone, cidade..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/nova-visita')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      </div>

      {/* Stats bar */}
      <p className="text-sm text-slate-500">
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            visitCount={getClientVisits(client.id).length}
            onClick={() => navigate(`/clientes/${client.id}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-slate-400 mb-3">Nenhum cliente encontrado.</p>
          <button onClick={() => navigate('/nova-visita')} className="btn-primary text-sm">
            Adicionar cliente
          </button>
        </div>
      )}
    </div>
  )
}

function ClientCard({ client, visitCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card text-left hover:border-brand-200 border transition-all hover:shadow-md w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{client.name}</p>
          <p className="text-sm text-slate-500 truncate">{client.address.city}</p>
        </div>
        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
          {visitCount} visita{visitCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <PhoneIcon />
          <span>{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MailIcon />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapIcon />
          <span className="truncate">{client.address.street} {client.address.number}, {client.address.city}</span>
        </div>
      </div>
      {client.workType && (
        <div className="mt-3">
          <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
            {WORK_TYPE_LABELS[client.workType] ?? client.workType}
          </span>
        </div>
      )}
    </button>
  )
}

function SearchIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
function PlusIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function PhoneIcon()  { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> }
function MailIcon()   { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
function MapIcon()    { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
