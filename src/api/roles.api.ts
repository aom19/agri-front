import { api } from './axios'
import type { Permission } from './permissions.api'

export type Role = {
  id: number
  code: string
  name: string
  description: string
  created_at: string
}

export type UpsertRoleRequest = {
  code: string
  name: string
  description?: string
}

export type SetRolePermissionsRequest = {
  permission_ids: number[]
}

export const rolesApi = {
  getAll: () => api.get<Role[]>('/roles').then((r) => r.data),
  create: (payload: UpsertRoleRequest) => api.post<Role>('/roles', payload).then((r) => r.data),
  update: (id: string, payload: UpsertRoleRequest) =>
    api.patch<Role>(`/roles/${id}`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/roles/${id}`),
  getRolePermissions: (id: string) =>
    api.get<Permission[]>(`/roles/${id}/permissions`).then((r) => r.data),
  setRolePermissions: (id: string, payload: SetRolePermissionsRequest) =>
    api.put<{ message: string }>(`/roles/${id}/permissions`, payload).then((r) => r.data),
}
