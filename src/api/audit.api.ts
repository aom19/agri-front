import { api } from './axios'
import type { AuditEntry } from './audit.types'
import { listParams, type PageParams, type Paginated } from './pagination'

export type { AuditEntry }

export const auditApi = {
  /** O pagină din jurnal, cele mai noi intrări primele. */
  getPage: (params: PageParams & { entity_type?: string; entity_id?: string }) =>
    api
      .get<Paginated<AuditEntry>>('/audit-log', { params: listParams(params) })
      .then((r) => r.data),
  getAll: (params?: { entity_type?: string; entity_id?: string; limit?: number }) =>
    api.get<AuditEntry[]>('/audit-log', { params }).then((r) => r.data),
}
