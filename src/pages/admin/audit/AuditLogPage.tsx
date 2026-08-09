import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { HistoryOutlined } from '@mui/icons-material'
import { useState } from 'react'
import { useAuditLog } from '../../../hooks/useAuditLog'

function formatTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

function actionColor(action: string): 'success' | 'info' | 'error' | 'warning' | 'default' {
  if (action === 'create') return 'success'
  if (action === 'update' || action === 'status_change') return 'info'
  if (action === 'delete') return 'error'
  return 'default'
}

const entityTypes = [
  { label: 'Toate', value: '' },
  { label: 'Mașini', value: 'machine' },
  { label: 'Echipamente', value: 'implement' },
  { label: 'Terenuri', value: 'field' },
  { label: 'Operațiuni', value: 'field_operation' },
  { label: 'Stocuri', value: 'stock' },
  { label: 'Resurse', value: 'resource' },
  { label: 'Operatori', value: 'operator' },
  { label: 'Utilizatori', value: 'user' },
]

const entityLabels = new Map(entityTypes.filter((item) => item.value).map((item) => [item.value, item.label]))

const statusLabels: Record<string, string> = {
  active: 'Activ',
  inactive: 'Inactiv',
  maintenance: 'Mentenanță',
  planned: 'Planificat',
  in_progress: 'În lucru',
  completed: 'Finalizat',
  cancelled: 'Anulat',
}

function formatStatus(value: unknown) {
  if (typeof value !== 'string') return ''
  return statusLabels[value] ?? value
}

function formatChanges(changes: Record<string, unknown> | null) {
  if (!changes) return '-'

  const oldStatus = formatStatus(changes.old_status)
  const status = formatStatus(changes.status)
  if (oldStatus && status) return `Status: ${oldStatus} -> ${status}`
  if (status) return `Status: ${status}`

  return JSON.stringify(changes, null, 2)
}

function actorLabel(actorName: string | null | undefined, actorID: number | null) {
  const name = actorName?.trim()
  if (name) return name
  if (actorID) return `User #${actorID}`
  return 'Sistem'
}

function entityNameLabel(entityName: string | null | undefined, entityID: string) {
  const name = entityName?.trim()
  if (name) return name
  return `#${entityID}`
}

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState('')
  const { data: entries, isPending } = useAuditLog({
    entity_type: entityFilter || undefined,
    limit: 200,
  })

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
        <HistoryOutlined color="primary" />
        <Typography sx={{ fontWeight: 800, fontSize: 22 }}>Jurnal de audit</Typography>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Tip entitate"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {entityTypes.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 32px rgba(13, 31, 23, 0.08)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 260px)', minHeight: 220 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Data</Typography></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Entitate</Typography></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Denumire</Typography></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Acțiune</Typography></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Actor</Typography></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>Modificări</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(entries ?? []).map((e) => {
                  const changesText = formatChanges(e.changes)
                  const actor = actorLabel(e.actor_name, e.actor_id)
                  const entityName = entityNameLabel(e.entity_name, e.entity_id)

                  return (
                  <TableRow
                    key={e.id}
                    hover
                    sx={{
                      '&:nth-of-type(even)': { bgcolor: 'rgba(13, 31, 23, 0.025)' },
                      '& td': { borderColor: 'rgba(13, 31, 23, 0.08)', py: 1.4 },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatTime(e.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={entityLabels.get(e.entity_type) ?? e.entity_type}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                      {entityName}
                    </TableCell>
                    <TableCell>
                      <Chip label={e.action} size="small" color={actionColor(e.action)} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={actor}
                        size="small"
                        color={e.actor_id ? 'default' : 'warning'}
                        variant={e.actor_id ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 280, maxWidth: 520 }}>
                      {changesText !== '-' ? (
                        <Box
                          component="span"
                          sx={{
                            bgcolor: 'rgba(13, 31, 23, 0.06)',
                            border: '1px solid',
                            borderColor: 'rgba(13, 31, 23, 0.1)',
                            borderRadius: 1,
                            color: 'text.primary',
                            display: 'inline-block',
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            lineHeight: 1.6,
                            m: 0,
                            maxHeight: 120,
                            overflow: 'auto',
                            p: 1.25,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {changesText}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })}
                {(entries ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există înregistrări de audit.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
