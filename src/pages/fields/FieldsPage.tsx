import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { AddOutlined, DeleteOutlined, EditOutlined, PlaceOutlined } from '@mui/icons-material'
import { MapContainer, Polygon, Polyline, TileLayer, useMapEvents } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { useNotificationStore } from '../../store/notification.store'
import {
  useCreateField,
  useDeleteField,
  useFields,
  useUpdateField,
} from '../../hooks/useFields'
import type { Field, GeoJSONPolygon, UpsertFieldRequest } from '../../api/fields.api'

type EditableField = {
  id: string | null
  name: string
  areaHaInput: string
  points: LatLngTuple[]
}

const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

function MapClickCapture({ onAddPoint }: { onAddPoint: (point: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onAddPoint([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function geoJSONToPoints(geometry: GeoJSONPolygon): LatLngTuple[] {
  const outerRing = geometry.coordinates[0] ?? []
  if (outerRing.length === 0) return []

  const withoutClosure = [...outerRing]
  if (outerRing.length > 1) {
    const first = outerRing[0]
    const last = outerRing[outerRing.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) {
      withoutClosure.pop()
    }
  }

  return withoutClosure.map((coordinate) => [coordinate[1], coordinate[0]])
}

function pointsToGeoJSON(points: LatLngTuple[]): GeoJSONPolygon {
  const ring = points.map((point) => [point[1], point[0]])
  if (ring.length > 0) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]])
    }
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  }
}

function estimateAreaHa(points: LatLngTuple[]): number {
  if (points.length < 3) return 0

  const earthRadius = 6378137
  const radians = Math.PI / 180
  let area = 0

  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    area +=
      (p2[1] - p1[1]) *
      radians *
      (2 + Math.sin(p1[0] * radians) + Math.sin(p2[0] * radians))
  }

  const areaM2 = Math.abs((area * earthRadius * earthRadius) / 2)
  return areaM2 / 10000
}

export default function FieldsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<EditableField>({
    id: null,
    name: '',
    areaHaInput: '',
    points: [],
  })

  const { show } = useNotificationStore()
  const { data: fields, isLoading } = useFields()
  const createField = useCreateField()
  const updateField = useUpdateField()
  const deleteField = useDeleteField()

  const pending = createField.isPending || updateField.isPending || deleteField.isPending
  const mapPolygon = useMemo(() => draft.points, [draft.points])
  const estimatedArea = useMemo(() => estimateAreaHa(draft.points), [draft.points])

  const resetDraft = () => {
    setDraft({ id: null, name: '', areaHaInput: '', points: [] })
  }

  const openCreateDialog = () => {
    resetDraft()
    setDialogOpen(true)
  }

  const openEditDialog = (field: Field) => {
    setDraft({
      id: field.id,
      name: field.name,
      areaHaInput: field.area_ha == null ? '' : String(field.area_ha),
      points: geoJSONToPoints(field.geometry),
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (pending) return
    setDialogOpen(false)
    resetDraft()
  }

  const removeLastPoint = () => {
    setDraft((prev) => ({
      ...prev,
      points: prev.points.slice(0, -1),
    }))
  }

  const clearPolygon = () => {
    setDraft((prev) => ({ ...prev, points: [] }))
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Ștergi terenul selectat?')) return

    deleteField.mutate(id, {
      onSuccess: () => show('Terenul a fost șters.', 'success'),
      onError: (error) => show(getApiErrorMessage(error, 'Nu am putut șterge terenul.'), 'error'),
    })
  }

  const parseArea = (): number | null | undefined => {
    const raw = draft.areaHaInput.trim()
    if (!raw) return null
    const value = Number(raw)
    if (Number.isNaN(value) || value < 0) return undefined
    return value
  }

  const handleSave = () => {
    if (!draft.name.trim()) {
      show('Numele terenului este obligatoriu.', 'warning')
      return
    }
    if (draft.points.length < 3) {
      show('Poligonul trebuie să aibă cel puțin 3 puncte.', 'warning')
      return
    }

    const areaHa = parseArea()
    if (areaHa === undefined) {
      show('Suprafața trebuie să fie un număr valid mai mare sau egal cu 0.', 'warning')
      return
    }

    const payload: UpsertFieldRequest = {
      name: draft.name.trim(),
      area_ha: areaHa,
      geometry: pointsToGeoJSON(draft.points),
    }

    if (draft.id) {
      updateField.mutate(
        { id: draft.id, payload },
        {
          onSuccess: () => {
            show('Terenul a fost actualizat.', 'success')
            closeDialog()
          },
          onError: (error) =>
            show(getApiErrorMessage(error, 'Nu am putut actualiza terenul.'), 'error'),
        }
      )
      return
    }

    createField.mutate(payload, {
      onSuccess: () => {
        show('Terenul a fost creat.', 'success')
        closeDialog()
      },
      onError: (error) => show(getApiErrorMessage(error, 'Nu am putut crea terenul.'), 'error'),
    })
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Terenuri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CRUD complet cu desenare poligon direct pe hartă (Leaflet).
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
          Teren nou
        </Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nume</TableCell>
                  <TableCell>Suprafață (ha)</TableCell>
                  <TableCell>Vârfuri</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(fields ?? []).map((field) => {
                  const points = geoJSONToPoints(field.geometry)
                  return (
                    <TableRow key={field.id} hover>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.area_ha == null ? '—' : field.area_ha.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip size="small" icon={<PlaceOutlined />} label={`${points.length} puncte`} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => openEditDialog(field)} aria-label="Editează terenul">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(field.id)}
                          aria-label="Șterge terenul"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(fields ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există terenuri încă.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{draft.id ? 'Editează teren' : 'Creează teren'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Nume teren"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Suprafață (ha)"
                value={draft.areaHaInput}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    areaHaInput: event.target.value,
                  }))
                }
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
              <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickCapture
                  onAddPoint={(point) => {
                    setDraft((prev) => ({ ...prev, points: [...prev.points, point] }))
                  }}
                />
                {mapPolygon.length >= 2 && <Polyline positions={mapPolygon} pathOptions={{ color: '#0d6e4f' }} />}
                {mapPolygon.length >= 3 && (
                  <Polygon positions={mapPolygon} pathOptions={{ color: '#0d6e4f', fillOpacity: 0.25 }} />
                )}
              </MapContainer>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={removeLastPoint} disabled={draft.points.length === 0}>
                Șterge ultimul punct
              </Button>
              <Button variant="outlined" color="error" onClick={clearPolygon} disabled={draft.points.length === 0}>
                Curăță poligon
              </Button>
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                Click pe hartă pentru a adăuga puncte.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit" disabled={pending}>
            Anulează
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={pending}>
            {pending ? 'Se salvează...' : 'Salvează'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
