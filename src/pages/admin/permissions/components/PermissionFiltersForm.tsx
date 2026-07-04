import { FilterAltOutlined } from '@mui/icons-material'
import { InputAdornment, Stack, TextField } from '@mui/material'

type PermissionFiltersFormProps = {
  value: string
  onChange: (value: string) => void
}

export default function PermissionFiltersForm({ value, onChange }: PermissionFiltersFormProps) {
  return (
    <Stack spacing={2} sx={{ mt: 0.5 }}>
      <TextField
        label="Caută"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        placeholder="caută după nume sau descriere..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <FilterAltOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  )
}