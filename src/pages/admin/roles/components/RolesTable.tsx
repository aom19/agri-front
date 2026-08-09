import {
  DeleteOutlined,
  EditOutlined,
  SecurityOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Role } from '../../../../api/roles.api'

type RolesTableProps = {
  roles: Role[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onView: (role: Role) => void
  onManagePermissions: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export default function RolesTable({
  roles,
  isLoading,
  canWrite,
  canDelete,
  onView,
  onManagePermissions,
  onEdit,
  onDelete,
}: RolesTableProps) {
  return (
    <Card>
      <CardContent>
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
            {roles.map((role) => {
              const adminRole = role.code.toLowerCase() === 'admin'

              return (
                <TableRow key={role.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {role.code}
                  </TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{role.description || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Vezi detalii rol">
                      <IconButton
                        size="small"
                        onClick={() => onView(role)}
                        aria-label="Vezi detalii rol"
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {canWrite && (
                      <Tooltip title="Gestionează permisiuni rol">
                        <IconButton
                          size="small"
                          onClick={() => onManagePermissions(role)}
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
                          onClick={() => onEdit(role)}
                          aria-label="Editează rol"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {canDelete && (
                      <Tooltip title={adminRole ? 'Rolul admin nu poate fi șters.' : 'Șterge rol'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(role)}
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

            {roles.length === 0 && !isLoading && (
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
      </CardContent>
    </Card>
  )
}