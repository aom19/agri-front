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
  initialized: boolean
  /** Parolă provizorie: aplicația redirecționează către schimbarea ei până când e schimbată. */
  mustChangePassword: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthState['user']) => void
  setMustChangePassword: (value: boolean) => void
  setInitialized: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      initialized: false,
      mustChangePassword: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
      setInitialized: () => set({ initialized: true }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          mustChangePassword: false,
          initialized: true,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        mustChangePassword: s.mustChangePassword,
      }),
    }
  )
)
