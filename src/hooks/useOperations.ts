import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { operationApi, type OperationTemplatePayload } from '../api/operation.api'
import { useAuthStore } from '../store/auth.store'

export const OPERATION_TEMPLATES_KEY = ['operation-templates']

export function useOperationTemplates() {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: OPERATION_TEMPLATES_KEY,
        queryFn: operationApi.getAllTemplates,
        enabled: initialized && !!accessToken,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useOperationTemplate(id: number | null) {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: [...OPERATION_TEMPLATES_KEY, id],
        queryFn: () => operationApi.getTemplateById(id!),
        enabled: initialized && !!accessToken && id !== null,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useCreateOperationTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: OperationTemplatePayload) => operationApi.createTemplate(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATION_TEMPLATES_KEY }),
    })
}

export function useUpdateOperationTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: OperationTemplatePayload }) =>
            operationApi.updateTemplate(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATION_TEMPLATES_KEY }),
    })
}

export function useDeleteOperationTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => operationApi.deleteTemplate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATION_TEMPLATES_KEY }),
    })
}
