import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '../api/permissions.api'
import { useAuthStore } from '../store/auth.store'

export const PERMISSIONS_KEY = ['my-permissions']

export function usePermissions() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: permissionsApi.getMyPermissions,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 min — permissions don't change often
    gcTime: 10 * 60 * 1000,
  })
}

export function useAllPermissions() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['all-permissions'],
    queryFn: permissionsApi.getAllPermissions,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 min — permissions don't change often
    gcTime: 10 * 60 * 1000,
  })
}

export function usePermissionById(id: string) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['permission', id],
    queryFn: () => permissionsApi.getPermissionById(id),
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 min — permissions don't change often
    gcTime: 10 * 60 * 1000,
  })
}



export function usePermissionSet(): Set<string> {
  const { data: permissions } = usePermissions()
  return useMemo(
    () => new Set(permissions?.map((p) => p.name) ?? []),
    [permissions],
  )
}

export function useHasPermission(permission: string): boolean {
  const permSet = usePermissionSet()
  return permSet.has(permission)
}
