import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { Link, useSearchParams } from 'react-router-dom'
import { useResendConfirmation } from '../../hooks/useAuth'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { authApi } from '../../api/auth.api'
import AuthLayout from './AuthLayout'

type ConfirmStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const resend = useResendConfirmation()
  const [resendEmail, setResendEmail] = useState('')

  // State local — supraviețuiește remount-ului React StrictMode, spre deosebire de useMutation
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle')
  const [confirmMessage, setConfirmMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token || calledRef.current) return
    calledRef.current = true
    setConfirmStatus('loading')
    authApi.confirmEmail(token)
      .then((res) => {
        setConfirmStatus('success')
        setConfirmMessage(res.data.message ?? 'Contul a fost activat cu succes.')
      })
      .catch((err) => {
        setConfirmStatus('error')
        setConfirmMessage(getApiErrorMessage(err, 'Linkul de confirmare este invalid sau a expirat.'))
      })
  }, [token])

  const showResend = !token || confirmStatus === 'error'

  return (
    <AuthLayout
      title="Confirmare cont"
      subtitle={
        token
          ? 'Validăm token-ul de activare primit pe email.'
          : 'Trimite un nou link de confirmare.'
      }
    >
      <Stack spacing={2.5}>
        {/* ── Confirmare în curs ── */}
        {token && confirmStatus === 'loading' && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={20} />
            <Typography>Confirmăm contul...</Typography>
          </Box>
        )}

        {/* ── Confirmare reușită ── */}
        {confirmStatus === 'success' && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {confirmMessage}
          </Alert>
        )}

        {/* ── Token lipsă sau invalid ── */}
        {!token && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Link invalid sau expirat. Introdu emailul pentru a primi un nou link.
          </Alert>
        )}

        {confirmStatus === 'error' && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {confirmMessage}
          </Alert>
        )}

        {/* ── Formular resend ── */}
        {showResend && (
          <>
            {resend.isSuccess ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {resend.data.data.message}
              </Alert>
            ) : (
              <>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resend.isPending}
                  size="small"
                />
                {resend.isError && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {getApiErrorMessage(resend.error, 'A apărut o eroare. Încearcă din nou.')}
                  </Alert>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  loading={resend.isPending}
                  disabled={!resendEmail.includes('@')}
                  onClick={() => resend.mutate(resendEmail)}
                >
                  Retrimite link de confirmare
                </Button>
              </>
            )}
          </>
        )}

        <Button component={Link} to="/login" variant="contained" size="large" fullWidth>
          Mergi la autentificare
        </Button>
      </Stack>
    </AuthLayout>
  )
}
