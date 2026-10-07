import { api } from './axios'

/**
 * Operatorul este un utilizator cu rolul `operator`: `id` este id-ul contului. `email` e gol când
 * contul nu are încă un e-mail real (și deci nu se poate autentifica).
 */
export type Operator = {
  id: number
  first_name: string
  last_name: string
  name: string
  phone: string
  email: string
  notes: string
  status: string
}

export type OperatorPayload = Pick<
  Operator,
  'first_name' | 'last_name' | 'phone' | 'email' | 'notes'
>

export const operatorApi = {
  getAllOperators: () => api.get<Operator[]>('/operators').then((r) => r.data),

  getOperatorById: (id: string) => api.get<Operator>(`/operators/${id}`).then((r) => r.data),

  createOperator: (payload: OperatorPayload) =>
    api.post<Operator>('/operators', payload).then((r) => r.data),

  updateOperator: (id: string, payload: OperatorPayload) =>
    api.patch<Operator>(`/operators/${id}`, payload).then((r) => r.data),

  deleteOperator: (id: string) => api.delete(`/operators/${id}`).then((r) => r.data),

  disableOperator: (id: string) =>
    api.patch<Operator>(`/operators/${id}/disable`).then((r) => r.data),

  enableOperator: (id: string) =>
    api.patch<Operator>(`/operators/${id}/enable`).then((r) => r.data),
}
