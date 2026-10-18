import { api } from './axios'
import { listParams, type PageParams, type Paginated } from './pagination'

export type StockMovementType = 'in' | 'out' | 'adjustment'

export type StockMovement = {
  id: number
  resource_id: number
  resource_name: string
  category: string
  unit: string
  field_operation_id?: number | null
  field_operation_label?: string | null
  field_crop_id?: number | null
  movement_type: StockMovementType
  quantity_delta: number
  resulting_quantity: number
  unit_cost?: number | null
  total_cost?: number | null
  notes: string
  actor_id?: number | null
  actor_name?: string | null
  created_at: string
}

export type StockMovementFilter = {
  resource_id?: number
  field_operation_id?: number
  from?: string
  to?: string
  limit?: number
}

export type StockMovementPayload = {
  resource_id: number
  movement_type: StockMovementType
  quantity: number
  unit_cost?: number | null
  field_operation_id?: number | null
  /** Leagă intrarea de cultura pe teren care a produs-o (ex. paie după grâu). */
  field_crop_id?: number | null
  notes?: string
}

export const stockMovementsApi = {
  /** O pagină de mișcări, cele mai noi primele. */
  listPage: (params: StockMovementFilter & PageParams) =>
    api
      .get<Paginated<StockMovement>>('/stock-movements', { params: listParams(params) })
      .then((r) => r.data),
  list: (filter: StockMovementFilter = {}) =>
    api
      .get<StockMovement[]>('/stock-movements', {
        params: Object.fromEntries(
          Object.entries(filter).filter(([, value]) => value !== undefined && value !== '')
        ),
      })
      .then((r) => r.data),
  create: (payload: StockMovementPayload) =>
    api.post<StockMovement>('/stock-movements', payload).then((r) => r.data),
}
