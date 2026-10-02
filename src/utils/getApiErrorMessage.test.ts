import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { getApiErrorMessage } from './getApiErrorMessage'

function axiosError(data: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', '400', config, null, {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config,
  })
}

describe('getApiErrorMessage', () => {
  it('returnează fallback-ul pentru erori care nu vin de la axios', () => {
    expect(getApiErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
    expect(getApiErrorMessage(new AxiosError('offline'), 'fallback')).toBe('fallback')
  })

  it('extrage mesajul generic din { error }', () => {
    expect(getApiErrorMessage(axiosError({ error: 'invalid credentials' }), 'fallback')).toBe(
      'invalid credentials'
    )
  })

  it('concatenează erorile de validare din { errors }', () => {
    const err = axiosError({ errors: { email: 'Email invalid', password: 'Parola lipsă' } })
    expect(getApiErrorMessage(err, 'fallback')).toBe('Email invalid. Parola lipsă')
  })

  it('folosește fallback-ul când corpul nu are un format cunoscut', () => {
    expect(getApiErrorMessage(axiosError({ message: 'x' }), 'fallback')).toBe('fallback')
    expect(getApiErrorMessage(axiosError({ error: 42 }), 'fallback')).toBe('fallback')
  })
})
