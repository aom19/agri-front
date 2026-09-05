import type { ReactNode } from 'react'
import { Box, Card, Stack, Typography } from '@mui/material'

type ChartCardProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  isEmpty?: boolean
  emptyText?: string
  minHeight?: number
  children: ReactNode
}

export default function ChartCard({
  title,
  subtitle,
  action,
  isEmpty = false,
  emptyText = 'Nu există date pentru filtrele selectate.',
  minHeight = 240,
  children,
}: ChartCardProps) {
  return (
    <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      <Box sx={{ flex: 1, minHeight, display: 'flex', flexDirection: 'column' }}>
        {isEmpty ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontSize: '0.85rem',
              textAlign: 'center',
              px: 2,
            }}
          >
            {emptyText}
          </Box>
        ) : (
          children
        )}
      </Box>
    </Card>
  )
}
