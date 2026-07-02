import { useMemo, useState } from 'react'
import {
  AddOutlined,
  ChevronLeft,
  ChevronRight,
  DeleteOutlined,
  EditOutlined,
  SecurityOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ModalConfirmAction from '../../../components/ModalConfirmAction'
import { useAllPermissions, useHasPermission } from '../../../hooks/usePermissions'
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useSetRolePermissions,
  useUpdateRole,
} from '../../../hooks/useRoles'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { rolesApi, type Role } from '../../../api/roles.api'
import type { Permission } from '../../../api/permissions.api'

type FormMode = 'create' | 'edit' | 'view'

type RoleFormState = {
  code: string
  name: string
  description: string
}

const initialFormState: RoleFormState = {
  code: '',
  name: '',
  description: '',
}

export default function RolesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formState, setFormState] = useState<RoleFormState>(initialFormState)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [roleForPermissions, setRoleForPermissions] = useState<Role | null>(null)
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<number[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [initialRolePermissionIds, setInitialRolePermissionIds] = useState<number[]>([])
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false)

  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('roles:write')
  const canDelete = useHasPermission('roles:delete')

  const { data: roles, isPending } = useRoles()
  const { data: allPermissions } = useAllPermissions()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const setRolePermissions = useSetRolePermissions()

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(roles ?? [])]
      .filter((role) => {
        if (!value) return true
        return (
          role.code.toLowerCase().includes(value) ||
          role.name.toLowerCase().includes(value) ||
          role.description?.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [roles, search])

  const submitting = createRole.isPending || updateRole.isPending
  const deleting = deleteRole.isPending
  const savingPermissions = setRolePermissions.isPending
  const loadingRolePermissions = rolePermissionsLoading
  const adminPermissionsRole = roleForPermissions?.code.toLowerCase() === 'admin'

  const availablePermissions = useMemo(() => {
    if (!allPermissions) return []

    const selected = new Set(selectedPermissionIds)
    return allPermissions
      .filter((permission) => !selected.has(permission.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [allPermissions, selectedPermissionIds])

  const selectedPermissions = useMemo(() => {
    if (!allPermissions) return []

    const selected = new Set(selectedPermissionIds)
    return allPermissions
      .filter((permission) => selected.has(permission.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [allPermissions, selectedPermissionIds])

  const checkedOnLeft = useMemo(
    () => availablePermissions.filter((permission) => checkedPermissionIds.includes(permission.id)),
    [availablePermissions, checkedPermissionIds]
  )

  const checkedOnRight = useMemo(
    () => selectedPermissions.filter((permission) => checkedPermissionIds.includes(permission.id)),
    [selectedPermissions, checkedPermissionIds]
  )

  const isChecked = (id: number) => checkedPermissionIds.includes(id)

  const toggleChecked = (id: number) => {
    setCheckedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const openCreateDialog = () => {
    setSelectedRole(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormOpen(true)
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormMode('edit')
    setFormState({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
    })
    setFormOpen(true)
  }

  const openViewDialog = (role: Role) => {
    setSelectedRole(role)
    setFormMode('view')
    setFormState({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
    })
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
  }

  const openDeleteDialog = (role: Role) => {
    if (role.code.toLowerCase() === 'admin') {
      show('Rolul admin nu poate fi șters.', 'warning')
      return
    }
    setRoleToDelete(role)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setRoleToDelete(null)
  }

  const openPermissionsDialog = async (role: Role) => {
    setRoleForPermissions(role)
    setPermissionsOpen(true)
    setCheckedPermissionIds([])
    setSelectedPermissionIds([])
    setInitialRolePermissionIds([])
    setRolePermissionsLoading(true)

    try {
      const rolePermissions = await rolesApi.getRolePermissions(String(role.id))
      const permissionIds = rolePermissions.map((permission) => permission.id)
      setSelectedPermissionIds(permissionIds)
      setInitialRolePermissionIds(permissionIds)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut încărca permisiunile rolului.'), 'error')
    } finally {
      setRolePermissionsLoading(false)
    }
  }

  const closePermissionsDialog = () => {
    if (savingPermissions) return
    setPermissionsOpen(false)
    setRoleForPermissions(null)
    setCheckedPermissionIds([])
    setSelectedPermissionIds([])
    setInitialRolePermissionIds([])
    setRolePermissionsLoading(false)
  }

  const handleFormSubmit = async () => {
    const payload = {
      code: formState.code.trim(),
      name: formState.name.trim(),
      description: formState.description.trim(),
    }

    if (!payload.code || !payload.name) {
      show('Codul și numele rolului sunt obligatorii.', 'warning')
      return
    }

    try {
      if (formMode === 'create') {
        await createRole.mutateAsync(payload)
        show('Rolul a fost creat cu succes.', 'success')
      } else if (selectedRole) {
        await updateRole.mutateAsync({ id: String(selectedRole.id), payload })
        show('Rolul a fost actualizat cu succes.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva rolul. Încearcă din nou.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return

    try {
      await deleteRole.mutateAsync(String(roleToDelete.id))
      show('Rolul a fost șters.', 'success')
      setDeleteOpen(false)
      setRoleToDelete(null)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge rolul.'), 'error')
    }
  }

  const moveToSelected = () => {
    if (checkedOnLeft.length === 0) return

    const toAdd = checkedOnLeft.map((permission) => permission.id)
    setSelectedPermissionIds((prev) => [...prev, ...toAdd])
    setCheckedPermissionIds((prev) => prev.filter((id) => !toAdd.includes(id)))
  }

  const moveToAvailable = () => {
    if (adminPermissionsRole) {
      show('Pentru rolul admin nu este permisă eliminarea de permisiuni.', 'warning')
      return
    }
    if (checkedOnRight.length === 0) return

    const toRemove = checkedOnRight.map((permission) => permission.id)
    setSelectedPermissionIds((prev) => prev.filter((id) => !toRemove.includes(id)))
    setCheckedPermissionIds((prev) => prev.filter((id) => !toRemove.includes(id)))
  }

  const handleSavePermissions = async () => {
    if (!roleForPermissions) return

    if (adminPermissionsRole) {
      const removedAdminPermissions = initialRolePermissionIds.some(
        (id) => !selectedPermissionIds.includes(id)
      )
      if (removedAdminPermissions) {
        show('Pentru rolul admin nu este permisă eliminarea de permisiuni.', 'warning')
        return
      }
    }

    try {
      await setRolePermissions.mutateAsync({
        id: String(roleForPermissions.id),
        payload: { permission_ids: selectedPermissionIds },
      })
      show('Permisiunile rolului au fost actualizate.', 'success')
      closePermissionsDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut actualiza permisiunile rolului.'), 'error')
    }
  }

  const renderPermissionList = (
    title: string,
    items: Permission[],
    options?: { disableSelection?: boolean }
  ) => (
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
                if (options?.disableSelection) return
                toggleChecked(permission.id)
              }}
              disabled={options?.disableSelection}
            >
              <Checkbox
                checked={isChecked(permission.id)}
                tabIndex={-1}
                disableRipple
                slotProps={{ input: { 'aria-labelledby': labelId } }}
                disabled={options?.disableSelection}
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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Roluri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrare roluri și acces pentru utilizatori.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Rol nou
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            label="Caută rol"
            placeholder="după cod, nume sau descriere"
            fullWidth
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Cod</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Nume</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Descriere</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoles.map((role) => {
                  const adminRole = role.code.toLowerCase() === 'admin'

                  return (
                    <TableRow key={role.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {role.code}
                      </TableCell>
                      <TableCell>{role.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {role.description || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Vezi detalii rol">
                          <IconButton
                            size="small"
                            onClick={() => openViewDialog(role)}
                            aria-label="Vezi detalii rol"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {canWrite && (
                          <Tooltip title="Gestionează permisiuni rol">
                            <IconButton
                              size="small"
                              onClick={() => openPermissionsDialog(role)}
                              aria-label="Gestionează permisiuni rol"
                            >
                              <SecurityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canWrite && (
                          <Tooltip title="Editează rol">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(role)}
                              aria-label="Editează rol"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canDelete && (
                          <Tooltip
                            title={adminRole ? 'Rolul admin nu poate fi șters.' : 'Șterge rol'}
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(role)}
                                aria-label="Șterge rol"
                                disabled={adminRole}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există roluri pentru filtrul curent.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={closeFormDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {formMode === 'create'
            ? 'Creează rol'
            : formMode === 'edit'
              ? 'Editează rol'
              : 'Detalii rol'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Cod"
              value={formState.code}
              onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="ex: manager"
              disabled={submitting || formMode === 'view'}
              fullWidth
            />
            <TextField
              label="Nume"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="ex: Manager"
              disabled={submitting || formMode === 'view'}
              fullWidth
            />
            <TextField
              label="Descriere"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Descriere opțională"
              disabled={submitting || formMode === 'view'}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeFormDialog} color="inherit" disabled={submitting}>
            {formMode === 'view' ? 'Închide' : 'Anulează'}
          </Button>
          {formMode !== 'view' && (
            <Button onClick={handleFormSubmit} variant="contained" disabled={submitting}>
              {formMode === 'create' ? 'Creează' : 'Salvează'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge rol"
        description={
          roleToDelete
            ? `Confirmi ștergerea rolului „${roleToDelete.name}” (${roleToDelete.code})?`
            : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      <Dialog open={permissionsOpen} onClose={closePermissionsDialog} fullWidth maxWidth="lg">
        <DialogTitle>
          Permisiuni rol
          {roleForPermissions ? `: ${roleForPermissions.name} (${roleForPermissions.code})` : ''}
        </DialogTitle>
        <DialogContent>
          {!allPermissions || loadingRolePermissions ? (
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
                  {renderPermissionList('Disponibile', availablePermissions)}
                </Box>

                <Stack
                  direction={{ xs: 'row', md: 'column' }}
                  spacing={1}
                  sx={{ justifyContent: 'center', alignItems: 'center' }}
                >
                  <Button
                    variant="outlined"
                    onClick={moveToSelected}
                    disabled={checkedOnLeft.length === 0}
                    startIcon={<ChevronRight />}
                  >
                    Adaugă
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={moveToAvailable}
                    disabled={checkedOnRight.length === 0 || adminPermissionsRole}
                    startIcon={<ChevronLeft />}
                  >
                    Elimină
                  </Button>
                </Stack>

                <Box sx={{ flex: 1 }}>
                  {renderPermissionList('Asignate', selectedPermissions, {
                    disableSelection: adminPermissionsRole,
                  })}
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closePermissionsDialog} color="inherit" disabled={savingPermissions}>
            Anulează
          </Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            disabled={savingPermissions || loadingRolePermissions}
          >
            Salvează permisiuni
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
