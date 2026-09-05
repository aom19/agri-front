import { Grid, LinearProgress, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import type {
  ReportFilters,
  ReportResourceConsumption,
  ReportStockRow,
} from '../../../api/reports.api'
import { useReportStocks } from '../../../hooks/useReports'
import ChartCard from '../components/ChartCard'
import LegendList from '../components/LegendList'
import { ReportError, ReportLoading } from '../components/ReportStates'
import ReportTable, { type ReportColumn } from '../components/ReportTable'
import StatTile from '../components/StatTile'
import {
  SERIES_COLORS,
  TRACK_COLOR,
  foldSeries,
  formatCompact,
  formatDecimal,
  formatInt,
  formatPercent,
  resourceCategoryColor,
  resourceCategoryLabel,
} from '../reportUtils'

type StocksTabProps = {
  filters: ReportFilters
}

function CoverageMeter({ row }: { row: ReportStockRow }) {
  if (row.minimum_quantity <= 0) {
    return (
      <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
        fără prag minim
      </Typography>
    )
  }
  const ratio = row.quantity / row.minimum_quantity
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 170 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, ratio * 50)}
        aria-label={`Acoperire prag minim: ${Math.round(ratio * 100)}%`}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: TRACK_COLOR,
          '& .MuiLinearProgress-bar': {
            bgcolor: row.below_minimum ? '#e34948' : '#008300',
            borderRadius: 3,
          },
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: '0.78rem',
          fontWeight: 600,
          minWidth: 44,
          textAlign: 'right',
          color: row.below_minimum ? '#b91c1c' : '#0d1f17',
        }}
      >
        {Math.round(ratio * 100)}%
      </Typography>
    </Stack>
  )
}

const stockColumns: ReportColumn<ReportStockRow>[] = [
  { key: 'resource', label: 'Resursă', render: (row) => row.resource_name },
  { key: 'category', label: 'Categorie', render: (row) => resourceCategoryLabel(row.category) },
  {
    key: 'quantity',
    label: 'Cantitate',
    align: 'right',
    render: (row) => `${formatDecimal(row.quantity, 2)} ${row.unit}`,
    csv: (row) => row.quantity,
  },
  {
    key: 'minimum',
    label: 'Prag minim',
    align: 'right',
    render: (row) => `${formatDecimal(row.minimum_quantity, 2)} ${row.unit}`,
    csv: (row) => row.minimum_quantity,
  },
  {
    key: 'coverage',
    label: 'Acoperire prag',
    render: (row) => <CoverageMeter row={row} />,
    csv: (row) =>
      row.minimum_quantity > 0 ? Math.round((row.quantity / row.minimum_quantity) * 100) : '',
  },
  {
    key: 'price',
    label: 'Preț unitar',
    align: 'right',
    render: (row) => formatDecimal(row.price_per_unit, 2),
    csv: (row) => row.price_per_unit,
  },
  {
    key: 'value',
    label: 'Valoare stoc',
    align: 'right',
    render: (row) => formatDecimal(row.value, 2),
    csv: (row) => row.value,
  },
]

const realConsumptionColumns: ReportColumn<ReportResourceConsumption>[] = [
  { key: 'resource', label: 'Resursă', render: (row) => row.resource_name },
  { key: 'category', label: 'Categorie', render: (row) => resourceCategoryLabel(row.category) },
  {
    key: 'quantity',
    label: 'Consum real',
    align: 'right',
    render: (row) => `${formatDecimal(row.quantity, 3)} ${row.unit}`,
    csv: (row) => row.quantity,
  },
  {
    key: 'cost',
    label: 'Cost real',
    align: 'right',
    render: (row) => formatDecimal(row.cost, 2),
    csv: (row) => row.cost,
  },
  {
    key: 'stock',
    label: 'Stoc curent',
    align: 'right',
    render: (row) =>
      row.stock_quantity == null ? '-' : `${formatDecimal(row.stock_quantity, 2)} ${row.unit}`,
    csv: (row) => row.stock_quantity,
  },
]

const consumptionColumns: ReportColumn<ReportResourceConsumption>[] = [
  { key: 'resource', label: 'Resursă', render: (row) => row.resource_name },
  { key: 'category', label: 'Categorie', render: (row) => resourceCategoryLabel(row.category) },
  {
    key: 'quantity',
    label: 'Consum estimat',
    align: 'right',
    render: (row) => `${formatDecimal(row.quantity, 2)} ${row.unit}`,
    csv: (row) => row.quantity,
  },
  {
    key: 'cost',
    label: 'Cost estimat',
    align: 'right',
    render: (row) => formatDecimal(row.cost, 2),
    csv: (row) => row.cost,
  },
  {
    key: 'stock',
    label: 'Stoc curent',
    align: 'right',
    render: (row) =>
      row.stock_quantity == null ? '-' : `${formatDecimal(row.stock_quantity, 2)} ${row.unit}`,
    csv: (row) => row.stock_quantity,
  },
  {
    key: 'coverage',
    label: 'Stoc / consum',
    align: 'right',
    render: (row) => (
      <Typography
        component="span"
        sx={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color:
            row.stock_quantity != null && row.stock_quantity < row.quantity ? '#b91c1c' : '#0d1f17',
        }}
      >
        {row.stock_quantity == null ? '-' : formatPercent(row.stock_quantity, row.quantity)}
      </Typography>
    ),
    csv: (row) =>
      row.stock_quantity == null || row.quantity <= 0
        ? ''
        : Math.round((row.stock_quantity / row.quantity) * 100),
  },
]

