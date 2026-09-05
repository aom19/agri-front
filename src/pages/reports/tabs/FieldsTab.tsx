import { useEffect, useMemo } from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { latLngBounds, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet'
import { MapContainer, Polygon, TileLayer, Tooltip as LeafletTooltip, useMap } from 'react-leaflet'
import type { ReportFieldRow, ReportFilters } from '../../../api/reports.api'
import { useReportFields } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  SEQUENTIAL_BLUE,
  SERIES_COLORS,
  formatCompact,
  formatDateTime,
  formatDecimal,
  formatHa,
  formatInt,
  formatPercent,
  geoJSONToPoints,
  sequentialColor,
} from '../reportUtils'

type FieldsTabProps = {
  filters: ReportFilters
}

const DEFAULT_CENTER: LatLngTuple = [46.05, 28.2]

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] })
  }, [bounds, map])
  return null
}

const columns: ReportColumn<ReportFieldRow>[] = [
  { key: 'name', label: 'Teren', render: (row) => row.name },
  { key: 'cadastral', label: 'Nr. cadastral', render: (row) => row.cadastral_number ?? '-' },
  {
    key: 'area',
    label: 'Suprafață',
    align: 'right',
    render: (row) => formatHa(row.area_ha),
    csv: (row) => row.area_ha,
  },
  {
    key: 'ops',
    label: 'Lucrări',
    align: 'right',
    render: (row) => formatInt(row.operations_count),
  },
  {
    key: 'completed',
    label: 'Finalizate',
    align: 'right',
    render: (row) => formatInt(row.completed_count),
  },
  {
    key: 'planned',
    label: 'Ha planificate',
    align: 'right',
    render: (row) => formatDecimal(row.planned_area_ha, 1),
    csv: (row) => row.planned_area_ha,
  },
  {
    key: 'cost',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.estimated_cost, 2),
    csv: (row) => row.estimated_cost,
  },
  {
    key: 'last',
    label: 'Ultima operațiune',
    render: (row) => formatDateTime(row.last_operation_at),
  },
]

export default function FieldsTab({ filters }: FieldsTabProps) {
  const { data, isPending, isError, refetch } = useReportFields(filters)

  const polygons = useMemo(() => {
    const items = data?.items ?? []
    const maxPlanned = Math.max(0, ...items.map((item) => item.planned_area_ha))
    return items
      .map((item) => ({
        item,
        points: geoJSONToPoints(item.geometry),
        color: sequentialColor(item.planned_area_ha, maxPlanned),
      }))
      .filter((polygon) => polygon.points.length >= 3)
  }, [data])

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const allPoints = polygons.flatMap((polygon) => polygon.points)
    return allPoints.length > 0 ? latLngBounds(allPoints) : null
  }, [polygons])

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const maxPlanned = Math.max(0, ...data.items.map((item) => item.planned_area_ha))
  const topFields = data.items
    .filter((item) => item.planned_area_ha > 0)
    .slice(0, 10)
    .sort((first, second) => second.planned_area_ha - first.planned_area_ha)

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile label="Terenuri înregistrate" value={formatInt(data.total_fields)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Terenuri cu lucrări"
            value={`${formatInt(data.fields_with_operations)} / ${formatInt(data.total_fields)}`}
            hint={`${formatPercent(data.fields_with_operations, data.total_fields)} din terenuri, în perioada selectată`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile label="Suprafață totală" value={formatHa(data.total_area_ha)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Suprafață cu lucrări"
            value={formatHa(data.worked_area_ha)}
            hint={`${formatPercent(data.worked_area_ha, data.total_area_ha)} din suprafața totală`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="Harta terenurilor"
            subtitle="Culoarea indică hectarele planificate în perioada selectată"
            isEmpty={polygons.length === 0}
            emptyText="Niciun teren nu are geometrie definită."
          >
            <Box sx={{ height: 400, borderRadius: '12px', overflow: 'hidden' }}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds bounds={bounds} />
                {polygons.map(({ item, points, color }) => (
                  <Polygon
                    key={item.id}
                    positions={points}
                    pathOptions={{
                      color: '#184f95',
                      weight: 1.5,
                      fillColor: color,
                      fillOpacity: 0.7,
                    }}
                  >
                    <LeafletTooltip sticky>
                      <strong>{item.name}</strong>
                      <br />
                      {formatHa(item.area_ha)} · {formatInt(item.operations_count)} lucrări
                      <br />
                      {formatHa(item.planned_area_ha)} planificate
                    </LeafletTooltip>
                  </Polygon>
                ))}
              </MapContainer>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mt: 1.5 }}
              aria-hidden="true"
            >
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>0 ha</Typography>
              <Stack direction="row" spacing={0.25}>
                {SEQUENTIAL_BLUE.map((step) => (
                  <Box
                    key={step}
                    sx={{ width: 22, height: 10, bgcolor: step, borderRadius: '2px' }}
                  />
                ))}
              </Stack>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                {formatHa(maxPlanned)}
              </Typography>
            </Stack>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard
            title="Top terenuri după hectare planificate"
            subtitle="Cele mai solicitate terenuri din perioada selectată"
            isEmpty={topFields.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: topFields.map((item) => item.name), width: 110 }]}
              xAxis={[{ valueFormatter: (value: number) => formatCompact(value) }]}
              series={[
                {
                  data: topFields.map((item) => item.planned_area_ha),
                  label: 'Hectare planificate',
                  color: SERIES_COLORS[0],
                  valueFormatter: (value) => formatHa(value),
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(220, topFields.length * 40 + 48)}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <ReportTable
        title="Situația terenurilor"
        subtitle="Lucrările și costurile estimate se referă la perioada selectată"
        columns={columns}
        rows={data.items}
        rowKey={(row) => row.id}
        csvName="raport-terenuri"
      />
    </Stack>
  )
}
