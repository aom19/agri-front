import { Grid, Stack } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import type { ReportFilters, WeatherSnapshot } from '../../../api/reports.api'
import { useReportWeather } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  SEQUENTIAL_BLUE,
  formatBucket,
  formatDateTime,
  formatDecimal,
  formatInt,
} from '../reportUtils'

type WeatherTabProps = {
  filters: ReportFilters
}

const latestColumns: ReportColumn<WeatherSnapshot>[] = [
  { key: 'field', label: 'Teren', render: (row) => row.field_name ?? '-' },
  { key: 'observed', label: 'Observat la', render: (row) => formatDateTime(row.observed_at) },
  {
    key: 'temp',
    label: 'Temperatură',
    align: 'right',
    render: (row) => `${formatDecimal(row.temperature_c, 1)} °C`,
    csv: (row) => row.temperature_c,
  },
  { key: 'condition', label: 'Condiții', render: (row) => row.condition || '-' },
  {
    key: 'humidity',
    label: 'Umiditate',
    align: 'right',
    render: (row) => (row.humidity_percent == null ? '-' : `${row.humidity_percent}%`),
    csv: (row) => row.humidity_percent,
  },
  {
    key: 'wind',
    label: 'Vânt',
    align: 'right',
    render: (row) =>
      row.wind_speed_kmh == null ? '-' : `${formatDecimal(row.wind_speed_kmh, 1)} km/h`,
    csv: (row) => row.wind_speed_kmh,
  },
  {
    key: 'precip',
    label: 'Precipitații',
    align: 'right',
    render: (row) =>
      row.precipitation_mm == null ? '-' : `${formatDecimal(row.precipitation_mm, 1)} mm`,
    csv: (row) => row.precipitation_mm,
  },
  { key: 'source', label: 'Sursă', render: (row) => row.source || '-' },
]

export default function WeatherTab({ filters }: WeatherTabProps) {
  const { data, isPending, isError, refetch } = useReportWeather(filters)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const labels = data.series.map((day) => formatBucket(day.day, 'day'))
  const hasSeries = data.series.length > 0

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Temperatură medie"
            value={hasSeries ? `${formatDecimal(data.summary.avg_temperature_c, 1)} °C` : '-'}
            hint={
              hasSeries
                ? `min ${formatDecimal(data.summary.min_temperature_c, 1)} °C · max ${formatDecimal(data.summary.max_temperature_c, 1)} °C`
                : 'fără observații în perioadă'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Precipitații totale"
            value={`${formatDecimal(data.summary.total_precipitation_mm, 1)} mm`}
            hint="medie între terenuri, însumată pe zile"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Zile cu ploaie"
            value={formatInt(data.summary.rainy_days)}
            hint="zile cu cel puțin 0,5 mm"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Observații salvate"
            value={formatInt(data.summary.samples)}
            hint={`${formatInt(data.summary.fields_covered)} terenuri acoperite`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard
            title="Temperatura pe zile"
            subtitle="Minimă, medie și maximă a observațiilor din perioadă"
            isEmpty={!hasSeries}
            emptyText="Istoricul meteo se construiește automat din observațiile salvate periodic. Nu există date în perioada selectată."
          >
            <LineChart
              xAxis={[{ scaleType: 'point', data: labels, tickLabelStyle: { fontSize: 11 } }]}
              yAxis={[{ valueFormatter: (value: number) => `${formatDecimal(value, 0)}°` }]}
              series={[
                {
                  data: data.series.map((day) => day.max_temperature_c),
                  label: 'Maximă',
                  color: SEQUENTIAL_BLUE[5],
                  showMark: false,
                  valueFormatter: (value) => `${formatDecimal(value, 1)} °C`,
                },
                {
                  data: data.series.map((day) => day.avg_temperature_c),
                  label: 'Medie',
                  color: SEQUENTIAL_BLUE[3],
                  showMark: false,
                  valueFormatter: (value) => `${formatDecimal(value, 1)} °C`,
                },
                {
                  data: data.series.map((day) => day.min_temperature_c),
                  label: 'Minimă',
                  color: SEQUENTIAL_BLUE[1],
                  showMark: false,
                  valueFormatter: (value) => `${formatDecimal(value, 1)} °C`,
                },
              ]}
              height={300}
              grid={{ horizontal: true }}
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
            title="Precipitații pe zile"
            subtitle="Milimetri, medie între terenurile monitorizate"
            isEmpty={!hasSeries}
          >
            <BarChart
              xAxis={[{ scaleType: 'band', data: labels, tickLabelStyle: { fontSize: 11 } }]}
              yAxis={[{ valueFormatter: (value: number) => `${formatDecimal(value, 0)} mm` }]}
              series={[
                {
                  data: data.series.map((day) => day.precipitation_mm),
                  label: 'Precipitații',
                  color: SEQUENTIAL_BLUE[3],
                  valueFormatter: (value) => `${formatDecimal(value, 1)} mm`,
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ horizontal: true }}
              height={300}
              margin={{ left: 0, right: 8, top: 8 }}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <ReportTable
        title="Ultima observație pe teren"
        subtitle="Cea mai recentă înregistrare salvată pentru fiecare teren cu geometrie"
        columns={latestColumns}
        rows={data.latest}
        rowKey={(row) => row.id}
        csvName="raport-meteo-terenuri"
        emptyText="Nu există observații meteo salvate. Verifică intervalul WEATHER_SNAPSHOT_INTERVAL și geometria terenurilor."
      />
    </Stack>
  )
}
