import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import {
  CheckOutlined,
  Inventory2Outlined,
  NotificationsActiveOutlined,
  PlayCircleOutlined,
  ReportProblemOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material'
import type { UserNotification } from '../api/notifications.api'

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function notificationMeta(notification: UserNotification) {
  const type = notification.notification.type
  const title = notification.notification.title.toLocaleLowerCase('ro-RO')
  const message = (notification.notification.message ?? '').toLocaleLowerCase('ro-RO')
  const text = `${title} ${message}`

  if (text.includes('echipament') && text.includes('activat') && !text.includes('dezactivat')) {
    return {
      label: 'Activare echipament',
      Icon: NotificationsActiveOutlined,
      accent: '#0f8f5f',
      tint: '#ecfdf5',
      ring: 'rgba(15, 143, 95, 0.18)',
    }
  }
  if (
    text.includes('echipament') &&
    (text.includes('dezactivat') || text.includes('indisponibil'))
  ) {
    return {
      label: 'Status echipament',
      Icon: ReportProblemOutlined,
      accent: '#b45309',
      tint: '#fff7ed',
      ring: 'rgba(180, 83, 9, 0.18)',
    }
  }
  if (text.includes('utilizator')) {
    return {
      label: 'Cont utilizator',
      Icon: NotificationsActiveOutlined,
      accent: '#2563eb',
      tint: '#eff6ff',
      ring: 'rgba(37, 99, 235, 0.16)',
    }
  }
  if (text.includes('stoc') || type === 'stock_low') {
    return {
      label: 'Actualizare stoc',
      Icon: Inventory2Outlined,
      accent: '#d97706',
      tint: '#fff7ed',
      ring: 'rgba(217, 119, 6, 0.18)',
    }
  }
  if (text.includes('resurs')) {
    return {
      label: 'Resursă operațională',
      Icon: WarningAmberOutlined,
      accent: '#0f766e',
      tint: '#f0fdfa',
      ring: 'rgba(15, 118, 110, 0.16)',
    }
  }
  if (type === 'operation_started') {
    return {
      label: 'Lucrare pornită',
      Icon: PlayCircleOutlined,
      accent: '#0f8f5f',
      tint: '#ecfdf5',
      ring: 'rgba(15, 143, 95, 0.18)',
    }
  }
  return {
    label: 'Notificare sistem',
    Icon: NotificationsActiveOutlined,
    accent: '#475569',
    tint: '#f8fafc',
    ring: 'rgba(71, 85, 105, 0.16)',
  }
}

type NotificationListItemProps = {
  notification: UserNotification
  compact?: boolean
  onMarkRead?: (notification: UserNotification) => void
  markReadDisabled?: boolean
}

export default function NotificationListItem({
  notification,
  compact = false,
  onMarkRead,
  markReadDisabled = false,
}: NotificationListItemProps) {
  const isUnread = !notification.read_at
  const createdAt = formatTime(notification.notification.created_at)
  const meta = notificationMeta(notification)
  const Icon = meta.Icon

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 1.5 : 2,
        p: compact ? 1.5 : 2.25,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: compact ? '16px' : '22px',
        border: '1px solid',
        borderColor: isUnread ? meta.ring : 'rgba(207, 216, 211, 0.84)',
        bgcolor: isUnread ? '#ffffff' : 'rgba(255,255,255,0.68)',
        boxShadow: compact
          ? '0 8px 24px rgba(10,30,20,0.08)'
          : '0 18px 44px rgba(15, 45, 29, 0.1), 0 2px 8px rgba(15, 45, 29, 0.05)',
        opacity: isUnread ? 1 : 0.76,
        transition:
          'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, opacity 0.18s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isUnread
            ? `linear-gradient(90deg, ${meta.tint} 0%, rgba(255,255,255,0) 38%)`
            : 'linear-gradient(90deg, rgba(240,242,240,0.82) 0%, rgba(255,255,255,0) 34%)',
          opacity: compact ? 0.9 : 1,
          pointerEvents: 'none',
        },
        '&:hover': {
          borderColor: isUnread ? meta.accent : '#b8c6bd',
          boxShadow: compact
            ? '0 12px 30px rgba(10,30,20,0.12)'
            : '0 24px 54px rgba(15, 45, 29, 0.14), 0 4px 12px rgba(15, 45, 29, 0.07)',
          transform: compact ? 'none' : 'translateY(-2px)',
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: compact ? 34 : 46,
          height: compact ? 34 : 46,
          borderRadius: compact ? '12px' : '16px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: meta.accent,
          bgcolor: meta.tint,
          border: `1px solid ${meta.ring}`,
          boxShadow: `0 10px 22px ${meta.ring}`,
        }}
      >
        <Icon sx={{ fontSize: compact ? 18 : 24 }} />
        {isUnread && (
          <Box
            sx={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#10b981',
              border: '2px solid #ffffff',
            }}
          />
        )}
      </Box>

      <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
            rowGap: 0.65,
            mb: compact ? 0.65 : 1,
          }}
        >
          <Chip
            label={meta.label}
            size="small"
            sx={{
              height: compact ? 21 : 24,
              borderRadius: '999px',
              fontWeight: 800,
              color: meta.accent,
              bgcolor: meta.tint,
              border: `1px solid ${meta.ring}`,
              letterSpacing: 0,
              '& .MuiChip-label': {
                px: compact ? 0.9 : 1.15,
                fontSize: compact ? '0.68rem' : '0.72rem',
              },
            }}
          />
          {createdAt && (
            <Typography
              sx={{
                fontSize: compact ? '0.72rem' : '0.8rem',
                color: 'text.secondary',
                fontWeight: 600,
              }}
            >
              {createdAt}
            </Typography>
          )}
        </Stack>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: compact ? '0.94rem' : '1.06rem',
            color: '#0d1f17',
            lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}
        >
          {notification.notification.title}
        </Typography>
        {notification.notification.message && (
          <Typography
            sx={{
              mt: 0.4,
              fontSize: compact ? '0.82rem' : '0.94rem',
              color: 'text.secondary',
              lineHeight: 1.45,
              overflowWrap: 'anywhere',
            }}
          >
            {notification.notification.message}
          </Typography>
        )}
      </Box>

      {isUnread && onMarkRead && (
        <Tooltip title="Marchează ca citită" arrow>
          <span>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation()
                onMarkRead(notification)
              }}
              disabled={markReadDisabled}
              aria-label="Marchează ca citită"
              sx={{
                position: 'relative',
                mt: compact ? 0 : 0.25,
                color: '#647067',
                bgcolor: 'rgba(255,255,255,0.86)',
                border: '1px solid rgba(145, 158, 151, 0.32)',
                '&:hover': { bgcolor: '#f3f6f4', borderColor: 'rgba(100, 112, 103, 0.46)' },
              }}
            >
              <CheckOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  )
}
