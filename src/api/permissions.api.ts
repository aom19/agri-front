import { api } from './axios'

export type Permission = {
  id: number
  name: string
  description: string
}

export const permissionsApi = {
  getMyPermissions: () =>
    api.get<Permission[]>('/auth/me/permissions').then((r) => r.data),

  getAllPermissions: () =>
    api.get<Permission[]>('/permissions').then((r) => r.data),

  getPermissionById: (id: string) =>
    api.get<Permission>(`/permissions/${id}`).then((r) => r.data),
}

