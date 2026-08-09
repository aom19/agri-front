import { api } from './axios'

export type UserNotification = {
    id: number
    notification_id: number
    user_id: number
    read_at: string | null
    created_at: string
    notification: {
        id: number
        type: string
        title: string
        message: string
        entity_type: string
        entity_id: string
        created_at: string
    }
}

export type NotificationCountResponse = {
    count: number
}

export const notificationsApi = {
    getAll: (params?: { unread?: boolean; limit?: number }) =>
        api.get<UserNotification[]>('/notifications', { params }).then((r) => r.data),

    countUnread: () =>
        api.get<NotificationCountResponse>('/notifications/count').then((r) => r.data),

    markAsRead: (id: number) =>
        api.patch(`/notifications/${id}/read`).then((r) => r.data),

    markAllAsRead: () =>
        api.patch('/notifications/read-all').then((r) => r.data),
}
