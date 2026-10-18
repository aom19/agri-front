import { api } from './axios'
import { listParams, type PageParams, type Paginated } from './pagination'

export type User = {
  id: number
  email: string
  email_confirmed: boolean
  disabled: boolean
  role_id: number
  role_code: string
  role: string
}

export type CreateUserRequest = {
  email: string
  password?: string
  role_id: number
  email_confirmed?: boolean
}

export type UpdateUserRequest = {
  email: string
  password?: string
  role_id: number
  email_confirmed: boolean
}

export const usersApi = {
  /** O pagină de conturi; căutarea `q` e în e-mail și rol. */
  getPage: (params: PageParams & { q?: string }) =>
    api.get<Paginated<User>>('/users', { params: listParams(params) }).then((r) => r.data),
  getAll: () => api.get<User[]>('/users').then((r) => r.data),
  getById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  create: (payload: CreateUserRequest) => api.post<User>('/users', payload).then((r) => r.data),
  update: (id: string, payload: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, payload).then((r) => r.data),
  disableUsers: (id: string) => api.delete(`/users/${id}`),
  enableUsers: (id: string) => api.patch(`/users/${id}/enable`),
  delete: (id: string) => api.delete(`/users/${id}`),
}
