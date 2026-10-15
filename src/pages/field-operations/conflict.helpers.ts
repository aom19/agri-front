import type {
  ConflictResource,
  FieldOperationConflict,
  FieldOperationConflictParams,
} from '../../api/fieldOperation.api'
import { formatDateTime, formatTime } from '../../utils/dateFormat'
import { toIsoOrNull, type FieldOperationFormState } from './formState'

const RESOURCE_LABELS: Record<ConflictResource, string> = {
  operator: 'operatorul',
  machine: 'mașina',
  implement: 'echipamentul',
}

/** „operatorul și mașina” */
export function conflictResourcesLabel(resources: ConflictResource[]) {
  return resources.map((r) => RESOURCE_LABELS[r]).join(' și ')
}

/** Intervalul ocupat de cealaltă lucrare: „20.10.2026 08:00 – 12:00”. */
export function conflictInterval(conflict: FieldOperationConflict) {
  const sameDay =
    new Date(conflict.start_at).toDateString() === new Date(conflict.end_at).toDateString()
  const end = sameDay ? formatTime(conflict.end_at) : formatDateTime(conflict.end_at)
  return `${formatDateTime(conflict.start_at)} – ${end}`
}

/** „#12 Pregătire sol – Tarla Mare (în lucru), 20.10.2026 08:00 – 12:00: operatorul și mașina” */
export function describeConflict(conflict: FieldOperationConflict) {
  const status = conflict.status === 'in_progress' ? ' (în lucru)' : ''
  return `#${conflict.operation_id} ${conflict.operation_type_name} – ${conflict.field_name}${status}, ${conflictInterval(conflict)}: ${conflictResourcesLabel(conflict.resources)}`
}

/**
 * Parametrii verificării din formular; null când nu e nimic de verificat (fără dată de început,
 * fără resurse sau lucrare închisă).
 */
export function conflictParamsFromForm(
  state: FieldOperationFormState,
  operationId?: number | null
): FieldOperationConflictParams | null {
  if (state.status !== 'planned' && state.status !== 'in_progress') return null
  const start = toIsoOrNull(state.planned_start_at)
  if (!start || (!state.operator_id && !state.machine_id && !state.implement_id)) return null
  const end = toIsoOrNull(state.planned_end_at)
  return {
    planned_start_at: start,
    ...(end ? { planned_end_at: end } : {}),
    ...(operationId ? { exclude_id: operationId } : {}),
    ...(state.operator_id ? { operator_id: Number(state.operator_id) } : {}),
    ...(state.machine_id ? { machine_id: Number(state.machine_id) } : {}),
    ...(state.implement_id ? { implement_id: Number(state.implement_id) } : {}),
  }
}
