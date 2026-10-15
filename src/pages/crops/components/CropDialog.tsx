import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import type { Crop, CropPayload } from '../../../api/crops.api'
import { useCreateCrop, useUpdateCrop } from '../../../hooks/useCrops'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

type CropDialogProps = {
  open: boolean
  crop: Crop | null
  onClose: () => void
}

export default function CropDialog({ open, crop, onClose }: CropDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <CropForm crop={crop} onClose={onClose} />}
    </Dialog>
  )
}

function CropForm({ crop, onClose }: { crop: Crop | null; onClose: () => void }) {
  const show = useNotificationStore((state) => state.show)
  const create = useCreateCrop()
  const update = useUpdateCrop()
  const [name, setName] = useState(crop?.name ?? '')
  const [code, setCode] = useState(crop?.code ?? '')
  const [category, setCategory] = useState(crop?.category ?? '')
  const [yieldUnit, setYieldUnit] = useState(crop?.yield_unit ?? 't')
  const [notes, setNotes] = useState(crop?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const submit = () => {
    if (!name.trim()) {
      setError('Numele culturii este obligatoriu.')
      return
    }
    setError(null)
    const payload: CropPayload = {
      name: name.trim(),
      code: code.trim() || null,
      category: category.trim(),
      yield_unit: yieldUnit.trim() || 't',
      notes,
    }
    const options = {
      onSuccess: () => {
        show(crop ? 'Cultura a fost actualizată.' : 'Cultura a fost adăugată.', 'success')
        onClose()
      },
      onError: (mutationError: unknown) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut salva cultura.')),
    }
    if (crop) update.mutate({ id: crop.id, payload }, options)
    else create.mutate(payload, options)
  }

  return (
    <>
      <DialogTitle>{crop ? 'Editează cultura' : 'Cultură nouă'}</DialogTitle>
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
              label="Cod (opțional)"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Categorie"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              size="small"
              fullWidth
              placeholder="cereale, oleaginoase..."
            />
            <TextField
              label="Unitate producție"
              value={yieldUnit}
              onChange={(event) => setYieldUnit(event.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            />
          </Stack>
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
