import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/auth.store'

if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL nu este definit. Verifică fișierul .env')
}

declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _retry?: boolean
    }
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

let isRefreshing = false
type QueueItem = {
    resolve: (token: string | null) => void
    reject: (error?: unknown) => void
}
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// Resetează starea de refresh la logout
useAuthStore.subscribe((state, prevState) => {
    if (prevState.accessToken && !state.accessToken) {
        isRefreshing = false
        processQueue(new Error('Logged out'), null)
    }
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest: InternalAxiosRequestConfig = error.config

        // Nu face refresh pentru rutele de auth fără token (login, register, refresh)
        const noTokenRoutes = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password']
        const isAuthRoute = noTokenRoutes.some((r) => originalRequest.url?.startsWith(r))
        if (error.response?.status !== 401 || originalRequest._retry || isAuthRoute) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            })
                .then((token) => {
                    if (token) {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                    }
                    return api(originalRequest)
                })
                .catch((err) => {
                    return Promise.reject(err)
                })
        }

        isRefreshing = true
        const refreshToken = useAuthStore.getState().refreshToken

        if (!refreshToken) {
            useAuthStore.getState().logout()
            return Promise.reject(error)
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                { refresh_token: refreshToken }
            )
            const { access_token, refresh_token } = response.data
            useAuthStore.getState().setTokens(access_token, refresh_token)
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            processQueue(null, access_token)
            return api(originalRequest)
        } catch (err) {
            processQueue(err, null)
            useAuthStore.getState().logout()
            return Promise.reject(err)
        } finally {
            isRefreshing = false
        }
    }
)