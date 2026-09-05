import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type DashboardCardKey } from '../api/dashboard.api'
import { useAuthStore } from '../store/auth.store'

export type { DashboardCardKey }

export const DASHBOARD_CARDS_KEY = ['dashboard-cards']
export const DASHBOARD_QUICK_STATS_KEY = ['dashboard-quick-stats']
export const DASHBOARD_ACTIVITY_KEY = ['dashboard-activity']

export function useDashboardCards() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...DASHBOARD_CARDS_KEY, accessToken],
    queryFn: dashboardApi.getCards,
    enabled: initialized && !!accessToken,
    refetchOnMount: 'always',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useDashboardQuickStats() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...DASHBOARD_QUICK_STATS_KEY, accessToken],
    queryFn: dashboardApi.getQuickStats,
    enabled: initialized && !!accessToken,
    refetchOnMount: 'always',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useDashboardActivity(limit = 5) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...DASHBOARD_ACTIVITY_KEY, accessToken, limit],
    queryFn: () => dashboardApi.getActivity(limit),
    enabled: initialized && !!accessToken,
    refetchOnMount: 'always',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
