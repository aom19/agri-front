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

export type ForgotPasswordRequest = {
    email: string
}

export type ResetPasswordRequest = {
    password: string
    confirm_password: string
}

export const authApi = {
    login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),

    register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),

    forgotPassword: (data: ForgotPasswordRequest) => api.post('/auth/forgot-password', data),

    resetPassword: (token: string, data: ResetPasswordRequest) =>
        api.post(`/auth/reset-password/${token}`, data),

    logout: (refreshToken: string) => api.post('/auth/logout', { refresh_token: refreshToken }),
}
