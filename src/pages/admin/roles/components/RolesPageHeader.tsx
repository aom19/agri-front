import { Box, Typography } from '@mui/material'

export default function RolesPageHeader() {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Roluri
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Rolurile sunt fixe. Rolul unui cont se schimbă din pagina Utilizatori.
      </Typography>
    </Box>
  )
}
