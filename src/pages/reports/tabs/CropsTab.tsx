import { Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ReportCropStat, ReportFieldCropRow, ReportFilters } from '../../../api/reports.api'
import { useReportCrops } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  SERIES_COLORS,
  formatCompact,
  formatDecimal,
  formatHa,
  formatInt,
  formatIsoDay,
} from '../reportUtils'

type CropsTabProps = {
  filters: ReportFilters
}

const cropColumns: ReportColumn<ReportCropStat>[] = [
  { key: 'crop', label: 'Cultură', render: (row) => row.crop_name },
  {
    key: 'fields',
    label: 'Terenuri',
    align: 'right',
    render: (row) => formatInt(row.fields_count),
  },
  {
    key: 'area',
    label: 'Suprafață cultivată',
    align: 'right',
    render: (row) => formatHa(row.planted_area_ha),
    csv: (row) => row.planted_area_ha,
  },
  {
    key: 'production',
    label: 'Producție',
    align: 'right',
    render: (row) => `${formatDecimal(row.production_total, 2)} ${row.yield_unit}`,
    csv: (row) => row.production_total,
  },
  {
    key: 'yield',
    label: 'Randament',
    align: 'right',
    render: (row) =>
      row.yield_per_ha == null ? '-' : `${formatDecimal(row.yield_per_ha, 2)} ${row.yield_unit}/ha`,
    csv: (row) => row.yield_per_ha,
  },
  {
    key: 'expected',
    label: 'Randament estimat',
    align: 'right',
    render: (row) =>
      row.expected_yield_per_ha == null
        ? '-'
        : `${formatDecimal(row.expected_yield_per_ha, 2)} ${row.yield_unit}/ha`,
    csv: (row) => row.expected_yield_per_ha,
  },
  {
    key: 'estimated',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.estimated_cost, 2),
    csv: (row) => row.estimated_cost,
  },
  {
    key: 'real',
    label: 'Cost real',
    align: 'right',
    render: (row) => formatDecimal(row.real_cost, 2),
    csv: (row) => row.real_cost,
  },
  {
    key: 'costha',
    label: 'Cost / ha',
    align: 'right',
    render: (row) => formatDecimal(row.cost_per_ha, 2),
    csv: (row) => row.cost_per_ha,
  },
]

const itemColumns: ReportColumn<ReportFieldCropRow>[] = [
  { key: 'field', label: 'Teren', render: (row) => row.field_name },
  { key: 'crop', label: 'Cultură', render: (row) => row.crop_name },
  {
    key: 'area',
    label: 'Suprafață cultivată',
    align: 'right',
    render: (row) => formatHa(row.planted_area_ha),
    csv: (row) => row.planted_area_ha,
  },
  { key: 'planted', label: 'Semănat', render: (row) => formatIsoDay(row.planted_at) },
  { key: 'harvested', label: 'Recoltat', render: (row) => formatIsoDay(row.harvested_at) },
  {
    key: 'production',
    label: 'Producție',
    align: 'right',
    render: (row) =>
      row.production_total == null
        ? '-'
        : `${formatDecimal(row.production_total, 2)} ${row.yield_unit}`,
    csv: (row) => row.production_total,
  },
  {
    key: 'yield',
    label: 'Randament',
    align: 'right',
    render: (row) =>
      row.yield_per_ha == null ? '-' : `${formatDecimal(row.yield_per_ha, 2)} ${row.yield_unit}/ha`,
    csv: (row) => row.yield_per_ha,
  },
  {
    key: 'expected',
    label: 'Estimat',
    align: 'right',
    render: (row) =>
      row.expected_yield_per_ha == null
        ? '-'
        : `${formatDecimal(row.expected_yield_per_ha, 2)} ${row.yield_unit}/ha`,
    csv: (row) => row.expected_yield_per_ha,
  },
  {
    key: 'ops',
    label: 'Lucrări în sezon',
    align: 'right',
    render: (row) => formatInt(row.operations_count),
  },
  {
    key: 'estimated',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.estimated_cost, 2),
    csv: (row) => row.estimated_cost,
  },
  {
    key: 'real',
    label: 'Cost real',
    align: 'right',
    render: (row) => formatDecimal(row.real_cost, 2),
    csv: (row) => row.real_cost,
  },
  {
    key: 'costha',
    label: 'Cost / ha',
    align: 'right',
    render: (row) => formatDecimal(row.cost_per_ha, 2),
    csv: (row) => row.cost_per_ha,
  },
]

