import {
  Button,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import { DoneAllOutlined, NotificationsOutlined } from '@mui/icons-material'
import { useState } from 'react'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useNotifications'
import type { UserNotification } from '../../api/notifications.api'
import NotificationListItem from '../../components/NotificationListItem'

export default function NotificationsPage() {
  const [tab, setTab] = useState(0)
  const onlyUnread = tab === 1
  const { data: notifications, isPending } = useNotifications({
    unread: onlyUnread || undefined,
    limit: 100,
  })
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const handleMarkRead = (n: UserNotification) => {
    if (!n.read_at) markRead.mutate(n.id)
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        m: { xs: -2, sm: -3 },
        p: { xs: 2, md: 4 },
        borderRadius: 0,
        background:
          'radial-gradient(circle at 12% 0%, rgba(16,185,129,0.16), transparent 30%), linear-gradient(135deg, #f6faf7 0%, #eef4f0 48%, #f7f4ec 100%)',
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            mb: 3,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: '28px',
            border: '1px solid rgba(195, 210, 201, 0.84)',
            bgcolor: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 28px 70px rgba(15,45,29,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '15px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#ecfdf5',
                color: 'primary.main',
                border: '1px solid rgba(16,185,129,0.2)',
                boxShadow: '0 12px 26px rgba(16,185,129,0.16)',
              }}
            >
              <NotificationsOutlined />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, md: 26 }, lineHeight: 1.15 }}>
                Notificări
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.94rem', maxWidth: 520 }}>
                Activitate recentă, alerte operaționale și schimbări importante într-un flux clar.
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Marchează toate notificările ca citite" arrow>
            <span>
              <Button
                variant="outlined"
                startIcon={<DoneAllOutlined fontSize="small" />}
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                aria-label="Marchează toate ca citite"
                sx={{
                  borderRadius: '999px',
                  px: 2.25,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 800,
                  color: '#42544a',
                  borderColor: 'rgba(145, 158, 151, 0.38)',
                  bgcolor: 'rgba(255,255,255,0.74)',
                  boxShadow: '0 12px 28px rgba(15,45,29,0.1)',
                  '&:hover': {
                    borderColor: 'rgba(100, 112, 103, 0.58)',
                    bgcolor: '#f3f6f4',
                    boxShadow: '0 16px 34px rgba(15,45,29,0.12)',
                  },
                }}
              >
                Marchează toate
              </Button>
            </span>
          </Tooltip>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2.5,
            minHeight: 46,
            px: 0.75,
            py: 0.75,
            width: 'fit-content',
            borderRadius: '999px',
            border: '1px solid rgba(195, 210, 201, 0.78)',
            bgcolor: 'rgba(255,255,255,0.72)',
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 34,
              px: 2.25,
              borderRadius: '999px',
              fontWeight: 800,
              textTransform: 'none',
              color: 'text.secondary',
            },
            '& .Mui-selected': {
              color: '#ffffff !important',
              bgcolor: '#0f8f5f',
              boxShadow: '0 8px 20px rgba(15,143,95,0.22)',
            },
          }}
        >
          <Tab label="Toate" />
          <Tab label="Necitite" />
        </Tabs>

        {isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (notifications ?? []).length === 0 ? (
          <Card
            sx={{
              borderRadius: '24px',
              border: '1px solid rgba(195, 210, 201, 0.84)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
              Nu ai notificări{onlyUnread ? ' necitite' : ''}.
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {(notifications ?? []).map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                markReadDisabled={markRead.isPending}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
