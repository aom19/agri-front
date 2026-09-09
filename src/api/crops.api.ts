import { api } from './axios'

export type Season = {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
}

export type SeasonPayload = {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  notes: string
}

export type Crop = {
  id: number
  name: string
  code?: string | null
  category: string
  yield_unit: string
  notes: string
  harvest_resource_id?: number | null
  created_at: string
  updated_at: string
}

export type CropPayload = {
  name: string
  code?: string | null
  category: string
  yield_unit: string
  notes: string
}

export type FieldCrop = {
  id: number
  field_id: string
  field_name: string
  field_area_ha?: number | null
  season_id: number
  season_name: string
  season_start: string
  season_end: string
  crop_id: number
  crop_name: string
  yield_unit: string
  planted_area_ha?: number | null
  planted_at?: string | null
  harvested_at?: string | null
  production_total?: number | null
  expected_yield_per_ha?: number | null
  yield_per_ha?: number | null
  notes: string
  harvest_recorded_quantity?: number | null
  harvest_recorded_at?: string | null
  created_at: string
  updated_at: string
}

export type HarvestResult = {
  field_crop: FieldCrop
  movement?: {
    id: number
    movement_type: 'in' | 'out' | 'adjustment'
    quantity_delta: number
    resulting_quantity: number
  } | null
}

export type FieldCropPayload = {
  field_id: string
  season_id: number
  crop_id: number
  planted_area_ha?: number | null
  planted_at?: string | null
  harvested_at?: string | null
  production_total?: number | null
  expected_yield_per_ha?: number | null
  notes: string
}

export type FieldCropFilter = {
  season_id?: number
  crop_id?: number
  field_id?: string
}

export const cropsApi = {
  getSeasons: () => api.get<Season[]>('/seasons').then((r) => r.data),
  createSeason: (payload: SeasonPayload) =>
    api.post<Season>('/seasons', payload).then((r) => r.data),
  updateSeason: (id: number, payload: SeasonPayload) =>
    api.patch<Season>(`/seasons/${id}`, payload).then((r) => r.data),
  deleteSeason: (id: number) => api.delete(`/seasons/${id}`).then((r) => r.data),

  getCrops: () => api.get<Crop[]>('/crops').then((r) => r.data),
  createCrop: (payload: CropPayload) => api.post<Crop>('/crops', payload).then((r) => r.data),
  updateCrop: (id: number, payload: CropPayload) =>
    api.patch<Crop>(`/crops/${id}`, payload).then((r) => r.data),
  deleteCrop: (id: number) => api.delete(`/crops/${id}`).then((r) => r.data),

  getFieldCrops: (filter: FieldCropFilter = {}) =>
    api
      .get<FieldCrop[]>('/field-crops', {
        params: Object.fromEntries(
          Object.entries(filter).filter(([, value]) => value !== undefined && value !== '')
        ),
      })
      .then((r) => r.data),
  createFieldCrop: (payload: FieldCropPayload) =>
    api.post<FieldCrop>('/field-crops', payload).then((r) => r.data),
  updateFieldCrop: (id: number, payload: FieldCropPayload) =>
    api.patch<FieldCrop>(`/field-crops/${id}`, payload).then((r) => r.data),
  deleteFieldCrop: (id: number) => api.delete(`/field-crops/${id}`).then((r) => r.data),
  recordHarvest: (id: number) =>
    api.post<HarvestResult>(`/field-crops/${id}/harvest`).then((r) => r.data),
}
