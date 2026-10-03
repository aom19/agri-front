// formatarea datelor Fiecare funcție primește textul afișat când
// valoarea lipsește sau nu e o dată validă.

const dateTimeFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 03.10.2026, 14:30 */
export function formatDateTime(value: string | null | undefined, fallback = '-') {
  const date = toDate(value)
  return date ? dateTimeFormat.format(date) : fallback
}

/** 03.10.2026 */
export function formatDate(value: string | null | undefined, fallback = '-') {
  const date = toDate(value)
  return date ? dateFormat.format(date) : fallback
}

/** 03.10.2026, pentru o zi calendaristică fără oră (YYYY-MM-DD), în ora locală. */
export function formatIsoDay(value: string | null | undefined, fallback = '-') {
  return formatDate(value ? `${value}T00:00:00` : value, fallback)
}

/** 14:30 */
export function formatTime(value: string | null | undefined, fallback = '--:--') {
  const date = toDate(value)
  return date ? timeFormat.format(date) : fallback
}
