import { format, isToday, isTomorrow, parseISO, differenceInDays } from 'date-fns'
import { pt } from 'date-fns/locale'

export function formatDate(dateStr) {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: pt })
}

export function formatDateShort(dateStr) {
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: pt })
}

export function formatDateTime(dateStr, timeStr) {
  return `${formatDateShort(dateStr)} às ${timeStr}`
}

export function formatMonthYear(date) {
  return format(date, "MMMM 'de' yyyy", { locale: pt })
}

export function formatWeekday(date) {
  return format(date, 'EEEE', { locale: pt })
}

export function formatWeekdayShort(date) {
  return format(date, 'EEE', { locale: pt })
}

export function isVisitToday(dateStr) {
  return isToday(parseISO(dateStr))
}

export function isVisitTomorrow(dateStr) {
  return isTomorrow(parseISO(dateStr))
}

export function daysUntilVisit(dateStr) {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function todayString() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function tomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return format(d, 'yyyy-MM-dd')
}

export function dateInDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}
