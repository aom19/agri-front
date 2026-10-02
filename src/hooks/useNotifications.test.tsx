import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { notificationsApi, type UserNotification } from '../api/notifications.api'
import {
  createWrapper,
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  NOTIFICATIONS_KEY,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCount,
  useNotifications,
} from './useNotifications'
import { useNotificationSocket } from './useNotificationSocket'

vi.mock('../api/notifications.api')

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onmessage: ((event: unknown) => void) | null = null
  onclose: (() => void) | null = null
  close = vi.fn()
  url: string
  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  it('încarcă notificările și numărul celor necitite', async () => {
    const items = [{ id: 1 } as UserNotification]
    vi.mocked(notificationsApi.getAll).mockResolvedValue(items)
    vi.mocked(notificationsApi.countUnread).mockResolvedValue({ count: 3 })
    await expectQueryData(() => useNotifications({ unread: true }), items)
    expect(notificationsApi.getAll).toHaveBeenCalledWith({ unread: true })
    await expectQueryData(() => useNotificationCount(), { count: 3 })
  })

  it('nu interoghează fără sesiune', () => {
    setAuth(null)
    expectQueryDisabled(() => useNotifications())
    expectQueryDisabled(() => useNotificationCount())
  })

  it('marcarea ca citită invalidează lista', async () => {
    vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined)
    vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue(undefined)
    const one = await runMutation(() => useMarkNotificationRead(), 4)
    expect(notificationsApi.markAsRead).toHaveBeenCalledWith(4)
    expect(invalidatedKeys(one.invalidate)).toEqual([NOTIFICATIONS_KEY])
    const all = await runMutation(() => useMarkAllNotificationsRead(), undefined)
    expect(notificationsApi.markAllAsRead).toHaveBeenCalled()
    expect(invalidatedKeys(all.invalidate)).toEqual([NOTIFICATIONS_KEY])
  })

  it('useNotificationSocket deschide un WebSocket cu token-ul și invalidează lista la mesaje', () => {
    const { unmount } = renderHook(() => useNotificationSocket(), { wrapper: createWrapper() })
    expect(FakeWebSocket.instances).toHaveLength(1)
    const socket = FakeWebSocket.instances[0]
    expect(socket.url).toContain('/ws/notifications?token=token')
    act(() => socket.onmessage?.({}))
    act(() => socket.onclose?.())
    unmount()
    expect(socket.close).toHaveBeenCalled()
  })

  it('useNotificationSocket nu se conectează fără token', () => {
    setAuth(null)
    renderHook(() => useNotificationSocket(), { wrapper: createWrapper() })
    expect(FakeWebSocket.instances).toHaveLength(0)
  })
})
