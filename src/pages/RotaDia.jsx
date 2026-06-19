import { useState, useEffect } from 'react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApp } from '../contexts/AppContext'
import { optimizeRoute, buildRouteWithTimes, generateGoogleMapsUrl } from '../utils/routeUtils'
import StatusBadge, { ConfirmBadge, workTypeLabel } from '../components/StatusBadge'
import VisitModal from '../components/VisitModal'
import MapaRota from '../components/MapaRota'
import { todayString, formatDate } from '../utils/dateUtils'
import { notifyConfirmationWebhook } from '../utils/whatsappUtils'

export default function RotaDia() {
  const { visits, settings, getVisitsByDate, updateVisit } = useApp()
  const [date, setDate]                 = useState(todayString())
  const [orderedVisits, setOrderedVisits] = useState([])
  const [legInfo, setLegInfo]           = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [showMap, setShowMap]           = useState(true)
  const [gapMinutes, setGapMinutes]     = useState(30)
  const [applying, setApplying]         = useState(false)
  const [appliedMsg, setAppliedMsg]     = useState(false)

  const apiKey    = settings.googleMaps?.apiKey ?? ''
  const companyAddr = settings.company

  useEffect(() => {
    const dayVisits = getVisitsByDate(date).filter((v) => v.status !== 'cancelado')
    const optimized = optimizeRoute(dayVisits)
    setOrderedVisits(buildRouteWithTimes(optimized, gapMinutes))
    setLegInfo([])
  }, [date, visits, getVisitsByDate, gapMinutes])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    setOrderedVisits((items) => {
      const oldIdx = items.findIndex((i) => i.id === active.id)
      const newIdx = items.findIndex((i) => i.id === over.id)
      return buildRouteWithTimes(arrayMove(items, oldIdx, newIdx), gapMinutes)
    })
    setLegInfo([])
  }

  function handleOptimize() {
    const dayVisits = getVisitsByDate(date).filter((v) => v.status !== 'cancelado')
    setOrderedVisits(buildRouteWithTimes(optimizeRoute(dayVisits), gapMinutes))
    setLegInfo([])
  }

  // Grava as horas calculadas pela rota em cada visita (define hora nas visitas sem horário)
  // e avisa o cliente por SMS com o horário confirmado.
  async function handleApplyTimes() {
    setApplying(true)
    for (const v of orderedVisits) {
      if (v.scheduledTime && v.scheduledTime !== v.time) {
        await updateVisit(v.id, { time: v.scheduledTime })
        if (v.clientPhone) {
          notifyConfirmationWebhook({ ...v, time: v.scheduledTime }, 'horario')
        }
      }
    }
    setApplying(false)
    setAppliedMsg(true)
    setTimeout(() => setAppliedMsg(false), 3000)
  }

  const hasTimeChanges = orderedVisits.some((v) => v.scheduledTime && v.scheduledTime !== v.time)

  // Leg 0 = HQ→visit[0], leg 1 = visit[0]→visit[1], ..., last = visit[n]→HQ
  const returnLeg = legInfo.length > 0 ? legInfo[legInfo.length - 1] : null
  const totalSeconds = legInfo.reduce((s, l) => s + (l.durationSeconds ?? 0), 0)
  const totalDist    = legInfo.reduce((s, l) => {
    const km = parseFloat((l.distance ?? '0').replace(/[^\d.]/g, ''))
    return s + (isNaN(km) ? 0 : km)
  }, 0)

  const mapsUrl = generateGoogleMapsUrl(orderedVisits, companyAddr)

  return (
    <div className="max-w-3xl space-y-5">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Data</label>
          <input
            type="date"
            className="input max-w-[200px]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap flex items-center gap-1">
            <ClockIcon /> Intervalo
          </label>
          <input
            type="number"
            min={0}
            max={120}
            step={5}
            className="input w-20 text-center"
            value={gapMinutes}
            onChange={(e) => setGapMinutes(Math.max(0, parseInt(e.target.value) || 0))}
          />
          <span className="text-sm text-slate-500">min</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowMap((v) => !v)} className="btn-secondary text-sm flex items-center gap-2">
            <MapIcon />
            {showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
          </button>
          <button onClick={handleOptimize} className="btn-secondary text-sm flex items-center gap-2">
            <AutoIcon />
            Otimizar
          </button>
          {hasTimeChanges && (
            <button
              onClick={handleApplyTimes}
              disabled={applying}
              className="btn-secondary text-sm flex items-center gap-2 !text-green-700 !border-green-300 hover:!bg-green-50"
            >
              <CheckSmallIcon />
              {applying ? 'A aplicar…' : 'Aplicar horários'}
            </button>
          )}
          {appliedMsg && (
            <span className="text-xs text-green-600 font-semibold self-center">✓ Horários gravados!</span>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary text-sm flex items-center gap-2 ${orderedVisits.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <MapsIcon />
            Abrir no Maps
          </a>
        </div>
      </div>

      {/* Summary bar */}
      {orderedVisits.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span><strong>{orderedVisits.length}</strong> visita{orderedVisits.length !== 1 ? 's' : ''}</span>
          {legInfo.length > 0 ? (
            <>
              <span className="flex items-center gap-1">
                <ClockIcon />
                <strong>{Math.round(totalSeconds / 60)} min</strong> de deslocação
                <span className="text-xs text-green-600 font-medium ml-1">(Google Maps)</span>
              </span>
              <span><strong>~{totalDist.toFixed(1)} km</strong> total</span>
            </>
          ) : (
            <span className="text-slate-400 text-xs">
              {apiKey ? 'A calcular tempos reais…' : 'Tempos estimados — configure a Maps API para dados reais'}
            </span>
          )}
        </div>
      )}

      {/* Map */}
      {showMap && (
        <MapaRota
          apiKey={apiKey}
          visits={orderedVisits}
          onLegsUpdate={setLegInfo}
        />
      )}

      {/* Route list */}
      {orderedVisits.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400">Sem visitas para {formatDate(date)}.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <HQStop label="Ponto de partida" sub="Rua Miguel Bombarda 78, Barreiro" />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedVisits.map((v) => v.id)} strategy={verticalListSortingStrategy}>
              {orderedVisits.map((visit, idx) => (
                <SortableVisitCard
                  key={visit.id}
                  visit={visit}
                  index={idx + 1}
                  leg={legInfo[idx] ?? null}
                  onSelect={() => setSelectedVisit(visit)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Return leg */}
          {returnLeg && (
            <div className="flex items-center gap-2 pl-14 py-1">
              <div className="w-px h-4 bg-slate-200" />
              <span className="text-xs text-green-600 font-medium">{returnLeg.duration} · {returnLeg.distance}</span>
            </div>
          )}
          <HQStop label="Regresso à sede" sub="Rua Miguel Bombarda 78, Barreiro" />
        </div>
      )}

      {selectedVisit && <VisitModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />}
    </div>
  )
}

function SortableVisitCard({ visit, index, leg, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: visit.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-10 relative' : ''}>
      {/* Travel connector */}
      <div className="flex items-center gap-2 pl-14 py-1">
        <div className="w-px h-4 bg-slate-200" />
        {leg ? (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <ClockIcon />{leg.duration} · {leg.distance}
            <span className="text-green-500 font-normal">(real)</span>
          </span>
        ) : visit.travelFromPrev ? (
          <span className="text-xs text-slate-400">~{visit.travelFromPrev} min (estimado)</span>
        ) : null}
      </div>

      <div className={`card flex items-start gap-4 hover:border-brand-200 border transition-all ${isDragging ? 'shadow-xl scale-[1.01]' : ''}`}>
        {/* Drag handle */}
        <button {...attributes} {...listeners} className="drag-handle mt-1 text-slate-300 hover:text-slate-500 flex-shrink-0 touch-none">
          <DragIcon />
        </button>

        {/* Stop number */}
        <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-800">{visit.clientName}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {visit.address.street} {visit.address.number}, {visit.address.city}
                {visit.address.postalCode && ` — ${visit.address.postalCode}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-lg font-bold text-brand-700">{visit.scheduledTime ?? visit.time ?? '—'}</span>
              {visit.scheduledTime && visit.time && visit.scheduledTime !== visit.time && (
                <span className="text-xs text-amber-600 line-through">{visit.time}</span>
              )}
              {!visit.time && (
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">sem hora marcada</span>
              )}
              <StatusBadge status={visit.status} size="xs" />
              <ConfirmBadge status={visit.confirmStatus} size="xs" withIcon={false} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-slate-400">{workTypeLabel(visit.workType, visit.workTypeOther)}</span>
            {visit.observations && (
              <span className="text-xs text-slate-400 truncate max-w-xs">· {visit.observations}</span>
            )}
          </div>

          <button onClick={onSelect} className="mt-2 text-xs text-brand-600 hover:underline font-medium">
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  )
}

function HQStop({ label, sub }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0">
        <HomeIcon />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  )
}

function DragIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg> }
function AutoIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> }
function MapsIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function MapIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> }
function HomeIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> }
function ClockIcon() { return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function CheckSmallIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> }
