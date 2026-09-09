import type { FieldOperation, FieldOperationPayload } from '../../api/fieldOperation.api'

export type FieldOperationFormState = {
  field_id: string
  operation_type_id: string
  operation_template_id: string
  machine_id: string
  implement_id: string
  operator_id: string
  planned_start_at: string
  planned_end_at: string
  area_planned_ha: string
  notes: string
  status: FieldOperation['status']
}

export type FieldOperationFormErrors = Partial<Record<keyof FieldOperationFormState, string>>

export type FieldOperationFormMode = 'create' | 'edit' | 'view'

export const initialFieldOperationFormState: FieldOperationFormState = {
  field_id: '',
  operation_type_id: '',
  operation_template_id: '',
  machine_id: '',
  implement_id: '',
  operator_id: '',
  planned_start_at: '',
  planned_end_at: '',
  area_planned_ha: '',
  notes: '',
  status: 'planned',
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toIsoOrNull(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function fieldOperationToFormState(item: FieldOperation): FieldOperationFormState {
  return {
    field_id: item.field_id,
    operation_type_id: String(item.operation_type_id),
    operation_template_id: item.operation_template_id ? String(item.operation_template_id) : '',
    machine_id: item.machine_id ? String(item.machine_id) : '',
    implement_id: item.implement_id ? String(item.implement_id) : '',
    operator_id: item.operator_id ? String(item.operator_id) : '',
    planned_start_at: toDateTimeLocal(item.planned_start_at),
    planned_end_at: toDateTimeLocal(item.planned_end_at),
    area_planned_ha: item.area_planned_ha != null ? String(item.area_planned_ha) : '',
    notes: item.notes ?? '',
    status: item.status,
  }
}

export function formStateToPayload(state: FieldOperationFormState): FieldOperationPayload {
  return {
    field_id: state.field_id,
    operation_type_id: Number(state.operation_type_id),
    operation_template_id: state.operation_template_id ? Number(state.operation_template_id) : null,
    machine_id: state.machine_id ? Number(state.machine_id) : null,
    implement_id: state.implement_id ? Number(state.implement_id) : null,
    operator_id: state.operator_id ? Number(state.operator_id) : null,
    planned_start_at: toIsoOrNull(state.planned_start_at),
    planned_end_at: toIsoOrNull(state.planned_end_at),
    area_planned_ha: state.area_planned_ha ? Number(state.area_planned_ha) : null,
    notes: state.notes,
    status: state.status,
  }
}

export function validateFieldOperation(state: FieldOperationFormState): FieldOperationFormErrors {
  const errors: FieldOperationFormErrors = {}
  if (!state.field_id) errors.field_id = 'Alege terenul.'
  if (!state.operation_type_id) errors.operation_type_id = 'Alege tipul operațiunii.'
  if (state.area_planned_ha && Number(state.area_planned_ha) < 0) {
    errors.area_planned_ha = 'Suprafața nu poate fi negativă.'
  }
  if (state.planned_start_at && state.planned_end_at) {
    if (new Date(state.planned_end_at) < new Date(state.planned_start_at)) {
      errors.planned_end_at = 'Sfârșitul trebuie să fie după start.'
    }
  }
  return errors
}
