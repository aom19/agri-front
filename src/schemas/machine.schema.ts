import { z } from 'zod'

export const machineTypeValues = [
  'tractor',
  'combine',
  'drone',
  'sprayer',
  'car',
  'small_truck',
  'other',
] as const

export const machineStatusValues = ['active', 'maintenance', 'inactive'] as const
export const fuelTypeValues = ['', 'diesel', 'gasoline', 'electric', 'hybrid'] as const

export type MachineTypeValue = (typeof machineTypeValues)[number]
export type MachineStatusValue = (typeof machineStatusValues)[number]
export type FuelTypeValue = (typeof fuelTypeValues)[number]

export const machineTypeOptions: ReadonlyArray<{ label: string; value: MachineTypeValue }> = [
  { label: 'Tractor', value: 'tractor' },
  { label: 'Combină', value: 'combine' },
  { label: 'Dronă', value: 'drone' },
  { label: 'Pulverizator', value: 'sprayer' },
  { label: 'Autoturism', value: 'car' },
  { label: 'Camionetă', value: 'small_truck' },
  { label: 'Altele', value: 'other' },
]

export const machineStatusOptions: ReadonlyArray<{ label: string; value: MachineStatusValue }> = [
  { label: 'Activ', value: 'active' },
  { label: 'În mentenanță', value: 'maintenance' },
  { label: 'Inactiv', value: 'inactive' },
]

export const fuelTypeOptions: ReadonlyArray<{ label: string; value: FuelTypeValue }> = [
  { label: 'Nespecificat', value: '' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Benzină', value: 'gasoline' },
  { label: 'Electric', value: 'electric' },
  { label: 'Hybrid', value: 'hybrid' },
]

export const machineFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele mașinii este obligatoriu.'),
  code: z.string().trim().min(1, 'Codul mașinii este obligatoriu.'),
  type: z.enum(machineTypeValues, { message: 'Tipul mașinii este invalid.' }),
  brand: z.string().trim(),
  model: z.string().trim(),
  year: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: 'Anul trebuie să fie un număr întreg.',
    })
    .refine((value) => value === '' || (Number(value) >= 1900 && Number(value) <= new Date().getFullYear()), {
      message: `Anul trebuie să fie între 1900 și ${new Date().getFullYear()}.`,
    }),
  registrationNumber: z.string().trim(),
  fuelType: z.enum(fuelTypeValues, { message: 'Tipul de combustibil este invalid.' }),
  status: z.enum(machineStatusValues, { message: 'Statusul mașinii este invalid.' }),
  notes: z.string().trim(),
})

export type MachineFormValues = z.infer<typeof machineFormSchema>
export type MachineFormErrors = Partial<Record<keyof MachineFormValues, string>>
