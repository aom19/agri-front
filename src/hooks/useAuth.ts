import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { authApi } from '../api/auth.api'
import type { LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm } from '../schemas/auth.schema'

export function useLogin() {
    const navigate = useNavigate()
    const { setTokens } = useAuthStore()

    return useMutation({
        mutationFn: (data: LoginForm) => authApi.login(data),
        onSuccess: ({ data }) => {
            setTokens(data.access_token, data.refresh_token)
            navigate('/', { replace: true })
        },
    })
}

export function useRegister() {
    const navigate = useNavigate()
    const { setTokens } = useAuthStore()

    return useMutation({
        mutationFn: (data: RegisterForm) =>
            authApi.register({ email: data.email, password: data.password }),
        onSuccess: ({ data }) => {
            setTokens(data.access_token, data.refresh_token)
            navigate('/', { replace: true })
        },
    })
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (data: ForgotPasswordForm) => authApi.forgotPassword(data),
    })
}

export function useResetPassword(token: string) {
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: ResetPasswordForm) =>
            authApi.resetPassword(token, {
                password: data.password,
                confirm_password: data.confirmPassword,
            }),
        onSuccess: () => {
            setTimeout(() => navigate('/login', { replace: true }), 2000)
        },
    })
}
