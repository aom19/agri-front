import { useState, type MouseEvent, type ReactNode } from 'react'
import {
  AgricultureOutlined,
  BuildOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreVertOutlined,
  PersonOutlined,
  TimerOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type {
  FieldOperation,
  FieldOperationSort,
  FieldOperationStatus,
  FieldOperationStatusCounts,
} from '../../../api/fieldOperation.api'
import { useNow } from '../../../hooks/useNow'
import { formatDateTime } from '../../../utils/dateFormat'
import { ACTIVE_STATUSES } from '../filters'
import { estimatedWorkTime, formatHoursAndMinutes, getOverdueMs } from '../schedule'
import { statusLabels } from '../status'
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
  /** Mesajul pentru lista goală (ex. când filtrele nu potrivesc nimic). */
  emptyText?: string
  /** Tab-ul de status ales: '' = toate, ACTIVE_STATUSES sau un status. */
  status: string
  onStatusChange: (status: string) => void
  statusCounts?: FieldOperationStatusCounts
  sort: FieldOperationSort | ''
  onSortChange: (sort: FieldOperationSort | '') => void
  /** Tab-urile de status afișate (valorile din STATUS_TABS); implicit toate. */
  statusTabs?: string[]
}

type StatusTab = { value: string; label: string; count: (c: FieldOperationStatusCounts) => number }

const STATUS_TABS: StatusTab[] = [
  { value: '', label: 'Toate', count: (c) => c.total },
  { value: ACTIVE_STATUSES, label: 'Active', count: (c) => c.planned + c.in_progress },
  { value: 'planned', label: 'Planificate', count: (c) => c.planned },
  { value: 'in_progress', label: 'În lucru', count: (c) => c.in_progress },
  { value: 'completed', label: 'Finalizate', count: (c) => c.completed },
  { value: 'canceled', label: 'Anulate', count: (c) => c.canceled },
]

type SortColumn = 'planned' | 'area' | 'field'

// Pe telefon nu există cap de tabel: ordonarea se alege dintr-o listă.
const MOBILE_SORTS: { value: FieldOperationSort; label: string }[] = [
  { value: 'planned_desc', label: 'Cele mai recente' },
  { value: 'planned_asc', label: 'Cele mai vechi' },
  { value: 'area_desc', label: 'Suprafață descrescătoare' },
  { value: 'area_asc', label: 'Suprafață crescătoare' },
  { value: 'field_asc', label: 'Teren A–Z' },
  { value: 'field_desc', label: 'Teren Z–A' },
]

// Fără sortare explicită, lista e „cele mai recente primele”, adică planificat descrescător.
function sortState(sort: FieldOperationSort | '', column: SortColumn) {
  const current = sort || 'planned_desc'
  if (!current.startsWith(`${column}_`)) return null
  return current.endsWith('_asc') ? 'asc' : 'desc'
}

// Planificat și suprafața încep descrescător (cele mai recente / mari sus); terenul, alfabetic.
function nextSort(sort: FieldOperationSort | '', column: SortColumn): FieldOperationSort | '' {
  const direction = sortState(sort, column)
  if (column === 'planned') return direction === 'desc' ? 'planned_asc' : ''
  if (column === 'field') return direction === 'asc' ? 'field_desc' : 'field_asc'
  return direction === 'desc' ? 'area_asc' : 'area_desc'
}

function statusColor(status: FieldOperationStatus): 'info' | 'warning' | 'success' | 'default' {
  if (status === 'planned') return 'info'
  if (status === 'in_progress') return 'warning'
  if (status === 'completed') return 'success'
  return 'default'
}

const areaFormat = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 })

function formatArea(value: number | null | undefined) {
  return value == null ? '-' : `${areaFormat.format(value)} ha`
}

const headCellSx = {
  bgcolor: '#f4f7f5',
  color: 'text.secondary',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  py: 1.25,
  borderBottom: '1px solid #e0e6e2',
} as const

function ResourceLine({ icon, text }: { icon: ReactNode; text?: string | null }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex', '& svg': { fontSize: 15 } }}>{icon}</Box>
      <Typography
        noWrap
        sx={{ fontSize: '0.8rem', color: text ? 'text.primary' : 'text.disabled' }}
      >
        {text ?? 'nealocat'}
      </Typography>
    </Stack>
  )
}

/** Mașina și operatorul; echipamentul doar când lucrarea are unul. */
function Resources({
  item,
  direction = 'column',
}: {
  item: FieldOperation
  direction?: 'row' | 'column'
}) {
  return (
    <Stack
      direction={direction}
      spacing={direction === 'row' ? 2 : 0}
      sx={{ minWidth: 0, flexWrap: 'wrap' }}
    >
      <ResourceLine icon={<AgricultureOutlined />} text={item.machine_name} />
      <ResourceLine icon={<PersonOutlined />} text={item.operator_name} />
      {item.implement_name && <ResourceLine icon={<BuildOutlined />} text={item.implement_name} />}
    </Stack>
  )
}

/** Data planificată, timpul estimat de lucru și, pentru o lucrare în lucru, cât e depășit. */
function Schedule({ item, now }: { item: FieldOperation; now: number }) {
  const estimate = estimatedWorkTime(item)
  const overdueMs = getOverdueMs(item, now)
  return (
    <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
        {formatDateTime(item.planned_start_at, 'neplanificată')}
      </Typography>
      {estimate && (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
          ≈ {estimate} de lucru
        </Typography>
      )}
      {overdueMs > 0 && (
        <Tooltip title="Timpul estimat de lucru a fost depășit">
          <Chip
            icon={<TimerOffOutlined />}
            label={
              overdueMs >= 60_000 ? `Depășit cu ${formatHoursAndMinutes(overdueMs)}` : 'Depășit'
            }
            size="small"
            color="error"
            variant="outlined"
            sx={{ fontWeight: 700, mt: 0.25 }}
          />
        </Tooltip>
      )}
    </Stack>
  )
}

