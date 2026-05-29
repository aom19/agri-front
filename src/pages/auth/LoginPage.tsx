import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { EmailOutlined, LockOutlined } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { PasswordField } from '../../components'
import { useLogin } from '../../hooks/useAuth'
import { loginSchema, type LoginForm } from '../../schemas/auth.schema'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import AuthLayout from './AuthLayout'

export default function LoginPage() {
  const mutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: LoginForm) => mutation.mutate(data)

  return (
    <AuthLayout
      title="Bun revenit"
      subtitle="Conectează-te pentru a gestiona operațiunile de pe câmp."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {getApiErrorMessage(mutation.error, 'Email sau parolă incorectă.')}
            </Alert>
          )}

          <TextField
            label="Email"
            autoComplete="username"
            autoFocus
            fullWidth
            error={!!errors.email || mutation.isError}
            helperText={errors.email?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            {...register('email')}
          />

          <PasswordField
            label="Parolă"
            autoComplete="current-password"
            fullWidth
            error={!!errors.password || mutation.isError}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            {...register('password')}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={<Checkbox size="small" />}
              label={
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  Ține-mă conectat
                </Typography>
              }
            />
            <Button
              component={Link}
              to="/forgot-password"
              size="small"
              sx={{ fontSize: '0.8rem', textDecoration: 'none' }}
            >
              Am uitat parola
            </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            loading={mutation.isPending}
            sx={{
              background: 'linear-gradient(135deg, #1a5c38, #2d8653)',
              fontWeight: 600,
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': {
                background: 'linear-gradient(135deg, #134a2c, #1a5c38)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(26,92,56,0.3)',
              },
            }}
          >
            Conectare
          </Button>

          <Typography
            sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem', mt: 1 }}
          >
            Nu ai un cont?{' '}
            <Button
              component={Link}
              to="/register"
              size="small"
              sx={{ fontSize: '0.8rem', p: 0, minWidth: 'auto' }}
            >
              Creează cont
            </Button>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  )
}
