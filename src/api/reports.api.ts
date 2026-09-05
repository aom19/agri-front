import { api } from './axios'
import type { GeoJSONPolygon } from './fields.api'
import type { FieldCrop, Season } from './crops.api'

export type ReportFilters = {
  from?: string
  to?: string
  field_id?: string
  operation_type_id?: number
  machine_id?: number
  operator_id?: number
}

export type ReportGranularity = 'day' | 'week' | 'month'

export type ReportPeriod = {
  from: string
  to: string
  previous_from: string
  previous_to: string
  granularity: ReportGranularity
}

export type ReportOperationsMetrics = {
  operations_total: number
  operations_planned: number
  operations_in_progress: number
  operations_completed: number
  operations_canceled: number
  overdue_operations: number
  on_time_completed: number
  planned_area_ha: number
  completed_area_ha: number
  estimated_cost: number
  fields_worked: number
  machines_used: number
  operators_used: number
  completed_with_actuals: number
  actual_duration_minutes: number
  realized_area_ha: number
  fuel_used_l: number
  machine_hours: number
  real_cost: number
}

export type ReportInventorySnapshot = {
  total_fields: number
  total_area_ha: number
  total_machines: number
  active_machines: number
  maintenance_assets: number
  total_operators: number
  active_operators: number
  total_stocks: number
  low_stocks: number
  stock_value: number
}

export type ReportSummary = {
  period: ReportPeriod
  current: ReportOperationsMetrics
  previous: ReportOperationsMetrics
  inventory: ReportInventorySnapshot
}

export type ReportTimeBucket = {
  bucket: string
  planned: number
  in_progress: number
  completed: number
  canceled: number
  area_ha: number
}

export type ReportNamedCount = { key: string; count: number }
export type ReportNamedValue = { key: string; value: number }

export type ReportOperationTypeStat = {
  operation_type_id: number
  operation_type_name: string
  total: number
  completed: number
  area_ha: number
  estimated_cost: number
}

export type ReportOperationRow = {
  id: number
  field_id: string
  field_name: string
  operation_type_name: string
  template_name?: string | null
  machine_name?: string | null
  implement_name?: string | null
  operator_name?: string | null
  planned_start_at?: string | null
  planned_end_at?: string | null
  area_planned_ha?: number | null
  status: string
  delay_minutes: number
  estimated_cost: number
  actual_start_at?: string | null
  actual_end_at?: string | null
  actual_duration_minutes?: number | null
  area_completed_ha?: number | null
  fuel_used_l?: number | null
  machine_hours?: number | null
  real_cost: number
}

export type ReportOperations = {
  period: ReportPeriod
  metrics: ReportOperationsMetrics
  timeline: ReportTimeBucket[]
  by_type: ReportOperationTypeStat[]
  by_status: ReportNamedCount[]
  items: ReportOperationRow[]
}

export type ReportFieldRow = {
  id: string
  name: string
  cadastral_number?: string | null
  area_ha?: number | null
  geometry?: GeoJSONPolygon | null
  operations_count: number
  completed_count: number
  planned_area_ha: number
  estimated_cost: number
  real_cost: number
  realized_area_ha: number
  fuel_used_l: number
  last_operation_at?: string | null
}

export type ReportFields = {
  period: ReportPeriod
  total_fields: number
  fields_with_operations: number
  total_area_ha: number
  worked_area_ha: number
  items: ReportFieldRow[]
}

export type ReportMachineRow = {
  id: number
  name: string
  code: string
  type: string
  status: string
  fuel_type?: string | null
  year?: number | null
  operating_hours?: number | null
  operations_count: number
  planned_area_ha: number
  active_assignments: number
  fuel_used_l: number
  hours_in_period: number
}

export type ReportImplementRow = {
  id: number
  name: string
  code: string
  type: string
  status: string
  working_width?: number | null
  operations_count: number
}

export type ReportFleet = {
  period: ReportPeriod
  machine_status: ReportNamedCount[]
  implement_status: ReportNamedCount[]
  machines_by_type: ReportNamedCount[]
  machines_by_fuel: ReportNamedCount[]
  machines_by_year: ReportNamedCount[]
  machines: ReportMachineRow[]
  implements: ReportImplementRow[]
}

export type ReportOperatorRow = {
  id: number
  name: string
  status: string
  allowed_machine_types: string[]
  operations_count: number
  completed_count: number
  in_progress_count: number
  planned_count: number
  on_time_count: number
  overdue_count: number
  planned_area_ha: number
  active_assignments: number
}

export type ReportOperators = {
  period: ReportPeriod
  total_operators: number
  active_operators: number
  items: ReportOperatorRow[]
}

