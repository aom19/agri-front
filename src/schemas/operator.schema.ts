import { z } from 'zod'

export const operatorStatusValues = ['active', 'inactive'] as const

export type OperatorStatusValue = (typeof operatorStatusValues)[number]

export const operatorStatusOptions: ReadonlyArray<{ label: string; value: OperatorStatusValue }> = [
  { label: 'Activ', value: 'active' },
  { label: 'Inactiv', value: 'inactive' },
]

export const operatorFormSchema = z.object({
  first_name: z.string().trim().min(1, 'Prenumele operatorului este obligatoriu.'),
  last_name: z.string().trim(),
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
})

export type OperatorFormValues = z.infer<typeof operatorFormSchema>
export type OperatorFormErrors = Partial<Record<keyof OperatorFormValues, string>>
