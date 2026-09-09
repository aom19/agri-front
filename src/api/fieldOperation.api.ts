import { api } from './axios'
import type { GeoJSONPolygon } from './fields.api'

export const FIELD_OPERATION_STATUSES = ['planned', 'in_progress', 'completed', 'canceled'] as const
export type FieldOperationStatus = (typeof FIELD_OPERATION_STATUSES)[number]

export type FieldOperationChecklistPayload = {
  machine_status: boolean
  implement_status: boolean
  field_area: boolean
  notes_confirmed: boolean
}

export type FieldOperationChecklist = FieldOperationChecklistPayload & {
  updated_at?: string | null
}

export type FieldOperation = {
  id: number
  field_id: string
  field_name: string
  field_geometry?: GeoJSONPolygon | null
  operation_type_id: number
  operation_type_code: string
  operation_type_name: string
  operation_template_id?: number | null
  operation_template_name?: string | null
  machine_id?: number | null
  machine_name?: string | null
  machine_status?: string | null
  implement_id?: number | null
  implement_name?: string | null
  implement_status?: string | null
  operator_id?: number | null
  operator_name?: string | null
  planned_start_at?: string | null
  planned_end_at?: string | null
  area_planned_ha?: number | null
  notes: string
  status: FieldOperationStatus
  checklist: FieldOperationChecklist
  field_crop_id?: number | null
  crop_name?: string | null
  season_name?: string | null
  actual_start_at?: string | null
  actual_end_at?: string | null
  actual_duration_minutes?: number | null
  area_completed_ha?: number | null
  fuel_used_l?: number | null
  machine_hours?: number | null
  completion_notes: string
  created_at: string
  updated_at: string
}

export type FieldOperationResourceUsage = {
  resource_id: number
  quantity: number
}

export type FieldOperationCompletionPayload = {
  actual_end_at?: string | null
  area_completed_ha?: number | null
  fuel_used_l?: number | null
  machine_hours?: number | null
  notes?: string
  resources?: FieldOperationResourceUsage[]
  consume_from_template?: boolean
}

export type FieldOperationCompletionResult = {
  operation: FieldOperation
  movements: Array<{
    id: number
    resource_id: number
    resource_name?: string
    quantity_delta: number
    resulting_quantity: number
    total_cost?: number | null
  }>
}

export type FieldOperationPayload = {
  field_id: string
  operation_type_id: number
  operation_template_id?: number | null
  machine_id?: number | null
  implement_id?: number | null
  operator_id?: number | null
  planned_start_at?: string | null
  planned_end_at?: string | null
  area_planned_ha?: number | null
  notes?: string
  status?: FieldOperationStatus
  field_crop_id?: number | null
}

export type FieldOperationsFilter = {
  status?: FieldOperationStatus
  field_id?: string
  operation_type_id?: number
  machine_id?: number
  operator_id?: number
}

export const fieldOperationsApi = {
  getAll: (filter?: FieldOperationsFilter) =>
    api.get<FieldOperation[]>('/field-operations', { params: filter }).then((r) => r.data),

  getById: (id: number) => api.get<FieldOperation>(`/field-operations/${id}`).then((r) => r.data),

  create: (payload: FieldOperationPayload) =>
    api.post<FieldOperation>('/field-operations', payload).then((r) => r.data),

  update: (id: number, payload: FieldOperationPayload) =>
    api.patch<FieldOperation>(`/field-operations/${id}`, payload).then((r) => r.data),

  updateChecklist: (id: number, payload: FieldOperationChecklistPayload) =>
    api.patch<FieldOperation>(`/field-operations/${id}/checklist`, payload).then((r) => r.data),

  complete: (id: number, payload: FieldOperationCompletionPayload) =>
    api
      .patch<FieldOperationCompletionResult>(`/field-operations/${id}/complete`, payload)
      .then((r) => r.data),
  start: (id: number) =>
    api.patch<FieldOperation>(`/field-operations/${id}/start`).then((r) => r.data),

  delete: (id: number) => api.delete(`/field-operations/${id}`).then((r) => r.data),
}
