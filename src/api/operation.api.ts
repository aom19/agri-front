import { api } from './axios'
import type { OperationTypeValue } from '../schemas/operation.schema'
import { listParams, type PageParams, type Paginated } from './pagination'

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
  operation_type: OperationTypeValue
  name: string
  description: string
  unit: string
  crop_id?: number | null
  crop_name?: string | null
  created_at: string
  updated_at: string
  resources?: TemplateResource[]
  machine_types?: string[]
  implement_types?: string[]
}

export type TemplateResourcePayload = {
  resource_id: number
  quantity_per_unit: number
  notes: string
}

export type OperationTemplatePayload = {
  operation_type: OperationTypeValue
  name: string
  description: string
  unit: string
  crop_id?: number | null
  resources?: TemplateResourcePayload[]
  machine_types?: string[]
  implement_types?: string[]
}

export const operationApi = {
  /** O pagină de template-uri; căutarea `q` e în nume, unitate și tipul operațiunii. */
  getTemplatesPage: (params: PageParams & { q?: string }) =>
    api
      .get<Paginated<OperationTemplate>>('/operation-templates', { params: listParams(params) })
      .then((r) => r.data),
  getAllTemplates: () => api.get<OperationTemplate[]>('/operation-templates').then((r) => r.data),

  getTemplateById: (id: number) =>
    api.get<OperationTemplate>(`/operation-templates/${id}`).then((r) => r.data),

  createTemplate: (payload: OperationTemplatePayload) =>
    api.post<OperationTemplate>('/operation-templates', payload).then((r) => r.data),

  updateTemplate: (id: number, payload: OperationTemplatePayload) =>
    api.patch<OperationTemplate>(`/operation-templates/${id}`, payload).then((r) => r.data),

  deleteTemplate: (id: number) => api.delete(`/operation-templates/${id}`).then((r) => r.data),
}
