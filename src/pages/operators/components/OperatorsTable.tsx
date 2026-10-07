import {
  BlockOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
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
import type { Operator } from '../../../api/operator.api'

type OperatorsTableProps = {
  operators: Operator[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  canDisable: boolean
  onView: (operator: Operator) => void
  onEdit: (operator: Operator) => void
  onDelete: (operator: Operator) => void
  onDisable: (operator: Operator) => void
  onEnable: (operator: Operator) => void
}

function statusColor(status: string): 'success' | 'default' {
  return status === 'active' ? 'success' : 'default'
}

function statusLabel(status: string): string {
  return status === 'active' ? 'Activ' : 'Inactiv'
}

export default function OperatorsTable({
  operators,
  isLoading,
  canWrite,
  canDelete,
  canDisable,
  onView,
  onEdit,
  onDelete,
  onDisable,
  onEnable,
}: OperatorsTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Nume</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Telefon</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Email</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Status</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {operators.map((operator) => (
              <TableRow key={operator.id} hover>
                <TableCell>{operator.name}</TableCell>
                <TableCell>{operator.phone || '-'}</TableCell>
                <TableCell>{operator.email || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabel(operator.status)}
                    size="small"
                    color={statusColor(operator.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Vezi detalii">
                    <IconButton
                      size="small"
                      onClick={() => onView(operator)}
                      aria-label="Vezi detalii"
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {canWrite && (
                    <Tooltip title="Editează operatorul">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(operator)}
                        aria-label="Editează operatorul"
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canDisable && operator.status === 'active' && (
                    <Tooltip title="Dezactivează operatorul">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => onDisable(operator)}
                        aria-label="Dezactivează operatorul"
                      >
                        <BlockOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canDisable && operator.status === 'inactive' && (
                    <Tooltip title="Reactivează operatorul">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => onEnable(operator)}
                        aria-label="Reactivează operatorul"
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canDelete && (
                    <Tooltip title="Șterge operatorul">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(operator)}
                        aria-label="Șterge operatorul"
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {operators.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu există operatori pentru filtrul curent.
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
