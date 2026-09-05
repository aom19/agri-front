import { Box, Card, Stack, Typography } from '@mui/material'
import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { NEUTRAL_INK } from '../reportUtils'

export type StatDelta = {
  percent: number | null
  periodLabel: string
  upIsGood?: boolean
}

type StatTileProps = {
  label: string
  value: string
  hint?: string
  delta?: StatDelta
  trend?: number[]
  accent?: string
}

function describeDelta(percent: number | null, upIsGood: boolean) {
  if (percent === null) return { Icon: TrendingUp, color: NEUTRAL_INK, text: 'nou' }
  if (percent === 0) return { Icon: TrendingFlat, color: NEUTRAL_INK, text: '0%' }
  const positive = percent > 0
  const good = positive === upIsGood
  return {
    Icon: positive ? TrendingUp : TrendingDown,
    color: good ? '#056849' : '#b91c1c',
    text: `${positive ? '+' : ''}${percent}%`,
  }
}

export default function StatTile({
  label,
  value,
  hint,
  delta,
  trend,
  accent = '#1a5c38',
}: StatTileProps) {
  const deltaVisual = delta ? describeDelta(delta.percent, delta.upIsGood ?? true) : null
  const DeltaIcon = deltaVisual?.Icon
  const hasTrend = !!trend && trend.length > 1 && trend.some((point) => point > 0)

  return (
    <Card component="article" aria-label={`${label}: ${value}`} sx={{ p: 2.25, height: '100%' }}>
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 0.5 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: '1.7rem', lineHeight: 1.15, color: '#0d1f17' }}
          >
            {value}
          </Typography>
          {hint && (
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
              {hint}
            </Typography>
          )}
        </Box>
        {hasTrend && (
          <Box sx={{ width: 96, height: 36, flexShrink: 0 }} aria-hidden="true">
            <SparkLineChart
              data={trend}
              height={36}
              color={accent}
              area
              curve="linear"
              showTooltip={false}
              margin={{ top: 4, bottom: 4, left: 0, right: 0 }}
            />
          </Box>
        )}
      </Stack>
      {deltaVisual && DeltaIcon && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1 }}>
          <DeltaIcon sx={{ fontSize: 14, color: deltaVisual.color }} />
          <Typography sx={{ fontSize: '0.72rem', color: deltaVisual.color, fontWeight: 600 }}>
            {deltaVisual.text}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }} noWrap>
            {delta?.periodLabel}
          </Typography>
        </Stack>
      )}
    </Card>
  )
}
