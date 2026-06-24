import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { WarningAmberOutlined } from '@mui/icons-material'

type ModalConfirmActionProps = {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ModalConfirmAction({
  open,
  title,
  description,
  confirmText = 'Confirmă',
  cancelText = 'Anulează',
  loading = false,
  onClose,
  onConfirm,
}: ModalConfirmActionProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Stack
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(211,47,47,0.12)',
              color: 'error.main',
              flexShrink: 0,
            }}
          >
            <WarningAmberOutlined sx={{ fontSize: 22 }} />
          </Stack>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
