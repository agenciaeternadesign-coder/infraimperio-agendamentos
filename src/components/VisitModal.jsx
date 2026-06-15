import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import StatusBadge, { ConfirmBadge, CONFIRM_CONFIG, workTypeLabel } from './StatusBadge'
import { formatDate } from '../utils/dateUtils'
import {
  buildWhatsAppUrl, buildConfirmationMessage, buildReminderMessage, sendTwilioWhatsApp,
} from '../utils/whatsappUtils'

const STATUS_OPTIONS = [
  { value: 'agendado',   label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'realizado',  label: 'Realizado' },
  { value: 'cancelado',  label: 'Cancelado' },
]

const REMINDER_TYPES = [
  { key: 'reminder3days', label: '3 dias antes' },
  { key: 'reminder1day',  label: '1 dia antes' },
  { key: 'reminderDay',   label: 'Lembrete dia' },
]

export default function VisitModal({ visit, onClose }) {
  const { updateVisit, deleteVisit, settings } = useApp()
  const navigate  = useNavigate()
  const company   = settings.company
  const twilio    = settings.whatsapp?.twilio
  const hasTwilio = !!(twilio?.accountSid && twilio?.authToken && twilio?.fromNumber)

  const [twilioResult, setTwilioResult]   = useState(null)
  const [sendingTwilio, setSendingTwilio] = useState(false)
  const [editDate, setEditDate] = useState(visit.date)
  const [editTime, setEditTime] = useState(visit.time)
  const [savedDT,  setSavedDT]  = useState(false)

  function handleStatusChange(e) {
    updateVisit(visit.id, { status: e.target.value })
  }

  function handleConfirmStatusChange(e) {
    updateVisit(visit.id, { confirmStatus: e.target.value })
  }

  function handleSaveDateTime() {
    if (editDate && editTime) {
      updateVisit(visit.id, { date: editDate, time: editTime })
      setSavedDT(true)
      setTimeout(() => setSavedDT(false), 2000)
    }
  }

  function handleDelete() {
    if (window.confirm('Tem a certeza que quer eliminar esta visita?')) {
      deleteVisit(visit.id)
      onClose()
    }
  }

  async function handleTwilioSend(message, waKey) {
    if (!visit.clientPhone) return
    setSendingTwilio(true)
    setTwilioResult(null)
    const result = await sendTwilioWhatsApp(visit.clientPhone, message, twilio)
    setTwilioResult(result)
    setSendingTwilio(false)
    if (result.success && waKey) {
      updateVisit(visit.id, {
        whatsappSent: { ...visit.whatsappSent, [waKey]: true },
      })
    }
  }

  const confirmMsg  = buildConfirmationMessage(visit, company)
  const confirmUrl  = visit.clientPhone ? buildWhatsAppUrl(visit.clientPhone, confirmMsg) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-brand-600 text-xs font-semibold uppercase tracking-wide mb-1">Visita de Orçamento</p>
              <h2 className="text-xl font-semibold text-slate-800">{visit.clientName}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <XIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status + date/time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={visit.status} />
              <ConfirmBadge status={visit.confirmStatus} />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2">Data e hora da visita</p>
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
                  <input type="date" className="input text-sm" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hora</label>
                  <input type="time" className="input text-sm" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                </div>
                <button
                  onClick={handleSaveDateTime}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  {savedDT ? '✓ Guardado' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <Row icon={<MapIcon />} label="Morada">
              {visit.address.street} {visit.address.number}
              {visit.address.floor && `, ${visit.address.floor}`}
              {', '}{visit.address.city}
              {visit.address.postalCode && ` — ${visit.address.postalCode}`}
            </Row>
            <Row icon={<HammerIcon />} label="Tipo de Obra">
              {workTypeLabel(visit.workType, visit.workTypeOther)}
            </Row>
            {visit.observations && (
              <Row icon={<NoteIcon />} label="Observações">{visit.observations}</Row>
            )}
            {visit.clientPhone && (
              <Row icon={<PhoneIcon />} label="Telefone">
                <a href={`tel:${visit.clientPhone}`} className="text-brand-600 hover:underline">{visit.clientPhone}</a>
              </Row>
            )}
            {visit.clientEmail && (
              <Row icon={<MailIcon />} label="E-mail">
                <a href={`mailto:${visit.clientEmail}`} className="text-brand-600 hover:underline">{visit.clientEmail}</a>
              </Row>
            )}
          </div>

          {/* ── WhatsApp ── */}
          {visit.clientPhone && (
            <div className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <WAIcon />
                <h4 className="font-semibold text-slate-700 text-sm">WhatsApp</h4>
              </div>

              {/* Level 1 — wa.me links */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Envio manual (clique para abrir WhatsApp)</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={confirmUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                  >
                    <WAIcon sm /> Confirmação
                  </a>
                  {REMINDER_TYPES.map(({ key, label }) => {
                    const msg = buildReminderMessage(visit, company, key)
                    const url = buildWhatsAppUrl(visit.clientPhone, msg)
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium transition-colors"
                      >
                        <WAIcon sm /> {label}
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Level 2 — Twilio auto */}
              {hasTwilio ? (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Envio via Twilio (automático ao criar, ou manual)</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={sendingTwilio}
                      onClick={() => handleTwilioSend(confirmMsg, 'confirmation')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-50 text-xs font-medium transition-colors ${visit.whatsappSent?.confirmation ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-brand-700 hover:bg-brand-800 text-white'}`}
                    >
                      {sendingTwilio ? <SpinIcon /> : <WAIcon sm />}
                      {visit.whatsappSent?.confirmation ? '✓ Confirmação' : 'Enviar confirmação'}
                    </button>
                    {REMINDER_TYPES.map(({ key, label }) => {
                      const msg = buildReminderMessage(visit, company, key)
                      const sent = visit.whatsappSent?.[key]
                      return (
                        <button
                          key={key}
                          disabled={sendingTwilio}
                          onClick={() => handleTwilioSend(msg, key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-50 text-xs font-medium transition-colors ${sent ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                        >
                          {sendingTwilio ? <SpinIcon /> : <WAIcon sm />}
                          {sent ? `✓ ${label}` : label}
                        </button>
                      )
                    })}
                  </div>
                  {twilioResult && (
                    <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${twilioResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {twilioResult.success ? '✓ Mensagem enviada com sucesso!' : `✗ ${twilioResult.error}`}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  A confirmação é enviada automaticamente ao guardar o agendamento (via servidor).
                  Os botões acima abrem o WhatsApp para envio manual, se precisar.
                </p>
              )}
            </div>
          )}

          {/* Sent status — email + WhatsApp */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">E-mails enviados</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'confirmation',  label: 'Confirmação' },
                  { key: 'reminder3days', label: '3 dias antes' },
                  { key: 'reminder1day',  label: '1 dia antes' },
                  { key: 'reminderDay',   label: 'Dia da visita' },
                ].map(({ key, label }) => (
                  <span key={key} className={`text-xs px-2 py-1 rounded-full ${visit.emailsSent?.[key] ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {visit.emailsSent?.[key] ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">WhatsApp enviados</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'confirmation',  label: 'Confirmação' },
                  { key: 'reminder3days', label: '3 dias antes' },
                  { key: 'reminder1day',  label: '1 dia antes' },
                  { key: 'reminderDay',   label: 'Dia da visita' },
                ].map(({ key, label }) => (
                  <span key={key} className={`text-xs px-2 py-1 rounded-full ${visit.whatsappSent?.[key] ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {visit.whatsappSent?.[key] ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Change status */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Estado da agenda</label>
              <select className="input" value={visit.status} onChange={handleStatusChange}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Confirmação WhatsApp</label>
              <select className="input" value={visit.confirmStatus ?? 'pendente'} onChange={handleConfirmStatusChange}>
                {Object.entries(CONFIRM_CONFIG).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0">
          <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700 transition-colors">
            Eliminar
          </button>
          <div className="flex gap-2">
            <button onClick={() => { onClose(); navigate(`/clientes/${visit.clientId}`) }} className="btn-secondary text-sm">
              Ver cliente
            </button>
            <button onClick={onClose} className="btn-primary text-sm">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-slate-400 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

function XIcon()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
function MapIcon()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function HammerIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> }
function NoteIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
function PhoneIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> }
function MailIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
function WAIcon({ sm }) {
  const s = sm ? 'w-3 h-3' : 'w-5 h-5'
  return <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.112 1.532 5.836L.053 23.447l5.761-1.51A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.91 0-3.693-.518-5.22-1.42l-.37-.22-3.842 1.007 1.025-3.742-.24-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
}
function SpinIcon()   { return <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> }
