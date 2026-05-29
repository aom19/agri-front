import { useForm } from 'react-hook-form'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { Link } from 'react-router-dom'
import { PasswordField } from '../../components'
import { useRegister } from '../../hooks/useAuth'
import { registerSchema, type RegisterForm } from '../../schemas/auth.schema'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import AuthLayout from './AuthLayout'

export default function RegisterPage() {
  const mutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = (data: RegisterForm) => {
    const parsed = registerSchema.safeParse(data)
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return (
    <AuthLayout title="Înregistrare" subtitle="Creează un cont nou pentru a accesa platforma.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, 'Înregistrare eșuată. Încercă din nou.')}
            </Alert>
          )}

          <TextField
            label="Utilizator"
            autoComplete="email"
            autoFocus
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email', { required: 'Câmp obligatoriu', minLength: 3 })}
          />

          <PasswordField
            label="Parolă"
            autoComplete="new-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password', { required: 'Câmp obligatoriu', minLength: 6 })}
          />

          <PasswordField
            label="Confirmă parola"
            autoComplete="new-password"
            fullWidth
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword', { required: 'Câmp obligatoriu' })}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            loading={mutation.isPending}
          >
            Creează cont
          </Button>

          <Button component={Link} to="/login" size="small" sx={{ alignSelf: 'center' }}>
            Ai deja un cont? Conectare
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}
