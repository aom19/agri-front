import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
    accessToken: string | null
    refreshToken: string | null
    user: null | {
        id: number
        email: string
        role: string
    }
    setTokens: (accessToken: string, refreshToken: string) => void
    setUser: (user: AuthState['user']) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            setUser: (user) => set({ user }),
            logout: () => set({ accessToken: null, refreshToken: null, user: null }),
        }),
        { name: 'auth-storage' }
    )
)