function CountBadge({ value, active }: { value: number; active: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        borderRadius: 10,
        fontSize: '0.72rem',
        lineHeight: '20px',
        bgcolor: active ? 'primary.main' : '#eef2ef',
        color: active ? 'primary.contrastText' : 'text.secondary',
      }}
    >
      {value}
    </Box>
  )
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
  emptyText = 'Nu există operațiuni pe teren.',
  status,
  onStatusChange,
  statusCounts,
  sort,
  onSortChange,
  statusTabs,
}: Props) {
  const theme = useTheme()
  const now = useNow()
  const tabs = statusTabs ? STATUS_TABS.filter((t) => statusTabs.includes(t.value)) : STATUS_TABS
  // pe telefon, cardurile înlocuiesc tabelul: 7 coloane nu încap fără scroll orizontal
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: FieldOperation } | null>(null)
  const activeTab = tabs.some((t) => t.value === status) ? status : (tabs[0]?.value ?? '')

  const openMenu = (event: MouseEvent<HTMLElement>, item: FieldOperation) => {
    event.stopPropagation()
    setMenu({ anchor: event.currentTarget, item })
  }
  const runAction = (action: (item: FieldOperation) => void) => {
    if (!menu) return
    const { item } = menu
    setMenu(null)
    action(item)
  }

  const sortableHead = (column: SortColumn, label: string, align?: 'right') => {
    const direction = sortState(sort, column)
    return (
      <TableCell align={align} sx={headCellSx} sortDirection={direction ?? false}>
        <TableSortLabel
          active={direction != null}
          direction={direction ?? 'desc'}
          onClick={() => onSortChange(nextSort(sort, column))}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    )
  }

  return (
    <Card>
      <Tabs
        value={activeTab}
        onChange={(_, value: string) => onStatusChange(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Status operațiuni"
        sx={{ px: 1, borderBottom: '1px solid #e0e6e2', minHeight: 48 }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value || 'all'}
            value={tab.value}
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
            label={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <span>{tab.label}</span>
                {statusCounts && (
                  <CountBadge value={tab.count(statusCounts)} active={activeTab === tab.value} />
                )}
              </Stack>
            }
          />
        ))}
      </Tabs>

      {isMobile ? (
        <Box>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Ordonează"
              value={sort || 'planned_desc'}
              onChange={(e) => {
                const next = e.target.value as FieldOperationSort
                onSortChange(next === 'planned_desc' ? '' : next)
              }}
            >
              {MOBILE_SORTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <List disablePadding aria-label="Operațiuni pe teren">
            {items.map((item) => (
              <ListItem
                key={item.id}
                disablePadding
                divider
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(event) => openMenu(event, item)}
                    aria-label={`Acțiuni pentru lucrarea de pe ${item.field_name}`}
                    aria-haspopup="menu"
                  >
                    <MoreVertOutlined fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => onView(item)} sx={{ py: 1.5, pr: 6 }}>
                  <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%' }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.operation_type_name}
                      </Typography>
                      <Chip
                        label={statusLabels[item.status]}
                        size="small"
                        color={statusColor(item.status)}
                        sx={{ flexShrink: 0 }}
                      />
                    </Stack>
                    <Typography noWrap sx={{ fontSize: '0.82rem' }}>
                      {item.field_name} · {formatArea(item.area_planned_ha)}
                    </Typography>
                    <Schedule item={item} now={now} />
                    <Resources item={item} direction="row" />
                    <OperationConflictChip conflicts={item.conflicts} />
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
            {items.length === 0 && (
              <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                {isLoading ? (
                  <CircularProgress size={28} aria-label="Se încarcă operațiunile" />
                ) : (
                  emptyText
                )}
              </Box>
            )}
          </List>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: { md: 'calc(100vh - 360px)' }, minHeight: 200 }}>
          <Table stickyHeader size="small" aria-label="Operațiuni pe teren">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Lucrare</TableCell>
                {sortableHead('field', 'Teren')}
                <TableCell sx={headCellSx}>Resurse</TableCell>
                {sortableHead('planned', 'Planificat')}
                {sortableHead('area', 'Suprafață', 'right')}
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={{ ...headCellSx, width: 48 }} aria-label="Acțiuni" />
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  onClick={() => onView(item)}
                  sx={{ cursor: 'pointer', '& td': { py: 1.25 } }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {item.operation_type_name}
                    </Typography>
                    {item.operation_template_name && (
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {item.operation_template_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{item.field_name}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Resources item={item} />
                  </TableCell>
                  <TableCell>
                    <Schedule item={item} now={now} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {formatArea(item.area_planned_ha)}
                  </TableCell>
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
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(event) => openMenu(event, item)}
                      aria-label={`Acțiuni pentru lucrarea de pe ${item.field_name}`}
                      aria-haspopup="menu"
                    >
                      <MoreVertOutlined fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 && isLoading && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 5, textAlign: 'center' }}>
                    <CircularProgress size={28} aria-label="Se încarcă operațiunile" />
                  </TableCell>
                </TableRow>
              )}

              {items.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                      {emptyText}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => runAction(onView)}>
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Vezi detalii</ListItemText>
        </MenuItem>
        {canWrite && (
          <MenuItem onClick={() => runAction(onEdit)}>
            <ListItemIcon>
              <EditOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editează</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={() => runAction(onDelete)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteOutlined fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Șterge</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {footer}
    </Card>
  )
}
