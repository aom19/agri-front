import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resourceApi, type StockPayload } from '../api/resource.api'
import { useAuthStore } from '../store/auth.store'

export const STOCKS_KEY = ['stocks']

export function useStocks() {
  const initialized = useAuthStore((state) => state.initialized)
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: STOCKS_KEY,
    queryFn: resourceApi.getAllStocks,
    enabled: initialized && !!accessToken,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockPayload) => resourceApi.createStock(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STOCKS_KEY }),
  })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockPayload }) =>
      resourceApi.updateStock(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STOCKS_KEY }),
  })
}

export function useDeleteStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resourceApi.deleteStock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STOCKS_KEY }),
  })
}
