import { useMemo } from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type {
  ReportFilters,
  ReportOperationRow,
  ReportOperationTypeStat,
} from '../../api/reports.api'
import { useMyReportOperations } from '../../hooks/useReports'
import { isOperationType } from '../../schemas/operation.schema'
import ChartCard from '../reports/components/ChartCard'
import ReportFilterBar from '../reports/components/ReportFilterBar'
import { ReportError, ReportLoading } from '../reports/components/ReportStates'
import ReportTable, { type ReportColumn } from '../reports/components/ReportTable'
import StatTile from '../reports/components/StatTile'
import StatusChip from '../reports/components/StatusChip'
import { defaultReportFilterState, type ReportFilterState } from '../reports/reportFilterState'
import {
  OPERATION_STATUS_META,
  OPERATION_STATUS_SINGULAR,
  SERIES_COLORS,
  formatBucket,
  formatDateTime,
  formatDecimal,
  formatDuration,
  formatHa,
  formatInt,
  formatPercent,
  granularityLabel,
} from '../reports/reportUtils'

type FilterKey = 'from' | 'to' | 'operationType'

const PARAM_NAMES: Record<FilterKey, string> = {
  from: 'from',
  to: 'to',
  operationType: 'operation_type',
}

const STATUS_KEYS = ['planned', 'in_progress', 'completed', 'canceled'] as const

const typeColumns: ReportColumn<ReportOperationTypeStat>[] = [
  { key: 'name', label: 'Tip operațiune', render: (row) => row.operation_type_name },
  { key: 'total', label: 'Lucrări', align: 'right', render: (row) => formatInt(row.total) },
  {
    key: 'completed',
    label: 'Finalizate',
    align: 'right',
    render: (row) => formatInt(row.completed),
  },
  {
    key: 'area',
    label: 'Ha planificate',
    align: 'right',
    render: (row) => formatDecimal(row.area_ha, 1),
    csv: (row) => row.area_ha,
  },
]

const itemColumns: ReportColumn<ReportOperationRow>[] = [
  { key: 'field', label: 'Teren', render: (row) => row.field_name },
  {
    key: 'operation',
    label: 'Operațiune',
    render: (row) => (
      <Stack spacing={0}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {row.operation_type_name}
        </Typography>
        {row.template_name && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {row.template_name}
          </Typography>
        )}
      </Stack>
    ),
    csv: (row) =>
      row.template_name
        ? `${row.operation_type_name} (${row.template_name})`
        : row.operation_type_name,
  },
  { key: 'machine', label: 'Mașină', render: (row) => row.machine_name ?? '-' },
  {
    key: 'start',
    label: 'Start planificat',
    render: (row) => formatDateTime(row.planned_start_at),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusChip status={row.status} />,
    csv: (row) => OPERATION_STATUS_SINGULAR[row.status] ?? row.status,
  },
  {
    key: 'duration',
    label: 'Durată reală',
    align: 'right',
    render: (row) => formatDuration(row.actual_duration_minutes ?? 0),
    csv: (row) => row.actual_duration_minutes ?? '',
  },
  {
    key: 'area',
    label: 'Ha realizate',
    align: 'right',
    render: (row) => formatDecimal(row.area_completed_ha, 1),
    csv: (row) => row.area_completed_ha ?? '',
  },
  {
    key: 'fuel',
    label: 'Combustibil (l)',
    align: 'right',
    render: (row) => formatDecimal(row.fuel_used_l, 1),
    csv: (row) => row.fuel_used_l ?? '',
  },
]

