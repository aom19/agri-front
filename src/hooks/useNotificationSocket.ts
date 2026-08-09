import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { NOTIFICATIONS_KEY } from './useNotifications'

const WS_BASE = window.location.origin.replace(/^http/, 'ws').replace(':3000', ':8080')

export function useNotificationSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const url = `${WS_BASE}/ws/notifications?token=${accessToken}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [accessToken, queryClient])
}
