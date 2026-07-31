import { api } from './axios'

export type ResourceCategory = 'fuel' | 'fertilizer' | 'seed' | 'pesticide' | 'water' | 'other'

export type ResourceType = {
  id: number
  name: string
  category: ResourceCategory
  default_unit: string
  created_at: string
  updated_at: string
}

export type Resource = {
  id: number
  name: string
  resource_type_id: number
  resource_type?: ResourceType
  price_per_unit: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type ResourcePayload = {
  name: string
  resource_type_id: number
  price_per_unit: number
  notes: string | null
}

export type Stock = {
  id: number
  resource_id: number
  resource?: Resource
  quantity: number
  minimum_quantity: number
  created_at: string
  updated_at: string
}

export type StockPayload = {
  resource_id: number
  quantity: number
  minimum_quantity: number
}

export type ResourceTypePayload = {
  name: string
  category: ResourceCategory
  default_unit: string
}

export const resourceApi = {
  getAllResourceTypes: () => api.get<ResourceType[]>('/resource-types').then((r) => r.data),

  createResourceType: (payload: ResourceTypePayload) =>
    api.post<ResourceType>('/resource-types', payload).then((r) => r.data),

  updateResourceType: (id: string, payload: ResourceTypePayload) =>
    api.patch<ResourceType>(`/resource-types/${id}`, payload).then((r) => r.data),

  deleteResourceType: (id: string) => api.delete(`/resource-types/${id}`).then((r) => r.data),

  getAllStocks: () => api.get<Stock[]>('/stocks').then((r) => r.data),

  createStock: (payload: StockPayload) => api.post<Stock>('/stocks', payload).then((r) => r.data),

  updateStock: (id: string, payload: StockPayload) =>
    api.patch<Stock>(`/stocks/${id}`, payload).then((r) => r.data),

  deleteStock: (id: string) => api.delete(`/stocks/${id}`).then((r) => r.data),

  getAllResources: () => api.get<Resource[]>('/resources').then((r) => r.data),

  getResourceById: (id: string) => api.get<Resource>(`/resources/${id}`).then((r) => r.data),

  createResource: (payload: ResourcePayload) =>
    api.post<Resource>('/resources', payload).then((r) => r.data),

  updateResource: (id: string, payload: ResourcePayload) =>
    api.patch<Resource>(`/resources/${id}`, payload).then((r) => r.data),

  deleteResource: (id: string) => api.delete(`/resources/${id}`).then((r) => r.data),
}
