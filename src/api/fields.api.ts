import { api } from './axios'
import { listParams, type PageParams, type Paginated } from './pagination'

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

export type FieldListParams = PageParams & {
  /** Nume sau număr cadastral. */
  q?: string
  min_area?: number
  max_area?: number
  sort?: 'name' | 'area'
  order?: 'asc' | 'desc'
}

export type FieldPage = Paginated<Field> & { total_area_ha: number }

export const fieldsApi = {
  /** O pagină de terenuri, cu suprafața totală a tuturor celor filtrate. */
  getPage: (params: FieldListParams) =>
    api.get<FieldPage>('/fields', { params: listParams(params) }).then((r) => r.data),
  getAll: () => api.get<Field[]>('/fields').then((r) => r.data),
  create: (payload: UpsertFieldRequest) => api.post<Field>('/fields', payload).then((r) => r.data),
  update: (id: string, payload: UpsertFieldRequest) =>
    api.patch<Field>(`/fields/${id}`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/fields/${id}`),
}
