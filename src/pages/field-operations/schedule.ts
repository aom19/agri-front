import type { FieldOperation } from '../../api/fieldOperation.api'

// Afișează o durată doar în ore și minute (fără zile), ex: "26 h 30 min".
export function formatHoursAndMinutes(durationMs: number) {
  const totalMinutes = Math.round(durationMs / 60000)
  if (totalMinutes <= 0) return '-'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

/** Timpul estimat de lucru, din intervalul planificat; null fără ambele capete. */
export function estimatedWorkTime(operation: FieldOperation) {
  if (!operation.planned_start_at || !operation.planned_end_at) return null
  const start = new Date(operation.planned_start_at).getTime()
  const end = new Date(operation.planned_end_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  return formatHoursAndMinutes(end - start)
}

// Cu cât a fost depășit timpul estimat (ms) pentru o operațiune în lucru; 0 dacă nu este depășit.
export function getOverdueMs(operation: FieldOperation, now: number) {
  if (operation.status !== 'in_progress' || !operation.planned_end_at) return 0
  const end = new Date(operation.planned_end_at).getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, now - end)
}
