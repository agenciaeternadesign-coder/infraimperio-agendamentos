import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { workTypeLabel } from '../components/StatusBadge'
import { formatDateShort } from '../utils/dateUtils'
import { showToast } from '../components/Toast'

// Normaliza texto para pesquisa sem acentos ("São João" encontra-se com "sao joao")
const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// ─── Mapeamento de cabeçalhos CSV → campos do cliente ───────────────────────
const COL_MAP = {
  name:        ['nome', 'name', 'cliente', 'client', 'designação', 'designacao'],
  phone:       ['telefone', 'telemovel', 'telemóvel', 'tel', 'phone', 'mobile', 'contato', 'contacto'],
  email:       ['email', 'e-mail', 'mail', 'correio'],
  salutation:  ['titulo', 'título', 'salutation', 'tratamento', 'sr', 'sra'],
  street:      ['rua', 'morada', 'street', 'address', 'endereço', 'endereco', 'logradouro'],
  number:      ['numero', 'número', 'nº', 'n°', 'number', 'num', 'porta'],
  floor:       ['andar', 'floor', 'apto', 'apartamento', 'fração', 'fracao'],
  city:        ['cidade', 'localidade', 'city', 'location', 'município', 'municipio', 'localidade'],
  postalCode:  ['codigo postal', 'código postal', 'cp', 'postal', 'zip', 'postcode', 'cep'],
  workType:    ['tipo obra', 'tipo de obra', 'obra', 'work', 'worktype', 'serviço', 'servico'],
  notes:       ['notas', 'notes', 'obs', 'observações', 'observacoes', 'comentarios', 'comentários'],
}

function detectColumn(headers, field) {
  const aliases = COL_MAP[field] ?? []
  return headers.findIndex((h) => aliases.some((a) => norm(h).includes(norm(a))))
}

