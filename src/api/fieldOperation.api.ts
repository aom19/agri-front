import { api } from './axios'

export const FIELD_OPERATION_STATUSES = ['planned', 'in_progress', 'completed', 'canceled'] as const
export type FieldOperationStatus = (typeof FIELD_OPERATION_STATUSES)[number]

export type FieldOperation = {
    id: number
    field_id: string
    field_name: string
    operation_type_id: number
    operation_type_code: string
    operation_type_name: string
    operation_template_id?: number | null
    operation_template_name?: string | null
    machine_id?: number | null
    machine_name?: string | null
    implement_id?: number | null
    implement_name?: string | null
    operator_id?: number | null
    operator_name?: string | null
    planned_start_at?: string | null
    planned_end_at?: string | null
    area_planned_ha?: number | null
    notes: string
    status: FieldOperationStatus
    created_at: string
    updated_at: string
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
        api
            .get<FieldOperation[]>('/field-operations', { params: filter })
            .then((r) => r.data),

    getById: (id: number) =>
        api.get<FieldOperation>(`/field-operations/${id}`).then((r) => r.data),

    create: (payload: FieldOperationPayload) =>
        api.post<FieldOperation>('/field-operations', payload).then((r) => r.data),

    update: (id: number, payload: FieldOperationPayload) =>
        api.patch<FieldOperation>(`/field-operations/${id}`, payload).then((r) => r.data),

    delete: (id: number) => api.delete(`/field-operations/${id}`).then((r) => r.data),
}
