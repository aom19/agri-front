import { Box, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import type { ReportFilters } from '../../../api/reports.api'
import { useReportOperations, useReportSummary } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import LegendList from '../components/LegendList'
import { ReportError, ReportLoading } from '../components/ReportStates'
import StatTile from '../components/StatTile'
import {
  NEUTRAL_INK,
  OPERATION_STATUS_META,
  SERIES_COLORS,
  TRACK_COLOR,
  deltaPercent,
  foldSeries,
  formatCompact,
  formatDecimal,
  formatDuration,
  formatHa,
  formatInt,
  formatIsoDay,
  formatPercent,
} from '../reportUtils'

type SummaryTabProps = {
  filters: ReportFilters
}

export default function SummaryTab({ filters }: SummaryTabProps) {
  const summaryQuery = useReportSummary(filters)
  const operationsQuery = useReportOperations(filters)

  if (summaryQuery.isPending) return <ReportLoading />
  if (summaryQuery.isError || !summaryQuery.data) {
    return <ReportError onRetry={() => summaryQuery.refetch()} />
  }

  const { current, previous, inventory, period } = summaryQuery.data
  const operations = operationsQuery.data
  const periodLabel = `față de ${formatIsoDay(period.previous_from)} – ${formatIsoDay(period.previous_to)}`
  const trend = operations?.timeline.map(
    (bucket) => bucket.planned + bucket.in_progress + bucket.completed + bucket.canceled
  )

  const statusItems = (operations?.by_status ?? [])
    .filter((status) => status.count > 0)
    .map((status) => ({
      key: status.key,
      label: OPERATION_STATUS_META[status.key]?.label ?? status.key,
      value: status.count,
      color: OPERATION_STATUS_META[status.key]?.color ?? NEUTRAL_INK,
    }))
  const areaByType = foldSeries(
    (operations?.by_type ?? [])
      .filter((type) => type.area_ha > 0)
      .map((type) => ({ label: type.operation_type_name, value: type.area_ha }))
  )
  const usage = [
    { label: 'Terenuri lucrate', used: current.fields_worked, total: inventory.total_fields },
    { label: 'Mașini folosite', used: current.machines_used, total: inventory.total_machines },
    {
      label: 'Operatori implicați',
      used: current.operators_used,
      total: inventory.total_operators,
    },
  ]

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Operațiuni în perioadă"
            value={formatInt(current.operations_total)}
            hint={`${formatInt(current.operations_in_progress)} în lucru · ${formatInt(current.operations_planned)} planificate`}
            delta={{
              percent: deltaPercent(current.operations_total, previous.operations_total),
              periodLabel,
            }}
            trend={trend}
            accent={SERIES_COLORS[0]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Operațiuni finalizate"
            value={formatInt(current.operations_completed)}
            hint={`${formatPercent(current.operations_completed, current.operations_total)} din total`}
            delta={{
              percent: deltaPercent(current.operations_completed, previous.operations_completed),
              periodLabel,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Hectare planificate"
            value={formatHa(current.planned_area_ha)}
            hint={`realizate: ${formatHa(current.realized_area_ha)} · finalizate planificat: ${formatHa(current.completed_area_ha)}`}
            delta={{
              percent: deltaPercent(current.planned_area_ha, previous.planned_area_ha),
              periodLabel,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Lucrări întârziate"
            value={formatInt(current.overdue_operations)}
            hint="planificate sau în lucru, cu termenul depășit"
            delta={{
              percent: deltaPercent(current.overdue_operations, previous.overdue_operations),
              periodLabel,
              upIsGood: false,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Cost estimat resurse"
            value={formatCompact(current.estimated_cost)}
            hint="din șabloanele operațiunilor și prețurile resurselor"
            delta={{
              percent: deltaPercent(current.estimated_cost, previous.estimated_cost),
              periodLabel,
              upIsGood: false,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Cost real resurse"
            value={formatCompact(current.real_cost)}
            hint={
              current.estimated_cost > 0
                ? `${formatPercent(current.real_cost, current.estimated_cost)} din costul estimat`
                : 'din ieșirile de stoc legate de lucrări'
            }
            delta={{
              percent: deltaPercent(current.real_cost, previous.real_cost),
              periodLabel,
              upIsGood: false,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Combustibil consumat"
            value={`${formatDecimal(current.fuel_used_l, 1)} l`}
            hint={
              current.realized_area_ha > 0
                ? `${formatDecimal(current.fuel_used_l / current.realized_area_ha, 2)} l/ha realizat`
                : 'declarat la finalizarea lucrărilor'
            }
            delta={{
              percent: deltaPercent(current.fuel_used_l, previous.fuel_used_l),
              periodLabel,
              upIsGood: false,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Ore de mașină"
            value={`${formatDecimal(current.machine_hours, 1)} h`}
            hint={`durată reală totală: ${formatDuration(current.actual_duration_minutes)}`}
            delta={{
              percent: deltaPercent(current.machine_hours, previous.machine_hours),
              periodLabel,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Finalizate la timp"
            value={formatPercent(current.on_time_completed, current.operations_completed)}
            hint={`${formatInt(current.on_time_completed)} din ${formatInt(current.operations_completed)} finalizate`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Mașini active"
            value={`${formatInt(inventory.active_machines)} / ${formatInt(inventory.total_machines)}`}
            hint={`${formatInt(inventory.maintenance_assets)} utilaje în mentenanță`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Stocuri sub minim"
            value={`${formatInt(inventory.low_stocks)} / ${formatInt(inventory.total_stocks)}`}
            hint={`valoare stoc: ${formatCompact(inventory.stock_value)}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            title="Operațiuni după status"
            subtitle="Distribuția lucrărilor din perioada selectată"
            isEmpty={statusItems.length === 0}
          >
            <Stack spacing={1.5}>
              <PieChart
                series={[
                  {
                    data: statusItems.map((item) => ({
                      id: item.key,
                      value: item.value,
                      label: item.label,
                      color: item.color,
                    })),
                    innerRadius: 52,
                    outerRadius: 84,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    valueFormatter: (item) => `${formatInt(item.value)} lucrări`,
                  },
                ]}
                hideLegend
                height={190}
                margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
              />
              <LegendList items={statusItems} />
            </Stack>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard
            title="Hectare planificate pe tip de operațiune"
            subtitle="Suprafața planificată în perioada selectată"
            isEmpty={areaByType.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[
                { scaleType: 'band', data: areaByType.map((item) => item.label), width: 120 },
              ]}
              xAxis={[{ valueFormatter: (value: number) => formatCompact(value) }]}
              series={[
                {
                  data: areaByType.map((item) => item.value),
                  label: 'Hectare planificate',
                  color: SERIES_COLORS[0],
                  valueFormatter: (value) => formatHa(value),
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(200, areaByType.length * 40 + 48)}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <ChartCard title="Grad de utilizare" subtitle="Resurse implicate în perioada selectată">
            <Stack spacing={2.25} sx={{ mt: 0.5 }}>
              {usage.map((item) => (
                <Box key={item.label}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d1f17' }}>
                      {formatInt(item.used)} / {formatInt(item.total)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.total > 0 ? Math.min(100, (item.used / item.total) * 100) : 0}
                    aria-label={`${item.label}: ${formatPercent(item.used, item.total)}`}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: TRACK_COLOR,
                      '& .MuiLinearProgress-bar': { bgcolor: '#1a5c38', borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </ChartCard>
        </Grid>
      </Grid>
    </Stack>
  )
}
