import { api } from './axios'

export type DashboardCardKey =
  | 'total_machines'
  | 'active_machines'
  | 'total_operators'
  | 'active_assignments'

export type DashboardCard = {
  key: DashboardCardKey
  label: string
  value: number
  trend: number
  progress: number
}

type DashboardCardsResponse = {
  cards: DashboardCard[]
}

export type DashboardQuickStats = {
  total_fields: number
  active_fields: number
  in_progress_operations: number
  overdue_operations: number
  maintenance_machines: number
  maintenance_implements: number
  low_stocks: number
  total_stocks: number
}

export type DashboardActivityItem = {
  id: number
  entity_type: string
  entity_id: string
  entity_name?: string | null
  action: string
  actor_name?: string | null
  status?: string | null
  old_status?: string | null
  created_at: string
}

export const dashboardApi = {
  getCards: () => api.get<DashboardCardsResponse>('/dashboard/cards').then((r) => r.data.cards),

  getQuickStats: () =>
    api.get<DashboardQuickStats>('/dashboard/quick-stats').then((r) => r.data),

  getActivity: (limit = 5) =>
    api
      .get<DashboardActivityItem[]>('/dashboard/activity', { params: { limit } })
      .then((r) => r.data),
}
