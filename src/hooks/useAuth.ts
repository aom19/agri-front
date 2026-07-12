import { useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { authApi } from '../api/auth.api'
import type { LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm } from '../schemas/auth.schema'

export function useLogin() {
    const navigate = useNavigate()
    const setTokens = useAuthStore((s) => s.setTokens)

    return useMutation({
        mutationFn: (data: LoginForm) => authApi.login(data),
        onSuccess: ({ data }) => {
            setTokens(data.access_token, data.refresh_token)
            navigate('/', { replace: true })
        },
    })
}

export function useRegister() {
    return useMutation({
        mutationFn: (data: RegisterForm) =>
            authApi.register({ email: data.email, password: data.password }),
    })
}

export function useConfirmEmail() {
    return useMutation({
        mutationFn: (token: string) => authApi.confirmEmail(token),
    })
}

export function useResendConfirmation() {
    return useMutation({
        mutationFn: (email: string) => authApi.resendConfirmation(email),
    })
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (data: ForgotPasswordForm) => authApi.forgotPassword(data),
    })
}

export function useResetPassword(token: string) {
    const navigate = useNavigate()
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    return useMutation({
        mutationFn: (data: ResetPasswordForm) =>
            authApi.resetPassword(token, {
                password: data.password,
                confirm_password: data.confirmPassword,
            }),
        onSuccess: () => {
            timerRef.current = setTimeout(() => navigate('/login', { replace: true }), 2000)
        },
    })
}

export function useLogout() {
    const logout = useAuthStore((s) => s.logout)
    const refreshToken = useAuthStore((s) => s.refreshToken)

    return useCallback(async () => {
        try {
            if (refreshToken) {
                await authApi.logout(refreshToken)
            }
        } finally {
            logout()
        }
    }, [logout, refreshToken])
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (data: { old_password: string; new_password: string; confirm_password: string }) =>
            authApi.changePassword(data),
    })
}
