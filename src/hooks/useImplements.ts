import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { implementApi, type Implement } from '../api/implement.api'
import { useAuthStore } from '../store/auth.store'

export const IMPLEMENTS_KEY = ['implements']

export function useImplements() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: IMPLEMENTS_KEY,
    queryFn: implementApi.getAllImplements,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useImplementById(id: string) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['implement', id],
    queryFn: () => implementApi.getImplementById(id),
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateImplement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<Implement, 'id'>) => implementApi.createImplement(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMPLEMENTS_KEY }),
  })
}

export function useUpdateImplement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<Implement, 'id'> }) =>
      implementApi.updateImplement(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMPLEMENTS_KEY }),
  })
}

export function useDeactivateImplement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => implementApi.deactivateImplement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMPLEMENTS_KEY }),
  })
}

export function useActivateImplement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => implementApi.activateImplement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMPLEMENTS_KEY }),
  })
}

export function useDeleteImplement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => implementApi.deleteImplement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMPLEMENTS_KEY }),
  })
}
