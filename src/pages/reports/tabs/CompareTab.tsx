import { useMemo } from 'react'
import { SwapHorizOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Card,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { useSearchParams } from 'react-router-dom'
import type {
  ReportCompareKind,
  ReportCompareParams,
  ReportCompareSide,
  ReportFilters,
} from '../../../api/reports.api'
import { useSeasons } from '../../../hooks/useCrops'
import { useMachines } from '../../../hooks/useMachines'
import { useOperators } from '../../../hooks/useOperators'
import { useReportCompare } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import {
  NEUTRAL_INK,
  SERIES_COLORS,
  deltaPercent,
  formatBucket,
  formatDecimal,
  formatDuration,
  formatInt,
  granularityLabel,
} from '../reportUtils'

type CompareTabProps = {
  filters: ReportFilters
}

const COLOR_A = SERIES_COLORS[0]
const COLOR_B = SERIES_COLORS[1]

const KINDS: { value: ReportCompareKind; label: string; singular: string }[] = [
  { value: 'operators', label: 'Operatori', singular: 'operatorul' },
  { value: 'machines', label: 'Mașini', singular: 'mașina' },
  { value: 'seasons', label: 'Sezoane', singular: 'sezonul' },
]

type Option = { id: number; name: string }

/** Lista din care se aleg cele două entități (listele sunt deja în cache din restul aplicației). */
function useCompareOptions(kind: ReportCompareKind): Option[] {
  const operators = useOperators()
  const machines = useMachines()
  const seasons = useSeasons()
  if (kind === 'operators') return (operators.data ?? []).map((o) => ({ id: o.id, name: o.name }))
  if (kind === 'machines') return (machines.data ?? []).map((m) => ({ id: m.id, name: m.name }))
  return (seasons.data ?? []).map((s) => ({ id: s.id, name: s.name }))
}

type MetricRow = {
  label: string
  value: (side: ReportCompareSide) => number | null
  format: (value: number | null) => string
  /** Care sens e „mai bine”; fără el, diferența e afișată neutru. */
  better?: 'higher' | 'lower'
  kinds?: ReportCompareKind[]
}

const ratio = (part: number, total: number) => (total > 0 ? part / total : null)
const fmtInt = (value: number | null) => (value == null ? '-' : formatInt(value))
const fmtDec =
  (digits: number, unit = '') =>
  (value: number | null) =>
    value == null ? '-' : `${formatDecimal(value, digits)}${unit}`

const METRIC_ROWS: MetricRow[] = [
  { label: 'Lucrări', value: (s) => s.metrics.operations_total, format: fmtInt },
  {
    label: 'Finalizate',
    value: (s) => s.metrics.operations_completed,
    format: fmtInt,
    better: 'higher',
  },
  {
    label: 'Finalizate la timp',
    value: (s) => {
      const r = ratio(s.metrics.on_time_completed, s.metrics.operations_completed)
      return r == null ? null : r * 100
    },
    format: fmtDec(0, '%'),
    better: 'higher',
  },
  {
    label: 'Întârziate acum',
    value: (s) => s.metrics.overdue_operations,
    format: fmtInt,
    better: 'lower',
  },
  {
    label: 'Suprafață planificată',
    value: (s) => s.metrics.planned_area_ha,
    format: fmtDec(1, ' ha'),
  },
  {
    label: 'Suprafață realizată',
    value: (s) => s.metrics.realized_area_ha,
    format: fmtDec(1, ' ha'),
    better: 'higher',
  },
  {
    label: 'Timp lucrat',
    value: (s) => s.metrics.actual_duration_minutes,
    format: (value) => (value ? formatDuration(value) : '-'),
  },
  {
    label: 'Ha pe oră lucrată',
    value: (s) => ratio(s.metrics.realized_area_ha, s.metrics.actual_duration_minutes / 60),
    format: fmtDec(2, ' ha/h'),
    better: 'higher',
  },
  { label: 'Combustibil', value: (s) => s.metrics.fuel_used_l, format: fmtDec(0, ' l') },
  {
    label: 'Combustibil pe ha',
    value: (s) => ratio(s.metrics.fuel_used_l, s.metrics.realized_area_ha),
    format: fmtDec(1, ' l/ha'),
    better: 'lower',
  },
  { label: 'Ore motor', value: (s) => s.metrics.machine_hours, format: fmtDec(1, ' h') },
  { label: 'Cost estimat', value: (s) => s.metrics.estimated_cost, format: fmtDec(0, ' lei') },
  { label: 'Cost real', value: (s) => s.metrics.real_cost, format: fmtDec(0, ' lei') },
  {
    label: 'Cost real pe ha',
    value: (s) => ratio(s.metrics.real_cost, s.metrics.realized_area_ha),
    format: fmtDec(0, ' lei/ha'),
    better: 'lower',
  },
  { label: 'Terenuri lucrate', value: (s) => s.metrics.fields_worked, format: fmtInt },
  {
    label: 'Mașini folosite',
    value: (s) => s.metrics.machines_used,
    format: fmtInt,
    kinds: ['operators', 'seasons'],
  },
  {
    label: 'Operatori implicați',
    value: (s) => s.metrics.operators_used,
    format: fmtInt,
    kinds: ['machines', 'seasons'],
  },
  {
    label: 'Suprafață cultivată',
    value: (s) => s.crop_totals?.planted_area_ha ?? null,
    format: fmtDec(1, ' ha'),
    kinds: ['seasons'],
  },
  {
    label: 'Producție totală',
    value: (s) => s.crop_totals?.production_total ?? null,
    format: fmtDec(1),
    better: 'higher',
    kinds: ['seasons'],
  },
  {
    label: 'Randament mediu pe ha',
    value: (s) => s.crop_totals?.yield_per_ha ?? null,
    format: fmtDec(2),
    better: 'higher',
    kinds: ['seasons'],
  },
]

function DeltaCell({ a, b, better }: { a: number | null; b: number | null; better?: string }) {
  if (a == null || b == null) return <>-</>
  const percent = deltaPercent(b, a)
  if (percent === 0) return <>=</>
  const text = percent == null ? 'nou' : `${percent > 0 ? '+' : ''}${percent}%`
  const good = better && percent != null ? percent > 0 === (better === 'higher') : null
  return (
    <Typography
      component="span"
      sx={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: good == null ? NEUTRAL_INK : good ? '#056849' : '#b91c1c',
      }}
    >
      {text}
    </Typography>
  )
}

