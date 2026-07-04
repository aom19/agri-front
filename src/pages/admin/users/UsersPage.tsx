import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import ModalConfirmAction from '../../../components/ModalConfirmAction'
import { useHasPermission } from '../../../hooks/usePermissions'
import { useRoles } from '../../../hooks/useRoles'
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../../../hooks/useUsers'
import { authApi } from '../../../api/auth.api'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import type { User } from '../../../api/users.api'
import { UserFormModal, UsersPageHeader, UsersTable } from './components'

type FormMode = 'create' | 'edit' | 'view'

type UserFormState = {
  email: string
  roleId: number | ''
  emailConfirmed: boolean
}

const initialFormState: UserFormState = {
  email: '',
  roleId: '',
  emailConfirmed: true,
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formState, setFormState] = useState<UserFormState>(initialFormState)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [sendingResetForUserId, setSendingResetForUserId] = useState<number | null>(null)

  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('users:write')

  const { data: users, isPending } = useUsers()
  const { data: roles } = useRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const submitting = createUser.isPending || updateUser.isPending
  const deleting = deleteUser.isPending

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase()

    return [...(users ?? [])]
      .filter((user) => {
        if (!value) return true
        return (
          user.email.toLowerCase().includes(value) ||
          user.role.toLowerCase().includes(value) ||
          user.role_code.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.email.localeCompare(b.email, 'ro'))
  }, [users, search])

  const openCreateDialog = () => {
    setSelectedUser(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormOpen(true)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormMode('edit')
    setFormState({
      email: user.email,
      roleId: user.role_id,
      emailConfirmed: user.email_confirmed,
    })
    setFormOpen(true)
  }

  const openViewDialog = (user: User) => {
    setSelectedUser(user)
    setFormMode('view')
    setFormState({
      email: user.email,
      roleId: user.role_id,
      emailConfirmed: user.email_confirmed,
    })
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setUserToDelete(null)
  }

  const handleSubmit = async () => {
    if (!formState.email.trim()) {
      show('Emailul este obligatoriu.', 'warning')
      return
    }
    if (!formState.roleId) {
      show('Rolul este obligatoriu.', 'warning')
      return
    }

    try {
      if (formMode === 'create') {
        const createdUser = await createUser.mutateAsync({
          email: formState.email.trim(),
          role_id: Number(formState.roleId),
          email_confirmed: formState.emailConfirmed,
        })
        show('Utilizatorul a fost creat.', 'success')

        try {
          await authApi.forgotPassword({ email: createdUser.email })
          show('Emailul de setare/resetare parolă a fost trimis.', 'info')
        } catch (emailError) {
          show(
            getApiErrorMessage(
              emailError,
              'Utilizatorul a fost creat, dar nu am putut trimite emailul de resetare.'
            ),
            'warning'
          )
        }
      } else if (formMode === 'edit' && selectedUser) {
        await updateUser.mutateAsync({
          id: String(selectedUser.id),
          payload: {
            email: formState.email.trim(),
            role_id: Number(formState.roleId),
            email_confirmed: formState.emailConfirmed,
          },
        })
        show('Utilizatorul a fost actualizat.', 'success')
      }

      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva utilizatorul.'), 'error')
    }
  }

  const handleSendResetEmail = async (user: User) => {
    setSendingResetForUserId(user.id)
    try {
      await authApi.forgotPassword({ email: user.email })
      show('Emailul de resetare parolă a fost trimis.', 'success')
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut trimite emailul de resetare.'), 'error')
    } finally {
      setSendingResetForUserId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await deleteUser.mutateAsync(String(userToDelete.id))
      show('Utilizatorul a fost șters.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge utilizatorul.'), 'error')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <UsersPageHeader onCreate={openCreateDialog} canWrite={canWrite} />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută utilizator"
          placeholder="după email sau rol"
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
        <UsersTable
          users={filteredUsers}
          isLoading={isPending}
          canWrite={canWrite}
          sendingResetForUserId={sendingResetForUserId}
          onView={openViewDialog}
          onResetEmail={handleSendResetEmail}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <UserFormModal
        open={formOpen}
        mode={formMode}
        formState={formState}
        roles={roles}
        submitting={submitting}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
        onChange={setFormState}
      />

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge utilizator"
        description={
          userToDelete ? `Confirmi ștergerea utilizatorului „${userToDelete.email}”?` : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}