export default function CropsTab({ filters }: CropsTabProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const seasonParam = Number(searchParams.get('season_id')) || undefined
  const { data, isPending, isError, refetch } = useReportCrops(seasonParam, filters.field_id)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const changeSeason = (value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set('season_id', value)
        else next.delete('season_id')
        return next
      },
      { replace: true }
    )
  }

  if (!data.season) {
    return (
      <ChartCard title="Culturi și producție" subtitle="Randamente pe cultură și teren, pe sezon">
        <Stack spacing={1.5} sx={{ alignItems: 'flex-start', py: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Nu există încă niciun sezon definit. Creează un sezon și atribuie culturi terenurilor
            pentru a vedea randamentele și costurile pe hectar.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/crops')}>
            Deschide pagina Culturi
          </Button>
        </Stack>
      </ChartCard>
    )
  }

  const yieldItems = data.by_crop.filter(
    (item) => item.yield_per_ha != null || item.expected_yield_per_ha != null
  )
  const unit = data.by_crop[0]?.yield_unit ?? 't'

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <TextField
          select
          size="small"
          label="Sezon"
          value={String(data.season.id)}
          onChange={(event) => changeSeason(event.target.value)}
          sx={{ minWidth: 240 }}
        >
          {data.seasons.map((season) => (
            <MenuItem key={season.id} value={String(season.id)}>
              {season.name} ({formatIsoDay(season.start_date)} – {formatIsoDay(season.end_date)})
              {season.is_active ? ' · activ' : ''}
            </MenuItem>
          ))}
        </TextField>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          Costurile includ operațiunile din intervalul sezonului, pe fiecare teren cultivat.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate('/crops')}
          sx={{ ml: { sm: 'auto' } }}
        >
          Administrează culturile
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile label="Terenuri cultivate" value={formatInt(data.totals.fields_count)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile label="Suprafață cultivată" value={formatHa(data.totals.planted_area_ha)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile
            label="Producție totală"
            value={`${formatDecimal(data.totals.production_total, 1)} ${unit}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile
            label="Randament mediu"
            value={
              data.totals.yield_per_ha == null
                ? '-'
                : `${formatDecimal(data.totals.yield_per_ha, 2)} ${unit}/ha`
            }
            hint="producție / suprafață cultivată"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile
            label="Cost estimat"
            value={formatCompact(data.totals.estimated_cost)}
            hint="operațiuni din sezon"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <StatTile
            label="Cost real"
            value={formatCompact(data.totals.real_cost)}
            hint="ieșiri din stoc legate de lucrări"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard
            title="Randament pe cultură"
            subtitle={`Realizat față de estimat, în ${unit}/ha`}
            isEmpty={yieldItems.length === 0}
            emptyText="Introdu producția obținută pe terenuri pentru a vedea randamentele."
          >
            <BarChart
              layout="horizontal"
              yAxis={[
                { scaleType: 'band', data: yieldItems.map((item) => item.crop_name), width: 130 },
              ]}
              xAxis={[{ valueFormatter: (value: number) => formatDecimal(value, 1) }]}
              series={[
                {
                  data: yieldItems.map((item) => item.yield_per_ha ?? 0),
                  label: 'Realizat',
                  color: SERIES_COLORS[0],
                  valueFormatter: (value) => `${formatDecimal(value, 2)} ${unit}/ha`,
                },
                {
                  data: yieldItems.map((item) => item.expected_yield_per_ha ?? 0),
                  label: 'Estimat',
                  color: SERIES_COLORS[1],
                  valueFormatter: (value) => `${formatDecimal(value, 2)} ${unit}/ha`,
                },
              ]}
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(220, yieldItems.length * 56 + 72)}
              slotProps={{
                legend: {
                  position: { vertical: 'bottom', horizontal: 'center' },
                  direction: 'horizontal',
                },
              }}
              margin={{ left: 0, right: 16, top: 8 }}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard
            title="Suprafață cultivată pe cultură"
            subtitle="Hectare atribuite în sezon"
            isEmpty={data.by_crop.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[
                { scaleType: 'band', data: data.by_crop.map((item) => item.crop_name), width: 130 },
              ]}
              xAxis={[{ valueFormatter: (value: number) => formatCompact(value) }]}
              series={[
                {
                  data: data.by_crop.map((item) => item.planted_area_ha),
                  label: 'Hectare',
                  color: SERIES_COLORS[2],
                  valueFormatter: (value) => formatHa(value),
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(220, data.by_crop.length * 40 + 48)}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <ReportTable
        title="Sinteză pe cultură"
        columns={cropColumns}
        rows={data.by_crop}
        rowKey={(row) => row.crop_id}
        csvName="raport-culturi"
        maxHeight={320}
      />
      <ReportTable
        title="Culturi pe terenuri"
        subtitle="Producția și randamentul pe fiecare teren din sezon"
        columns={itemColumns}
        rows={data.items}
        rowKey={(row) => row.id}
        csvName="raport-culturi-terenuri"
      />
    </Stack>
  )
}
