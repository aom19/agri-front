import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../auth.store'
import { useNotificationStore } from '../notification.store'

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    useAuthStore.setState({ initialized: false })
  })

  it('setează token-urile, utilizatorul și starea de inițializare', () => {
    const store = useAuthStore.getState()
    store.setTokens('access', 'refresh')
    store.setUser({ id: 1, email: 'ana@x.ro', role: 'admin' })
    store.setInitialized()
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access')
    expect(state.refreshToken).toBe('refresh')
    expect(state.user?.email).toBe('ana@x.ro')
    expect(state.initialized).toBe(true)
  })

  it('logout golește sesiunea dar rămâne inițializat', () => {
    useAuthStore.getState().setTokens('access', 'refresh')
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
    expect(state.initialized).toBe(true)
  })

  it('persistă doar token-urile și utilizatorul în localStorage', () => {
    useAuthStore.getState().setTokens('access', 'refresh')
    useAuthStore.getState().setInitialized()
    const persisted = JSON.parse(window.localStorage.getItem('auth-storage') ?? '{}')
    expect(persisted.state).toEqual({ accessToken: 'access', refreshToken: 'refresh', user: null })
  })
})

describe('notification.store', () => {
  it('afișează și închide notificarea', () => {
    useNotificationStore.getState().show('Salvat')
    expect(useNotificationStore.getState()).toMatchObject({
      open: true,
      message: 'Salvat',
      severity: 'info',
    })
    useNotificationStore.getState().show('Eroare', 'error')
    expect(useNotificationStore.getState().severity).toBe('error')
    useNotificationStore.getState().close()
    expect(useNotificationStore.getState().open).toBe(false)
  })
})
