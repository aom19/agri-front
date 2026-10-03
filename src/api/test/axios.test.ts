import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { api } from '../axios'
import { useAuthStore } from '../../store/auth.store'
import { useNotificationStore } from '../../store/notification.store'

/** Adaptor fals: prima cerere pentru un URL răspunde după scenariul dat, restul cu 200. */
function installAdapter(scenario: (config: InternalAxiosRequestConfig, attempt: number) => number) {
  const attempts = new Map<string, number>()
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const key = config.url ?? ''
    const attempt = (attempts.get(key) ?? 0) + 1
    attempts.set(key, attempt)
    const status = scenario(config, attempt)
    const response: AxiosResponse = {
      data: { url: key, auth: config.headers.Authorization },
      status,
      statusText: '',
      headers: {},
      config,
    }
    if (status >= 400) {
      throw new AxiosError('Request failed', String(status), config, null, response)
    }
    return response
  })
  api.defaults.adapter = adapter
  return adapter
}

describe('client axios', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, initialized: true })
    useNotificationStore.getState().close()
  })
  afterEach(() => vi.restoreAllMocks())

  it('adaugă header-ul Authorization doar când există token', async () => {
    installAdapter(() => 200)
    const anonymous = await api.get('/public')
    expect(anonymous.data.auth).toBeUndefined()

    useAuthStore.getState().setTokens('acc', 'ref')
    const authenticated = await api.get('/private')
    expect(authenticated.data.auth).toBe('Bearer acc')
  })

  it('nu încearcă refresh pentru rutele de autentificare sau alte erori decât 401', async () => {
    installAdapter((config) => (config.url === '/auth/login' ? 401 : 500))
    const post = vi.spyOn(axios, 'post')
    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ response: { status: 401 } })
    await expect(api.get('/machines')).rejects.toMatchObject({ response: { status: 500 } })
    expect(post).not.toHaveBeenCalled()
  })

  it('deloghează când primește 401 fără refresh token', async () => {
    useAuthStore.setState({ accessToken: 'acc', refreshToken: null })
    installAdapter(() => 401)
    await expect(api.get('/machines')).rejects.toBeInstanceOf(AxiosError)
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('reîmprospătează token-ul la 401 și reia cererea cu noul token', async () => {
    useAuthStore.getState().setTokens('vechi', 'refresh-vechi')
    const adapter = installAdapter((_config, attempt) => (attempt === 1 ? 401 : 200))
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({
        data: { access_token: 'nou', refresh_token: 'refresh-nou' },
      } as AxiosResponse)

    const response = await api.get('/machines')

    expect(post).toHaveBeenCalledWith('http://localhost:8080/api/auth/refresh', {
      refresh_token: 'refresh-vechi',
    })
    expect(response.data.auth).toBe('Bearer nou')
    expect(useAuthStore.getState().accessToken).toBe('nou')
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('pune în coadă cererile concurente și face un singur refresh', async () => {
    useAuthStore.getState().setTokens('vechi', 'refresh-vechi')
    installAdapter((_config, attempt) => (attempt === 1 ? 401 : 200))
    const post = vi
      .spyOn(axios, 'post')
      .mockImplementation(
        () =>
          new Promise<AxiosResponse>((resolve) =>
            setTimeout(
              () => resolve({ data: { access_token: 'nou', refresh_token: 'r' } } as AxiosResponse),
              10
            )
          )
      )

    const [a, b] = await Promise.all([api.get('/machines'), api.get('/operators')])

    expect(post).toHaveBeenCalledTimes(1)
    expect(a.data.auth).toBe('Bearer nou')
    expect(b.data.auth).toBe('Bearer nou')
  })

  it('deloghează și anunță utilizatorul când refresh-ul eșuează', async () => {
    useAuthStore.getState().setTokens('vechi', 'refresh-vechi')
    installAdapter(() => 401)
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh expirat'))

    await expect(api.get('/machines')).rejects.toThrow('refresh expirat')
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useNotificationStore.getState()).toMatchObject({ open: true, severity: 'warning' })
  })

  it('respinge cererile din coadă când utilizatorul se deloghează în timpul refresh-ului', async () => {
    useAuthStore.getState().setTokens('vechi', 'refresh-vechi')
    installAdapter(() => 401)
    let finishRefresh: (value: AxiosResponse) => void = () => {}
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise<AxiosResponse>((resolve) => (finishRefresh = resolve))
    )

    const first = api.get('/machines')
    const queued = api.get('/operators')
    await new Promise((resolve) => setTimeout(resolve, 0))
    useAuthStore.getState().logout()

    await expect(queued).rejects.toThrow('Logged out')
    finishRefresh({ data: { access_token: 'nou', refresh_token: 'r' } } as AxiosResponse)
    await expect(first).rejects.toBeInstanceOf(AxiosError)
  })
})
