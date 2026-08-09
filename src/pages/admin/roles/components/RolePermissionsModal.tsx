import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { Permission } from '../../../../api/permissions.api'
import type { Role } from '../../../../api/roles.api'

type RolePermissionsModalProps = {
  open: boolean
  role: Role | null
  loading: boolean
  saving: boolean
  allPermissionsReady: boolean
  adminPermissionsRole: boolean
  availablePermissions: Permission[]
  selectedPermissions: Permission[]
  checkedPermissionIds: number[]
  onToggleChecked: (id: number) => void
  onMoveToSelected: () => void
  onMoveToAvailable: () => void
  onClose: () => void
  onSave: () => void
}

function PermissionList({
  title,
  items,
  checkedPermissionIds,
  onToggleChecked,
  disableSelection,
}: {
  title: string
  items: Permission[]
  checkedPermissionIds: number[]
  onToggleChecked: (id: number) => void
  disableSelection?: boolean
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ width: '100%', minHeight: 320, display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {items.length} permisiuni
        </Typography>
      </Box>
      <Divider />
      <List dense sx={{ overflowY: 'auto', flex: 1 }}>
        {items.map((permission) => {
          const labelId = `permission-transfer-${permission.id}`

          return (
            <ListItemButton
              key={permission.id}
              role="listitem"
              onClick={() => {
                if (disableSelection) return
                onToggleChecked(permission.id)
              }}
              disabled={disableSelection}
            >
              <Checkbox
                checked={checkedPermissionIds.includes(permission.id)}
                tabIndex={-1}
                disableRipple
                slotProps={{ input: { 'aria-labelledby': labelId } }}
                disabled={disableSelection}
              />
              <ListItemText
                id={labelId}
                primary={permission.name}
                secondary={permission.description || '—'}
              />
            </ListItemButton>
          )
        })}
        {items.length === 0 && (
          <Box sx={{ p: 2, color: 'text.secondary', fontSize: 13 }}>Nu există elemente.</Box>
        )}
      </List>
    </Paper>
  )
}

export default function RolePermissionsModal({
  open,
  role,
  loading,
  saving,
  allPermissionsReady,
  adminPermissionsRole,
  availablePermissions,
  selectedPermissions,
  checkedPermissionIds,
  onToggleChecked,
  onMoveToSelected,
  onMoveToAvailable,
  onClose,
  onSave,
}: RolePermissionsModalProps) {
  const checkedOnLeft = availablePermissions.filter((permission) =>
    checkedPermissionIds.includes(permission.id)
  )
  const checkedOnRight = selectedPermissions.filter((permission) =>
    checkedPermissionIds.includes(permission.id)
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Permisiuni rol{role ? `: ${role.name} (${role.code})` : ''}</DialogTitle>
      <DialogContent>
        {!allPermissionsReady || loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {adminPermissionsRole && (
              <Typography variant="body2" color="warning.main">
                Rolul admin poate primi permisiuni noi, dar nu i se pot elimina permisiunile deja
                asignate.
              </Typography>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: 'stretch' }}
            >
              <Box sx={{ flex: 1 }}>
                <PermissionList
                  title="Disponibile"
                  items={availablePermissions}
                  checkedPermissionIds={checkedPermissionIds}
                  onToggleChecked={onToggleChecked}
                />
              </Box>

              <Stack
                direction={{ xs: 'row', md: 'column' }}
                spacing={1}
                sx={{ justifyContent: 'center', alignItems: 'center' }}
              >
                <Button
                  variant="outlined"
                  onClick={onMoveToSelected}
                  disabled={checkedOnLeft.length === 0}
                  startIcon={<ChevronRight />}
                >
                  Adaugă
                </Button>
                <Button
                  variant="outlined"
                  onClick={onMoveToAvailable}
                  disabled={checkedOnRight.length === 0 || adminPermissionsRole}
                  startIcon={<ChevronLeft />}
                >
                  Elimină
                </Button>
              </Stack>

              <Box sx={{ flex: 1 }}>
                <PermissionList
                  title="Asignate"
                  items={selectedPermissions}
                  checkedPermissionIds={checkedPermissionIds}
                  onToggleChecked={onToggleChecked}
                  disableSelection={adminPermissionsRole}
                />
              </Box>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Anulează
        </Button>
        <Button onClick={onSave} variant="contained" disabled={saving || loading}>
          Salvează permisiuni
        </Button>
      </DialogActions>
    </Dialog>
  )
}