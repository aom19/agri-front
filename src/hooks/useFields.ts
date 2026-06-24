import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fieldsApi, type UpsertFieldRequest } from '../api/fields.api'

export const FIELDS_KEY = ['fields']

export function useFields() {
  return useQuery({
    queryKey: FIELDS_KEY,
    queryFn: fieldsApi.getAll,
  })
}

export function useCreateField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertFieldRequest) => fieldsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY }),
  })
}

export function useUpdateField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertFieldRequest }) =>
      fieldsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY }),
  })
}

export function useDeleteField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fieldsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY }),
  })
}
