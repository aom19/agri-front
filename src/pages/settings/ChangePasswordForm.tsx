import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PasswordRequirements } from '../../components'
import { strongPasswordSchema } from '../../schemas/auth.schema'
import { useChangePassword } from '../../hooks/useAuth'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    old_password: z.string().min(1, 'Parola curentă este obligatorie'),
    new_password: strongPasswordSchema,
    confirm_password: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Parolele noi nu coincid',
    path: ['confirm_password'],
  })
  .refine((d) => d.old_password === '' || d.new_password !== d.old_password, {
    message: 'Parola nouă nu poate fi identică cu parola curentă',
    path: ['new_password'],
  })

type FormValues = z.infer<typeof schema>

type ChangePasswordFormProps = {
  /** Textul butonului; implicit „Salvează parola”. */
  submitLabel?: string
  onSuccess?: () => void
}

/** Formularul de schimbare a parolei, folosit în Setări și la schimbarea obligatorie. */
export default function ChangePasswordForm({ submitLabel, onSuccess }: ChangePasswordFormProps) {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const changePassword = useChangePassword()
  const show = useNotificationStore((s) => s.show)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  })

  const newPasswordValue = watch('new_password')

  const onSubmit = handleSubmit(async (data) => {
    try {
      await changePassword.mutateAsync(data)
      show('Parola a fost modificată cu succes. Vei primi un email de confirmare.', 'success')
      reset()
      onSuccess?.()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut modifica parola.'), 'error')
    }
  })

  const busy = isSubmitting || changePassword.isPending

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <TextField
          {...register('old_password')}
          label="Parola curentă"
          type={showOld ? 'text' : 'password'}
          error={Boolean(errors.old_password)}
          helperText={errors.old_password?.message}
          disabled={busy}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowOld((v) => !v)} edge="end" size="small">
                    {showOld ? (
                      <VisibilityOffOutlined fontSize="small" />
                    ) : (
                      <VisibilityOutlined fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box>
          <TextField
            {...register('new_password')}
            label="Parola nouă"
            type={showNew ? 'text' : 'password'}
            error={Boolean(errors.new_password)}
            helperText={errors.new_password?.message}
            disabled={busy}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNew((v) => !v)} edge="end" size="small">
                      {showNew ? (
                        <VisibilityOffOutlined fontSize="small" />
                      ) : (
                        <VisibilityOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <PasswordRequirements value={newPasswordValue} />
        </Box>

        <TextField
          {...register('confirm_password')}
          label="Confirmă parola nouă"
          type={showConfirm ? 'text' : 'password'}
          error={Boolean(errors.confirm_password)}
          helperText={errors.confirm_password?.message}
          disabled={busy}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                    {showConfirm ? (
                      <VisibilityOffOutlined fontSize="small" />
                    ) : (
                      <VisibilityOutlined fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {busy ? 'Se salvează...' : (submitLabel ?? 'Salvează parola')}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
