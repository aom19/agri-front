import { Stack, Typography } from '@mui/material'
import { CheckCircleOutlined, RadioButtonUncheckedOutlined } from '@mui/icons-material'

export const passwordRules = [
  { key: 'min', label: 'Minim 8 caractere', test: (v: string) => v.length >= 8 },
  { key: 'lower', label: 'Literă mică (a–z)', test: (v: string) => /[a-z]/.test(v) },
  { key: 'upper', label: 'Literă mare (A–Z)', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'digit', label: 'Cifră (0–9)', test: (v: string) => /[0-9]/.test(v) },
  {
    key: 'special',
    label: 'Caracter special (!@#$…)',
    test: (v: string) => /[^a-zA-Z0-9]/.test(v),
  },
]

type PasswordRequirementsProps = {
  value: string
}

export default function PasswordRequirements({ value }: PasswordRequirementsProps) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {passwordRules.map((rule) => {
        const met = rule.test(value)
        return (
          <Stack key={rule.key} direction="row" alignItems="center" spacing={0.75}>
            {met ? (
              <CheckCircleOutlined sx={{ fontSize: 15, color: 'success.main' }} />
            ) : (
              <RadioButtonUncheckedOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
            )}
            <Typography variant="caption" color={met ? 'success.main' : 'text.secondary'}>
              {rule.label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}
