import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications.api'
import { useAuthStore } from '../store/auth.store'

export const NOTIFICATIONS_KEY = ['notifications']

export function useNotifications(params?: { unread?: boolean; limit?: number }) {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: [...NOTIFICATIONS_KEY, accessToken, params ?? {}],
        queryFn: () => notificationsApi.getAll(params),
        enabled: initialized && !!accessToken,
        refetchInterval: 30_000,
    })
}

export function useNotificationCount() {
    const initialized = useAuthStore((s) => s.initialized)
    const accessToken = useAuthStore((s) => s.accessToken)

    return useQuery({
        queryKey: [...NOTIFICATIONS_KEY, 'count', accessToken],
        queryFn: () => notificationsApi.countUnread(),
        enabled: initialized && !!accessToken,
        refetchInterval: 30_000,
    })
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => notificationsApi.markAsRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
    })
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
    })
}
