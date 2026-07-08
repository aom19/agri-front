import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import {
  implementStatusOptions,
  implementTypeOptions,
  type ImplementFormErrors,
  type ImplementFormValues,
  type ImplementStatusValue,
  type ImplementTypeValue,
} from '../../../schemas/implement.schema'

type FormMode = 'create' | 'edit' | 'view'

type ImplementFormModalProps = {
  open: boolean
  mode: FormMode
  formState: ImplementFormValues
  errors: ImplementFormErrors
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (updater: (prev: ImplementFormValues) => ImplementFormValues) => void
}

export default function ImplementFormModal({
  open,
  mode,
  formState,
  errors,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: ImplementFormModalProps) {
  const isView = mode === 'view'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create'
          ? 'Creeaza implement'
          : mode === 'edit'
            ? 'Editeaza implement'
            : 'Detalii implement'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
            <TextField
              label="Cod"
              required
              value={formState.code}
              onChange={(event) => onChange((prev) => ({ ...prev, code: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.code)}
              helperText={errors.code}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl
              fullWidth
              disabled={submitting || isView}
              required
              error={Boolean(errors.type)}
            >
              <InputLabel id="implement-type-label">Tip</InputLabel>
              <Select
                labelId="implement-type-label"
                label="Tip"
                value={formState.type}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    type: event.target.value as ImplementTypeValue,
                  }))
                }
              >
                {implementTypeOptions.map((typeOption) => (
                  <MenuItem key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <FormControl
              fullWidth
              disabled={submitting || isView}
              required
              error={Boolean(errors.status)}
            >
              <InputLabel id="implement-status-label">Status</InputLabel>
              <Select
                labelId="implement-status-label"
                label="Status"
                value={formState.status}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    status: event.target.value as ImplementStatusValue,
                  }))
                }
              >
                {implementStatusOptions.map((statusOption) => (
                  <MenuItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Brand"
              value={formState.brand}
              onChange={(event) => onChange((prev) => ({ ...prev, brand: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.brand)}
              helperText={errors.brand}
              fullWidth
            />
            <TextField
              label="Model"
              value={formState.model}
              onChange={(event) => onChange((prev) => ({ ...prev, model: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.model)}
              helperText={errors.model}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="An"
              value={formState.year}
              onChange={(event) => onChange((prev) => ({ ...prev, year: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(errors.year)}
              helperText={errors.year}
              fullWidth
            />
            <TextField
              label="Latime de lucru (m)"
              value={formState.workingWidth}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, workingWidth: event.target.value }))
              }
              disabled={submitting || isView}
              error={Boolean(errors.workingWidth)}
              helperText={errors.workingWidth}
              fullWidth
            />
          </Stack>

          <TextField
            label="Capacitate"
            value={formState.capacity}
            onChange={(event) => onChange((prev) => ({ ...prev, capacity: event.target.value }))}
            disabled={submitting || isView}
            error={Boolean(errors.capacity)}
            helperText={errors.capacity}
            fullWidth
          />

          <TextField
            label="Notite"
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
          {isView ? 'Inchide' : 'Anuleaza'}
        </Button>
        {!isView && (
          <Button onClick={onSubmit} variant="contained" disabled={submitting}>
            {mode === 'create' ? 'Creeaza' : 'Salveaza'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
