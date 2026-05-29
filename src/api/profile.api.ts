import { api } from './axios'

export type UserProfile = {
  user_id: number
  email: string
  role: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  profile_photo: string
  created_at: string
  updated_at: string
}

export type UpdateProfileRequest = {
    first_name: string
    last_name: string
    date_of_birth?: string // YYYY-MM-DD
}

export const profileApi = {
    get: () => api.get<UserProfile>('/profile'),

    update: (data: UpdateProfileRequest) => api.patch<UserProfile>('/profile', data),

    uploadPhoto: (file: File) => {
        const form = new FormData()
        form.append('photo', file)
        return api.post<{ profile_photo: string }>('/profile/photo', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
}
