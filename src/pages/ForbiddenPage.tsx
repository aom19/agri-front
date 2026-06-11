import { Box, Button, Typography } from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 2,
        textAlign: 'center',
      }}
    >
      <LockOutlined sx={{ fontSize: 64, color: '#dc2626', opacity: 0.7 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d1f17' }}>
        403 — Acces interzis
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 360 }}>
        Nu ai permisiunile necesare pentru a accesa această pagină. Contactează administratorul dacă
        crezi că este o eroare.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/', { replace: true })}>
        Înapoi la tablou de bord
      </Button>
    </Box>
  )
}
