import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

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
const failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    failedQueue.length = 0
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Nu face refresh pentru rutele de auth (login, register, etc.)
        const isAuthRoute = originalRequest.url?.startsWith('/auth/')
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
        const refreshUrl = '/auth/refresh'
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}${refreshUrl}`,
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