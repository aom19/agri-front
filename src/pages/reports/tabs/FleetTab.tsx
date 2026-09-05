import { Chip, Grid, Stack } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import type {
  ReportFilters,
  ReportImplementRow,
  ReportMachineRow,
  ReportNamedCount,
} from '../../../api/reports.api'
import { useReportFleet } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import LegendList, { type LegendItem } from '../components/LegendList'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  ASSET_STATUS_META,
  ASSET_STATUS_SINGULAR,
  NEUTRAL_INK,
  SERIES_COLORS,
  formatDecimal,
  formatInt,
  fuelTypeLabel,
  implementTypeLabel,
  machineTypeLabel,
} from '../reportUtils'

type FleetTabProps = {
  filters: ReportFilters
}

function AssetStatusChip({ status }: { status: string }) {
  const meta = ASSET_STATUS_META[status]
  return (
    <Chip
      size="small"
      label={ASSET_STATUS_SINGULAR[status] ?? status}
      sx={{ bgcolor: `${meta?.color ?? NEUTRAL_INK}1f`, color: '#0d1f17', fontWeight: 600 }}
    />
  )
}

function statusLegend(counts: ReportNamedCount[]): LegendItem[] {
  return counts
    .filter((item) => item.count > 0)
    .map((item) => ({
      key: item.key,
      label: ASSET_STATUS_META[item.key]?.label ?? item.key,
      value: item.count,
      color: ASSET_STATUS_META[item.key]?.color ?? NEUTRAL_INK,
    }))
}

function StatusDonut({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: LegendItem[]
}) {
  return (
    <ChartCard title={title} subtitle={subtitle} isEmpty={items.length === 0}>
      <Stack spacing={1.5}>
        <PieChart
          series={[
            {
              data: items.map((item) => ({
                id: item.key,
                value: item.value,
                label: item.label,
                color: item.color,
              })),
              innerRadius: 48,
              outerRadius: 78,
              paddingAngle: 2,
              cornerRadius: 4,
              valueFormatter: (item) => `${formatInt(item.value)} unități`,
            },
          ]}
          hideLegend
          height={176}
          margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
        />
        <LegendList items={items} />
      </Stack>
    </ChartCard>
  )
}

