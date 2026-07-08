import { AddOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type ImplementsPageHeaderProps = {
  onCreate: () => void
  canWrite: boolean
}

export default function ImplementsPageHeader({ onCreate, canWrite }: ImplementsPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Echipament agricol
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administrare echipamente atasabile pentru utilaje.
        </Typography>
      </Box>

      {canWrite && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Echipament nou
        </Button>
      )}
    </Stack>
  )
}
