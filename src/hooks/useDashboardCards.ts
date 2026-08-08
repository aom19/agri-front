import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type DashboardCardKey } from '../api/dashboard.api'
import { useAuthStore } from '../store/auth.store'

export type { DashboardCardKey }

export const DASHBOARD_CARDS_KEY = ['dashboard-cards']

export function useDashboardCards() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: DASHBOARD_CARDS_KEY,
    queryFn: dashboardApi.getCards,
    enabled: initialized && !!accessToken,
    refetchOnMount: 'always',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}