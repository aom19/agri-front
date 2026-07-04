import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { MapContainer, Polygon, Polyline, TileLayer, useMapEvents } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'

const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

export type EditableField = {
  id: string | null
  name: string
  areaHaInput: string
  points: LatLngTuple[]
}

function MapClickCapture({ onAddPoint }: { onAddPoint: (point: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onAddPoint([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

type FieldFormModalProps = {
  open: boolean
  draft: EditableField
  estimatedArea: number
  pending: boolean
  onClose: () => void
  onSave: () => void
  onChangeName: (value: string) => void
  onChangeArea: (value: string) => void
  onAddPoint: (point: LatLngTuple) => void
  onRemoveLastPoint: () => void
  onClearPolygon: () => void
}

export default function FieldFormModal({
  open,
  draft,
  estimatedArea,
  pending,
  onClose,
  onSave,
  onChangeName,
  onChangeArea,
  onAddPoint,
  onRemoveLastPoint,
  onClearPolygon,
}: FieldFormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{draft.id ? 'Editează teren' : 'Creează teren'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Nume teren"
            value={draft.name}
            onChange={(event) => onChangeName(event.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Suprafață (ha)"
              value={draft.areaHaInput}
              onChange={(event) => onChangeArea(event.target.value)}
              helperText={`Estimare din poligon: ${estimatedArea.toFixed(2)} ha`}
              fullWidth
            />
            <TextField
              label="Puncte poligon"
              value={draft.points.length}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
          </Stack>

          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              height: 380,
            }}
          >
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickCapture onAddPoint={onAddPoint} />
              {draft.points.length >= 2 && (
                <Polyline positions={draft.points} pathOptions={{ color: '#0d6e4f' }} />
              )}
              {draft.points.length >= 3 && (
                <Polygon
                  positions={draft.points}
                  pathOptions={{ color: '#0d6e4f', fillOpacity: 0.25 }}
                />
              )}
            </MapContainer>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={onRemoveLastPoint}
              disabled={draft.points.length === 0}
            >
              Șterge ultimul punct
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onClearPolygon}
              disabled={draft.points.length === 0}
            >
              Curăță poligon
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
              Click pe hartă pentru a adăuga puncte.
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={pending}>
          Anulează
        </Button>
        <Button onClick={onSave} variant="contained" disabled={pending}>
          {pending ? 'Se salvează...' : 'Salvează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
