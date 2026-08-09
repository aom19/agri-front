import { z } from 'zod'

export const resourceFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele resursei este obligatoriu.'),
  resourceTypeId: z.string().trim().min(1, 'Tipul resursei este obligatoriu.'),
  pricePerUnit: z
    .string()
    .trim()
    .min(1, 'Prețul per unitate este obligatoriu.')
    .refine((value) => !Number.isNaN(Number(value)), {
      message: 'Prețul per unitate trebuie să fie numeric.',
    })
    .refine((value) => Number(value) >= 0, {
      message: 'Prețul per unitate trebuie să fie >= 0.',
    }),
  notes: z.string().trim(),
})

export type ResourceFormValues = z.infer<typeof resourceFormSchema>
export type ResourceFormErrors = Partial<Record<keyof ResourceFormValues, string>>
