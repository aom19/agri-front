import { AddOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type UsersPageHeaderProps = {
  onCreate: () => void
  canWrite: boolean
}

export default function UsersPageHeader({ onCreate, canWrite }: UsersPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Utilizatori
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administrare conturi de utilizator.
        </Typography>
      </Box>

      {canWrite && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Utilizator nou
        </Button>
      )}
    </Stack>
  )
}
