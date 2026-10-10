import { api } from './axios'
import type { Permission } from './permissions.api'

export type Role = {
  id: number
  code: string
  name: string
  description: string
  created_at: string
}

// Rolurile sunt fixe (admin, manager, operator, viewer), deci API-ul le expune doar la citire.
export const rolesApi = {
  getAll: () => api.get<Role[]>('/roles').then((r) => r.data),
  getRolePermissions: (id: string) =>
    api.get<Permission[]>(`/roles/${id}/permissions`).then((r) => r.data),
}
