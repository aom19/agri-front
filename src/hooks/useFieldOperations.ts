import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fieldOperationsApi,
  type FieldOperationChecklistPayload,
  type FieldOperationPayload,
  type FieldOperationsFilter,
  type FieldOperationCompletionPayload,
} from '../api/fieldOperation.api'
import { useAuthStore } from '../store/auth.store'

export const FIELD_OPERATIONS_KEY = ['field-operations']

export function useFieldOperations(filter?: FieldOperationsFilter) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...FIELD_OPERATIONS_KEY, accessToken, filter ?? {}],
    queryFn: () => fieldOperationsApi.getAll(filter),
    enabled: initialized && !!accessToken,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useFieldOperation(id: number | null) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...FIELD_OPERATIONS_KEY, accessToken, 'detail', id],
    queryFn: () => fieldOperationsApi.getById(id!),
    enabled: initialized && !!accessToken && id != null,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreateFieldOperation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FieldOperationPayload) => fieldOperationsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY }),
  })
}

export function useUpdateFieldOperation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FieldOperationPayload }) =>
      fieldOperationsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY }),
  })
}

export function useUpdateFieldOperationChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FieldOperationChecklistPayload }) =>
      fieldOperationsApi.updateChecklist(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY }),
  })
}

export function useStartFieldOperation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => fieldOperationsApi.start(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY }),
  })
}

export function useDeleteFieldOperation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => fieldOperationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY }),
  })
}

export function useCompleteFieldOperation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FieldOperationCompletionPayload }) =>
      fieldOperationsApi.complete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_OPERATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-cards'] })
    },
  })
}
