import { ClearOutlined, FilterAltOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'

type FieldFiltersModalProps = {
  open: boolean
  filterNameDraft: string
  filterMinDraft: string
  filterMaxDraft: string
  onChangeName: (value: string) => void
  onChangeMin: (value: string) => void
  onChangeMax: (value: string) => void
  onClose: () => void
  onReset: () => void
  onApply: () => void
}

export default function FieldFiltersModal({
  open,
  filterNameDraft,
  filterMinDraft,
  filterMaxDraft,
  onChangeName,
  onChangeMin,
  onChangeMax,
  onClose,
  onReset,
  onApply,
}: FieldFiltersModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Filtrare terenuri</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Filtru nume"
            value={filterNameDraft}
            onChange={(event) => onChangeName(event.target.value)}
            fullWidth
            placeholder="ex: parcela, nord, lot..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAltOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Suprafață minimă (ha)"
              value={filterMinDraft}
              onChange={(event) => onChangeMin(event.target.value)}
              type="number"
              fullWidth
            />
            <TextField
              label="Suprafață maximă (ha)"
              value={filterMaxDraft}
              onChange={(event) => onChangeMax(event.target.value)}
              type="number"
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button startIcon={<ClearOutlined />} onClick={onReset} color="inherit">
          Resetează
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit">
          Anulează
        </Button>
        <Button onClick={onApply} variant="contained">
          Aplică
        </Button>
      </DialogActions>
    </Dialog>
  )
}