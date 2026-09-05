import { Box, Stack, Typography } from '@mui/material'
import { formatPercent } from '../reportUtils'

export type LegendItem = {
  key: string
  label: string
  value: number
  color: string
  formatted?: string
}

type LegendListProps = {
  items: LegendItem[]
  total?: number
}

export default function LegendList({ items, total }: LegendListProps) {
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0)

  return (
    <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', m: 0, p: 0, minWidth: 0 }}>
      {items.map((item) => (
        <Stack
          key={item.key}
          component="li"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 10,
                height: 10,
                borderRadius: '3px',
                bgcolor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
              {item.label}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#0d1f17',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.formatted ?? item.value}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: 'text.secondary',
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {formatPercent(item.value, sum)}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
