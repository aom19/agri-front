import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  stockMovementsApi,
  type StockMovementFilter,
  type StockMovementPayload,
} from '../api/stockMovement.api'
import { useAuthStore } from '../store/auth.store'

export const STOCK_MOVEMENTS_KEY = ['stock-movements']

export function useStockMovements(filter: StockMovementFilter, enabled = true) {
  const initialized = useAuthStore((state) => state.initialized)
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: [...STOCK_MOVEMENTS_KEY, accessToken, filter],
    queryFn: () => stockMovementsApi.list(filter),
    enabled: enabled && initialized && !!accessToken,
    staleTime: 30 * 1000,
  })
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockMovementPayload) => stockMovementsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
