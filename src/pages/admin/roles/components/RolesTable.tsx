import { VisibilityOutlined } from '@mui/icons-material'
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
  onView: (role: Role) => void
}

export default function RolesTable({ roles, isLoading, onView }: RolesTableProps) {
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
            {roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{role.code}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{role.description || '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Vezi permisiunile rolului">
                    <IconButton
                      size="small"
                      onClick={() => onView(role)}
                      aria-label="Vezi permisiunile rolului"
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

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
