import { api } from './axios'
import type { AuditEntry } from './audit.types'

export type { AuditEntry }

export const auditApi = {
    getAll: (params?: { entity_type?: string; entity_id?: string; limit?: number }) =>
        api.get<AuditEntry[]>('/audit-log', { params }).then((r) => r.data),
}
