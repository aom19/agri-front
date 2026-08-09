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
  fuelTypeOptions,
  machineStatusOptions,
  machineTypeOptions,
  type FuelTypeValue,
  type MachineFormErrors,
  type MachineFormValues,
  type MachineStatusValue,
  type MachineTypeValue,
} from '../../../schemas/machine.schema'

type FormMode = 'create' | 'edit' | 'view'

type MachineFormModalProps = {
  open: boolean
  mode: FormMode
  formState: MachineFormValues
  errors: MachineFormErrors
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (updater: (prev: MachineFormValues) => MachineFormValues) => void
}

export default function MachineFormModal({
  open,
  mode,
  formState,
  errors,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: MachineFormModalProps) {
  const isView = mode === 'view'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create'
          ? 'Creează mașină'
          : mode === 'edit'
            ? 'Editează mașină'
            : 'Detalii mașină'}
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
              <InputLabel id="machine-type-label">Tip</InputLabel>
              <Select
                labelId="machine-type-label"
                label="Tip"
                value={formState.type}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    type: event.target.value as MachineTypeValue,
                  }))
                }
              >
                {machineTypeOptions.map((typeOption) => (
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
              <InputLabel id="machine-status-label">Status</InputLabel>
              <Select
                labelId="machine-status-label"
                label="Status"
                value={formState.status}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    status: event.target.value as MachineStatusValue,
                  }))
                }
              >
                {machineStatusOptions.map((statusOption) => (
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
              label="Număr înmatriculare"
              value={formState.registrationNumber}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, registrationNumber: event.target.value }))
              }
              disabled={submitting || isView}
              error={Boolean(errors.registrationNumber)}
              helperText={errors.registrationNumber}
              fullWidth
            />
          </Stack>

          <FormControl fullWidth disabled={submitting || isView} error={Boolean(errors.fuelType)}>
            <InputLabel id="machine-fuel-type-label">Combustibil</InputLabel>
            <Select
              labelId="machine-fuel-type-label"
              label="Combustibil"
              value={formState.fuelType}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  fuelType: event.target.value as FuelTypeValue,
                }))
              }
            >
              {fuelTypeOptions.map((fuelTypeOption) => (
                <MenuItem key={fuelTypeOption.value || 'none'} value={fuelTypeOption.value}>
                  {fuelTypeOption.label}
                </MenuItem>
              ))}
            </Select>
            {errors.fuelType && <FormHelperText>{errors.fuelType}</FormHelperText>}
          </FormControl>

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
