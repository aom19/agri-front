import { z } from 'zod'

export const strongPasswordSchema = z
    .string()
    .min(8, 'Minim 8 caractere')
    .regex(/[a-z]/, 'Trebuie să conțină o literă mică')
    .regex(/[A-Z]/, 'Trebuie să conțină o literă mare')
    .regex(/[0-9]/, 'Trebuie să conțină o cifră')
    .regex(/[^a-zA-Z0-9]/, 'Trebuie să conțină un caracter special')

export const loginSchema = z.object({
    email: z.string().email('Adresa de email invalidă'),
    password: z.string().min(1, 'Parola este obligatorie'),
})

export const registerSchema = z
    .object({
        email: z.string().email('Adresa de email invalidă'),
        password: strongPasswordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Parolele nu coincid',
        path: ['confirmPassword'],
    })

export const forgotPasswordSchema = z.object({
    email: z.string().email('Adresa de email invalidă'),
})

export const resetPasswordSchema = z
    .object({
        password: strongPasswordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Parolele nu coincid',
        path: ['confirmPassword'],
    })

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>
