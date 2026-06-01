import { useState, useEffect, useMemo } from 'react'

const LS_KEY = 'infraimperio_entregas_v1'
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const TIPOS = ['Dinheiro','Cheque','Transferência','MBWay','Outro']

function novoId() { return 'e_' + Date.now() + '_' + Math.floor(Math.random() * 1000) }
function fmtEur(n) { return Number(n).toFixed(2).replace('.', ',') + ' €' }
function parseNum(s) { return parseFloat(String(s || 0).replace(',', '.')) || 0 }
function dataHoje() { return new Date().toISOString().slice(0, 10) }
function chaveMes(mes, ano) { return ano + '-' + String(mes).padStart(2, '0') }

function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { funcionarios: [], entregas: [] } }
  catch { return { funcionarios: [], entregas: [] } }
}
function saveData(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)) }

const FUNC_VAZIO = { nome: '', funcao: '' }
const ENTREGA_VAZIA = { funcionarioId: '', valor: '', tipo: 'Dinheiro', data: dataHoje(), descricao: '', confirmado: false }

export default function EntregaNotas() {
  const [data, setData] = useState(loadData)
  const hoje = new Date()
  const [mesSel, setMesSel] = useState(hoje.getMonth() + 1)
  const [anoSel, setAnoSel] = useState(hoje.getFullYear())
  const [tab, setTab] = useState('entregas') // 'entregas' | 'funcionarios'
  const [modalEntrega, setModalEntrega] = useState(null) // null | 'novo' | entregaObj
  const [modalFunc, setModalFunc] = useState(null) // null | 'novo' | funcObj
  const [formEntrega, setFormEntrega] = useState(ENTREGA_VAZIA)
  const [formFunc, setFormFunc] = useState(FUNC_VAZIO)
  const [filtroFunc, setFiltroFunc] = useState('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => { saveData(data) }, [data])

  const chave = chaveMes(mesSel, anoSel)

  const entregasMes = useMemo(() =>
    data.entregas
      .filter(e => e.data.slice(0, 7) === chave)
      .filter(e => filtroFunc === 'todos' || e.funcionarioId === filtroFunc)
      .filter(e => busca === '' || e.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        getNomeFuncionario(data.funcionarios, e.funcionarioId).toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => b.data.localeCompare(a.data))
  , [data, chave, filtroFunc, busca])

  const totalMes = entregasMes.reduce((s, e) => s + parseNum(e.valor), 0)
  const totalConfirmado = entregasMes.filter(e => e.confirmado).reduce((s, e) => s + parseNum(e.valor), 0)
  const totalPendente = totalMes - totalConfirmado

  // stats por funcionário no mês
  const statsPorFunc = useMemo(() => {
    const map = {}
    data.entregas
      .filter(e => e.data.slice(0, 7) === chave)
      .forEach(e => {
        if (!map[e.funcionarioId]) map[e.funcionarioId] = { total: 0, confirmado: 0, count: 0 }
        map[e.funcionarioId].total += parseNum(e.valor)
        if (e.confirmado) map[e.funcionarioId].confirmado += parseNum(e.valor)
        map[e.funcionarioId].count++
      })
    return map
  }, [data, chave])

  // Anos disponíveis
  const anos = useMemo(() => {
    const set = new Set([hoje.getFullYear()])
    data.entregas.forEach(e => set.add(parseInt(e.data.slice(0, 4))))
    return [...set].sort((a, b) => b - a)
  }, [data.entregas])

  function abrirNovaEntrega() {
    setFormEntrega({ ...ENTREGA_VAZIA, data: dataHoje() })
    setModalEntrega('novo')
  }
  function abrirEditarEntrega(e) {
    setFormEntrega({ ...e })
    setModalEntrega(e)
  }
  function salvarEntrega() {
    if (!formEntrega.funcionarioId || !formEntrega.valor || parseNum(formEntrega.valor) <= 0) return
    setData(prev => {
      const entregas = modalEntrega === 'novo'
        ? [...prev.entregas, { ...formEntrega, id: novoId(), valor: parseNum(formEntrega.valor) }]
        : prev.entregas.map(e => e.id === modalEntrega.id ? { ...formEntrega, id: e.id, valor: parseNum(formEntrega.valor) } : e)
      return { ...prev, entregas }
    })
    setModalEntrega(null)
  }
  function excluirEntrega(id) {
    if (!confirm('Excluir esta entrega?')) return
    setData(prev => ({ ...prev, entregas: prev.entregas.filter(e => e.id !== id) }))
    setModalEntrega(null)
  }
  function toggleConfirmado(id) {
    setData(prev => ({
      ...prev,
      entregas: prev.entregas.map(e => e.id === id ? { ...e, confirmado: !e.confirmado } : e)
    }))
  }

  function abrirNovoFunc() { setFormFunc({ ...FUNC_VAZIO }); setModalFunc('novo') }
  function abrirEditarFunc(f) { setFormFunc({ ...f }); setModalFunc(f) }
  function salvarFunc() {
    if (!formFunc.nome.trim()) return
    setData(prev => {
      const funcionarios = modalFunc === 'novo'
        ? [...prev.funcionarios, { ...formFunc, id: novoId(), ativo: true }]
        : prev.funcionarios.map(f => f.id === modalFunc.id ? { ...formFunc, id: f.id } : f)
      return { ...prev, funcionarios }
    })
    setModalFunc(null)
  }
  function excluirFunc(id) {
    if (!confirm('Excluir este funcionário? As entregas associadas serão mantidas.')) return
    setData(prev => ({ ...prev, funcionarios: prev.funcionarios.filter(f => f.id !== id) }))
    setModalFunc(null)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Controlo de Entregas</h1>
          <p className="text-sm text-slate-500">Registo de dinheiro entregue pelo chefe a cada funcionário</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de mês/ano */}
          <select
            value={mesSel}
            onChange={e => setMesSel(Number(e.target.value))}
            className="input text-sm py-1.5 px-3"
          >
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={anoSel}
            onChange={e => setAnoSel(Number(e.target.value))}
            className="input text-sm py-1.5 px-3"
          >
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <MoneyIcon />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{fmtEur(totalMes)}</p>
            <p className="text-xs text-slate-500">Total entregue</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <CheckIcon />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{fmtEur(totalConfirmado)}</p>
            <p className="text-xs text-slate-500">Confirmado</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ClockIcon />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{fmtEur(totalPendente)}</p>
            <p className="text-xs text-slate-500">Pendente</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <UsersIcon />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{Object.keys(statsPorFunc).length}</p>
            <p className="text-xs text-slate-500">Funcionários</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {[
          { id: 'entregas', label: 'Entregas' },
          { id: 'resumo', label: 'Resumo por Funcionário' },
          { id: 'funcionarios', label: 'Funcionários' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Entregas ── */}
      {tab === 'entregas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <select
                value={filtroFunc}
                onChange={e => setFiltroFunc(e.target.value)}
                className="input text-sm py-1.5 px-3"
              >
                <option value="todos">Todos os funcionários</option>
                {data.funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Pesquisar..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="input text-sm py-1.5 px-3 w-44"
              />
            </div>
            <button onClick={abrirNovaEntrega} className="btn-primary flex items-center gap-2 text-sm">
              <PlusIcon /> Nova Entrega
            </button>
          </div>

          {entregasMes.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 text-sm mb-3">Nenhuma entrega registada neste período.</p>
              <button onClick={abrirNovaEntrega} className="btn-primary text-sm">Registar Entrega</button>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Funcionário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirm.</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entregasMes.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600">{formatData(e.data)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {getNomeFuncionario(data.funcionarios, e.funcionarioId)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                          {e.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell max-w-[200px] truncate">
                        {e.descricao || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtEur(e.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleConfirmado(e.id)}
                          title={e.confirmado ? 'Confirmado — clique para desmarcar' : 'Marcar como confirmado'}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${
                            e.confirmado
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {e.confirmado && <SmallCheckIcon />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => abrirEditarEntrega(e)}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          <EditIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-600">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtEur(totalMes)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Resumo por Funcionário ── */}
      {tab === 'resumo' && (
        <div className="space-y-4">
          {data.funcionarios.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 text-sm mb-3">Nenhum funcionário cadastrado.</p>
              <button onClick={() => setTab('funcionarios')} className="btn-primary text-sm">Gerir Funcionários</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.funcionarios.map(f => {
                const s = statsPorFunc[f.id] || { total: 0, confirmado: 0, count: 0 }
                const pendente = s.total - s.confirmado
                return (
                  <div key={f.id} className="card space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {iniciais(f.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{f.nome}</p>
                        <p className="text-xs text-slate-400">{f.funcao || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-blue-600 font-medium">Total</p>
                        <p className="text-sm font-bold text-blue-800">{fmtEur(s.total)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-xs text-emerald-600 font-medium">Confirm.</p>
                        <p className="text-sm font-bold text-emerald-800">{fmtEur(s.confirmado)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-xs text-amber-600 font-medium">Pendente</p>
                        <p className="text-sm font-bold text-amber-800">{fmtEur(pendente)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 text-right">{s.count} entrega(s) no mês</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Funcionários ── */}
      {tab === 'funcionarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={abrirNovoFunc} className="btn-primary flex items-center gap-2 text-sm">
              <PlusIcon /> Novo Funcionário
            </button>
          </div>
          {data.funcionarios.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 text-sm mb-3">Nenhum funcionário cadastrado.</p>
              <button onClick={abrirNovoFunc} className="btn-primary text-sm">Adicionar Funcionário</button>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Função</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total (mês)</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.funcionarios.map(f => {
                    const s = statsPorFunc[f.id] || { total: 0 }
                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {iniciais(f.nome)}
                            </div>
                            <span className="font-medium text-slate-800">{f.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{f.funcao || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmtEur(s.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => abrirEditarFunc(f)}
                            className="text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <EditIcon />
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

      {/* ── Modal: Nova/Editar Entrega ── */}
      {modalEntrega !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                {modalEntrega === 'novo' ? 'Nova Entrega' : 'Editar Entrega'}
              </h2>
              <button onClick={() => setModalEntrega(null)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Funcionário *</label>
                <select
                  value={formEntrega.funcionarioId}
                  onChange={e => setFormEntrega(p => ({ ...p, funcionarioId: e.target.value }))}
                  className="input"
                >
                  <option value="">Selecionar funcionário...</option>
                  {data.funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
                {data.funcionarios.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum funcionário cadastrado. Vá à tab "Funcionários" para adicionar.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Valor (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formEntrega.valor}
                    onChange={e => setFormEntrega(p => ({ ...p, valor: e.target.value }))}
                    className="input"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={formEntrega.tipo}
                    onChange={e => setFormEntrega(p => ({ ...p, tipo: e.target.value }))}
                    className="input"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  value={formEntrega.data}
                  onChange={e => setFormEntrega(p => ({ ...p, data: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Descrição / Nota</label>
                <input
                  type="text"
                  value={formEntrega.descricao}
                  onChange={e => setFormEntrega(p => ({ ...p, descricao: e.target.value }))}
                  className="input"
                  placeholder="Ex: Adiantamento semana 1, Vale de combustível..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirmado"
                  checked={formEntrega.confirmado}
                  onChange={e => setFormEntrega(p => ({ ...p, confirmado: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-brand-700"
                />
                <label htmlFor="confirmado" className="text-sm text-slate-700">Entrega confirmada pelo funcionário</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {modalEntrega !== 'novo' ? (
                <button
                  onClick={() => excluirEntrega(modalEntrega.id)}
                  className="btn-danger text-sm"
                >
                  Excluir
                </button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={() => setModalEntrega(null)} className="btn-secondary text-sm">Cancelar</button>
                <button
                  onClick={salvarEntrega}
                  disabled={!formEntrega.funcionarioId || parseNum(formEntrega.valor) <= 0}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalEntrega === 'novo' ? 'Registar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Novo/Editar Funcionário ── */}
      {modalFunc !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                {modalFunc === 'novo' ? 'Novo Funcionário' : 'Editar Funcionário'}
              </h2>
              <button onClick={() => setModalFunc(null)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input
                  type="text"
                  value={formFunc.nome}
                  onChange={e => setFormFunc(p => ({ ...p, nome: e.target.value }))}
                  className="input"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="label">Função / Cargo</label>
                <input
                  type="text"
                  value={formFunc.funcao}
                  onChange={e => setFormFunc(p => ({ ...p, funcao: e.target.value }))}
                  className="input"
                  placeholder="Ex: Limpeza, Motorista..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {modalFunc !== 'novo' ? (
                <button onClick={() => excluirFunc(modalFunc.id)} className="btn-danger text-sm">Excluir</button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={() => setModalFunc(null)} className="btn-secondary text-sm">Cancelar</button>
                <button
                  onClick={salvarFunc}
                  disabled={!formFunc.nome.trim()}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalFunc === 'novo' ? 'Adicionar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getNomeFuncionario(funcionarios, id) {
  return funcionarios.find(f => f.id === id)?.nome || 'Desconhecido'
}
function iniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}
function formatData(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function MoneyIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }
function CheckIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function ClockIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function UsersIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> }
function PlusIcon()       { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function EditIcon()       { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }
function XIcon()          { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
function SmallCheckIcon() { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> }
