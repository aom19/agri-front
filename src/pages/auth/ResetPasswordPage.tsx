import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { Link, useParams } from 'react-router-dom'
import { PasswordField } from '../../components'
import { useResetPassword } from '../../hooks/useAuth'
import { resetPasswordSchema, type ResetPasswordForm } from '../../schemas/auth.schema'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import AuthLayout from './AuthLayout'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: 'Slabă', color: '#dc2626' },
    { label: 'Acceptabilă', color: '#f59e0b' },
    { label: 'Bună', color: '#2d8653' },
    { label: 'Excelentă', color: '#10b981' },
  ]
  const idx = Math.min(score, 4) - 1
  const level = levels[Math.max(idx, 0)]
  return { score, label: level.label, color: level.color }
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()

  if (!token) {
    return (
      <AuthLayout title="Link invalid">
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Linkul de resetare este invalid sau a expirat.
        </Alert>
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
    control,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = useWatch({ control, name: 'password' })
  const strength = getPasswordStrength(password || '')

  const onSubmit = (data: ResetPasswordForm) => mutation.mutate(data)

  return (
    <AuthLayout title="Resetare parolă" subtitle="Alege o parolă nouă pentru contul tău.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {mutation.isSuccess && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Parola a fost schimbată cu succes. Vei fi redirecționat la autentificare.
            </Alert>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#6b7c74', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            {...register('password')}
          />

          {/* Password strength indicator */}
          {password && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={(strength.score / 4) * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: '#e0e6e2',
                  '& .MuiLinearProgress-bar': { bgcolor: strength.color, borderRadius: 2 },
                }}
              />
              <Typography
                sx={{ fontSize: '0.7rem', color: strength.color, mt: 0.5, fontWeight: 500 }}
              >
                {strength.label}
              </Typography>
            </Box>
          )}

          <PasswordField
            label="Confirmă parola"
            autoComplete="new-password"
            fullWidth
            disabled={mutation.isSuccess}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#6b7c74', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            {...register('confirmPassword')}
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
            Schimbă parola
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
