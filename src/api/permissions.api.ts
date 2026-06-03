import { api } from './axios'

export type Permission = {
  id: number
  name: string
  description: string
}

export const permissionsApi = {
  getMyPermissions: () =>
    api.get<Permission[]>('/auth/me/permissions').then((r) => r.data),
}
