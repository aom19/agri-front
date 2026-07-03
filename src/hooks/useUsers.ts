import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type CreateUserRequest, type UpdateUserRequest } from '../api/users.api'
import { useAuthStore } from '../store/auth.store'

export const USERS_KEY = ['users']

export function useUsers() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll,
    enabled: initialized && !!accessToken,
    staleTime: 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => usersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      usersApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
