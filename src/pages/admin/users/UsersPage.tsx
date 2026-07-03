import { useMemo, useState } from 'react'
import {
  AddOutlined,
  DeleteOutlined,
  EmailOutlined,
  EditOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import { useHasPermission } from '../../../hooks/usePermissions'
import { useRoles } from '../../../hooks/useRoles'
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../../../hooks/useUsers'
import { authApi } from '../../../api/auth.api'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import type { User } from '../../../api/users.api'

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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Utilizatori
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrare conturi de utilizator.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Utilizator nou
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            label="Caută utilizator"
            placeholder="după email sau rol"
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
                    <Typography sx={{ fontWeight: 700 }}>Email</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Rol</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Stare email</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${user.role} (${user.role_code})`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.email_confirmed ? 'Confirmat' : 'Neconfirmat'}
                        size="small"
                        color={user.email_confirmed ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Vezi detalii">
                        <IconButton
                          size="small"
                          onClick={() => openViewDialog(user)}
                          aria-label="Vezi detalii"
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {canWrite && (
                        <Tooltip title="Trimite email resetare parolă">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSendResetEmail(user)}
                              aria-label="Trimite email resetare parolă"
                              disabled={sendingResetForUserId === user.id}
                            >
                              <EmailOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {canWrite && (
                        <Tooltip title="Editează utilizator">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(user)}
                            aria-label="Editează utilizator"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canWrite && (
                        <Tooltip title="Șterge utilizator">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(user)}
                            aria-label="Șterge utilizator"
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există utilizatori pentru filtrul curent.
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
            ? 'Creează utilizator'
            : formMode === 'edit'
              ? 'Editează utilizator'
              : 'Detalii utilizator'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              disabled={submitting || formMode === 'view'}
              fullWidth
            />

            <FormControl fullWidth disabled={submitting || formMode === 'view'}>
              <InputLabel id="role-id-label">Rol</InputLabel>
              <Select
                labelId="role-id-label"
                label="Rol"
                value={formState.roleId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, roleId: Number(event.target.value) }))
                }
              >
                {(roles ?? []).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} ({role.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formState.emailConfirmed}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, emailConfirmed: event.target.checked }))
                  }
                  disabled={submitting || formMode === 'view'}
                />
              }
              label="Email confirmat"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeFormDialog} color="inherit" disabled={submitting}>
            {formMode === 'view' ? 'Închide' : 'Anulează'}
          </Button>
          {formMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
              {formMode === 'create' ? 'Creează' : 'Salvează'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
