import { Box, Stack, Typography } from '@mui/material'
import logoUrl from '../assets/Logo.svg'

type AppLogoProps = {
  color?: 'default' | 'white'
  compact?: boolean
}

export default function AppLogo({ color = 'default', compact = false }: AppLogoProps) {
  const textColor = color === 'white' ? '#ffffff' : '#0d1f17'
  const mutedColor = color === 'white' ? 'rgba(255,255,255,0.7)' : '#6b7c74'

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
      <Box component="img" src={logoUrl} alt="AgriERP" sx={{ width: 36, height: 36 }} />
      {!compact && (
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: textColor,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            AgriERP
          </Typography>
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: mutedColor,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Field Operations
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