export default function StocksTab({ filters }: StocksTabProps) {
  const { data, isPending, isError, refetch } = useReportStocks(filters)

  if (isPending) return <ReportLoading />
  if (isError || !data) return <ReportError onRetry={() => refetch()} />

  const categoryItems = data.value_by_category
    .filter((item) => item.value > 0)
    .map((item) => ({
      key: item.key,
      label: resourceCategoryLabel(item.key),
      value: item.value,
      color: resourceCategoryColor(item.key),
      formatted: formatCompact(item.value),
    }))
  const consumptionCost = data.estimated_consumption.reduce((sum, item) => sum + item.cost, 0)
  const costByResource = foldSeries(
    data.estimated_consumption
      .filter((item) => item.cost > 0)
      .map((item) => ({ label: item.resource_name, value: item.cost }))
  )
  const insufficient = data.estimated_consumption.filter(
    (item) => item.stock_quantity != null && item.stock_quantity < item.quantity
  )

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Valoarea stocului"
            value={formatCompact(data.total_value)}
            hint="cantitate × preț unitar, pentru toate resursele"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Stocuri sub prag minim"
            value={`${formatInt(data.low_stocks)} / ${formatInt(data.total_stocks)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Cost estimat consum"
            value={formatCompact(consumptionCost)}
            hint="pentru operațiunile din perioada selectată"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Cost real consum"
            value={formatCompact(data.real_consumption_cost)}
            hint={
              consumptionCost > 0
                ? `${formatPercent(data.real_consumption_cost, consumptionCost)} din estimat · ${formatInt(data.movement_totals.out_count)} ieșiri`
                : `${formatInt(data.movement_totals.out_count)} ieșiri din stoc în perioadă`
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Intrări în stoc"
            value={formatCompact(data.movement_totals.in_value)}
            hint={`${formatInt(data.movement_totals.in_count)} recepții în perioadă`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            label="Resurse cu stoc insuficient"
            value={formatInt(insufficient.length)}
            hint="stocul curent nu acoperă consumul estimat"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard
            title="Valoarea stocului pe categorii"
            subtitle="Structura valorii curente a stocurilor"
            isEmpty={categoryItems.length === 0}
          >
            <Stack spacing={1.5}>
              <PieChart
                series={[
                  {
                    data: categoryItems.map((item) => ({
                      id: item.key,
                      value: item.value,
                      label: item.label,
                      color: item.color,
                    })),
                    innerRadius: 52,
                    outerRadius: 84,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    valueFormatter: (item) => formatDecimal(item.value, 2),
                  },
                ]}
                hideLegend
                height={190}
                margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
              />
              <LegendList items={categoryItems} />
            </Stack>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard
            title="Cost estimat pe resursă"
            subtitle="Calculat din șabloanele operațiunilor din perioada selectată"
            isEmpty={costByResource.length === 0}
          >
            <BarChart
              layout="horizontal"
              yAxis={[
                { scaleType: 'band', data: costByResource.map((item) => item.label), width: 170 },
              ]}
              xAxis={[{ valueFormatter: (value: number) => formatCompact(value) }]}
              series={[
                {
                  data: costByResource.map((item) => item.value),
                  label: 'Cost estimat',
                  color: SERIES_COLORS[1],
                  valueFormatter: (value) => formatDecimal(value, 2),
                },
              ]}
              hideLegend
              borderRadius={4}
              grid={{ vertical: true }}
              height={Math.max(220, costByResource.length * 40 + 48)}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <ReportTable
        title="Stocuri"
        subtitle="Bara de acoperire este plină la dublul pragului minim; roșu înseamnă stoc sub prag"
        columns={stockColumns}
        rows={data.items}
        rowKey={(row) => row.id}
        csvName="raport-stocuri"
      />

      <ReportTable
        title="Consum real de resurse"
        subtitle="Ieșiri din stoc înregistrate în perioada selectată (la finalizarea lucrărilor sau manual)"
        columns={realConsumptionColumns}
        rows={data.real_consumption}
        rowKey={(row) => row.resource_id}
        csvName="raport-consum-real"
        maxHeight={360}
      />

      <ReportTable
        title="Consum estimat de resurse"
        subtitle="Cantitate pe unitate din șablon × suprafața planificată, pentru operațiunile neanulate din perioadă"
        columns={consumptionColumns}
        rows={data.estimated_consumption}
        rowKey={(row) => row.resource_id}
        csvName="raport-consum-estimat"
        maxHeight={360}
      />
    </Stack>
  )
}
