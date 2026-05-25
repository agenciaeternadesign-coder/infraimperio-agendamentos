import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import StatusBadge, { WORK_TYPE_LABELS } from '../components/StatusBadge'
import VisitModal from '../components/VisitModal'
import { formatDate, todayString, daysUntilVisit } from '../utils/dateUtils'

export default function Dashboard() {
  const { visits, clients, getTodayVisits } = useApp()
  const navigate = useNavigate()
  const [selectedVisit, setSelectedVisit] = useState(null)

  const today = todayString()
  const todayVisits = getTodayVisits()
  const nextVisit = todayVisits.find((v) => v.status !== 'cancelado' && v.status !== 'realizado')

  const upcomingVisits = visits
    .filter((v) => v.date > today && v.status !== 'cancelado')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5)

  const alertClients = visits
    .filter((v) => v.date >= today && v.status !== 'cancelado')
    .reduce((acc, v) => {
      const prevVisits = visits.filter((pv) => pv.clientId === v.clientId && pv.date < today)
      if (prevVisits.length > 0 && !acc.find((a) => a.visitId === v.id)) {
        acc.push({ visitId: v.id, visit: v, prevCount: prevVisits.length })
      }
      return acc
    }, [])

  const stats = [
    { label: 'Visitas hoje', value: todayVisits.filter(v => v.status !== 'cancelado').length, color: 'bg-blue-600', icon: CalIcon },
    { label: 'Esta semana', value: visits.filter(v => { const d = daysUntilVisit(v.date); return d >= 0 && d <= 7 && v.status !== 'cancelado' }).length, color: 'bg-emerald-600', icon: WeekIcon },
    { label: 'Total clientes', value: clients.length, color: 'bg-violet-600', icon: UsersIcon },
    { label: 'Pendentes', value: visits.filter(v => v.status === 'agendado').length, color: 'bg-amber-500', icon: ClockIcon },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              <s.icon />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's visits */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Visitas de Hoje</h2>
            <button onClick={() => navigate('/rota')} className="text-xs text-brand-600 hover:underline font-medium">
              Ver rota
            </button>
          </div>

          {todayVisits.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Sem visitas agendadas para hoje.</p>
              <button onClick={() => navigate('/nova-visita')} className="mt-3 btn-primary text-sm">
                Nova Visita
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayVisits.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-lg font-bold text-brand-700">{v.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{v.clientName}</p>
                    <p className="text-xs text-slate-500 truncate">{v.address.street} {v.address.number}, {v.address.city}</p>
                    <p className="text-xs text-slate-400">{WORK_TYPE_LABELS[v.workType] ?? v.workType}</p>
                  </div>
                  <StatusBadge status={v.status} size="xs" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Next visit highlight */}
          {nextVisit && (
            <div className="bg-brand-700 rounded-xl p-5 text-white">
              <p className="text-brand-200 text-xs font-medium mb-2">Próxima visita</p>
              <p className="font-bold text-lg">{nextVisit.time}</p>
              <p className="font-medium">{nextVisit.clientName}</p>
              <p className="text-brand-200 text-sm mt-1 truncate">
                {nextVisit.address.street} {nextVisit.address.number}, {nextVisit.address.city}
              </p>
              <button
                onClick={() => setSelectedVisit(nextVisit)}
                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Ver detalhes
              </button>
            </div>
          )}

          {/* Alerts */}
          {alertClients.length > 0 && (
            <div className="card border-l-4 border-l-amber-400">
              <div className="flex items-center gap-2 mb-3">
                <AlertIcon />
                <h3 className="font-semibold text-slate-800 text-sm">Alertas</h3>
              </div>
              <div className="space-y-2">
                {alertClients.slice(0, 3).map(({ visitId, visit, prevCount }) => (
                  <button
                    key={visitId}
                    onClick={() => setSelectedVisit(visit)}
                    className="w-full text-left p-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <p className="text-xs font-medium text-amber-800">{visit.clientName}</p>
                    <p className="text-xs text-amber-600">{prevCount} visita(s) anterior(es)</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Próximas Visitas</h3>
            {upcomingVisits.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma visita futura.</p>
            ) : (
              <div className="space-y-2">
                {upcomingVisits.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVisit(v)}
                    className="w-full text-left flex items-start gap-3 hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{v.clientName}</p>
                      <p className="text-xs text-slate-400">{formatDate(v.date)} · {v.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick action */}
      <button
        onClick={() => navigate('/nova-visita')}
        className="fixed bottom-6 right-6 bg-brand-700 hover:bg-brand-800 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 font-medium transition-colors md:hidden"
      >
        <PlusIcon />
        Nova Visita
      </button>

      {selectedVisit && (
        <VisitModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
      )}
    </div>
  )
}

function CalIcon()   { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
function WeekIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> }
function UsersIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> }
function ClockIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function PlusIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function AlertIcon() { return <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }
