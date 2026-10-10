import { api } from './axios'
import type { GeoJSONPolygon } from './fields.api'
import type { OperationTypeValue } from '../schemas/operation.schema'

export const FIELD_OPERATION_STATUSES = ['planned', 'in_progress', 'completed', 'canceled'] as const
export type FieldOperationStatus = (typeof FIELD_OPERATION_STATUSES)[number]

export type FieldOperation = {
  id: number
  field_id: string
  field_name: string
  field_geometry?: GeoJSONPolygon | null
  // tipul efectiv: al template-ului, sau tipul propriu când operațiunea nu are template
  operation_type: OperationTypeValue
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
  /** Combustibilul raportat; se scade din stocul resursei fuel_resource_id. */
  fuel_used_l?: number | null
  fuel_resource_id?: number | null
  machine_hours?: number | null
  notes?: string
  /** Cu consume_from_template, corectează consumul calculat din normele șablonului. */
  resources?: FieldOperationResourceUsage[]
  consume_from_template?: boolean
}

export type ConsumptionEstimateItem = {
  resource_id: number
  resource_name: string
  category: string
  unit: string
  quantity_per_unit: number
  quantity: number
}

export type FuelStock = {
  resource_id: number
  resource_name: string
  unit: string
  quantity: number
}

/** Consumul estimat la finalizare, calculat de server (normă × suprafață). */
export type ConsumptionEstimate = {
  area_ha: number
  items: ConsumptionEstimateItem[]
  fuel_resources: FuelStock[]
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
  // cu template, tipul vine din el; dacă e trimis, trebuie să fie același
  operation_type?: OperationTypeValue | null
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
  operation_type?: OperationTypeValue
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

  getConsumptionEstimate: (id: number, areaHa?: number | null) =>
    api
      .get<ConsumptionEstimate>(`/field-operations/${id}/consumption-estimate`, {
        params: areaHa != null ? { area_ha: areaHa } : undefined,
      })
      .then((r) => r.data),

  complete: (id: number, payload: FieldOperationCompletionPayload) =>
    api
      .patch<FieldOperationCompletionResult>(`/field-operations/${id}/complete`, payload)
      .then((r) => r.data),
  start: (id: number) =>
    api.patch<FieldOperation>(`/field-operations/${id}/start`).then((r) => r.data),

  delete: (id: number) => api.delete(`/field-operations/${id}`).then((r) => r.data),
}
