import { z } from 'zod'
import { machineTypeValues } from './machine.schema'

export const operatorStatusValues = ['active', 'inactive'] as const

export type OperatorStatusValue = (typeof operatorStatusValues)[number]

export const operatorStatusOptions: ReadonlyArray<{ label: string; value: OperatorStatusValue }> = [
    { label: 'Activ', value: 'active' },
    { label: 'Inactiv', value: 'inactive' },
]

export const operatorFormSchema = z.object({
    name: z.string().trim().min(1, 'Numele operatorului este obligatoriu.'),
    phone: z
        .string()
        .trim()
        .refine((v) => v === '' || /^\+?[0-9\s\-().]{7,20}$/.test(v), {
            message: 'Numărul de telefon este invalid.',
        }),
    email: z
        .string()
        .trim()
        .refine((v) => v === '' || z.string().email().safeParse(v).success, {
            message: 'Adresa de email este invalidă.',
        }),
    notes: z.string().trim(),
    allowed_machine_types: z.array(z.enum(machineTypeValues)),
})

export type OperatorFormValues = z.infer<typeof operatorFormSchema>
export type OperatorFormErrors = Partial<Record<keyof OperatorFormValues, string>>
