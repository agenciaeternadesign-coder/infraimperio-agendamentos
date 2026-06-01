import { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'

const MEDAL = ['🥇', '🥈', '🥉']

// Modal inline genérico
function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-lg leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function Premiacao() {
  const { funcionarios, acoes, addFuncionario, deleteFuncionario, addAcao, deleteAcao } = useApp()

  const [tab, setTab] = useState('ranking')
  const [modalFunc, setModalFunc] = useState(false)
  const [modalAcao, setModalAcao] = useState(null)   // { funcionarioId, tipo }
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteAcao, setConfirmDeleteAcao] = useState(null)
  const [formFunc, setFormFunc] = useState({ name: '', cargo: '' })
  const [formAcao, setFormAcao] = useState({ descricao: '' })

  // Ranking ordenado por pontos
  const ranking = useMemo(() => {
    return funcionarios
      .map((f) => {
        const fa = acoes.filter((a) => a.funcionarioId === f.id)
        const fotos = fa.filter((a) => a.tipo === 'foto').length
        const reclamacoes = fa.filter((a) => a.tipo === 'reclamacao').length
        const pontos = fa.reduce((s, a) => s + a.pontos, 0)
        return { ...f, fotos, reclamacoes, pontos }
      })
      .sort((a, b) => b.pontos - a.pontos)
  }, [funcionarios, acoes])

  const totalFotos = acoes.filter((a) => a.tipo === 'foto').length
  const totalReclamacoes = acoes.filter((a) => a.tipo === 'reclamacao').length
  const lider = ranking[0]

  const historico = useMemo(() => {
    return [...acoes]
      .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
      .slice(0, 50)
      .map((a) => ({ ...a, func: funcionarios.find((f) => f.id === a.funcionarioId) }))
  }, [acoes, funcionarios])

  const fmtData = (d) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const handleSaveFunc = () => {
    if (!formFunc.name.trim()) return
    addFuncionario(formFunc)
    setModalFunc(false)
    setFormFunc({ name: '', cargo: '' })
  }

  const handleSaveAcao = () => {
    if (!formAcao.descricao.trim()) return
    addAcao({
      funcionarioId: modalAcao.funcionarioId,
      tipo: modalAcao.tipo,
      descricao: formAcao.descricao,
      data: new Date().toISOString().split('T')[0],
      pontos: modalAcao.tipo === 'foto' ? 1 : -2,
    })
    setModalAcao(null)
  }

  const openFoto = (id) => { setModalAcao({ funcionarioId: id, tipo: 'foto' }); setFormAcao({ descricao: '' }) }
  const openReclamacao = (id) => { setModalAcao({ funcionarioId: id, tipo: 'reclamacao' }); setFormAcao({ descricao: '' }) }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrophyIcon className="text-brand-700" />
            Premiação
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Ranking de desempenho da equipa</p>
        </div>
        <button
          onClick={() => { setFormFunc({ name: '', cargo: '' }); setModalFunc(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
        >
          <PlusIcon />
          Funcionário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <UsersIcon className="w-8 h-8 text-brand-700 bg-brand-50 rounded-xl p-1.5 mb-3" />
          <p className="text-2xl font-bold text-slate-800">{funcionarios.length}</p>
          <p className="text-sm text-slate-500 mt-0.5">Funcionários</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <CameraIcon className="w-8 h-8 text-emerald-600 bg-emerald-50 rounded-xl p-1.5 mb-3" />
          <p className="text-2xl font-bold text-slate-800">{totalFotos}</p>
          <p className="text-sm text-slate-500 mt-0.5">Fotos enviadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <AlertIcon className="w-8 h-8 text-red-500 bg-red-50 rounded-xl p-1.5 mb-3" />
          <p className="text-2xl font-bold text-slate-800">{totalReclamacoes}</p>
          <p className="text-sm text-slate-500 mt-0.5">Reclamações</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <TrophyIcon className="w-8 h-8 text-gold-600 bg-gold-50 rounded-xl p-1.5 mb-3" />
          <p className="text-2xl font-bold text-slate-800 truncate">{lider?.name?.split(' ')[0] ?? '—'}</p>
          <p className="text-sm text-slate-500 mt-0.5">{lider ? `${lider.pontos > 0 ? '+' : ''}${lider.pontos} pts` : 'Sem ranking'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit">
        {[{ id: 'ranking', label: '🏆 Ranking' }, { id: 'historico', label: '📋 Histórico' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* RANKING */}
      {tab === 'ranking' && (
        <div className="space-y-3">
          {ranking.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-400">
              <TrophyIcon className="w-10 h-10 opacity-30" />
              <p className="mt-3 font-medium text-slate-500">Nenhum funcionário cadastrado</p>
              <button
                onClick={() => { setFormFunc({ name: '', cargo: '' }); setModalFunc(true) }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-700"
              >
                + Adicionar Funcionário
              </button>
            </div>
          ) : (
            ranking.map((func, idx) => (
              <div
                key={func.id}
                className={`group bg-white rounded-2xl border p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-sm
                  ${idx === 0 ? 'border-gold-300 shadow-sm' : 'border-slate-100'}`}
              >
                {/* Posição */}
                <div className="flex-shrink-0 w-10 text-center">
                  {idx < 3
                    ? <span className="text-2xl">{MEDAL[idx]}</span>
                    : <span className="text-base font-bold text-slate-300">#{idx + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 bg-brand-700">
                  {func.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{func.name}</p>
                  {func.cargo && <p className="text-xs text-slate-400 mt-0.5">{func.cargo}</p>}
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      📷 {func.fotos} foto{func.fotos !== 1 ? 's' : ''} · +{func.fotos} pt{func.fotos !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                      ⚠️ {func.reclamacoes} reclam. · {func.reclamacoes > 0 ? `-${func.reclamacoes * 2}` : '0'} pts
                    </span>
                  </div>
                </div>

                {/* Pontuação */}
                <div className="text-right flex-shrink-0 min-w-[64px]">
                  <p className={`text-3xl font-black ${func.pontos > 0 ? 'text-slate-800' : func.pontos === 0 ? 'text-slate-400' : 'text-red-500'}`}>
                    {func.pontos > 0 ? `+${func.pontos}` : func.pontos}
                  </p>
                  <p className="text-xs text-slate-400">pontos</p>
                </div>

                {/* Botões */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => openFoto(func.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    📷 +1 Foto
                  </button>
                  <button
                    onClick={() => openReclamacao(func.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    ⚠️ -2 Reclamação
                  </button>
                  <button
                    onClick={() => setConfirmDelete(func)}
                    title="Remover funcionário"
                    className="p-2 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* HISTÓRICO */}
      {tab === 'historico' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <HistoryIcon className="w-10 h-10 opacity-30" />
              <p className="mt-3 font-medium text-slate-500">Nenhuma ação registada ainda</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Últimas {historico.length} ações</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>📷 foto = +1 &nbsp; ⚠️ reclamação = -2</span>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {historico.map((a) => (
                  <div key={a.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${a.tipo === 'foto' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {a.tipo === 'foto' ? '📷' : '⚠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{a.descricao}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="font-medium">{a.func?.name ?? '—'}</span>
                        {a.func?.cargo ? ` · ${a.func.cargo}` : ''}
                        {' · '}{fmtData(a.data)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${a.pontos > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {a.pontos > 0 ? `+${a.pontos}` : a.pontos} pt{Math.abs(a.pontos) !== 1 ? 's' : ''}
                    </span>
                    {/* Botão excluir registro */}
                    <button
                      onClick={() => setConfirmDeleteAcao(a)}
                      title="Excluir este registo"
                      className="p-1.5 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modais ── */}

      {/* Novo Funcionário */}
      <Modal open={modalFunc} onClose={() => setModalFunc(false)} title="Novo Funcionário">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
            <input
              value={formFunc.name}
              onChange={(e) => setFormFunc((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveFunc()}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cargo</label>
            <input
              value={formFunc.cargo}
              onChange={(e) => setFormFunc((f) => ({ ...f, cargo: e.target.value }))}
              placeholder="Ex: Pedreiro, Pintor, Eletricista..."
              onKeyDown={(e) => e.key === 'Enter' && handleSaveFunc()}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalFunc(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={handleSaveFunc}
              disabled={!formFunc.name.trim()}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-semibold bg-brand-700 hover:bg-brand-800 disabled:opacity-40 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      </Modal>

      {/* Registar Foto / Reclamação */}
      <Modal
        open={!!modalAcao}
        onClose={() => setModalAcao(null)}
        title={modalAcao?.tipo === 'foto' ? '📷 Registar Foto (+1 ponto)' : '⚠️ Registar Reclamação (-2 pontos)'}
      >
        <div className="space-y-4">
          {modalAcao && (() => {
            const func = funcionarios.find((f) => f.id === modalAcao.funcionarioId)
            return func ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-brand-700">
                  {func.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{func.name}</p>
                  {func.cargo && <p className="text-xs text-slate-400">{func.cargo}</p>}
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-lg font-bold ${modalAcao.tipo === 'foto' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {modalAcao.tipo === 'foto' ? '+1' : '-2'}
                  </p>
                  <p className="text-[10px] text-slate-400">ponto{modalAcao.tipo === 'foto' ? '' : 's'}</p>
                </div>
              </div>
            ) : null
          })()}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              {modalAcao?.tipo === 'foto' ? 'Descrição da foto *' : 'Descrição da reclamação *'}
            </label>
            <textarea
              value={formAcao.descricao}
              onChange={(e) => setFormAcao({ descricao: e.target.value })}
              rows={3}
              autoFocus
              placeholder={modalAcao?.tipo === 'foto'
                ? 'Ex: Foto da obra — remodelação casa de banho'
                : 'Ex: Cliente relatou atraso na entrega da obra'
              }
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalAcao(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={handleSaveAcao}
              disabled={!formAcao.descricao.trim()}
              className={`flex-1 py-2.5 text-sm rounded-xl text-white font-semibold disabled:opacity-40 transition-colors ${
                modalAcao?.tipo === 'foto' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {modalAcao?.tipo === 'foto' ? '📷 Registar +1 ponto' : '⚠️ Registar -2 pontos'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmar excluir registo */}
      <Modal open={!!confirmDeleteAcao} onClose={() => setConfirmDeleteAcao(null)} title="Excluir Registo">
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-xl ${confirmDeleteAcao?.tipo === 'foto' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span className="text-xl flex-shrink-0">{confirmDeleteAcao?.tipo === 'foto' ? '📷' : '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{confirmDeleteAcao?.descricao}</p>
              <p className="text-xs text-slate-400">
                {confirmDeleteAcao?.func?.name ?? funcionarios.find((f) => f.id === confirmDeleteAcao?.funcionarioId)?.name}
              </p>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${confirmDeleteAcao?.pontos > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {confirmDeleteAcao?.pontos > 0 ? `+${confirmDeleteAcao?.pontos}` : confirmDeleteAcao?.pontos} pts
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Excluir este registo? Os pontos serão <strong>revertidos automaticamente</strong>.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDeleteAcao(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={() => { deleteAcao(confirmDeleteAcao.id); setConfirmDeleteAcao(null) }}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold"
            >
              Excluir Registo
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmar remover funcionário */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remover Funcionário">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Remover <strong>{confirmDelete?.name}</strong> do ranking? Todo o histórico de pontos será apagado.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              Cancelar
            </button>
            <button
              onClick={() => { deleteFuncionario(confirmDelete.id); setConfirmDelete(null) }}
              className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold"
            >
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Ícones inline ─────────────────────────────────────────────────────────────
function TrophyIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}
function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}
function CameraIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function AlertIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
}
function HistoryIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
