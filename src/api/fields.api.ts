import { api } from './axios'

export type GeoJSONPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type Field = {
  id: string
  name: string
  cadastral_number?: string | null
  area_ha: number | null
  geometry: GeoJSONPolygon
  created_at: string
  updated_at: string
}

export type UpsertFieldRequest = {
  name: string
  cadastral_number?: string | null
  area_ha?: number | null
  geometry: GeoJSONPolygon
}

export const fieldsApi = {
  getAll: () => api.get<Field[]>('/fields').then((r) => r.data),
  create: (payload: UpsertFieldRequest) => api.post<Field>('/fields', payload).then((r) => r.data),
  update: (id: string, payload: UpsertFieldRequest) =>
    api.patch<Field>(`/fields/${id}`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/fields/${id}`),
}