function SideHeader({ side, color }: { side: ReportCompareSide; color: string }) {
  const season = side.season
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>
          {side.name}
        </Typography>
        {season && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>
            {season.start_date.slice(0, 10)} – {season.end_date?.slice(0, 10) ?? 'în curs'}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

export default function CompareTab({ filters }: CompareTabProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const kindParam = searchParams.get('cmp')
  const kind: ReportCompareKind = KINDS.some((k) => k.value === kindParam)
    ? (kindParam as ReportCompareKind)
    : 'operators'
  const a = Number(searchParams.get('a')) || 0
  const b = Number(searchParams.get('b')) || 0
  const options = useCompareOptions(kind)
  const kindMeta = KINDS.find((k) => k.value === kind)!

  const setParams = (patch: Record<string, string | number | null>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, String(value))
          else next.delete(key)
        }
        return next
      },
      { replace: true }
    )
  }

  const params: ReportCompareParams | null = useMemo(
    () => (a > 0 && b > 0 && a !== b ? { ...filters, kind, a, b } : null),
    [filters, kind, a, b]
  )
  const { data, isPending, isError, refetch } = useReportCompare(params)

  const picker = (label: string, value: number, other: number, key: 'a' | 'b', color: string) => (
    <TextField
      select
      size="small"
      label={label}
      value={options.some((o) => o.id === value) ? String(value) : ''}
      onChange={(e) => setParams({ [key]: e.target.value })}
      sx={{ minWidth: 220, flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: color } }}
    >
      {options.map((option) => (
        <MenuItem key={option.id} value={String(option.id)} disabled={option.id === other}>
          {option.name}
        </MenuItem>
      ))}
    </TextField>
  )

  return (
    <Stack spacing={2.5}>
      <Card sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={kind}
            onChange={(_, value: ReportCompareKind | null) =>
              value && setParams({ cmp: value === 'operators' ? null : value, a: null, b: null })
            }
            aria-label="Ce compari"
          >
            {KINDS.map((k) => (
              <ToggleButton key={k.value} value={k.value} sx={{ textTransform: 'none', px: 2 }}>
                {k.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' } }}
          >
            {picker(`Primul (${kindMeta.label.toLowerCase()})`, a, b, 'a', COLOR_A)}
            <Tooltip title="Inversează">
              <span>
                <IconButton
                  aria-label="Inversează"
                  onClick={() => setParams({ a: b, b: a })}
                  disabled={!a && !b}
                  sx={{ alignSelf: 'center' }}
                >
                  <SwapHorizOutlined />
                </IconButton>
              </span>
            </Tooltip>
            {picker(`Al doilea (${kindMeta.label.toLowerCase()})`, b, a, 'b', COLOR_B)}
          </Stack>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {kind === 'seasons'
              ? 'Se compară tot sezonul: perioada din filtre nu se aplică; terenul și tipul operațiunii, da.'
              : 'Indicatorii sunt din perioada și filtrele de mai sus.'}
          </Typography>
        </Stack>
      </Card>

      {!params ? (
        <Alert severity="info">
          Alege {kindMeta.label.toLowerCase()} de comparat, câte unul în fiecare câmp.
        </Alert>
      ) : isPending ? (
        <ReportLoading />
      ) : isError || !data ? (
        <ReportError onRetry={() => refetch()} />
      ) : (
        <CompareResult data={data} />
      )}
    </Stack>
  )
}

function CompareResult({
  data,
}: {
  data: NonNullable<ReturnType<typeof useReportCompare>['data']>
}) {
  const rows = METRIC_ROWS.filter((row) => !row.kinds || row.kinds.includes(data.kind))

  const typeNames = Array.from(
    new Set([...data.a.by_type, ...data.b.by_type].map((t) => t.operation_type_name))
  )
  const typeCount = (side: ReportCompareSide, name: string) =>
    side.by_type.find((t) => t.operation_type_name === name)?.total ?? 0

  const cropNames = Array.from(
    new Set([...(data.a.by_crop ?? []), ...(data.b.by_crop ?? [])].map((c) => c.crop_name))
  )
  const cropArea = (side: ReportCompareSide, name: string) =>
    side.by_crop?.find((c) => c.crop_name === name)?.planted_area_ha ?? 0

  const timeline = data.a.timeline ?? []
  const series = (side: ReportCompareSide, color: string) => ({
    label: side.name,
    color,
    valueFormatter: (value: number | null) => `${formatInt(value ?? 0)} lucrări`,
  })

  return (
    <Stack spacing={2.5}>
      <Card sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Comparație indicatori">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Indicator</TableCell>
              <TableCell align="right">
                <SideHeader side={data.a} color={COLOR_A} />
              </TableCell>
              <TableCell align="right">
                <SideHeader side={data.b} color={COLOR_B} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                Al doilea față de primul
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const va = row.value(data.a)
              const vb = row.value(data.b)
              return (
                <TableRow key={row.label} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>{row.label}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.format(va)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.format(vb)}
                  </TableCell>
                  <TableCell align="right">
                    <DeltaCell a={va} b={vb} better={row.better} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: data.kind === 'seasons' ? 6 : 5 }}>
          <ChartCard
            title="Lucrări pe tip de operațiune"
            subtitle="Număr de lucrări, unul lângă altul"
            isEmpty={typeNames.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: typeNames, width: 120 }]}
              xAxis={[{ valueFormatter: (value: number) => formatInt(value), tickMinStep: 1 }]}
              series={[
                { ...series(data.a, COLOR_A), data: typeNames.map((n) => typeCount(data.a, n)) },
                { ...series(data.b, COLOR_B), data: typeNames.map((n) => typeCount(data.b, n)) },
              ]}
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(240, typeNames.length * 56 + 64)}
              margin={{ left: 0, right: 16, top: 8 }}
            />
          </ChartCard>
        </Grid>

        {data.kind === 'seasons' ? (
          <Grid size={{ xs: 12, lg: 6 }}>
            <ChartCard
              title="Suprafață cultivată pe cultură"
              subtitle="Hectare semănate în fiecare sezon"
              isEmpty={cropNames.length === 0}
            >
              <BarChart
                layout="horizontal"
                yAxis={[{ scaleType: 'band', data: cropNames, width: 120 }]}
                xAxis={[{ valueFormatter: (value: number) => formatDecimal(value, 0) }]}
                series={[
                  {
                    label: data.a.name,
                    color: COLOR_A,
                    data: cropNames.map((n) => cropArea(data.a, n)),
                    valueFormatter: (value) => `${formatDecimal(value ?? 0, 1)} ha`,
                  },
                  {
                    label: data.b.name,
                    color: COLOR_B,
                    data: cropNames.map((n) => cropArea(data.b, n)),
                    valueFormatter: (value) => `${formatDecimal(value ?? 0, 1)} ha`,
                  },
                ]}
                borderRadius={4}
                grid={{ vertical: true }}
                height={Math.max(240, cropNames.length * 56 + 64)}
                margin={{ left: 0, right: 16, top: 8 }}
              />
            </ChartCard>
          </Grid>
        ) : (
          <Grid size={{ xs: 12, lg: 7 }}>
            <ChartCard
              title={`Lucrări finalizate ${data.period ? granularityLabel(data.period.granularity) : ''}`}
              subtitle="Evoluția în perioada selectată"
              isEmpty={timeline.length === 0}
            >
              <LineChart
                xAxis={[
                  {
                    scaleType: 'point',
                    data: timeline.map((bucket) =>
                      formatBucket(bucket.bucket, data.period?.granularity ?? 'day')
                    ),
                    tickLabelStyle: { fontSize: 11 },
                  },
                ]}
                yAxis={[{ valueFormatter: (value: number) => formatInt(value), tickMinStep: 1 }]}
                series={[
                  {
                    ...series(data.a, COLOR_A),
                    data: (data.a.timeline ?? []).map((bucket) => bucket.completed),
                    showMark: false,
                  },
                  {
                    ...series(data.b, COLOR_B),
                    data: (data.b.timeline ?? []).map((bucket) => bucket.completed),
                    showMark: false,
                  },
                ]}
                height={300}
                grid={{ horizontal: true }}
                margin={{ left: 0, right: 8, top: 8 }}
              />
            </ChartCard>
          </Grid>
        )}
      </Grid>

      {data.kind === 'seasons' && cropNames.length > 0 && (
        <Card sx={{ overflowX: 'auto' }}>
          <Box sx={{ px: 2.5, pt: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Randament pe cultură</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              Producție pe hectar, în unitatea culturii
            </Typography>
          </Box>
          <Table size="small" aria-label="Randament pe cultură">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Cultură</TableCell>
                <TableCell align="right">
                  <SideHeader side={data.a} color={COLOR_A} />
                </TableCell>
                <TableCell align="right">
                  <SideHeader side={data.b} color={COLOR_B} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Diferență
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cropNames.map((name) => {
                const ca = data.a.by_crop?.find((c) => c.crop_name === name)
                const cb = data.b.by_crop?.find((c) => c.crop_name === name)
                const unit = (ca ?? cb)?.yield_unit ?? ''
                const ya = ca?.yield_per_ha ?? null
                const yb = cb?.yield_per_ha ?? null
                return (
                  <TableRow key={name} hover>
                    <TableCell>{name}</TableCell>
                    <TableCell align="right">
                      {ya == null ? '-' : `${formatDecimal(ya, 2)} ${unit}/ha`}
                    </TableCell>
                    <TableCell align="right">
                      {yb == null ? '-' : `${formatDecimal(yb, 2)} ${unit}/ha`}
                    </TableCell>
                    <TableCell align="right">
                      <DeltaCell a={ya} b={yb} better="higher" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </Stack>
  )
}
