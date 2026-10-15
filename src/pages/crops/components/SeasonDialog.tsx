import { useState } from 'react'
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type { Season, SeasonPayload } from '../../../api/crops.api'
import { useCreateSeason, useUpdateSeason } from '../../../hooks/useCrops'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

type SeasonDialogProps = {
  open: boolean
  season: Season | null
  onClose: () => void
}

export default function SeasonDialog({ open, season, onClose }: SeasonDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <SeasonForm season={season} onClose={onClose} />}
    </Dialog>
  )
}

function SeasonForm({ season, onClose }: { season: Season | null; onClose: () => void }) {
  const show = useNotificationStore((state) => state.show)
  const create = useCreateSeason()
  const update = useUpdateSeason()
  // Implicit: anul agricol care conține ziua de azi (începe la 1 august). Sfârșitul nu se cunoaște
  // la creare: sezonul rămâne „în curs” până când îl închei.
  const today = new Date()
  const agriYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1
  const [name, setName] = useState(season?.name ?? `Sezon ${agriYear}/${agriYear + 1}`)
  const [startDate, setStartDate] = useState(season?.start_date ?? `${agriYear}-08-01`)
  const [endDate, setEndDate] = useState(season?.end_date ?? '')
  const [isActive, setIsActive] = useState(season?.is_active ?? true)
  const [notes, setNotes] = useState(season?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const submit = () => {
    if (!name.trim()) {
      setError('Numele sezonului este obligatoriu.')
      return
    }
    if (!startDate) {
      setError('Data de început este obligatorie.')
      return
    }
    if (endDate && endDate < startDate) {
      setError('Sfârșitul sezonului este înaintea începutului.')
      return
    }
    setError(null)
    const payload: SeasonPayload = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate || null,
      is_active: isActive,
      notes,
    }
    const options = {
      onSuccess: () => {
        show(season ? 'Sezonul a fost actualizat.' : 'Sezonul a fost creat.', 'success')
        onClose()
      },
      onError: (mutationError: unknown) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut salva sezonul.')),
    }
    if (season) update.mutate({ id: season.id, payload }, options)
    else create.mutate(payload, options)
  }

  return (
    <>
      <DialogTitle>{season ? 'Editează sezonul' : 'Sezon nou'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Nume"
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="small"
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Început"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Sfârșit (opțional)"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Lasă gol cât timp sezonul e în curs; completează-l când îl închei"
            />
          </Stack>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            Sezonul e o etichetă de raportare: lucrările se leagă de cultura deschisă a terenului,
            nu de datele de aici. Numește-l după ciclul de producție (ex. „Ciclu toamnă 2025/2026”).
          </Typography>
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            }
            label="Sezon activ (implicit în rapoarte)"
          />
          <TextField
            label="Observații"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Renunță
        </Button>
        <Button variant="contained" onClick={submit} disabled={pending}>
          {pending ? 'Se salvează...' : 'Salvează'}
        </Button>
      </DialogActions>
    </>
  )
}