function parseCSV(text) {
  // Suporta ponto-e-vírgula ou vírgula como separador
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return null
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map((h) => h.replace(/^["']|["']$/g, '').trim())
  const rows = lines.slice(1).map((line) =>
    line.split(sep).map((v) => v.replace(/^["']|["']$/g, '').trim())
  ).filter((r) => r.some((v) => v))
  return { headers, rows }
}

function rowToClient(row, map) {
  const get = (field) => (map[field] >= 0 ? (row[map[field]] ?? '').trim() : '')
  return {
    name:       get('name'),
    phone:      get('phone'),
    email:      get('email'),
    salutation: get('salutation'),
    address: {
      street:     get('street'),
      number:     get('number'),
      floor:      get('floor'),
      city:       get('city'),
      postalCode: get('postalCode'),
    },
    workType:     get('workType') || 'outro',
    workTypeOther: get('workType') || '',
    notes:        get('notes'),
  }
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Clientes() {
  const { clients, getClientVisits, addClient } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)

  const filtered = clients.filter((c) => {
    const q = norm(search)
    return (
      norm(c.name).includes(q) ||
      (c.phone ?? '').includes(search) ||
      norm(c.email).includes(q) ||
      norm(c.address?.city).includes(q)
    )
  })

  return (
    <div className="max-w-4xl space-y-5">
      {/* Search + Buttons */}
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
          onClick={() => setShowImport(true)}
          className="btn-secondary flex items-center gap-2"
          title="Importar clientes de ficheiro CSV"
        >
          <UploadIcon />
          <span className="hidden sm:inline">Importar</span>
        </button>
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

      {showImport && (
        <ImportModal
          existingClients={clients}
          onClose={() => setShowImport(false)}
          onImport={addClient}
        />
      )}
    </div>
  )
}

// ─── Modal de importação ─────────────────────────────────────────────────────

function ImportModal({ existingClients, onClose, onImport }) {
  const [parsed, setParsed]     = useState(null) // { headers, rows }
  const [colMap, setColMap]     = useState({})
  const [preview, setPreview]   = useState([])
  const [importing, setImporting] = useState(false)
  const [done, setDone]         = useState(null) // { added, skipped }
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseCSV(e.target.result)
      if (!result || result.rows.length === 0) {
        showToast('Ficheiro inválido ou vazio.', 'error')
        return
      }
      const map = {}
      Object.keys(COL_MAP).forEach((field) => {
        map[field] = detectColumn(result.headers, field)
      })
      setParsed(result)
      setColMap(map)
      setPreview(result.rows.slice(0, 5))
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    setImporting(true)
    let added = 0, skipped = 0
    for (const row of parsed.rows) {
      const data = rowToClient(row, colMap)
      if (!data.name) { skipped++; continue }
      const dup = existingClients.find(
        (c) => norm(c.name) === norm(data.name) && (c.phone === data.phone || !data.phone)
      )
      if (dup) { skipped++; continue }
      await onImport(data)
      added++
    }
    setDone({ added, skipped })
    setImporting(false)
    if (added > 0) showToast(`${added} cliente${added !== 1 ? 's' : ''} importado${added !== 1 ? 's' : ''} com sucesso.`, 'success')
  }

  const downloadTemplate = () => {
    const csv = 'Nome;Telefone;Email;Rua;Número;Cidade;Código Postal;Notas\nJoão Silva;912345678;joao@email.pt;Rua das Flores;12;Lisboa;1000-001;\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'template-clientes.csv'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Importar Clientes</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-5">

          {/* Done state */}
          {done && (
            <div className="text-center py-8 space-y-3">
              <div className="text-5xl">✅</div>
              <p className="text-lg font-bold text-slate-800">{done.added} cliente{done.added !== 1 ? 's' : ''} importado{done.added !== 1 ? 's' : ''}!</p>
              {done.skipped > 0 && <p className="text-sm text-slate-500">{done.skipped} linha{done.skipped !== 1 ? 's' : ''} ignorada{done.skipped !== 1 ? 's' : ''} (duplicadas ou sem nome).</p>}
              <button onClick={onClose} className="btn-primary mt-2">Fechar</button>
            </div>
          )}

          {/* Upload zone */}
          {!done && !parsed && (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <UploadIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-600">Arraste um ficheiro CSV ou clique para seleccionar</p>
                <p className="text-sm text-slate-400 mt-1">Formato: CSV com separador ; ou ,</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex-1 h-px bg-slate-100" />
                <span>ou</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button onClick={downloadTemplate} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <DownloadIcon />
                Descarregar template CSV
              </button>

              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 mb-2">Colunas reconhecidas automaticamente:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>• <strong>Nome</strong> (obrigatório)</span>
                  <span>• <strong>Telefone</strong></span>
                  <span>• <strong>Email</strong></span>
                  <span>• <strong>Rua / Morada</strong></span>
                  <span>• <strong>Número</strong></span>
                  <span>• <strong>Cidade</strong></span>
                  <span>• <strong>Código Postal</strong></span>
                  <span>• <strong>Notas</strong></span>
                </div>
              </div>
            </>
          )}

          {/* Preview + column mapping */}
          {!done && parsed && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                <strong>{parsed.rows.length} linha{parsed.rows.length !== 1 ? 's' : ''}</strong> detectada{parsed.rows.length !== 1 ? 's' : ''}. Verifique o mapeamento e confirme a importação.
              </div>

              {/* Column mapping */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'name',       label: 'Nome *' },
                  { field: 'phone',      label: 'Telefone' },
                  { field: 'email',      label: 'Email' },
                  { field: 'city',       label: 'Cidade' },
                  { field: 'street',     label: 'Rua' },
                  { field: 'number',     label: 'Número' },
                  { field: 'postalCode', label: 'Código Postal' },
                  { field: 'notes',      label: 'Notas' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="label text-xs">{label}</label>
                    <select
                      className="input text-sm py-1.5"
                      value={colMap[field] ?? -1}
                      onChange={(e) => setColMap((m) => ({ ...m, [field]: parseInt(e.target.value) }))}
                    >
                      <option value={-1}>— não importar —</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pré-visualização (primeiras {preview.length} linhas)</p>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Nome', 'Telefone', 'Email', 'Cidade'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => {
                        const c = rowToClient(row, colMap)
                        return (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-medium text-slate-800">{c.name || <span className="text-red-400 italic">sem nome</span>}</td>
                            <td className="px-3 py-2 text-slate-600">{c.phone}</td>
                            <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate">{c.email}</td>
                            <td className="px-3 py-2 text-slate-600">{c.address.city}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setParsed(null); setPreview([]); setColMap({}) }} className="btn-secondary flex-1">
                  Mudar ficheiro
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || colMap['name'] < 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> A importar…</>
                  ) : (
                    <><UploadIcon /> Importar {parsed.rows.length} clientes</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Client card ─────────────────────────────────────────────────────────────

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
            {workTypeLabel(client.workType, client.workTypeOther)}
          </span>
        </div>
      )}
    </button>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function SearchIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
function PlusIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function PhoneIcon()    { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> }
function MailIcon()     { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
function MapIcon()      { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function UploadIcon({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> }
function DownloadIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> }
