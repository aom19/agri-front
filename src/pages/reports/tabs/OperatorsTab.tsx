import { Chip, Grid, Stack } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { ReportFilters, ReportOperatorRow } from '../../../api/reports.api'
import { useReportOperators } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  NEUTRAL_INK,
  OPERATION_STATUS_META,
  formatDecimal,
  formatInt,
  formatPercent,
  machineTypeLabel,
} from '../reportUtils'

type OperatorsTabProps = {
  filters: ReportFilters
}

function OperatorStatusChip({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <Chip
      size="small"
      label={active ? 'Activ' : 'Inactiv'}
      sx={{ bgcolor: active ? '#0083001f' : `${NEUTRAL_INK}1f`, color: '#0d1f17', fontWeight: 600 }}
    />
  )
}

const columns: ReportColumn<ReportOperatorRow>[] = [
  { key: 'name', label: 'Operator', render: (row) => row.name },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <OperatorStatusChip status={row.status} />,
    csv: (row) => (row.status === 'active' ? 'Activ' : 'Inactiv'),
  },
  {
    key: 'types',
    label: 'Mașini permise',
    render: (row) => row.allowed_machine_types.map(machineTypeLabel).join(', ') || '-',
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
    key: 'ontime',
    label: 'La timp',
    align: 'right',
    render: (row) => formatPercent(row.on_time_count, row.completed_count),
    csv: (row) => row.on_time_count,
  },
  {
    key: 'overdue',
    label: 'Întârziate',
    align: 'right',
    render: (row) => formatInt(row.overdue_count),
  },
  {
    key: 'progress',
    label: 'În lucru',
    align: 'right',
    render: (row) => formatInt(row.in_progress_count),
  },
  {
    key: 'planned',
    label: 'Planificate',
    align: 'right',
    render: (row) => formatInt(row.planned_count),
  },
  {
    key: 'area',
    label: 'Ha planificate',
    align: 'right',
    render: (row) => formatDecimal(row.planned_area_ha, 1),
    csv: (row) => row.planned_area_ha,
  },
  {
    key: 'assignments',
    label: 'Alocări active',
    align: 'right',
    render: (row) => formatInt(row.active_assignments),
  },
]

export default function OperatorsTab({ filters }: OperatorsTabProps) {
  const { data, isPending, isError, refetch } = useReportOperators(filters)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const withOperations = data.items.filter((operator) => operator.operations_count > 0)
  const totalOperations = data.items.reduce((sum, operator) => sum + operator.operations_count, 0)
  const totalCompleted = data.items.reduce((sum, operator) => sum + operator.completed_count, 0)
  const totalOnTime = data.items.reduce((sum, operator) => sum + operator.on_time_count, 0)
  const totalOverdue = data.items.reduce((sum, operator) => sum + operator.overdue_count, 0)
  const topOperators = withOperations.slice(0, 10)
  const workloadSeries = (['completed', 'in_progress', 'planned'] as const).map((key) => ({
    data: topOperators.map((operator) => operator[`${key}_count`]),
    label: OPERATION_STATUS_META[key].label,
    color: OPERATION_STATUS_META[key].color,
    stack: 'workload',
    valueFormatter: (value: number | null) => `${formatInt(value ?? 0)} lucrări`,
  }))

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Operatori activi"
            value={`${formatInt(data.active_operators)} / ${formatInt(data.total_operators)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Operatori cu lucrări"
            value={formatInt(withOperations.length)}
            hint={`${formatInt(totalOperations)} lucrări alocate în perioadă`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Finalizate la timp"
            value={formatPercent(totalOnTime, totalCompleted)}
            hint={`${formatInt(totalOnTime)} din ${formatInt(totalCompleted)} lucrări finalizate`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Lucrări întârziate"
            value={formatInt(totalOverdue)}
            hint="planificate sau în lucru, cu termenul depășit"
          />
        </Grid>
      </Grid>

      <ChartCard
        title="Încărcarea operatorilor"
        subtitle="Lucrări după status pentru operatorii cu cele mai multe lucrări în perioadă"
        isEmpty={topOperators.length === 0}
      >
        <BarChart
          layout="horizontal"
          yAxis={[
            { scaleType: 'band', data: topOperators.map((operator) => operator.name), width: 150 },
          ]}
          xAxis={[{ valueFormatter: (value: number) => formatInt(value), tickMinStep: 1 }]}
          series={workloadSeries}
          borderRadius={4}
          grid={{ vertical: true }}
          height={Math.max(220, topOperators.length * 40 + 72)}
          slotProps={{
            legend: {
              position: { vertical: 'bottom', horizontal: 'center' },
              direction: 'horizontal',
            },
          }}
          margin={{ left: 0, right: 16, top: 8 }}
        />
      </ChartCard>

      <ReportTable
        title="Operatori"
        subtitle="Indicatorii se referă la perioada selectată; alocările active sunt valoarea curentă"
        columns={columns}
        rows={data.items}
        rowKey={(row) => row.id}
        csvName="raport-operatori"
      />
    </Stack>
  )
}
