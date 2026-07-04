import { useMemo, useState } from 'react'
import { MapOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { ModalConfirmAction } from '../../components'
import { useNotificationStore } from '../../store/notification.store'
import { useCreateField, useDeleteField, useFields, useUpdateField } from '../../hooks/useFields'
import type { Field, GeoJSONPolygon, UpsertFieldRequest } from '../../api/fields.api'
import {
  FieldFiltersModal,
  FieldFormModal,
  FieldMapModal,
  FieldsPageHeader,
  FieldsTable,
  type EditableField,
} from './components'

const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

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

  const mapFields = allFieldsMapMarkers

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
      <FieldsPageHeader
        totalResults={filteredSortedFields.length}
        totalFilteredArea={totalFilteredArea}
        activeFilterCount={activeFilterCount}
        onOpenMap={openMapView}
        onCreate={openCreateDialog}
      />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          label="Caută teren"
          placeholder="după nume"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MapOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <FieldsTable
          fields={filteredSortedFields}
          isLoading={isLoading}
          totalFilteredArea={totalFilteredArea}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onOpenFilters={openFiltersDialog}
          onSortClick={handleSortClick}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          getPointsCount={(field) => geoJSONToPoints(field.geometry).length}
        />
      )}

      <FieldFiltersModal
        open={filtersOpen}
        filterNameDraft={filterNameDraft}
        filterMinDraft={filterMinDraft}
        filterMaxDraft={filterMaxDraft}
        onChangeName={setFilterNameDraft}
        onChangeMin={setFilterMinDraft}
        onChangeMax={setFilterMaxDraft}
        onClose={closeFiltersDialog}
        onReset={clearFilters}
        onApply={applyFilters}
      />

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

      <FieldMapModal
        open={mapViewOpen}
        fields={mapFields}
        bounds={allFieldsBounds}
        onClose={closeMapView}
      />

      <FieldFormModal
        open={dialogOpen}
        draft={draft}
        estimatedArea={estimatedArea}
        pending={pending}
        onClose={closeDialog}
        onSave={handleSave}
        onChangeName={(value) => setDraft((prev) => ({ ...prev, name: value }))}
        onChangeArea={(value) => setDraft((prev) => ({ ...prev, areaHaInput: value }))}
        onAddPoint={(point) => setDraft((prev) => ({ ...prev, points: [...prev.points, point] }))}
        onRemoveLastPoint={removeLastPoint}
        onClearPolygon={clearPolygon}
      />
    </Box>
  )
}
