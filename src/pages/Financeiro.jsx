import { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { todayString } from '../utils/dateUtils'

const TABS = ['Entregas', 'Funcionários']

const STATUS_LABELS = { entregue: 'Entregue', pendente: 'Pendente', confirmado: 'Confirmado' }
const STATUS_COLORS = {
  entregue:   'bg-emerald-100 text-emerald-700',
  pendente:   'bg-amber-100 text-amber-700',
  confirmado: 'bg-blue-100 text-blue-700',
}

function fmt(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0)
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function Financeiro() {
  const { entregas, addEntrega, updateEntrega, deleteEntrega, funcionarios, addFuncionario, deleteFuncionario } = useApp()
  const [tab, setTab] = useState('Entregas')

  // --- Entregas state ---
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [filterFunc, setFilterFunc] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // --- Funcionários state ---
  const [funcNome, setFuncNome] = useState('')
  const [funcCargo, setFuncCargo] = useState('')

  function emptyForm() {
    return { funcionario: '', valor: '', data: todayString(), descricao: '', status: 'pendente' }
  }

  function openNew() {
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(e) {
    setForm({ funcionario: e.funcionario, valor: String(e.valor), data: e.data, descricao: e.descricao ?? '', status: e.status })
    setEditingId(e.id)
    setShowForm(true)
  }

  function submitForm(ev) {
    ev.preventDefault()
    const payload = { ...form, valor: parseFloat(form.valor) || 0 }
    if (editingId) updateEntrega(editingId, payload)
    else addEntrega(payload)
    setShowForm(false)
    setEditingId(null)
  }

  const filtered = useMemo(() => {
    return entregas
      .filter(e => (!filterFunc || e.funcionario === filterFunc) && (!filterStatus || e.status === filterStatus))
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [entregas, filterFunc, filterStatus])

  const totalEntregue = useMemo(() => entregas.filter(e => e.status !== 'pendente').reduce((s, e) => s + (e.valor ?? 0), 0), [entregas])
  const totalPendente = useMemo(() => entregas.filter(e => e.status === 'pendente').reduce((s, e) => s + (e.valor ?? 0), 0), [entregas])
  const totalGeral    = useMemo(() => entregas.reduce((s, e) => s + (e.valor ?? 0), 0), [entregas])

  const nomesFuncionarios = useMemo(() => funcionarios.map(f => f.nome), [funcionarios])

  function addFunc(ev) {
    ev.preventDefault()
    if (!funcNome.trim()) return
    addFuncionario({ nome: funcNome.trim(), cargo: funcCargo.trim() })
    setFuncNome('')
    setFuncCargo('')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Controle Financeiro</h1>
          <p className="text-sm text-slate-500">Entregas de notas e valores aos funcionários</p>
        </div>
        {tab === 'Entregas' && (
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon /> Nova Entrega
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <MoneyIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{fmt(totalEntregue)}</p>
            <p className="text-xs text-slate-500">Total entregue</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ClockIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{fmt(totalPendente)}</p>
            <p className="text-xs text-slate-500">A confirmar</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-brand-700 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ChartIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{fmt(totalGeral)}</p>
            <p className="text-xs text-slate-500">Total geral</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Entregas */}
      {tab === 'Entregas' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterFunc}
              onChange={e => setFilterFunc(e.target.value)}
              className="input text-sm py-1.5 w-auto"
            >
              <option value="">Todos os funcionários</option>
              {nomesFuncionarios.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input text-sm py-1.5 w-auto"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="entregue">Entregue</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 text-sm">Nenhuma entrega registrada.</p>
              <button onClick={openNew} className="mt-3 btn-primary text-sm">Registrar Entrega</button>
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Data</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Funcionário</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Valor</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Descrição</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtDate(e.data)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{e.funcionario}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">{fmt(e.valor)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.descricao || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABELS[e.status] ?? e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-brand-600 transition-colors" title="Editar">
                            <EditIcon />
                          </button>
                          <button onClick={() => { if (confirm('Remover esta entrega?')) deleteEntrega(e.id) }} className="text-slate-400 hover:text-red-500 transition-colors" title="Remover">
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Funcionários */}
      {tab === 'Funcionários' && (
        <div className="space-y-4">
          <form onSubmit={addFunc} className="card flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
              <input
                className="input"
                placeholder="Nome do funcionário"
                value={funcNome}
                onChange={e => setFuncNome(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cargo (opcional)</label>
              <input
                className="input"
                placeholder="Ex: Técnico, Vendedor"
                value={funcCargo}
                onChange={e => setFuncCargo(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">
              Adicionar Funcionário
            </button>
          </form>

          {funcionarios.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-slate-400 text-sm">Nenhum funcionário cadastrado.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Nome</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Cargo</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Total Recebido</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map(f => {
                    const total = entregas.filter(e => e.funcionario === f.nome).reduce((s, e) => s + (e.valor ?? 0), 0)
                    return (
                      <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{f.nome}</td>
                        <td className="px-4 py-3 text-slate-500">{f.cargo || '—'}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">{fmt(total)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { if (confirm(`Remover ${f.nome}?`)) deleteFuncionario(f.id) }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Remover"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar Entrega' : 'Nova Entrega'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <XIcon />
              </button>
            </div>
            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Funcionário *</label>
                {nomesFuncionarios.length > 0 ? (
                  <select
                    className="input"
                    value={form.funcionario}
                    onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
                    required
                  >
                    <option value="">Selecionar funcionário</option>
                    {nomesFuncionarios.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    placeholder="Nome do funcionário"
                    value={form.funcionario}
                    onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
                    required
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
                <input
                  className="input"
                  placeholder="Ex: Adiantamento, despesas do dia..."
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="pendente">Pendente</option>
                  <option value="entregue">Entregue</option>
                  <option value="confirmado">Confirmado</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingId ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function MoneyIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }
function ClockIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function ChartIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
function EditIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }
function TrashIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function XIcon()     { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
