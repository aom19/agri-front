import { Alert, Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../hooks/useAuth'
import ChangePasswordForm from '../settings/ChangePasswordForm'
import AuthLayout from './AuthLayout'

/**
 * Schimbarea obligatorie a parolei: contul are o parolă provizorie (ex. administratorul creat la
 * pornire) și serverul refuză orice altă rută până la schimbare.
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <AuthLayout
      title="Schimbă parola provizorie"
      subtitle="Contul tău are o parolă provizorie. Alege una nouă ca să continui."
    >
      <Stack spacing={2.5}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Parola curentă este cea primită la crearea contului. După schimbare, celelalte sesiuni
          sunt deconectate.
        </Alert>
        <ChangePasswordForm
          submitLabel="Schimbă parola și continuă"
          onSuccess={() => navigate('/', { replace: true })}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button size="small" onClick={() => void logout()} sx={{ fontSize: '0.8rem' }}>
            Deconectare
          </Button>
        </Box>
      </Stack>
    </AuthLayout>
  )
}
