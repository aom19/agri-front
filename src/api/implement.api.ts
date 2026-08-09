import { api } from './axios'

export type Implement = {
  id: number
  name: string
  code: string
  type: string
  brand: string
  model: string
  year: number | null
  working_width: number | null
  capacity: number | null
  status: string
  notes: string | null
}

export const implementApi = {
  getAllImplements: () => api.get<Implement[]>('/implements').then((r) => r.data),

  getImplementById: (id: string) =>
    api.get<Implement>(`/implements/${id}`).then((r) => r.data),

  createImplement: (payload: Omit<Implement, 'id'>) =>
    api.post<Implement>('/implements', payload).then((r) => r.data),

  updateImplement: (id: string, payload: Omit<Implement, 'id'>) =>
    api.patch<Implement>(`/implements/${id}`, payload).then((r) => r.data),

  deactivateImplement: (id: string) =>
    api.patch(`/implements/${id}/deactivate`).then((r) => r.data),

  activateImplement: (id: string) =>
    api.patch(`/implements/${id}/activate`).then((r) => r.data),

  deleteImplement: (id: string) => api.delete(`/implements/${id}`).then((r) => r.data),
}
