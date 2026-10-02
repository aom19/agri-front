import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { AxiosResponse } from 'axios'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import { createWrapper, resetAuth, runMutation, setAuth } from '../test/utils'
import {
  useChangePassword,
  useConfirmEmail,
  useForgotPassword,
  useLogin,
  useLogout,
  useRegister,
  useResendConfirmation,
  useResetPassword,
} from './useAuth'

vi.mock('../api/auth.api')
const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

const response = (data: unknown) => ({ data }) as AxiosResponse

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuth()
  })
  afterEach(() => vi.useRealTimers())

  it('useLogin salvează token-urile, golește cache-ul și navighează la tabloul de bord', async () => {
    vi.mocked(authApi.login).mockResolvedValue(
      response({ access_token: 'acc', refresh_token: 'ref' })
    )
    const { remove } = await runMutation(() => useLogin(), {
      email: 'ana@x.ro',
      password: 'Parola1!',
    })
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ana@x.ro', password: 'Parola1!' })
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'acc', refreshToken: 'ref' })
    expect(remove).toHaveBeenCalledTimes(4)
    expect(navigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('mutațiile simple apelează endpoint-urile corespunzătoare', async () => {
    vi.mocked(authApi.register).mockResolvedValue(response({ message: 'ok' }))
    await runMutation(() => useRegister(), {
      email: 'a@x.ro',
      password: 'Parola1!',
      confirmPassword: 'Parola1!',
    })
    expect(authApi.register).toHaveBeenCalledWith({ email: 'a@x.ro', password: 'Parola1!' })

    vi.mocked(authApi.confirmEmail).mockResolvedValue(response({ message: 'ok' }))
    await runMutation(() => useConfirmEmail(), 'token')
    expect(authApi.confirmEmail).toHaveBeenCalledWith('token')

    vi.mocked(authApi.resendConfirmation).mockResolvedValue(response({ message: 'ok' }))
    await runMutation(() => useResendConfirmation(), 'a@x.ro')
    expect(authApi.resendConfirmation).toHaveBeenCalledWith('a@x.ro')

    vi.mocked(authApi.forgotPassword).mockResolvedValue(response({ message: 'ok' }))
    await runMutation(() => useForgotPassword(), { email: 'a@x.ro' })
    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'a@x.ro' })

    vi.mocked(authApi.changePassword).mockResolvedValue(response({ message: 'ok' }))
    const payload = { old_password: 'a', new_password: 'b', confirm_password: 'b' }
    await runMutation(() => useChangePassword(), payload)
    expect(authApi.changePassword).toHaveBeenCalledWith(payload)
  })

  it('useResetPassword navighează la login după 2 secunde', async () => {
    vi.useFakeTimers()
    vi.mocked(authApi.resetPassword).mockResolvedValue(response({ message: 'ok' }))
    const { result, unmount } = renderHook(() => useResetPassword('tok'), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync({ password: 'Parola1!', confirmPassword: 'Parola1!' })
    })
    expect(authApi.resetPassword).toHaveBeenCalledWith('tok', {
      password: 'Parola1!',
      confirm_password: 'Parola1!',
    })
    expect(navigate).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true })
    unmount()
  })

  it('useResetPassword anulează timer-ul la demontare', async () => {
    vi.useFakeTimers()
    vi.mocked(authApi.resetPassword).mockResolvedValue(response({ message: 'ok' }))
    const { result, unmount } = renderHook(() => useResetPassword('tok'), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync({ password: 'Parola1!', confirmPassword: 'Parola1!' })
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('useLogout revocă sesiunea pe server și golește store-ul, chiar dacă API-ul eșuează', async () => {
    setAuth('acc')
    vi.mocked(authApi.logout).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() })
    // eroarea API-ului e propagată, dar store-ul e golit oricum (finally)
    await expect(
      act(async () => {
        await result.current()
      })
    ).rejects.toThrow('offline')
    expect(authApi.logout).toHaveBeenCalledWith('refresh')
    expect(useAuthStore.getState().accessToken).toBeNull()

    vi.mocked(authApi.logout).mockClear()
    const { result: anonymous } = renderHook(() => useLogout(), { wrapper: createWrapper() })
    await act(async () => {
      await anonymous.current()
    })
    expect(authApi.logout).not.toHaveBeenCalled()
  })
})
