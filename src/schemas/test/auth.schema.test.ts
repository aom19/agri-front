import { describe, expect, it } from 'vitest'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  strongPasswordSchema,
} from '../auth.schema'

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.message)

describe('auth.schema', () => {
  it('validează parola puternică regulă cu regulă', () => {
    expect(strongPasswordSchema.safeParse('Parola1!').success).toBe(true)
    expect(messages(strongPasswordSchema.safeParse('short'))).toContain('Minim 8 caractere')
    expect(messages(strongPasswordSchema.safeParse('PAROLA123!'))).toContain(
      'Trebuie să conțină o literă mică'
    )
    expect(messages(strongPasswordSchema.safeParse('parola123!'))).toContain(
      'Trebuie să conțină o literă mare'
    )
    expect(messages(strongPasswordSchema.safeParse('Parolaaaa!'))).toContain(
      'Trebuie să conțină o cifră'
    )
    expect(messages(strongPasswordSchema.safeParse('Parola123'))).toContain(
      'Trebuie să conțină un caracter special'
    )
  })

  it('validează login-ul', () => {
    expect(loginSchema.safeParse({ email: 'ana@x.ro', password: 'x' }).success).toBe(true)
    expect(messages(loginSchema.safeParse({ email: 'nu', password: '' }))).toEqual([
      'Adresa de email invalidă',
      'Parola este obligatorie',
    ])
  })

  it('cere ca parolele să coincidă la înregistrare și resetare', () => {
    const ok = { email: 'ana@x.ro', password: 'Parola1!', confirmPassword: 'Parola1!' }
    expect(registerSchema.safeParse(ok).success).toBe(true)
    const mismatch = registerSchema.safeParse({ ...ok, confirmPassword: 'Alta1!' })
    expect(mismatch.success).toBe(false)
    expect(mismatch.error!.issues[0].path).toEqual(['confirmPassword'])
    expect(mismatch.error!.issues[0].message).toBe('Parolele nu coincid')

    expect(
      resetPasswordSchema.safeParse({ password: 'Parola1!', confirmPassword: 'Parola1!' }).success
    ).toBe(true)
    expect(
      messages(resetPasswordSchema.safeParse({ password: 'Parola1!', confirmPassword: 'x' }))
    ).toContain('Parolele nu coincid')
  })

  it('validează emailul la parola uitată', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'ana@x.ro' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(false)
  })
})
