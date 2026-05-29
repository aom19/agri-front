import { create } from 'zustand'

type Severity = 'error' | 'warning' | 'info' | 'success'

type NotificationState = {
    open: boolean
    message: string
    severity: Severity
    show: (message: string, severity?: Severity) => void
    close: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
    open: false,
    message: '',
    severity: 'info',
    show: (message, severity = 'info') => set({ open: true, message, severity }),
    close: () => set({ open: false }),
}))
