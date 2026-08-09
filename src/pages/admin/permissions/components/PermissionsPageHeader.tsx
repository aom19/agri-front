import { Box, Chip, Stack, Typography } from '@mui/material'

type PermissionsPageHeaderProps = {
  title: string
  description: string
  chips?: Array<{
    label: string
    color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  }>
}

export default function PermissionsPageHeader({
  title,
  description,
  chips = [],
}: PermissionsPageHeaderProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      {chips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {chips.map((chip) => (
            <Chip key={chip.label} label={chip.label} size="small" color={chip.color} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
