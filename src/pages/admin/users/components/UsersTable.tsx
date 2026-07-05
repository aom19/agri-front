import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EditOutlined,
  EmailOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { User } from '../../../../api/users.api'

type UsersTableProps = {
  users: User[]
  isLoading: boolean
  canWrite: boolean
  canDisable: boolean
  canEnable: boolean
  sendingResetForUserId: number | null
  onView: (user: User) => void
  onResetEmail: (user: User) => void
  onEdit: (user: User) => void
  onDisable: (user: User) => void
  onEnable: (user: User) => void
}

export default function UsersTable({
  users,
  isLoading,
  canWrite,
  canDisable,
  canEnable,
  sendingResetForUserId,
  onView,
  onResetEmail,
  onEdit,
  onDisable,
  onEnable,
}: UsersTableProps) {
  return (
    <Card>
      <CardContent>
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
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Stare cont</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                hover
                sx={
                  user.disabled
                    ? {
                        backgroundColor: 'rgba(255, 152, 0, 0.08)',
                        '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.14)' },
                      }
                    : undefined
                }
              >
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={`${user.role} `} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.email_confirmed ? 'Confirmat' : 'Neconfirmat'}
                    size="small"
                    color={user.email_confirmed ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.disabled ? 'Dezactivat' : 'Activ'}
                    size="small"
                    color={user.disabled ? 'warning' : 'success'}
                    variant={user.disabled ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Vezi detalii">
                    <IconButton size="small" onClick={() => onView(user)} aria-label="Vezi detalii">
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canWrite && (
                    <Tooltip title="Trimite email resetare parolă">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onResetEmail(user)}
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
                        onClick={() => onEdit(user)}
                        aria-label="Editează utilizator"
                        disabled={user.disabled}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {user.disabled ? (
                    <>
                      {canEnable && (
                        <Tooltip title={'Reactivează utilizator'}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onEnable(user)}
                            aria-label="Reactivează utilizator"
                            disabled={!user.disabled}
                          >
                            <CheckCircleOutlineOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <>
                      {canDisable && (
                        <Tooltip title={'Dezactivează utilizator'}>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => onDisable(user)}
                            aria-label="Dezactivează utilizator"
                            disabled={user.disabled}
                          >
                            <BlockOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu există utilizatori pentru filtrul curent.
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
