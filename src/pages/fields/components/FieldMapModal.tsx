import { useEffect } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Marker, Polygon, TileLayer, MapContainer, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'

const FIELD_POLYGON_COLOR = '#8b5cf6'
const FIELD_POLYGON_FILL = 'rgba(139, 92, 246, 0.22)'
const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

type MapField = {
  id: string
  name: string
  points: LatLngTuple[]
  center: LatLngTuple
}

function MapBoundsSetter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()

  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [32, 32] })
  }, [bounds, map])

  return null
}

type FieldMapModalProps = {
  open: boolean
  fields: MapField[]
  bounds: LatLngBoundsExpression | null
  title?: string
  description?: string
  onClose: () => void
}

export default function FieldMapModal({
  open,
  fields,
  bounds,
  title = 'Toate terenurile pe hartă',
  description,
  onClose,
}: FieldMapModalProps) {
  const contentDescription =
    description ??
    (fields.length > 0
      ? 'Terenurile sunt afișate în violet, iar numele lor apare direct pe hartă.'
      : 'Nu există terenuri adăugate încă.')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ mb: 2, color: 'text.secondary' }}>{contentDescription}</Box>
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            height: 560,
          }}
        >
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsSetter bounds={bounds} />
            {fields.map((field) => {
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
        <Button onClick={onClose} variant="contained">
          Închide
        </Button>
      </DialogActions>
    </Dialog>
  )
}