function CountBars({
  title,
  subtitle,
  counts,
  labelFor,
}: {
  title: string
  subtitle: string
  counts: ReportNamedCount[]
  labelFor: (key: string) => string
}) {
  return (
    <ChartCard title={title} subtitle={subtitle} isEmpty={counts.length === 0} minHeight={200}>
      <BarChart
        xAxis={[
          {
            scaleType: 'band',
            data: counts.map((item) => labelFor(item.key)),
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[{ valueFormatter: (value: number) => formatInt(value), tickMinStep: 1 }]}
        series={[
          {
            data: counts.map((item) => item.count),
            label: 'Mașini',
            color: SERIES_COLORS[0],
            valueFormatter: (value) => `${formatInt(value ?? 0)} mașini`,
          },
        ]}
        hideLegend
        borderRadius={4}
        grid={{ horizontal: true }}
        height={220}
        margin={{ left: 0, right: 8, top: 8 }}
      />
    </ChartCard>
  )
}

const machineColumns: ReportColumn<ReportMachineRow>[] = [
  { key: 'name', label: 'Mașină', render: (row) => row.name },
  { key: 'code', label: 'Cod', render: (row) => row.code },
  { key: 'type', label: 'Tip', render: (row) => machineTypeLabel(row.type) },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <AssetStatusChip status={row.status} />,
    csv: (row) => ASSET_STATUS_SINGULAR[row.status] ?? row.status,
  },
  { key: 'fuel', label: 'Combustibil', render: (row) => fuelTypeLabel(row.fuel_type) },
  { key: 'year', label: 'An', align: 'right', render: (row) => row.year ?? '-' },
  {
    key: 'hours',
    label: 'Ore funcționare',
    align: 'right',
    render: (row) => formatDecimal(row.operating_hours, 0),
    csv: (row) => row.operating_hours,
  },
  {
    key: 'ops',
    label: 'Lucrări în perioadă',
    align: 'right',
    render: (row) => formatInt(row.operations_count),
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

const implementColumns: ReportColumn<ReportImplementRow>[] = [
  { key: 'name', label: 'Echipament', render: (row) => row.name },
  { key: 'code', label: 'Cod', render: (row) => row.code },
  { key: 'type', label: 'Tip', render: (row) => implementTypeLabel(row.type) },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <AssetStatusChip status={row.status} />,
    csv: (row) => ASSET_STATUS_SINGULAR[row.status] ?? row.status,
  },
  {
    key: 'width',
    label: 'Lățime de lucru (m)',
    align: 'right',
    render: (row) => formatDecimal(row.working_width, 2),
    csv: (row) => row.working_width,
  },
  {
    key: 'ops',
    label: 'Lucrări în perioadă',
    align: 'right',
    render: (row) => formatInt(row.operations_count),
  },
]

export default function FleetTab({ filters }: FleetTabProps) {
  const { data, isPending, isError, refetch } = useReportFleet(filters)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const countOf = (counts: ReportNamedCount[], key: string) =>
    counts.find((item) => item.key === key)?.count ?? 0
  const totalMachines = data.machine_status.reduce((sum, item) => sum + item.count, 0)
  const totalImplements = data.implement_status.reduce((sum, item) => sum + item.count, 0)
  const usedMachines = data.machines.filter((machine) => machine.operations_count > 0)
  const operationsWithMachine = data.machines.reduce(
    (sum, machine) => sum + machine.operations_count,
    0
  )

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Mașini active"
            value={`${formatInt(countOf(data.machine_status, 'active'))} / ${formatInt(totalMachines)}`}
            hint={`${formatInt(countOf(data.machine_status, 'inactive'))} inactive`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Echipamente active"
            value={`${formatInt(countOf(data.implement_status, 'active'))} / ${formatInt(totalImplements)}`}
            hint={`${formatInt(countOf(data.implement_status, 'inactive'))} inactive`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Utilaje în mentenanță"
            value={formatInt(
              countOf(data.machine_status, 'maintenance') +
                countOf(data.implement_status, 'maintenance')
            )}
            hint={`${formatInt(countOf(data.machine_status, 'maintenance'))} mașini · ${formatInt(countOf(data.implement_status, 'maintenance'))} echipamente`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Mașini folosite în perioadă"
            value={`${formatInt(usedMachines.length)} / ${formatInt(totalMachines)}`}
            hint={`${formatInt(operationsWithMachine)} lucrări cu mașină alocată`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <StatusDonut
            title="Status mașini"
            subtitle="Situația curentă a parcului"
            items={statusLegend(data.machine_status)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <StatusDonut
            title="Status echipamente"
            subtitle="Situația curentă a echipamentelor"
            items={statusLegend(data.implement_status)}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CountBars
            title="Mașini pe tip"
            subtitle="Structura parcului după tipul de mașină"
            counts={data.machines_by_type}
            labelFor={machineTypeLabel}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CountBars
            title="Mașini pe combustibil"
            subtitle="Structura parcului după tipul de combustibil"
            counts={data.machines_by_fuel}
            labelFor={fuelTypeLabel}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CountBars
            title="Vârsta parcului"
            subtitle="Număr de mașini după anul de fabricație"
            counts={data.machines_by_year}
            labelFor={(key) => (key === 'unknown' ? 'Necunoscut' : key)}
          />
        </Grid>
      </Grid>

      <ReportTable
        title="Mașini"
        subtitle="Lucrările și hectarele se referă la perioada selectată; orele de funcționare sunt valoarea curentă"
        columns={machineColumns}
        rows={data.machines}
        rowKey={(row) => row.id}
        csvName="raport-masini"
      />

      <ReportTable
        title="Echipamente agricole"
        subtitle="Lucrările se referă la perioada selectată"
        columns={implementColumns}
        rows={data.implements}
        rowKey={(row) => row.id}
        csvName="raport-echipamente"
        maxHeight={360}
      />
    </Stack>
  )
}
