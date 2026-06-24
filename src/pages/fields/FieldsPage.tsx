import { useEffect, useMemo, useState } from 'react'
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
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  AddOutlined,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterAltOutlined,
  MapOutlined,
  PlaceOutlined,
} from '@mui/icons-material'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import { divIcon } from 'leaflet'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { ModalConfirmAction } from '../../components'
import { useNotificationStore } from '../../store/notification.store'
import { useCreateField, useDeleteField, useFields, useUpdateField } from '../../hooks/useFields'
import type { Field, GeoJSONPolygon, UpsertFieldRequest } from '../../api/fields.api'

type EditableField = {
  id: string | null
  name: string
  areaHaInput: string
  points: LatLngTuple[]
}

const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

const FIELD_POLYGON_COLOR = '#8b5cf6'
const FIELD_POLYGON_FILL = 'rgba(139, 92, 246, 0.22)'

function MapClickCapture({ onAddPoint }: { onAddPoint: (point: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onAddPoint([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function MapBoundsSetter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()

  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [32, 32] })
  }, [bounds, map])

  return null
}

function polygonCenter(points: LatLngTuple[]): LatLngTuple {
  if (points.length === 0) return DEFAULT_CENTER

  const total = points.reduce(
    (accumulator, point) => {
      accumulator.lat += point[0]
      accumulator.lng += point[1]
      return accumulator
    },
    { lat: 0, lng: 0 }
  )

  return [total.lat / points.length, total.lng / points.length]
}

function getMapBounds(fields: Field[]): LatLngBoundsExpression | null {
  const allPoints = fields.flatMap((field) => geoJSONToPoints(field.geometry))
  if (allPoints.length === 0) return null

  const latitudes = allPoints.map((point) => point[0])
  const longitudes = allPoints.map((point) => point[1])

  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ]
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
    area += (p2[1] - p1[1]) * radians * (2 + Math.sin(p1[0] * radians) + Math.sin(p2[0] * radians))
  }

  const areaM2 = Math.abs((area * earthRadius * earthRadius) / 2)
  return areaM2 / 10000
}

