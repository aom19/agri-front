import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { usePermissions } from '../hooks/usePermissions'
import { useAuthStore } from '../store/auth.store'

type Props = {
  permission: string
  children: ReactNode
}

/**
 * Wraps a route and redirects to /403 if the authenticated user
 * does not hold the required permission.
 * Shows a loader while permissions are being fetched.
 */
export function RequirePermission({ permission, children }: Props) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: permissions, isPending } = usePermissions()

  // Wait until auth bootstrap completes and permissions query resolves.
  if (!initialized || (accessToken && isPending)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  const hasPermission = permissions?.some((p) => p.name === permission) ?? false
  if (!hasPermission) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
