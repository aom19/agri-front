import { z } from 'zod'

const nonNegativeNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} este obligatorie.`)
    .refine((value) => !Number.isNaN(Number(value)), { message: `${label} trebuie să fie numerică.` })
    .refine((value) => Number(value) >= 0, { message: `${label} trebuie să fie mai mare sau egală cu 0.` })

export const stockFormSchema = z.object({
  resourceId: z.string().trim().min(1, 'Resursa este obligatorie.'),
  quantity: nonNegativeNumber('Cantitatea'),
  minimumQuantity: nonNegativeNumber('Cantitatea minimă'),
})

export type StockFormValues = z.infer<typeof stockFormSchema>
export type StockFormErrors = Partial<Record<keyof StockFormValues, string>>
