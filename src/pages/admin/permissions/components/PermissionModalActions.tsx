import { Box, Button, Stack } from '@mui/material'

type PermissionModalActionsProps = {
  onReset: () => void
  onClose: () => void
  onApply: () => void
  resetLabel?: string
  closeLabel?: string
  applyLabel?: string
}

export default function PermissionModalActions({
  onReset,
  onClose,
  onApply,
  resetLabel = 'Resetează',
  closeLabel = 'Anulează',
  applyLabel = 'Aplică',
}: PermissionModalActionsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
      <Button onClick={onReset} color="inherit">
        {resetLabel}
      </Button>
      <Box sx={{ flex: 1 }} />
      <Button onClick={onClose} color="inherit">
        {closeLabel}
      </Button>
      <Button onClick={onApply} variant="contained">
        {applyLabel}
      </Button>
    </Stack>
  )
}