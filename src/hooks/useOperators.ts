import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth.store"
import { operatorApi } from "../api/operator.api"

export const OPERATOR_KEY = ['operators']

export function useOperators() {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: OPERATOR_KEY,
        queryFn: operatorApi.getAllOperators,
        enabled: initialized && !!accessToken,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useOperatorById(id: string) {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: ['operator', id],
        queryFn: () => operatorApi.getOperatorById(id),
        enabled: initialized && !!accessToken,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useCreateOperator() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: operatorApi.createOperator,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATOR_KEY }),
    })
}

export function useUpdateOperator() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof operatorApi.updateOperator>[1] }) =>
            operatorApi.updateOperator(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATOR_KEY }),
    })
}

export function useDeleteOperator() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => operatorApi.deleteOperator(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATOR_KEY }),
    })
}

export function useDisableOperator() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => operatorApi.disableOperator(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATOR_KEY }),
    })
}

export function useEnableOperator() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => operatorApi.enableOperator(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATOR_KEY }),
    })
}
