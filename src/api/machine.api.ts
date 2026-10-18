import { api } from './axios'
import { listParams, type PageParams, type Paginated } from './pagination'

export type Machine = {
  id: number
  name: string
  code: string
  type: string
  brand: string
  model: string
  year: number | null
  registration_number: string | null
  fuel_type: string | null
  status: string
  notes: string | null
}
export const machineApi = {
  /** O pagină de mașini; căutarea `q` e în nume, cod, tip, marcă, model, înmatriculare. */
  getMachinesPage: (params: PageParams & { q?: string }) =>
    api.get<Paginated<Machine>>('/machines', { params: listParams(params) }).then((r) => r.data),
  getAllMachines: () => api.get<Machine[]>('/machines').then((r) => r.data),

  getMachineById: (id: string) => api.get<Machine>(`/machines/${id}`).then((r) => r.data),

  createMachine: (machine: Omit<Machine, 'id'>) =>
    api.post<Machine>('/machines', machine).then((r) => r.data),

  updateMachine: (id: string, machine: Omit<Machine, 'id'>) =>
    api.patch<Machine>(`/machines/${id}`, machine).then((r) => r.data),

  deleteMachine: (id: string) => api.delete(`/machines/${id}`).then((r) => r.data),
}
