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
    <Card sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
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