export type ReportStockRow = {
  id: number
  resource_name: string
  category: string
  unit: string
  quantity: number
  minimum_quantity: number
  price_per_unit: number
  value: number
  below_minimum: boolean
}

export type ReportResourceConsumption = {
  resource_id: number
  resource_name: string
  category: string
  unit: string
  quantity: number
  cost: number
  stock_quantity?: number | null
}

export type ReportMovementTotals = {
  in_count: number
  in_value: number
  out_count: number
  out_value: number
}

export type ReportStocks = {
  period: ReportPeriod
  real_consumption: ReportResourceConsumption[]
  real_consumption_cost: number
  movement_totals: ReportMovementTotals
  total_stocks: number
  low_stocks: number
  total_value: number
  value_by_category: ReportNamedValue[]
  items: ReportStockRow[]
  estimated_consumption: ReportResourceConsumption[]
}

function toParams(filters: ReportFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '' && value !== 0
    )
  )
}

function fetchReport<T>(path: string) {
  return (filters: ReportFilters) =>
    api.get<T>(`/reports/${path}`, { params: toParams(filters) }).then((r) => r.data)
}

export const reportsApi = {
  getSummary: fetchReport<ReportSummary>('summary'),
  getOperations: fetchReport<ReportOperations>('operations'),
  getFields: fetchReport<ReportFields>('fields'),
  getFleet: fetchReport<ReportFleet>('fleet'),
  getOperators: fetchReport<ReportOperators>('operators'),
  getStocks: fetchReport<ReportStocks>('stocks'),
}

export type ReportCropStat = {
  crop_id: number
  crop_name: string
  yield_unit: string
  fields_count: number
  planted_area_ha: number
  production_total: number
  yield_per_ha?: number | null
  expected_yield_per_ha?: number | null
  estimated_cost: number
  real_cost: number
  cost_per_ha?: number | null
}

export type ReportFieldCropRow = FieldCrop & {
  operations_count: number
  estimated_cost: number
  real_cost: number
  cost_per_ha?: number | null
}

export type ReportCrops = {
  season?: Season | null
  seasons: Season[]
  totals: {
    fields_count: number
    planted_area_ha: number
    production_total: number
    yield_per_ha?: number | null
    estimated_cost: number
    real_cost: number
  }
  by_crop: ReportCropStat[]
  items: ReportFieldCropRow[]
}

export type WeatherDailyAggregate = {
  day: string
  avg_temperature_c: number
  min_temperature_c: number
  max_temperature_c: number
  precipitation_mm: number
  avg_humidity_percent?: number | null
  avg_wind_speed_kmh?: number | null
  samples: number
}

export type WeatherSnapshot = {
  id: number
  field_id?: string | null
  field_name?: string | null
  latitude: number
  longitude: number
  observed_at: string
  temperature_c: number
  condition: string
  weather_code?: number | null
  humidity_percent?: number | null
  wind_speed_kmh?: number | null
  wind_direction_deg?: number | null
  precipitation_mm?: number | null
  cloud_cover_percent?: number | null
  source: string
}

export type ReportWeather = {
  period: ReportPeriod
  summary: {
    avg_temperature_c: number
    min_temperature_c: number
    max_temperature_c: number
    total_precipitation_mm: number
    rainy_days: number
    samples: number
    fields_covered: number
  }
  series: WeatherDailyAggregate[]
  latest: WeatherSnapshot[]
}

export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export type ReportSubscription = {
  id: number
  user_id: number
  frequency: ReportFrequency
  send_hour: number
  weekday: number
  is_active: boolean
  last_sent_at?: string | null
  created_at: string
  updated_at: string
}

export type ReportSubscriptionPayload = {
  frequency: ReportFrequency
  send_hour: number
  weekday: number
  is_active: boolean
}

export const reportsExtraApi = {
  getCrops: (seasonId?: number, fieldId?: string) =>
    api
      .get<ReportCrops>('/reports/crops', {
        params: { season_id: seasonId || undefined, field_id: fieldId || undefined },
      })
      .then((r) => r.data),
  getWeather: fetchReport<ReportWeather>('weather'),
  getSubscription: () =>
    api
      .get<ReportSubscription | ''>('/reports/subscription')
      .then((r) => (r.status === 204 || !r.data ? null : (r.data as ReportSubscription))),
  saveSubscription: (payload: ReportSubscriptionPayload) =>
    api.put<ReportSubscription>('/reports/subscription', payload).then((r) => r.data),
  deleteSubscription: () => api.delete('/reports/subscription').then((r) => r.data),
  sendNow: () =>
    api.post<{ message: string }>('/reports/subscription/send-now').then((r) => r.data),
}
