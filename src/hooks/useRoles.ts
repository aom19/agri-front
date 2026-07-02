import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi, type SetRolePermissionsRequest, type UpsertRoleRequest } from '../api/roles.api'
import { useAuthStore } from '../store/auth.store'

export const ROLES_KEY = ['roles']

export function useRoles() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: rolesApi.getAll,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertRoleRequest) => rolesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertRoleRequest }) =>
      rolesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  })
}

export function useRolePermissions(id: string, enabled: boolean = true) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['role-permissions', id],
    queryFn: () => rolesApi.getRolePermissions(id),
    enabled: enabled && initialized && !!accessToken,
    staleTime: 60 * 1000,
  })
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetRolePermissionsRequest }) =>
      rolesApi.setRolePermissions(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', variables.id] })
    },
  })
}
