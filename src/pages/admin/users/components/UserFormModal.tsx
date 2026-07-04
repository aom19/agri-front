import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import type { Role } from '../../../../api/roles.api'

type FormMode = 'create' | 'edit' | 'view'

type UserFormState = {
  email: string
  roleId: number | ''
  emailConfirmed: boolean
}

type UserFormModalProps = {
  open: boolean
  mode: FormMode
  formState: UserFormState
  roles: Role[] | undefined
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (updater: (prev: UserFormState) => UserFormState) => void
}

export default function UserFormModal({
  open,
  mode,
  formState,
  roles,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: UserFormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create'
          ? 'Creează utilizator'
          : mode === 'edit'
            ? 'Editează utilizator'
            : 'Detalii utilizator'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Email"
            value={formState.email}
            onChange={(event) => onChange((prev) => ({ ...prev, email: event.target.value }))}
            disabled={submitting || mode === 'view'}
            fullWidth
          />
          <FormControl fullWidth disabled={submitting || mode === 'view'}>
            <InputLabel id="role-id-label">Rol</InputLabel>
            <Select
              labelId="role-id-label"
              label="Rol"
              value={formState.roleId}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, roleId: Number(event.target.value) }))
              }
            >
              {(roles ?? []).map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formState.emailConfirmed}
                onChange={(event) =>
                  onChange((prev) => ({ ...prev, emailConfirmed: event.target.checked }))
                }
                disabled={submitting || mode === 'view'}
              />
            }
            label="Email confirmat"
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
