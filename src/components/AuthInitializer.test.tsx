import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import axios, { type AxiosResponse } from 'axios'
import AuthInitializer from './AuthInitializer'
import { useAuthStore } from '../store/auth.store'
import { useNotificationStore } from '../store/notification.store'
import { resetAuth } from '../test/utils'

describe('AuthInitializer', () => {
  beforeEach(() => {
    resetAuth()
    useNotificationStore.getState().close()
  })
  afterEach(() => vi.restoreAllMocks())

  it('marchează inițializarea fără să apeleze API-ul când nu există refresh token', () => {
    const post = vi.spyOn(axios, 'post')
    render(<AuthInitializer />)
    expect(post).not.toHaveBeenCalled()
    expect(useAuthStore.getState().initialized).toBe(true)
  })

  it('reîmprospătează sesiunea când există refresh token', async () => {
    useAuthStore.setState({ refreshToken: 'vechi' })
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { access_token: 'nou', refresh_token: 'refresh-nou' },
    } as AxiosResponse)
    render(<AuthInitializer />)
    await waitFor(() => expect(useAuthStore.getState().initialized).toBe(true))
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/auth/refresh', {
      refresh_token: 'vechi',
    })
    expect(useAuthStore.getState().accessToken).toBe('nou')
  })

  it('deloghează și anunță utilizatorul când refresh-ul eșuează', async () => {
    useAuthStore.setState({ refreshToken: 'expirat', accessToken: 'x' })
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('expirat'))
    render(<AuthInitializer />)
    await waitFor(() => expect(useAuthStore.getState().initialized).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useNotificationStore.getState()).toMatchObject({ open: true, severity: 'warning' })
  })
})
