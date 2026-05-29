import { Alert, Box, IconButton, Snackbar } from '@mui/material'
import { CloseOutlined } from '@mui/icons-material'
import { useNotificationStore } from '../store/notification.store'

const DURATION = 4000

export default function NotificationBar() {
  const { open, message, severity, close } = useNotificationStore()

  return (
    <Snackbar
      open={open}
      autoHideDuration={DURATION}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') close()
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Box sx={{ width: 360, maxWidth: '100vw' }}>
        <Alert
          severity={severity}
          variant="filled"
          sx={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          action={
            <IconButton size="small" color="inherit" onClick={close}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          }
        >
          {message}
        </Alert>

        {/* CSS-driven timer bar — no JS state needed */}
        <Box
          sx={{
            height: 3,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            bgcolor: 'rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <Box
            key={open ? 'running' : 'idle'}
            sx={{
              height: '100%',
              width: '100%',
              bgcolor: 'rgba(255,255,255,0.7)',
              transformOrigin: 'left',
              animation: open ? `timerShrink ${DURATION}ms linear forwards` : 'none',
              '@keyframes timerShrink': {
                from: { transform: 'scaleX(1)' },
                to: { transform: 'scaleX(0)' },
              },
            }}
          />
        </Box>
      </Box>
    </Snackbar>
  )
}
