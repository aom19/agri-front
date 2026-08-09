import { AddOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type MachinesPageHeaderProps = {
  onCreate: () => void
  canWrite: boolean
}

export default function MachinesPageHeader({ onCreate, canWrite }: MachinesPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Mașini
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administrare flotă utilaje și vehicule.
        </Typography>
      </Box>

      {canWrite && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Mașină nouă
        </Button>
      )}
    </Stack>
  )
}
