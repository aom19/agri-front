import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
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
import type { FieldOperation, FieldOperationStatus } from '../../../api/fieldOperation.api'

type Props = {
  items: FieldOperation[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onView: (item: FieldOperation) => void
  onEdit: (item: FieldOperation) => void
  onDelete: (item: FieldOperation) => void
}

const statusLabels: Record<FieldOperationStatus, string> = {
  planned: 'Planificată',
  in_progress: 'În lucru',
  completed: 'Finalizată',
  canceled: 'Anulată',
}

function statusColor(status: FieldOperationStatus): 'info' | 'warning' | 'success' | 'default' {
  if (status === 'planned') return 'info'
  if (status === 'in_progress') return 'warning'
  if (status === 'completed') return 'success'
  return 'default'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatArea(value: number | null | undefined) {
  if (value == null) return '-'
  return `${value} ha`
}

export default function FieldOperationsTable({
  items,
  isLoading,
  canWrite,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Teren</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Tip operațiune</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Template</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Mașină</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Operator</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Planificat</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Suprafață</Typography>
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
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.field_name}</TableCell>
                <TableCell>{item.operation_type_name}</TableCell>
                <TableCell>{item.operation_template_name ?? '-'}</TableCell>
                <TableCell>{item.machine_name ?? '-'}</TableCell>
                <TableCell>{item.operator_name ?? '-'}</TableCell>
                <TableCell>{formatDate(item.planned_start_at)}</TableCell>
                <TableCell>{formatArea(item.area_planned_ha)}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[item.status]}
                    size="small"
                    color={statusColor(item.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Vezi detalii">
                    <IconButton size="small" onClick={() => onView(item)} aria-label="Vezi detalii">
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {canWrite && (
                    <Tooltip title="Editează">
                      <IconButton size="small" onClick={() => onEdit(item)} aria-label="Editează">
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canDelete && (
                    <Tooltip title="Șterge">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(item)}
                        aria-label="Șterge"
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu există operațiuni pe teren.
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
