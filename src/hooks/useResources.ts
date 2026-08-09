import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resourceApi, type ResourcePayload, type ResourceTypePayload } from '../api/resource.api'
import { useAuthStore } from '../store/auth.store'

export const RESOURCES_KEY = ['resources']
export const RESOURCE_TYPES_KEY = ['resource-types']

export function useResources() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: RESOURCES_KEY,
    queryFn: resourceApi.getAllResources,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useResourceTypes() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: RESOURCE_TYPES_KEY,
    queryFn: resourceApi.getAllResourceTypes,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

function invalidateResourceTypeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: RESOURCE_TYPES_KEY }),
    queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  ])
}

export function useCreateResourceType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ResourceTypePayload) => resourceApi.createResourceType(payload),
    onSuccess: () => invalidateResourceTypeQueries(queryClient),
  })
}

export function useUpdateResourceType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceTypePayload }) =>
      resourceApi.updateResourceType(id, payload),
    onSuccess: () => invalidateResourceTypeQueries(queryClient),
  })
}

export function useDeleteResourceType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resourceApi.deleteResourceType(id),
    onSuccess: () => invalidateResourceTypeQueries(queryClient),
  })
}

export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ResourcePayload) => resourceApi.createResource(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourcePayload }) =>
      resourceApi.updateResource(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resourceApi.deleteResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  })
}
