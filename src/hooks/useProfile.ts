import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type UpdateProfileRequest } from '../api/profile.api'
import { useAuthStore } from '../store/auth.store'

export const PROFILE_KEY = ['profile']

export function useProfile() {
    const initialized = useAuthStore((s) => s.initialized)
    return useQuery({
        queryKey: PROFILE_KEY,
        queryFn: () => profileApi.get().then((r) => r.data),
        enabled: initialized,
    })
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: UpdateProfileRequest) => profileApi.update(data).then((r) => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
    })
}

export function useUploadPhoto() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (file: File) => profileApi.uploadPhoto(file).then((r) => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
    })
}