/** Rapoartele operatorului: doar lucrările proprii, filtrate și agregate în API. */
export default function MyReportsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaults = useMemo(() => defaultReportFilterState(), [])

  const state = {
    from: searchParams.get(PARAM_NAMES.from) ?? defaults.from,
    to: searchParams.get(PARAM_NAMES.to) ?? defaults.to,
    operationType: searchParams.get(PARAM_NAMES.operationType) ?? '',
  }

  const updateFilters = (patch: Partial<ReportFilterState>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const key of Object.keys(PARAM_NAMES) as FilterKey[]) {
          if (!(key in patch)) continue
          const value = patch[key]
          if (!value || value === defaults[key]) next.delete(PARAM_NAMES[key])
          else next.set(PARAM_NAMES[key], value)
        }
        return next
      },
      { replace: true }
    )
  }

  const filters: ReportFilters = useMemo(
    () => ({
      from: state.from,
      to: state.to,
      operation_type: isOperationType(state.operationType) ? state.operationType : undefined,
    }),
    [state.from, state.to, state.operationType]
  )
  const { data, isPending, isError, refetch } = useMyReportOperations(filters)

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
          Rapoartele mele
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Lucrările tale pe teren · {state.from} – {state.to}
        </Typography>
      </Box>

      <ReportFilterBar
        value={state}
        onChange={updateFilters}
        onReset={() => setSearchParams(new URLSearchParams(), { replace: true })}
      />

      {isPending ? (
        <ReportLoading />
      ) : isError || !data ? (
        <ReportError onRetry={() => refetch()} />
      ) : (
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, lg: 3 }}>
              <StatTile
                label="Lucrări în perioadă"
                value={formatInt(data.metrics.operations_total)}
                hint={`${formatInt(data.metrics.operations_in_progress)} în lucru · ${formatInt(data.metrics.operations_planned)} planificate`}
              />
            </Grid>
            <Grid size={{ xs: 6, lg: 3 }}>
              <StatTile
                label="Finalizate"
                value={formatInt(data.metrics.operations_completed)}
                hint={`${formatPercent(data.metrics.on_time_completed, data.metrics.operations_completed)} la timp`}
              />
            </Grid>
            <Grid size={{ xs: 6, lg: 3 }}>
              <StatTile
                label="Suprafață realizată"
                value={formatHa(data.metrics.realized_area_ha)}
                hint={`din ${formatHa(data.metrics.planned_area_ha)} planificate`}
              />
            </Grid>
            <Grid size={{ xs: 6, lg: 3 }}>
              <StatTile
                label="Timp lucrat"
                value={formatDuration(data.metrics.actual_duration_minutes)}
                hint={`${formatDecimal(data.metrics.fuel_used_l, 1)} l combustibil · ${formatDecimal(data.metrics.machine_hours, 1)} ore motor`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ChartCard
                title={`Lucrări ${granularityLabel(data.period.granularity)}`}
                subtitle="Lucrările tale după status, pe intervalul selectat"
                isEmpty={data.metrics.operations_total === 0}
              >
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: data.timeline.map((bucket) =>
                        formatBucket(bucket.bucket, data.period.granularity)
                      ),
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  yAxis={[{ valueFormatter: (value: number) => formatInt(value) }]}
                  series={STATUS_KEYS.map((key) => ({
                    data: data.timeline.map((bucket) => bucket[key]),
                    label: OPERATION_STATUS_META[key].label,
                    color: OPERATION_STATUS_META[key].color,
                    stack: 'status',
                    valueFormatter: (value: number | null) => `${formatInt(value ?? 0)} lucrări`,
                  }))}
                  height={300}
                  borderRadius={4}
                  grid={{ horizontal: true }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'center' },
                      direction: 'horizontal',
                    },
                  }}
                  margin={{ left: 0, right: 8, top: 8 }}
                />
              </ChartCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <ChartCard
                title="Pe tip de operațiune"
                subtitle="Număr de lucrări din perioada selectată"
                isEmpty={data.by_type.length === 0}
              >
                <BarChart
                  layout="horizontal"
                  yAxis={[
                    {
                      scaleType: 'band',
                      data: data.by_type.map((type) => type.operation_type_name),
                      width: 120,
                    },
                  ]}
                  xAxis={[{ valueFormatter: (value: number) => formatInt(value), tickMinStep: 1 }]}
                  series={[
                    {
                      data: data.by_type.map((type) => type.total),
                      label: 'Lucrări',
                      color: SERIES_COLORS[0],
                      valueFormatter: (value) => `${formatInt(value ?? 0)} lucrări`,
                    },
                  ]}
                  hideLegend
                  borderRadius={4}
                  grid={{ vertical: true }}
                  height={Math.max(220, data.by_type.length * 40 + 48)}
                  margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
                />
              </ChartCard>
            </Grid>
          </Grid>

          <ReportTable
            title="Sinteză pe tip de operațiune"
            columns={typeColumns}
            rows={data.by_type}
            rowKey={(row) => row.operation_type}
            csvName="lucrarile-mele-pe-tip"
            maxHeight={320}
          />

          <ReportTable
            title="Lucrările mele"
            subtitle="Click pe un rând deschide detaliile lucrării."
            columns={itemColumns}
            rows={data.items}
            rowKey={(row) => row.id}
            csvName="lucrarile-mele"
            onRowClick={(row) => navigate(`/field-operations/${row.id}`)}
          />
        </Stack>
      )}
    </Box>
  )
}
