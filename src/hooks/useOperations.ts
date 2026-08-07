import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    implementCompatibilityApi,
    operationApi,
    type OperationTemplatePayload,
    type OperationTypePayload,
} from '../api/operation.api'
import { useAuthStore } from '../store/auth.store'

export const OPERATION_TYPES_KEY = ['operation-types']
export const OPERATION_TEMPLATES_KEY = ['operation-templates']
export const IMPLEMENT_COMPATIBILITIES_KEY = ['implement-compatibilities']

export function useImplementCompatibilities() {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: IMPLEMENT_COMPATIBILITIES_KEY,
        queryFn: implementCompatibilityApi.getAll,
        enabled: initialized && !!accessToken,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useOperationTypes() {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: OPERATION_TYPES_KEY,
        queryFn: operationApi.getAllTypes,
        enabled: initialized && !!accessToken,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

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

export function useCreateOperationType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: OperationTypePayload) => operationApi.createType(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATION_TYPES_KEY }),
    })
}

export function useUpdateOperationType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: OperationTypePayload }) =>
            operationApi.updateType(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATION_TYPES_KEY }),
    })
}

export function useDeleteOperationType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => operationApi.deleteType(id),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: OPERATION_TYPES_KEY }),
                queryClient.invalidateQueries({ queryKey: OPERATION_TEMPLATES_KEY }),
            ]),
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
