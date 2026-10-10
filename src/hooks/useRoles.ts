import { useQuery } from '@tanstack/react-query'
import { rolesApi } from '../api/roles.api'
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
