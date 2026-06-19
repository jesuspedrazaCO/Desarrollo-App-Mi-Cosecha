import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

const toLocalDate = (date) => {
  if (!date) return null
  if (date instanceof Date) return date
  const datePart = String(date).split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  const d = toLocalDate(date)
  if (!d || !isValid(d)) return '—'
  return format(d, fmt, { locale: es })
}

export const formatDateLong = (date) => formatDate(date, "EEEE dd 'de' MMMM 'de' yyyy")

export const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return format(d, 'MMM yyyy', { locale: es })
}

export const toInputDate = (date) => {
  const d = toLocalDate(date)
  if (!d || !isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}