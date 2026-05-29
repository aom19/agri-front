import { Box, Chip, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import AppLogo from '../../components/AppLogo'

type AuthLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

const particles = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  top: `${10 + Math.random() * 75}%`,
  left: `${5 + Math.random() * 85}%`,
  size: 3 + Math.random() * 4,
  duration: `${3 + Math.random() * 3}s`,
  delay: `${Math.random() * 2}s`,
}))

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left hero panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(13,31,23,0.82) 0%, rgba(26,92,56,0.65) 100%)',
            zIndex: 1,
          },
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-4px)' },
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.8 },
          },
        }}
      >
        {/* Floating particles */}
        {particles.map((p) => (
          <Box
            key={p.id}
            sx={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.6)',
              zIndex: 2,
              animation: `pulse ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 3, textAlign: 'center', px: 4, maxWidth: 380 }}>
          <Box sx={{ animation: 'float 4s ease-in-out infinite', mb: 4 }}>
            <AppLogo color="white" />
          </Box>

          <Typography
            sx={{
              fontFamily: '"Instrument Serif", serif',
              fontStyle: 'italic',
              fontSize: '1.8rem',
              color: '#ffffff',
              lineHeight: 1.4,
              mb: 4,
            }}
          >
            Cultivând precizie, recoltând excelență.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['🌾 Programare inteligentă', '📊 Analiză în timp real', '🚜 Gestiunea flotei'].map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{
                  color: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.75rem',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f0f2f0',
          px: { xs: 2, sm: 4 },
          py: 4,
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(24px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 5 },
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(10,30,20,0.10)',
            animation: 'fadeInUp 0.5s ease-out',
          }}
        >
          <Chip
            label="Platformă Enterprise"
            variant="outlined"
            size="small"
            sx={{
              mb: 2,
              color: '#1a5c38',
              borderColor: '#1a5c38',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d1f17', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: '#6b7c74', fontSize: '0.875rem', mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Paper>
      </Box>
    </Box>
  )
}
