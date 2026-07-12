import { api } from "./axios"

export type Operator = {
    id: number
    name: string
    phone: string
    email: string
    notes: string
    status: string
    allowed_machine_types: string[]
}

export const operatorApi = {
    getAllOperators: () =>
        api.get<Operator[]>('/operators').then((r) => r.data),

    getOperatorById: (id: string) =>
        api.get<Operator>(`/operators/${id}`).then((r) => r.data),

    createOperator: (payload: Omit<Operator, 'id' | 'status'>) =>
        api.post<Operator>('/operators', payload).then((r) => r.data),

    updateOperator: (id: string, payload: Omit<Operator, 'id' | 'status'>) =>
        api.patch<Operator>(`/operators/${id}`, payload).then((r) => r.data),

    deleteOperator: (id: string) =>
        api.delete(`/operators/${id}`).then((r) => r.data),

    disableOperator: (id: string) =>
        api.patch<Operator>(`/operators/${id}/disable`).then((r) => r.data),

    enableOperator: (id: string) =>
        api.patch<Operator>(`/operators/${id}/enable`).then((r) => r.data),
}
