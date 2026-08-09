import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../api/audit.api'
import { useAuthStore } from '../store/auth.store'

export const AUDIT_KEY = ['audit-log']

export function useAuditLog(params?: { entity_type?: string; entity_id?: string; limit?: number }) {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: [...AUDIT_KEY, accessToken, params ?? {}],
        queryFn: () => auditApi.getAll(params),
        enabled: initialized && !!accessToken,
    })
}
