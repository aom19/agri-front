import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import type { Role } from '../../../../api/roles.api'
import { useRolePermissions } from '../../../../hooks/useRoles'

type RolePermissionsDialogProps = {
  role: Role | null
  onClose: () => void
}

export default function RolePermissionsDialog({ role, onClose }: RolePermissionsDialogProps) {
  const { data: permissions, isPending } = useRolePermissions(String(role?.id ?? ''), !!role)

  return (
    <Dialog open={!!role} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{role ? `Permisiuni: ${role.name} (${role.code})` : 'Permisiuni'}</DialogTitle>
      <DialogContent>
        {role?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {role.description}
          </Typography>
        )}
        {isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense>
            {(permissions ?? []).map((permission) => (
              <ListItem key={permission.id} disableGutters>
                <ListItemText
                  primary={permission.description || permission.name}
                  secondary={permission.name}
                  slotProps={{ secondary: { sx: { fontFamily: 'monospace' } } }}
                />
              </ListItem>
            ))}
            {permissions?.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Rolul nu are permisiuni.
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}
