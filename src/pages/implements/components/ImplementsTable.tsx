import {
  DeleteOutlined,
  EditOutlined,
  ToggleOffOutlined,
  ToggleOnOutlined,
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
import type { Implement } from '../../../api/implement.api'
import {
  implementStatusOptions,
  implementTypeOptions,
  type ImplementStatusValue,
  type ImplementTypeValue,
} from '../../../schemas/implement.schema'

type ImplementsTableProps = {
  implementsData: Implement[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onView: (implementData: Implement) => void
  onEdit: (implementData: Implement) => void
  onDelete: (implementData: Implement) => void
  onToggleActive: (implementData: Implement) => void
}

function statusColor(status: string): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'maintenance') return 'warning'
  return 'default'
}

const implementTypeLabelByValue = new Map(
  implementTypeOptions.map((option) => [option.value, option.label])
)
const implementStatusLabelByValue = new Map(
  implementStatusOptions.map((option) => [option.value, option.label])
)

export default function ImplementsTable({
  implementsData,
  isLoading,
  canWrite,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: ImplementsTableProps) {
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
                <Typography sx={{ fontWeight: 700 }}>Tip</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Brand / Model</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Latime / Capacitate</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Status</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: 700 }}>Actiuni</Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {implementsData.map((implementData) => {
              const isActive = implementData.status === 'active'

              return (
                <TableRow key={implementData.id} hover>
                  <TableCell>{implementData.code}</TableCell>
                  <TableCell>{implementData.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        implementTypeLabelByValue.get(implementData.type as ImplementTypeValue) ??
                        implementData.type
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {implementData.brand || '-'} / {implementData.model || '-'}
                  </TableCell>
                  <TableCell>
                    {implementData.working_width == null ? '-' : `${implementData.working_width} m`}{' '}
                    / {implementData.capacity == null ? '-' : implementData.capacity}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        implementStatusLabelByValue.get(
                          implementData.status as ImplementStatusValue
                        ) ?? implementData.status
                      }
                      size="small"
                      color={statusColor(implementData.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Vezi detalii">
                      <IconButton
                        size="small"
                        onClick={() => onView(implementData)}
                        aria-label="Vezi detalii"
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {canWrite && (
                      <>
                        <Tooltip title="Editeaza implementul">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(implementData)}
                            aria-label="Editeaza implementul"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={isActive ? 'Dezactiveaza implementul' : 'Activeaza implementul'}
                        >
                          <IconButton
                            size="small"
                            color={isActive ? 'warning' : 'success'}
                            onClick={() => onToggleActive(implementData)}
                            aria-label={
                              isActive ? 'Dezactiveaza implementul' : 'Activeaza implementul'
                            }
                          >
                            {isActive ? (
                              <ToggleOffOutlined fontSize="small" />
                            ) : (
                              <ToggleOnOutlined fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {canDelete && (
                      <Tooltip title="Sterge implementul">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(implementData)}
                          aria-label="Sterge implementul"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {implementsData.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu exista implementuri pentru filtrul curent.
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
