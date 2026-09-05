import { Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useNavigate } from 'react-router-dom'
import type {
  ReportFilters,
  ReportOperationRow,
  ReportOperationTypeStat,
} from '../../../api/reports.api'
import { useReportOperations } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import {
  NEUTRAL_INK,
  OPERATION_STATUS_META,
  OPERATION_STATUS_SINGULAR,
  SERIES_COLORS,
  foldSeries,
  formatBucket,
  formatCompact,
  formatDateTime,
  formatDecimal,
  formatDuration,
  formatHa,
  formatInt,
  granularityLabel,
} from '../reportUtils'

type OperationsTabProps = {
  filters: ReportFilters
}

const STATUS_KEYS = ['planned', 'in_progress', 'completed', 'canceled'] as const

function StatusChip({ status }: { status: string }) {
  const meta = OPERATION_STATUS_META[status]
  return (
    <Chip
      size="small"
      label={OPERATION_STATUS_SINGULAR[status] ?? status}
      sx={{
        bgcolor: `${meta?.color ?? NEUTRAL_INK}1f`,
        color: '#0d1f17',
        fontWeight: 600,
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: meta?.color ?? NEUTRAL_INK,
          ml: 1,
          mr: -0.5,
        },
      }}
    />
  )
}

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
  {
    key: 'cost',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.estimated_cost, 2),
    csv: (row) => row.estimated_cost,
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
  { key: 'operator', label: 'Operator', render: (row) => row.operator_name ?? '-' },
  {
    key: 'start',
    label: 'Start planificat',
    render: (row) => formatDateTime(row.planned_start_at),
  },
  { key: 'end', label: 'Sfârșit planificat', render: (row) => formatDateTime(row.planned_end_at) },
  {
    key: 'area',
    label: 'Ha',
    align: 'right',
    render: (row) => formatDecimal(row.area_planned_ha, 1),
    csv: (row) => row.area_planned_ha,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusChip status={row.status} />,
    csv: (row) => OPERATION_STATUS_SINGULAR[row.status] ?? row.status,
  },
  {
    key: 'delay',
    label: 'Întârziere',
    align: 'right',
    render: (row) => (
      <Typography
        component="span"
        sx={{
          fontSize: '0.8rem',
          fontWeight: row.delay_minutes > 0 ? 700 : 400,
          color: row.delay_minutes > 0 ? '#b91c1c' : 'text.secondary',
        }}
      >
        {formatDuration(row.delay_minutes)}
      </Typography>
    ),
    csv: (row) => row.delay_minutes,
  },
  {
    key: 'cost',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.estimated_cost, 2),
    csv: (row) => row.estimated_cost,
  },
]

export default function OperationsTab({ filters }: OperationsTabProps) {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useReportOperations(filters)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const labels = data.timeline.map((bucket) => formatBucket(bucket.bucket, data.period.granularity))
  const timelineSeries = STATUS_KEYS.map((key) => ({
    data: data.timeline.map((bucket) => bucket[key]),
    label: OPERATION_STATUS_META[key].label,
    color: OPERATION_STATUS_META[key].color,
    stack: 'status',
    valueFormatter: (value: number | null) => `${formatInt(value ?? 0)} lucrări`,
  }))
  const countByType = foldSeries(
    data.by_type.map((type) => ({ label: type.operation_type_name, value: type.total }))
  )

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title={`Operațiuni ${granularityLabel(data.period.granularity)}`}
            subtitle="Număr de lucrări după status, pe intervalul selectat"
            isEmpty={data.metrics.operations_total === 0}
          >
            <BarChart
              xAxis={[{ scaleType: 'band', data: labels, tickLabelStyle: { fontSize: 11 } }]}
              yAxis={[{ valueFormatter: (value: number) => formatInt(value) }]}
              series={timelineSeries}
              height={320}
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
            title="Lucrări pe tip de operațiune"
            subtitle="Număr de lucrări din perioada selectată"
            isEmpty={countByType.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[
                { scaleType: 'band', data: countByType.map((item) => item.label), width: 120 },
              ]}
              xAxis={[{ valueFormatter: (value: number) => formatCompact(value), tickMinStep: 1 }]}
              series={[
                {
                  data: countByType.map((item) => item.value),
                  label: 'Lucrări',
                  color: SERIES_COLORS[0],
                  valueFormatter: (value) => `${formatInt(value ?? 0)} lucrări`,
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(220, countByType.length * 40 + 48)}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <ReportTable
        title="Sinteză pe tip de operațiune"
        subtitle={`${formatHa(data.metrics.planned_area_ha)} planificate · ${formatHa(data.metrics.realized_area_ha)} realizate · cost estimat ${formatDecimal(data.metrics.estimated_cost, 2)} · cost real ${formatDecimal(data.metrics.real_cost, 2)}`}
        columns={typeColumns}
        rows={data.by_type}
        rowKey={(row) => row.operation_type_id}
        csvName="raport-operatiuni-pe-tip"
        maxHeight={320}
      />

      <ReportTable
        title="Lista operațiunilor"
        subtitle="Click pe un rând deschide detaliile lucrării. Sunt afișate cel mult 500 de înregistrări."
        columns={itemColumns}
        rows={data.items}
        rowKey={(row) => row.id}
        csvName="raport-operatiuni"
        onRowClick={(row) => navigate(`/field-operations/${row.id}`)}
      />
    </Stack>
  )
}