export default function FieldsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mapViewOpen, setMapViewOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [minAreaFilter, setMinAreaFilter] = useState('')
  const [maxAreaFilter, setMaxAreaFilter] = useState('')
  const [filterNameDraft, setFilterNameDraft] = useState('')
  const [filterMinDraft, setFilterMinDraft] = useState('')
  const [filterMaxDraft, setFilterMaxDraft] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'area'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
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

  const filteredSortedFields = useMemo(() => {
    const minArea = minAreaFilter.trim() === '' ? null : Number(minAreaFilter)
    const maxArea = maxAreaFilter.trim() === '' ? null : Number(maxAreaFilter)

    return [...(fields ?? [])]
      .filter((field) => {
        const matchesName = field.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
        if (!matchesName) return false

        const area = field.area_ha
        if (minArea != null && Number.isFinite(minArea)) {
          if (area == null || area < minArea) return false
        }
        if (maxArea != null && Number.isFinite(maxArea)) {
          if (area == null || area > maxArea) return false
        }

        return true
      })
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1

        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ro') * direction
        }

        const aArea = a.area_ha ?? -1
        const bArea = b.area_ha ?? -1
        return (aArea - bArea) * direction
      })
  }, [fields, nameFilter, minAreaFilter, maxAreaFilter, sortBy, sortOrder])

  const totalFilteredArea = useMemo(
    () => filteredSortedFields.reduce((sum, field) => sum + (field.area_ha ?? 0), 0),
    [filteredSortedFields]
  )

  const allFieldsBounds = useMemo(() => getMapBounds(fields ?? []), [fields])

  const allFieldsMapMarkers = useMemo(
    () =>
      (fields ?? []).map((field) => {
        const points = geoJSONToPoints(field.geometry)
        return {
          id: field.id,
          name: field.name,
          points,
          center: polygonCenter(points),
        }
      }),
    [fields]
  )

  const activeFilterCount =
    Number(Boolean(nameFilter.trim())) +
    Number(Boolean(minAreaFilter.trim())) +
    Number(Boolean(maxAreaFilter.trim()))

  const handleSortClick = (column: 'name' | 'area') => {
    if (sortBy !== column) {
      setSortBy(column)
      setSortOrder('asc')
      return
    }
    setSortOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'))
  }

  const openFiltersDialog = () => {
    setFilterNameDraft(nameFilter)
    setFilterMinDraft(minAreaFilter)
    setFilterMaxDraft(maxAreaFilter)
    setFiltersOpen(true)
  }

  const closeFiltersDialog = () => {
    setFiltersOpen(false)
  }

  const applyFilters = () => {
    setNameFilter(filterNameDraft)
    setMinAreaFilter(filterMinDraft)
    setMaxAreaFilter(filterMaxDraft)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilterNameDraft('')
    setFilterMinDraft('')
    setFilterMaxDraft('')
    setNameFilter('')
    setMinAreaFilter('')
    setMaxAreaFilter('')
  }

  const openMapView = () => setMapViewOpen(true)
  const closeMapView = () => setMapViewOpen(false)

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
    const field = fields?.find((item) => item.id === id) ?? null
    setFieldToDelete(field)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleteField.isPending) return
    setDeleteDialogOpen(false)
    setFieldToDelete(null)
  }

  const confirmDelete = () => {
    if (!fieldToDelete) return

    deleteField.mutate(fieldToDelete.id, {
      onSuccess: () => show('Terenul a fost șters.', 'success'),
      onError: (error) => show(getApiErrorMessage(error, 'Nu am putut șterge terenul.'), 'error'),
      onSettled: () => closeDeleteDialog(),
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
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${filteredSortedFields.length} rezultate`} size="small" />
            <Chip
              label={`${totalFilteredArea.toFixed(2)} ha total`}
              size="small"
              variant="outlined"
            />
            {activeFilterCount > 0 && (
              <Chip label={`${activeFilterCount} filtre active`} size="small" color="primary" />
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<MapOutlined />} onClick={openMapView}>
            Vezi toate terenurile
          </Button>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Teren nou
          </Button>
        </Stack>
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
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                        Nume
                      </Typography>
                      <Tooltip title="Deschide filtre">
                        <IconButton size="small" onClick={openFiltersDialog}>
                          <FilterAltOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sortează după nume">
                        <IconButton size="small" onClick={() => handleSortClick('name')}>
                          {sortBy === 'name' && sortOrder === 'desc' ? (
                            <ArrowDownwardOutlined sx={{ fontSize: 18 }} />
                          ) : (
                            <ArrowUpwardOutlined sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                        Suprafață (ha)
                      </Typography>
                      <Tooltip title="Deschide filtre">
                        <IconButton size="small" onClick={openFiltersDialog}>
                          <FilterAltOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sortează după suprafață">
                        <IconButton size="small" onClick={() => handleSortClick('area')}>
                          {sortBy === 'area' && sortOrder === 'desc' ? (
                            <ArrowDownwardOutlined sx={{ fontSize: 18 }} />
                          ) : (
                            <ArrowUpwardOutlined sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                      Vârfuri
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                      Acțiuni
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSortedFields.map((field) => {
                  const points = geoJSONToPoints(field.geometry)
                  return (
                    <TableRow key={field.id} hover>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>
                        {field.area_ha == null ? '—' : field.area_ha.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={<PlaceOutlined />}
                          label={`${points.length} puncte`}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => openEditDialog(field)}
                          aria-label="Editează terenul"
                        >
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
                {filteredSortedFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există terenuri încă.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Total (filtrat)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{totalFilteredArea.toFixed(2)} ha</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onClose={closeFiltersDialog} fullWidth maxWidth="sm">
        <DialogTitle>Filtrare terenuri</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Filtru nume"
              value={filterNameDraft}
              onChange={(event) => setFilterNameDraft(event.target.value)}
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
                onChange={(event) => setFilterMinDraft(event.target.value)}
                type="number"
                fullWidth
              />
              <TextField
                label="Suprafață maximă (ha)"
                value={filterMaxDraft}
                onChange={(event) => setFilterMaxDraft(event.target.value)}
                type="number"
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<ClearOutlined />} onClick={clearFilters} color="inherit">
            Resetează
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeFiltersDialog} color="inherit">
            Anulează
          </Button>
          <Button onClick={applyFilters} variant="contained">
            Aplică
          </Button>
        </DialogActions>
      </Dialog>

      <ModalConfirmAction
        open={deleteDialogOpen}
        title="Ștergere teren"
        description={
          fieldToDelete
            ? `Ești sigur că vrei să ștergi terenul "${fieldToDelete.name}"? Acțiunea nu poate fi anulată.`
            : 'Ești sigur că vrei să ștergi acest teren? Acțiunea nu poate fi anulată.'
        }
        confirmText={deleteField.isPending ? 'Se șterge...' : 'Șterge'}
        cancelText="Renunță"
        loading={deleteField.isPending}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />

      <Dialog open={mapViewOpen} onClose={closeMapView} fullWidth maxWidth="lg">
        <DialogTitle>Toate terenurile pe hartă</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2, color: 'text.secondary' }}>
            {fields && fields.length > 0
              ? 'Terenurile sunt afișate în violet, iar numele lor apare direct pe hartă.'
              : 'Nu există terenuri adăugate încă.'}
          </Box>
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              height: 560,
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
              <MapBoundsSetter bounds={allFieldsBounds} />
              {allFieldsMapMarkers.map((field) => {
                if (field.points.length === 0) return null

                const labelIcon = divIcon({
                  className: 'field-label-marker',
                  html: `
                    <div style="
                      transform: translate(-50%, -50%);
                      background: rgba(139, 92, 246, 0.95);
                      color: #fff;
                      border: 1px solid rgba(255,255,255,0.7);
                      border-radius: 999px;
                      padding: 6px 10px;
                      font-size: 12px;
                      font-weight: 700;
                      box-shadow: 0 8px 18px rgba(139, 92, 246, 0.28);
                      white-space: nowrap;
                    ">${field.name}</div>
                  `,
                  iconSize: [1, 1],
                  iconAnchor: [0, 0],
                })

                return (
                  <>
                    <Polygon
                      key={field.id}
                      positions={field.points}
                      pathOptions={{
                        color: FIELD_POLYGON_COLOR,
                        fillColor: FIELD_POLYGON_FILL,
                        fillOpacity: 0.22,
                        weight: 2,
                      }}
                    />
                    <Marker
                      key={`${field.id}-label`}
                      position={field.center}
                      icon={labelIcon}
                      interactive={false}
                    />
                  </>
                )
              })}
            </MapContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeMapView} variant="contained">
            Închide
          </Button>
        </DialogActions>
      </Dialog>

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
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickCapture
                  onAddPoint={(point) => {
                    setDraft((prev) => ({ ...prev, points: [...prev.points, point] }))
                  }}
                />
                {mapPolygon.length >= 2 && (
                  <Polyline positions={mapPolygon} pathOptions={{ color: '#0d6e4f' }} />
                )}
                {mapPolygon.length >= 3 && (
                  <Polygon
                    positions={mapPolygon}
                    pathOptions={{ color: '#0d6e4f', fillOpacity: 0.25 }}
                  />
                )}
              </MapContainer>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                onClick={removeLastPoint}
                disabled={draft.points.length === 0}
              >
                Șterge ultimul punct
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={clearPolygon}
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
