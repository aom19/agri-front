import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { FieldCrop, FieldCropClosePayload } from '../../../api/crops.api'
import { useCloseFieldCrop } from '../../../hooks/useCrops'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { toOptionalNumber } from './cropFormat'

type CloseFieldCropDialogProps = {
  item: FieldCrop | null
  onClose: () => void
}

export default function CloseFieldCropDialog({ item, onClose }: CloseFieldCropDialogProps) {
  return (
    <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="sm">
      {item && <CloseFieldCropForm item={item} onClose={onClose} />}
    </Dialog>
  )
}

function CloseFieldCropForm({ item, onClose }: { item: FieldCrop; onClose: () => void }) {
  const show = useNotificationStore((state) => state.show)
  const close = useCloseFieldCrop()
  const today = new Date().toISOString().slice(0, 10)
  const [status, setStatus] = useState<FieldCropClosePayload['status']>('closed')
  const [closedAt, setClosedAt] = useState(item.harvested_at ?? today)
  const [production, setProduction] = useState(
    item.production_total != null ? String(item.production_total) : ''
  )
  const [notes, setNotes] = useState(item.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const compromised = status === 'compromised'

  const submit = () => {
    if (!closedAt) {
      setError('Data închiderii este obligatorie.')
      return
    }
    const parsedProduction = compromised ? 0 : toOptionalNumber(production)
    if (parsedProduction != null && (Number.isNaN(parsedProduction) || parsedProduction < 0)) {
      setError('Producția trebuie să fie un număr pozitiv.')
      return
    }
    if (compromised && !notes.trim()) {
      setError('La o cultură compromisă, scrie ce s-a întâmplat.')
      return
    }
    setError(null)
    close.mutate(
      {
        id: item.id,
        payload: {
          status,
          closed_at: closedAt,
          production_total: parsedProduction,
          notes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          show(
            compromised
              ? 'Cultura a fost închisă ca compromisă.'
              : 'Cultura a fost închisă. Lucrările noi de pe teren nu mai merg la ea.',
            'success'
          )
          onClose()
        },
        onError: (mutationError: unknown) =>
          setError(getApiErrorMessage(mutationError, 'Nu am putut închide cultura.')),
      }
    )
  }

  return (
    <>
      <DialogTitle>
        Închide {item.crop_name} · {item.field_name}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <RadioGroup
            row
            value={status}
            onChange={(event) => setStatus(event.target.value as FieldCropClosePayload['status'])}
          >
            <FormControlLabel value="closed" control={<Radio size="small" />} label="Recoltată" />
            <FormControlLabel
              value="compromised"
              control={<Radio size="small" />}
              label="Compromisă"
            />
          </RadioGroup>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Data închiderii"
              type="date"
              value={closedAt}
              onChange={(event) => setClosedAt(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={`Producție totală (${item.yield_unit})`}
              value={compromised ? '0' : production}
              onChange={(event) => setProduction(event.target.value)}
              size="small"
              fullWidth
              disabled={compromised}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              helperText={compromised ? 'O cultură compromisă nu are producție' : undefined}
            />
          </Stack>
          <TextField
            label={compromised ? 'Ce s-a întâmplat (obligatoriu)' : 'Observații'}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            După închidere, lucrările noi de pe acest teren nu mai merg la această cultură.
            Lucrările deja salvate rămân neschimbate. Producția se poate înregistra în stoc și după
            închidere.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={close.isPending}>
          Renunță
        </Button>
        <Button
          variant="contained"
          color={compromised ? 'warning' : 'primary'}
          onClick={submit}
          disabled={close.isPending}
        >
          {close.isPending ? 'Se salvează...' : 'Închide cultura'}
        </Button>
      </DialogActions>
    </>
  )
}
