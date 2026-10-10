import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { reportsApi, reportsExtraApi, type ReportFilters } from '../api/reports.api'
import { useAuthStore } from '../store/auth.store'

export const REPORTS_KEY = ['reports']

function useReportQuery<T>(
  section: string,
  filters: ReportFilters,
  fetcher: (filters: ReportFilters) => Promise<T>
) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...REPORTS_KEY, section, accessToken, filters],
    queryFn: () => fetcher(filters),
    enabled: initialized && !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export const useReportSummary = (filters: ReportFilters) =>
  useReportQuery('summary', filters, reportsApi.getSummary)

export const useReportOperations = (filters: ReportFilters) =>
  useReportQuery('operations', filters, reportsApi.getOperations)

export const useReportFields = (filters: ReportFilters) =>
  useReportQuery('fields', filters, reportsApi.getFields)

export const useReportFleet = (filters: ReportFilters) =>
  useReportQuery('fleet', filters, reportsApi.getFleet)

export const useReportOperators = (filters: ReportFilters) =>
  useReportQuery('operators', filters, reportsApi.getOperators)

export const useReportStocks = (filters: ReportFilters) =>
  useReportQuery('stocks', filters, reportsApi.getStocks)

export const useReportWeather = (filters: ReportFilters) =>
  useReportQuery('weather', filters, reportsExtraApi.getWeather)

export function useReportCrops(seasonId: number | undefined, fieldId: string | undefined) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...REPORTS_KEY, 'crops', accessToken, seasonId ?? 0, fieldId ?? ''],
    queryFn: () => reportsExtraApi.getCrops(seasonId, fieldId),
    enabled: initialized && !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export function useEmailReportSummary() {
  return useMutation({
    mutationFn: (period: Pick<ReportFilters, 'from' | 'to'>) =>
      reportsExtraApi.emailSummary(period),
  })
}
