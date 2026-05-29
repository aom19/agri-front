import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../../hooks/useAuth'
import { forgotPasswordSchema, type ForgotPasswordForm } from '../../schemas/auth.schema'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import AuthLayout from './AuthLayout'

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (data: ForgotPasswordForm) => mutation.mutate(data)

  return (
    <AuthLayout title="Recuperare parolă" subtitle="Introdu adresa de email asociată contului tău.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isSuccess && (
            <Alert severity="success">
              Dacă adresa există în sistem, vei primi un email cu instrucțiuni de resetare.
            </Alert>
          )}

          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, 'A apărut o eroare. Încercă din nou.')}
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            disabled={mutation.isSuccess}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={mutation.isSuccess}
            loading={mutation.isPending}
          >
            Trimite link de resetare
          </Button>

          <Button component={Link} to="/login" size="small" sx={{ alignSelf: 'center' }}>
            Înapoi la autentificare
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}
