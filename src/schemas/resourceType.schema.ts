import { z } from 'zod'

export const resourceCategoryValues = [
  'fuel',
  'fertilizer',
  'seed',
  'pesticide',
  'water',
  'harvest',
  'other',
] as const

export const resourceCategoryOptions: ReadonlyArray<{
  label: string
  value: (typeof resourceCategoryValues)[number]
}> = [
  { label: 'Combustibil', value: 'fuel' },
  { label: 'Fertilizant', value: 'fertilizer' },
  { label: 'Semințe', value: 'seed' },
  { label: 'Pesticid', value: 'pesticide' },
  { label: 'Apă', value: 'water' },
  { label: 'Recoltă', value: 'harvest' },
  { label: 'Alte resurse', value: 'other' },
]

export const resourceTypeFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele categoriei este obligatoriu.'),
  category: z.enum(resourceCategoryValues, { message: 'Categoria este invalidă.' }),
  defaultUnit: z.string().trim().min(1, 'Unitatea implicită este obligatorie.'),
})

export type ResourceTypeFormValues = z.infer<typeof resourceTypeFormSchema>
export type ResourceTypeFormErrors = Partial<Record<keyof ResourceTypeFormValues, string>>
