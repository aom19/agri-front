import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { useAuthStore } from '../../store/auth.store'
import { useLogout } from '../../hooks/useAuth'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Agri Platform
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={() => logout()}>
            Deconectare
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, flex: 1 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Bine ai venit! Selectează o secțiune din meniu pentru a continua.
        </Typography>
      </Container>
    </Box>
  )
}
