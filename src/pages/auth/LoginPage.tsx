import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField } from '@mui/material'
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
    <AuthLayout title="Autentificare" subtitle="Introdu datele de acces pentru a continua.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isError && (
            <Alert severity="error">
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
            {...register('email')}
          />

          <PasswordField
            label="Parolă"
            autoComplete="current-password"
            fullWidth
            error={!!errors.password || mutation.isError}
            helperText={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            loading={mutation.isPending}
          >
            Conectare
          </Button>

          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Button component={Link} to="/forgot-password" size="small">
              Am uitat parola
            </Button>
            <Button component={Link} to="/register" size="small">
              Crează cont
            </Button>
          </Stack>
        </Stack>
      </form>
    </AuthLayout>
  )
}
