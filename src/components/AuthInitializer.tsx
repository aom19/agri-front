import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/auth.store'
import { useNotificationStore } from '../store/notification.store'

/**
 * La montare, dacă există un refreshToken salvat, apelează /auth/refresh
 * pentru a valida sesiunea și a obține un accessToken proaspăt.
 * Dacă refresh-ul eșuează (token expirat/invalid), face logout automat.
 */
export default function AuthInitializer() {
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const logout = useAuthStore((s) => s.logout)
  const show = useNotificationStore((s) => s.show)
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current || !refreshToken) return
    attempted.current = true

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then((res) => {
        setTokens(res.data.access_token, res.data.refresh_token)
      })
      .catch(() => {
        logout()
        show('Sesiunea a expirat. Te-ai deconectat automat.', 'warning')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
