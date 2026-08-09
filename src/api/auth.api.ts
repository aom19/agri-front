import { api } from './axios'

export type LoginRequest = {
    email: string
    password: string
}

export type RegisterRequest = {
    email: string
    password: string
}

export type AuthResponse = {
    access_token: string
    refresh_token: string
}

export type MessageResponse = {
    status?: 'success' | 'error'
    message: string
}

export type ForgotPasswordRequest = {
    email: string
}

export type ResetPasswordRequest = {
    password: string
    confirm_password: string
}

export const authApi = {
    login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),

    register: (data: RegisterRequest) => api.post<MessageResponse>('/auth/register', data),

    confirmEmail: (token: string) => api.post<MessageResponse>('/auth/confirm-email', { token }),

    resendConfirmation: (email: string) => api.post<MessageResponse>('/auth/resend-confirmation', { email }),

    forgotPassword: (data: ForgotPasswordRequest) => api.post<MessageResponse>('/auth/forgot-password', data),

    resetPassword: (token: string, data: ResetPasswordRequest) =>
        api.post<MessageResponse>(`/auth/reset-password/${token}`, data),

    logout: (refreshToken: string) => api.post('/auth/logout', { refresh_token: refreshToken }),

    changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
        api.post<MessageResponse>('/auth/change-password', data),
}
