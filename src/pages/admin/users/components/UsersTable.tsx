import {
  DeleteOutlined,
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
  sendingResetForUserId: number | null
  onView: (user: User) => void
  onResetEmail: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export default function UsersTable({
  users,
  isLoading,
  canWrite,
  sendingResetForUserId,
  onView,
  onResetEmail,
  onEdit,
  onDelete,
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
              <TableCell align="right">
                <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
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
                        onClick={() => onDelete(user)}
                        aria-label="Șterge utilizator"
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 && !isLoading && (
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
      </CardContent>
    </Card>
  )
}
