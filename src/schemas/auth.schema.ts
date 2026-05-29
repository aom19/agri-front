import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Adresa de email invalidă'),
    password: z.string().min(6, 'Minim 6 caractere'),
})

export const registerSchema = z
    .object({
        email: z.string().email('Adresa de email invalidă'),
        password: z.string().min(6, 'Minim 6 caractere'),
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
        password: z.string().min(6, 'Minim 6 caractere'),
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
