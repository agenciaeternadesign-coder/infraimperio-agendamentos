import { useState, useEffect, useMemo } from 'react'

const LS_KEY = 'infraimperio_entregas_v1'
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const OBJETIVOS = ['Combustível','Alimentação','Manutenção Carrinha','Material de Trabalho','Vale','Outro']

function novoId() { return 'e_' + Date.now() + '_' + Math.floor(Math.random() * 1000) }
function fmtEur(n) { return Number(n).toFixed(2).replace('.', ',') + ' €' }
function parseNum(s) { return parseFloat(String(s || 0).replace(',', '.')) || 0 }
function dataHoje() { return new Date().toISOString().slice(0, 10) }
function formatData(iso) { if (!iso) return ''; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}` }
function chaveMes(mes, ano) { return ano + '-' + String(mes).padStart(2, '0') }
function iniciais(nome) { return nome.split(' ').filter(Boolean).slice(0,2).map(p=>p[0].toUpperCase()).join('') }

function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { funcionarios: [], entregas: [] } }
  catch { return { funcionarios: [], entregas: [] } }
}
function saveData(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)) }

const ENTREGA_VAZIA = { funcionarioId: '', valor: '', objetivo: 'Combustível', data: dataHoje() }
const FUNC_VAZIO = { nome: '', funcao: '' }

export default function EntregaNotas() {
  const [data, setData] = useState(loadData)
  const hoje = new Date()
  const [mesSel, setMesSel] = useState(hoje.getMonth() + 1)
  const [anoSel, setAnoSel] = useState(hoje.getFullYear())
  const [modalEntrega, setModalEntrega] = useState(null)
  const [modalFunc, setModalFunc] = useState(null)
  const [formEntrega, setFormEntrega] = useState(ENTREGA_VAZIA)
  const [formFunc, setFormFunc] = useState(FUNC_VAZIO)

  useEffect(() => { saveData(data) }, [data])

  const chave = chaveMes(mesSel, anoSel)

  const entregasMes = useMemo(() =>
    data.entregas
      .filter(e => e.data.slice(0, 7) === chave)
      .sort((a, b) => b.data.localeCompare(a.data))
  , [data, chave])

  const totalMes = entregasMes.reduce((s, e) => s + parseNum(e.valor), 0)

  const somasPorFunc = useMemo(() => {
    const map = {}
    entregasMes.forEach(e => {
      map[e.funcionarioId] = (map[e.funcionarioId] || 0) + parseNum(e.valor)
    })
    return map
  }, [entregasMes])

  const anos = useMemo(() => {
    const set = new Set([hoje.getFullYear()])
    data.entregas.forEach(e => set.add(parseInt(e.data.slice(0,4))))
    return [...set].sort((a,b) => b-a)
  }, [data.entregas])

  function getNome(id) { return data.funcionarios.find(f => f.id === id)?.nome || 'Desconhecido' }

  function abrirNovaEntrega() { setFormEntrega({ ...ENTREGA_VAZIA, data: dataHoje() }); setModalEntrega('novo') }
  function abrirEditarEntrega(e) { setFormEntrega({ ...e }); setModalEntrega(e) }

  function salvarEntrega() {
    if (!formEntrega.funcionarioId || parseNum(formEntrega.valor) <= 0) return
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

  function salvarFunc() {
    if (!formFunc.nome.trim()) return
    setData(prev => {
      const funcionarios = modalFunc === 'novo'
        ? [...prev.funcionarios, { ...formFunc, id: novoId() }]
        : prev.funcionarios.map(f => f.id === modalFunc.id ? { ...formFunc, id: f.id } : f)
      return { ...prev, funcionarios }
    })
    setModalFunc(null)
  }

  function excluirFunc(id) {
    if (!confirm('Excluir este funcionário?')) return
    setData(prev => ({ ...prev, funcionarios: prev.funcionarios.filter(f => f.id !== id) }))
    setModalFunc(null)
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Entrega de Dinheiro</h1>
          <p className="text-sm text-slate-500">Controlo do dinheiro entregue pelo chefe a cada funcionário</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} className="input text-sm py-1.5 px-3">
            {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={anoSel} onChange={e => setAnoSel(Number(e.target.value))} className="input text-sm py-1.5 px-3">
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => { setFormFunc({ ...FUNC_VAZIO }); setModalFunc('novo') }} className="btn-secondary text-sm flex items-center gap-1">
            <PlusIcon /> Funcionário
          </button>
          <button onClick={abrirNovaEntrega} className="btn-primary text-sm flex items-center gap-1">
            <PlusIcon /> Nova Entrega
          </button>
        </div>
      </div>

      {/* Soma por funcionário */}
      {Object.keys(somasPorFunc).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.funcionarios.filter(f => somasPorFunc[f.id] > 0).map(f => (
            <div key={f.id} className="card flex items-center gap-3 py-3">
              <div className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {iniciais(f.nome)}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{f.nome}</p>
                <p className="font-bold text-slate-800">{fmtEur(somasPorFunc[f.id])}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Objetivo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entregasMes.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatData(e.data)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {iniciais(getNome(e.funcionarioId))}
                      </div>
                      <span className="font-medium text-slate-800">{getNome(e.funcionarioId)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                      {e.objetivo || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">{fmtEur(e.valor)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirEditarEntrega(e)} className="text-slate-400 hover:text-brand-600 transition-colors">
                      <EditIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-600">Total do mês</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtEur(totalMes)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Lista de funcionários */}
      {data.funcionarios.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Funcionários</h3>
          <div className="space-y-2">
            {data.funcionarios.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-xs">{iniciais(f.nome)}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{f.nome}</p>
                    {f.funcao && <p className="text-xs text-slate-400">{f.funcao}</p>}
                  </div>
                </div>
                <button onClick={() => { setFormFunc({...f}); setModalFunc(f) }} className="text-slate-400 hover:text-brand-600 transition-colors">
                  <EditIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Nova/Editar Entrega */}
      {modalEntrega !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{modalEntrega === 'novo' ? 'Nova Entrega' : 'Editar Entrega'}</h2>
              <button onClick={() => setModalEntrega(null)} className="text-slate-400 hover:text-slate-600"><XIcon /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Funcionário *</label>
                <select value={formEntrega.funcionarioId} onChange={e => setFormEntrega(p => ({...p, funcionarioId: e.target.value}))} className="input">
                  <option value="">Selecionar...</option>
                  {data.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                {data.funcionarios.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Adicione primeiro um funcionário com o botão "+ Funcionário".</p>
                )}
              </div>
              <div>
                <label className="label">Objetivo</label>
                <select value={formEntrega.objetivo || 'Combustível'} onChange={e => setFormEntrega(p => ({...p, objetivo: e.target.value}))} className="input">
                  {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Valor (€) *</label>
                <input type="number" min="0" step="0.01" value={formEntrega.valor} onChange={e => setFormEntrega(p => ({...p, valor: e.target.value}))} className="input" placeholder="0,00" />
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" value={formEntrega.data} onChange={e => setFormEntrega(p => ({...p, data: e.target.value}))} className="input" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {modalEntrega !== 'novo'
                ? <button onClick={() => excluirEntrega(modalEntrega.id)} className="btn-danger text-sm">Excluir</button>
                : <div />}
              <div className="flex gap-3">
                <button onClick={() => setModalEntrega(null)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={salvarEntrega} disabled={!formEntrega.funcionarioId || parseNum(formEntrega.valor) <= 0} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {modalEntrega === 'novo' ? 'Registar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Funcionário */}
      {modalFunc !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{modalFunc === 'novo' ? 'Novo Funcionário' : 'Editar Funcionário'}</h2>
              <button onClick={() => setModalFunc(null)} className="text-slate-400 hover:text-slate-600"><XIcon /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input type="text" value={formFunc.nome} onChange={e => setFormFunc(p => ({...p, nome: e.target.value}))} className="input" placeholder="Nome completo" autoFocus />
              </div>
              <div>
                <label className="label">Função</label>
                <input type="text" value={formFunc.funcao || ''} onChange={e => setFormFunc(p => ({...p, funcao: e.target.value}))} className="input" placeholder="Ex: Limpeza, Motorista..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {modalFunc !== 'novo'
                ? <button onClick={() => excluirFunc(modalFunc.id)} className="btn-danger text-sm">Excluir</button>
                : <div />}
              <div className="flex gap-3">
                <button onClick={() => setModalFunc(null)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={salvarFunc} disabled={!formFunc.nome.trim()} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
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

function PlusIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function EditIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }
function XIcon()    { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
