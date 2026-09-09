import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cropsApi,
  type CropPayload,
  type FieldCropFilter,
  type FieldCropPayload,
  type SeasonPayload,
} from '../api/crops.api'
import { useAuthStore } from '../store/auth.store'

export const SEASONS_KEY = ['seasons']
export const CROPS_KEY = ['crops']
export const FIELD_CROPS_KEY = ['field-crops']

function useAuthReady() {
  const initialized = useAuthStore((state) => state.initialized)
  const accessToken = useAuthStore((state) => state.accessToken)
  return initialized && !!accessToken
}

export function useSeasons() {
  const ready = useAuthReady()
  return useQuery({
    queryKey: SEASONS_KEY,
    queryFn: cropsApi.getSeasons,
    enabled: ready,
    staleTime: 60 * 1000,
  })
}

export function useCrops() {
  const ready = useAuthReady()
  return useQuery({
    queryKey: CROPS_KEY,
    queryFn: cropsApi.getCrops,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })
}

export function useFieldCrops(filter: FieldCropFilter = {}) {
  const ready = useAuthReady()
  return useQuery({
    queryKey: [...FIELD_CROPS_KEY, filter],
    queryFn: () => cropsApi.getFieldCrops(filter),
    enabled: ready,
    staleTime: 60 * 1000,
  })
}

function useInvalidateCrops() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: SEASONS_KEY })
    queryClient.invalidateQueries({ queryKey: CROPS_KEY })
    queryClient.invalidateQueries({ queryKey: FIELD_CROPS_KEY })
    queryClient.invalidateQueries({ queryKey: ['reports'] })
  }
}

export function useCreateSeason() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: (payload: SeasonPayload) => cropsApi.createSeason(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateSeason() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SeasonPayload }) =>
      cropsApi.updateSeason(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteSeason() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: (id: number) => cropsApi.deleteSeason(id),
    onSuccess: invalidate,
  })
}

export function useCreateCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: (payload: CropPayload) => cropsApi.createCrop(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CropPayload }) =>
      cropsApi.updateCrop(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({ mutationFn: (id: number) => cropsApi.deleteCrop(id), onSuccess: invalidate })
}

export function useCreateFieldCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: (payload: FieldCropPayload) => cropsApi.createFieldCrop(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateFieldCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FieldCropPayload }) =>
      cropsApi.updateFieldCrop(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteFieldCrop() {
  const invalidate = useInvalidateCrops()
  return useMutation({
    mutationFn: (id: number) => cropsApi.deleteFieldCrop(id),
    onSuccess: invalidate,
  })
}

export function useRecordHarvest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cropsApi.recordHarvest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_CROPS_KEY })
      queryClient.invalidateQueries({ queryKey: CROPS_KEY })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
