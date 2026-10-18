import type { ReactNode } from 'react'
import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { FieldOperation, FieldOperationStatus } from '../../../api/fieldOperation.api'
import { formatDateTime } from '../../../utils/dateFormat'
import OperationConflictChip from './OperationConflictChip'

type Props = {
  items: FieldOperation[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onView: (item: FieldOperation) => void
  onEdit: (item: FieldOperation) => void
  onDelete: (item: FieldOperation) => void
  /** Sub tabel, în același card (ex. paginarea). */
  footer?: ReactNode
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
  footer,
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
                <TableCell>{formatDateTime(item.planned_start_at)}</TableCell>
                <TableCell>{formatArea(item.area_planned_ha)}</TableCell>
                <TableCell>
                  <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                    <Chip
                      label={statusLabels[item.status]}
                      size="small"
                      color={statusColor(item.status)}
                    />
                    <OperationConflictChip conflicts={item.conflicts} />
                  </Stack>
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
        {footer}
      </CardContent>
    </Card>
  )
}
