import type { ReactNode } from 'react'
import { Box, Card, Stack, Typography } from '@mui/material'

type SectionProps = {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}

export default function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
      {/* pe telefon, acțiunile (filtre, butoane) trec sub titlu, pe toată lățimea */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
      {children}
    </Card>
  )
}
