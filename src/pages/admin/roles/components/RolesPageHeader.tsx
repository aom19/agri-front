import { AddOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type RolesPageHeaderProps = {
  onCreate: () => void
  canWrite: boolean
}

export default function RolesPageHeader({ onCreate, canWrite }: RolesPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Roluri
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administrare roluri și acces pentru utilizatori.
        </Typography>
      </Box>

      {canWrite && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Rol nou
        </Button>
      )}
    </Stack>
  )
}
