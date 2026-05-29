import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, InputAdornment, Stack, TextField } from '@mui/material'
import { EmailOutlined } from '@mui/icons-material'
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
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Dacă adresa există în sistem, vei primi un email cu instrucțiuni de resetare.
            </Alert>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {getApiErrorMessage(mutation.error, 'A apărut o eroare. Încearcă din nou.')}
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: '#6b7c74', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={mutation.isSuccess}
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
            Trimite link de resetare
          </Button>

          <Button
            component={Link}
            to="/login"
            size="small"
            sx={{ alignSelf: 'center', fontSize: '0.8rem' }}
          >
            Înapoi la autentificare
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}
