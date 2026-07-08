import { z } from 'zod'

export const implementTypeValues = [
  'plow',
  'disc_harrow',
  'cultivator',
  'seeder',
  'fertilizer_spreader',
  'sprayer',
  'trailer',
  'header',
  'other',
] as const

export const implementStatusValues = ['active', 'maintenance', 'inactive'] as const

export type ImplementTypeValue = (typeof implementTypeValues)[number]
export type ImplementStatusValue = (typeof implementStatusValues)[number]

export const implementTypeOptions: ReadonlyArray<{ label: string; value: ImplementTypeValue }> = [
  { label: 'Plug', value: 'plow' },
  { label: 'Grapa cu discuri', value: 'disc_harrow' },
  { label: 'Cultivator', value: 'cultivator' },
  { label: 'Semanatoare', value: 'seeder' },
  { label: 'Distribuitor ingrasaminte', value: 'fertilizer_spreader' },
  { label: 'Pulverizator', value: 'sprayer' },
  { label: 'Remorca', value: 'trailer' },
  { label: 'Header', value: 'header' },
  { label: 'Altele', value: 'other' },
]

export const implementStatusOptions: ReadonlyArray<{
  label: string
  value: ImplementStatusValue
}> = [
  { label: 'Activ', value: 'active' },
  { label: 'In mentenanta', value: 'maintenance' },
  { label: 'Inactiv', value: 'inactive' },
]

export const implementFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele implementului este obligatoriu.'),
  code: z.string().trim().min(1, 'Codul implementului este obligatoriu.'),
  type: z.enum(implementTypeValues, { message: 'Tipul implementului este invalid.' }),
  brand: z.string().trim(),
  model: z.string().trim(),
  year: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: 'Anul trebuie sa fie un numar intreg.',
    })
    .refine(
      (value) =>
        value === '' || (Number(value) >= 1900 && Number(value) <= new Date().getFullYear()),
      {
        message: `Anul trebuie sa fie intre 1900 si ${new Date().getFullYear()}.`,
      }
    ),
  workingWidth: z
    .string()
    .trim()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), {
      message: 'Latimea de lucru trebuie sa fie numerica.',
    })
    .refine((value) => value === '' || Number(value) > 0, {
      message: 'Latimea de lucru trebuie sa fie mai mare decat 0.',
    }),
  capacity: z
    .string()
    .trim()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), {
      message: 'Capacitatea trebuie sa fie numerica.',
    })
    .refine((value) => value === '' || Number(value) > 0, {
      message: 'Capacitatea trebuie sa fie mai mare decat 0.',
    }),
  status: z.enum(implementStatusValues, { message: 'Statusul implementului este invalid.' }),
  notes: z.string().trim(),
})

export type ImplementFormValues = z.infer<typeof implementFormSchema>
export type ImplementFormErrors = Partial<Record<keyof ImplementFormValues, string>>
