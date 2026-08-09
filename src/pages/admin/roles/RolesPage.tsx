import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
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
import { RoleFormModal, RolePermissionsModal, RolesPageHeader, RolesTable } from './components'

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

  const show = useNotificationStore((state) => state.show)
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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <RolesPageHeader onCreate={openCreateDialog} canWrite={canWrite} />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută rol"
          placeholder="după cod, nume sau descriere"
          fullWidth
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
      </Box>

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <RolesTable
          roles={filteredRoles}
          isLoading={isPending}
          canWrite={canWrite}
          canDelete={canDelete}
          onView={openViewDialog}
          onManagePermissions={openPermissionsDialog}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <RoleFormModal
        open={formOpen}
        mode={formMode}
        formState={formState}
        submitting={submitting}
        onClose={closeFormDialog}
        onSubmit={handleFormSubmit}
        onChange={setFormState}
      />

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

      <RolePermissionsModal
        open={permissionsOpen}
        role={roleForPermissions}
        loading={loadingRolePermissions}
        saving={savingPermissions}
        allPermissionsReady={Boolean(allPermissions)}
        adminPermissionsRole={adminPermissionsRole}
        availablePermissions={availablePermissions}
        selectedPermissions={selectedPermissions}
        checkedPermissionIds={checkedPermissionIds}
        onToggleChecked={toggleChecked}
        onMoveToSelected={moveToSelected}
        onMoveToAvailable={moveToAvailable}
        onClose={closePermissionsDialog}
        onSave={handleSavePermissions}
      />
    </Box>
  )
}
