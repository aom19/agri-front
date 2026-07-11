import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import type { OperatorFormErrors, OperatorFormValues } from '../../../schemas/operator.schema'

type FormMode = 'create' | 'edit' | 'view'

type OperatorFormModalProps = {
  open: boolean
  mode: FormMode
  formState: OperatorFormValues
  errors: OperatorFormErrors
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (updater: (prev: OperatorFormValues) => OperatorFormValues) => void
}

export default function OperatorFormModal({
  open,
  mode,
  formState,
  errors,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: OperatorFormModalProps) {
  const isView = mode === 'view'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create'
          ? 'Operator nou'
          : mode === 'edit'
            ? 'Editează operator'
            : 'Detalii operator'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Nume"
            required
            value={formState.name}
            onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))}
            disabled={submitting || isView}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Telefon"
              value={formState.phone}
              onChange={(event) => onChange((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formState.email}
              onChange={(event) => onChange((prev) => ({ ...prev, email: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
            />
          </Stack>

          <TextField
            label="Notițe"
            value={formState.notes}
            onChange={(event) => onChange((prev) => ({ ...prev, notes: event.target.value }))}
            disabled={submitting || isView}
            error={Boolean(errors.notes)}
            helperText={errors.notes}
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          {isView ? 'Închide' : 'Anulează'}
        </Button>
        {!isView && (
          <Button onClick={onSubmit} variant="contained" disabled={submitting}>
            {mode === 'create' ? 'Creează' : 'Salvează'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
