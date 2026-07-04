import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'

type FormMode = 'create' | 'edit' | 'view'

type RoleFormState = {
  code: string
  name: string
  description: string
}

type RoleFormModalProps = {
  open: boolean
  mode: FormMode
  formState: RoleFormState
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (updater: (prev: RoleFormState) => RoleFormState) => void
}

export default function RoleFormModal({
  open,
  mode,
  formState,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: RoleFormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create' ? 'Creează rol' : mode === 'edit' ? 'Editează rol' : 'Detalii rol'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Cod"
            value={formState.code}
            onChange={(event) => onChange((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="ex: manager"
            disabled={submitting || mode === 'view'}
            fullWidth
          />
          <TextField
            label="Nume"
            value={formState.name}
            onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="ex: Manager"
            disabled={submitting || mode === 'view'}
            fullWidth
          />
          <TextField
            label="Descriere"
            value={formState.description}
            onChange={(event) => onChange((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Descriere opțională"
            disabled={submitting || mode === 'view'}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          {mode === 'view' ? 'Închide' : 'Anulează'}
        </Button>
        {mode !== 'view' && (
          <Button onClick={onSubmit} variant="contained" disabled={submitting}>
            {mode === 'create' ? 'Creează' : 'Salvează'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}