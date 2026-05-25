import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths,
  subMonths, addWeeks, subWeeks, format, parseISO, isToday,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import StatusBadge from '../components/StatusBadge'
import VisitModal from '../components/VisitModal'

const STATUS_DOT = {
  agendado:  'bg-blue-500',
  confirmado: 'bg-green-500',
  realizado:  'bg-slate-400',
  cancelado:  'bg-red-400',
}

export default function Agenda() {
  const { visits } = useApp()
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState('month')
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const visitsForDay = (date) => {
    const str = format(date, 'yyyy-MM-dd')
    return visits.filter((v) => v.date === str).sort((a, b) => a.time.localeCompare(b.time))
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => view === 'month' ? setCurrent(subMonths(current, 1)) : setCurrent(subWeeks(current, 1))} className="btn-secondary p-2">
            <ChevronLeftIcon />
          </button>
          <h2 className="text-base font-semibold text-slate-800 w-52 text-center">
            {view === 'month'
              ? format(current, "MMMM 'de' yyyy", { locale: pt })
              : `Semana de ${format(startOfWeek(current, { weekStartsOn: 1 }), 'd MMM', { locale: pt })}`
            }
          </h2>
          <button onClick={() => view === 'month' ? setCurrent(addMonths(current, 1)) : setCurrent(addWeeks(current, 1))} className="btn-secondary p-2">
            <ChevronRightIcon />
          </button>
          <button onClick={() => setCurrent(new Date())} className="btn-secondary text-sm px-3 py-2">Hoje</button>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {['month', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              {v === 'month' ? 'Mês' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <MonthView current={current} visitsForDay={visitsForDay} onSelectVisit={setSelectedVisit} onSelectDay={setSelectedDay} />
      ) : (
        <WeekView current={current} visitsForDay={visitsForDay} onSelectVisit={setSelectedVisit} />
      )}

      {/* Day panel */}
      {selectedDay && (
        <DayPanel date={selectedDay} visits={visitsForDay(selectedDay)} onClose={() => setSelectedDay(null)} onSelectVisit={setSelectedVisit} />
      )}

      {selectedVisit && <VisitModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />}
    </div>
  )
}

function MonthView({ current, visitsForDay, onSelectVisit, onSelectDay }) {
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {weekdays.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayVisits = visitsForDay(day)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          return (
            <button
              key={idx}
              onClick={() => { onSelectDay(day) }}
              className={`cal-day min-h-[80px] p-1.5 text-left border-b border-r border-slate-100 transition-colors ${!inMonth ? 'bg-slate-50' : ''}`}
            >
              <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium mb-1 ${
                today ? 'bg-brand-700 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayVisits.slice(0, 3).map((v) => (
                  <button
                    key={v.id}
                    onClick={(e) => { e.stopPropagation(); onSelectVisit(v) }}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate ${
                      v.status === 'cancelado' ? 'opacity-40' : ''
                    } bg-brand-50 hover:bg-brand-100 transition-colors`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[v.status]}`} />
                      <span className="truncate text-brand-800 font-medium">{v.time} {v.clientName.split(' ')[0]}</span>
                    </div>
                  </button>
                ))}
                {dayVisits.length > 3 && (
                  <p className="text-xs text-slate-400 pl-1">+{dayVisits.length - 3} mais</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ current, visitsForDay, onSelectVisit }) {
  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {days.map((day, i) => (
          <div key={i} className={`py-3 text-center border-r border-slate-100 last:border-0 ${isToday(day) ? 'bg-brand-50' : ''}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase">{weekdays[i]}</p>
            <p className={`text-lg font-bold mt-0.5 ${isToday(day) ? 'text-brand-700' : 'text-slate-700'}`}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[300px]">
        {days.map((day, i) => {
          const dayVisits = visitsForDay(day)
          return (
            <div key={i} className={`p-2 border-r border-slate-100 last:border-0 space-y-2 ${isToday(day) ? 'bg-brand-50/40' : ''}`}>
              {dayVisits.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVisit(v)}
                  className={`w-full text-left p-2 rounded-lg text-xs bg-white border hover:border-brand-300 shadow-sm transition-colors ${v.status === 'cancelado' ? 'opacity-40' : ''}`}
                >
                  <p className="font-bold text-brand-700">{v.time}</p>
                  <p className="font-medium text-slate-700 truncate">{v.clientName.split(' ')[0]}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[v.status]}`} />
                    <span className="text-slate-400 truncate">{v.address.city}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayPanel({ date, visits, onClose, onSelectVisit }) {
  return (
    <div className="card border-l-4 border-l-brand-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">
          {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      {visits.length === 0 ? (
        <p className="text-sm text-slate-400">Sem visitas neste dia.</p>
      ) : (
        <div className="space-y-2">
          {visits.map((v) => (
            <button
              key={v.id}
              onClick={() => { onSelectVisit(v); onClose() }}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <p className="text-brand-700 font-bold w-12 text-sm">{v.time}</p>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{v.clientName}</p>
                <p className="text-xs text-slate-500 truncate">{v.address.street} {v.address.number}, {v.address.city}</p>
              </div>
              <StatusBadge status={v.status} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronLeftIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> }
function ChevronRightIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg> }
