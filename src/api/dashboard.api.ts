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

export const dashboardApi = {
  getCards: () => api.get<DashboardCardsResponse>('/dashboard/cards').then((r) => r.data.cards),
}