import { api } from './axios'

export type ResourceCategory =
  | 'fuel'
  | 'fertilizer'
  | 'seed'
  | 'pesticide'
  | 'water'
  | 'harvest'
  | 'other'

export type ResourceType = {
  id: number
  name: string
  category: ResourceCategory
  default_unit: string
  created_at: string
  updated_at: string
}

// Resursa are stocul ei: cantitatea se modifică doar prin mișcări de stoc.
export type Resource = {
  id: number
  name: string
  resource_type_id: number
  resource_type?: ResourceType
  price_per_unit: number
  quantity: number
  minimum_quantity: number
  notes: string | null
  created_at: string
  updated_at: string
}

// La editare cantitatea lipsește: corecțiile se fac prin mișcări de stoc.
export type ResourcePayload = {
  name: string
  resource_type_id: number
  price_per_unit: number
  minimum_quantity: number
  notes: string | null
}

// La creare, cantitatea inițială se înregistrează ca ajustare de inventar.
export type ResourceCreatePayload = ResourcePayload & {
  quantity: number
}

export type ResourceTypePayload = {
  name: string
  category: ResourceCategory
  default_unit: string
}

/** Filtrul de listare aplicat în API (SQL): categoria tipului de resursă și text în nume/tip/unitate. */
export type ResourceListFilter = {
  category?: string
  q?: string
}

export type CategoryCounts = {
  total: number
  by_category: { category: string; count: number }[]
}

function filterParams(filter: ResourceListFilter = {}) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== '')
  )
}

export const resourceApi = {
  getAllResourceTypes: () => api.get<ResourceType[]>('/resource-types').then((r) => r.data),

  createResourceType: (payload: ResourceTypePayload) =>
    api.post<ResourceType>('/resource-types', payload).then((r) => r.data),

  updateResourceType: (id: string, payload: ResourceTypePayload) =>
    api.patch<ResourceType>(`/resource-types/${id}`, payload).then((r) => r.data),

  deleteResourceType: (id: string) => api.delete(`/resource-types/${id}`).then((r) => r.data),

  getAllResources: (filter: ResourceListFilter = {}) =>
    api.get<Resource[]>('/resources', { params: filterParams(filter) }).then((r) => r.data),
  getResourceCategoryCounts: () =>
    api.get<CategoryCounts>('/resources/category-counts').then((r) => r.data),

  getResourceById: (id: string) => api.get<Resource>(`/resources/${id}`).then((r) => r.data),

  createResource: (payload: ResourceCreatePayload) =>
    api.post<Resource>('/resources', payload).then((r) => r.data),

  updateResource: (id: string, payload: ResourcePayload) =>
    api.patch<Resource>(`/resources/${id}`, payload).then((r) => r.data),

  deleteResource: (id: string) => api.delete(`/resources/${id}`).then((r) => r.data),
}
