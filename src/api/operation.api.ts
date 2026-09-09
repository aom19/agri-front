import { api } from './axios'

export type OperationType = {
  id: number
  code: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type TemplateResource = {
  id: number
  template_id: number
  resource_id: number
  quantity_per_unit: number
  notes: string
  created_at: string
  updated_at: string
  resource?: {
    id: number
    name: string
    resource_type_id: number
    price_per_unit: number
    notes: string
    created_at: string
    updated_at: string
  }
}

export type OperationTemplate = {
  id: number
  operation_type_id: number
  name: string
  description: string
  unit: string
  crop_id?: number | null
  crop_name?: string | null
  created_at: string
  updated_at: string
  operation_type?: OperationType
  resources?: TemplateResource[]
  machine_types?: string[]
  implement_types?: string[]
}

export type OperationTypePayload = {
  code: string
  name: string
  description: string
}

export type TemplateResourcePayload = {
  resource_id: number
  quantity_per_unit: number
  notes: string
}

export type OperationTemplatePayload = {
  operation_type_id: number
  name: string
  description: string
  unit: string
  crop_id?: number | null
  resources?: TemplateResourcePayload[]
  machine_types?: string[]
  implement_types?: string[]
}

export const operationApi = {
  // Operation Types
  getAllTypes: () => api.get<OperationType[]>('/operation-types').then((r) => r.data),

  getTypeById: (id: number) => api.get<OperationType>(`/operation-types/${id}`).then((r) => r.data),

  createType: (payload: OperationTypePayload) =>
    api.post<OperationType>('/operation-types', payload).then((r) => r.data),

  updateType: (id: number, payload: OperationTypePayload) =>
    api.patch<OperationType>(`/operation-types/${id}`, payload).then((r) => r.data),

  deleteType: (id: number) => api.delete(`/operation-types/${id}`).then((r) => r.data),

  // Operation Templates
  getAllTemplates: () => api.get<OperationTemplate[]>('/operation-templates').then((r) => r.data),

  getTemplateById: (id: number) =>
    api.get<OperationTemplate>(`/operation-templates/${id}`).then((r) => r.data),

  getTemplatesByType: (typeId: number) =>
    api.get<OperationTemplate[]>(`/operation-types/${typeId}/templates`).then((r) => r.data),

  createTemplate: (payload: OperationTemplatePayload) =>
    api.post<OperationTemplate>('/operation-templates', payload).then((r) => r.data),

  updateTemplate: (id: number, payload: OperationTemplatePayload) =>
    api.patch<OperationTemplate>(`/operation-templates/${id}`, payload).then((r) => r.data),

  deleteTemplate: (id: number) => api.delete(`/operation-templates/${id}`).then((r) => r.data),
}

export type ImplementCompatibility = {
  id: number
  machine_type: string
  implement_type: string
  created_at: string
  updated_at: string
}

export const implementCompatibilityApi = {
  getAll: () => api.get<ImplementCompatibility[]>('/implement-compatibilities').then((r) => r.data),
}
