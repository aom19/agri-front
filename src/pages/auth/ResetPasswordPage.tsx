import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import { PasswordField } from '../../components'
import { useResetPassword } from '../../hooks/useAuth'
import { resetPasswordSchema, type ResetPasswordForm } from '../../schemas/auth.schema'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import AuthLayout from './AuthLayout'

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()

  if (!token) {
    return (
      <AuthLayout title="Link invalid">
        <Alert severity="error">Linkul de resetare este invalid sau a expirat.</Alert>
        <Button component={Link} to="/forgot-password" sx={{ mt: 2 }}>
          Solicită un link nou
        </Button>
      </AuthLayout>
    )
  }

  return <ResetForm token={token} />
}

function ResetForm({ token }: { token: string }) {
  const mutation = useResetPassword(token)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = (data: ResetPasswordForm) => mutation.mutate(data)

  return (
    <AuthLayout title="Resetare parolă" subtitle="Alege o parolă nouă pentru contul tău.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isSuccess && (
            <Alert severity="success">
              Parola a fost schimbată cu succes. Vei fi redirecționat la autentificare.
            </Alert>
          )}

          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, 'Linkul a expirat sau este invalid.')}
            </Alert>
          )}

          <PasswordField
            label="Parolă nouă"
            autoComplete="new-password"
            autoFocus
            fullWidth
            disabled={mutation.isSuccess}
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />

          <PasswordField
            label="Confirmă parola"
            autoComplete="new-password"
            fullWidth
            disabled={mutation.isSuccess}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={mutation.isSuccess}
            loading={mutation.isPending}
          >
            Schimbă parola
          </Button>

          <Button component={Link} to="/login" size="small" sx={{ alignSelf: 'center' }}>
            Înapoi la autentificare
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}
