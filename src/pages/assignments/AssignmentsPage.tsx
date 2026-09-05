import { useEffect, useState } from 'react'
import { TimerOffOutlined, VisibilityOutlined, WorkOutlineOutlined } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import { useNavigate } from 'react-router-dom'
import type { FieldOperation, FieldOperationStatus } from '../../api/fieldOperation.api'
import { useFieldOperations } from '../../hooks/useFieldOperations'

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
  if (!value) return 'Data neplanificată'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data neplanificată'
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Afișează o durată doar în ore și minute (fără zile), ex: "26 h 30 min".
function formatHoursAndMinutes(durationMs: number) {
  const totalMinutes = Math.round(durationMs / 60000)
  if (totalMinutes <= 0) return '-'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function formatEstimatedWorkTime(
  startValue: string | null | undefined,
  endValue: string | null | undefined
) {
  if (!startValue || !endValue) return '-'

  const startDate = new Date(startValue)
  const endDate = new Date(endValue)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '-'

  return formatHoursAndMinutes(endDate.getTime() - startDate.getTime())
}

// Cu cât a fost depășit timpul estimat (ms) pentru o operațiune în lucru; 0 dacă nu este depășit.
function getOverdueMs(operation: FieldOperation, now: number) {
  if (operation.status !== 'in_progress' || !operation.planned_end_at) return 0
  const end = new Date(operation.planned_end_at).getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, now - end)
}

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const { data: operations, isPending } = useFieldOperations()
  const now = useNow()

  const openView = (operation: FieldOperation) => {
    navigate(`/field-operations/${operation.id}`)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <WorkOutlineOutlined color="primary" />
          <Typography sx={{ fontWeight: 800, fontSize: 22 }}>Alocări pe teren</Typography>
        </Stack>
        <Typography color="text.secondary">
          Datele sunt preluate din operațiunile pe teren planificate.
        </Typography>
      </Stack>

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Teren</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Operator</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Mașină</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Echipament</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Data</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Timp estimat de lucru</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Status operațiune</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(operations ?? []).map((operation) => {
                  const overdueMs = getOverdueMs(operation, now)
                  const overdueLabel =
                    overdueMs >= 60_000
                      ? `Depășit cu ${formatHoursAndMinutes(overdueMs)}`
                      : 'Depășit'

                  return (
                    <TableRow key={operation.id} hover>
                      <TableCell>{operation.field_name}</TableCell>
                      <TableCell>{operation.operator_name ?? 'Operator neatribuit'}</TableCell>
                      <TableCell>{operation.machine_name ?? 'Mașină neatribuită'}</TableCell>
                      <TableCell>{operation.implement_name ?? 'Echipament neatribuit'}</TableCell>
                      <TableCell>{formatDate(operation.planned_start_at)}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                          <span>
                            {formatEstimatedWorkTime(
                              operation.planned_start_at,
                              operation.planned_end_at
                            )}
                          </span>
                          {overdueMs > 0 && (
                            <Tooltip title="Timpul estimat de lucru a fost depășit">
                              <Chip
                                icon={<TimerOffOutlined />}
                                label={overdueLabel}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[operation.status]}
                          size="small"
                          color={statusColor(operation.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Vezi operațiunea">
                          <IconButton
                            size="small"
                            onClick={() => openView(operation)}
                            aria-label="Vezi operațiunea"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {(operations ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există operațiuni pe teren pentru alocări.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
