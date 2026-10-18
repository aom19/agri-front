import { useState, type MouseEvent, type ReactNode } from 'react'
import {
  AgricultureOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreVertOutlined,
  PersonOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
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
  Typography,
} from '@mui/material'
import type {
  FieldOperation,
  FieldOperationSort,
  FieldOperationStatus,
  FieldOperationStatusCounts,
} from '../../../api/fieldOperation.api'
import { formatDateTime } from '../../../utils/dateFormat'
import { ACTIVE_STATUSES } from '../filters'
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
}: Props) {
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: FieldOperation } | null>(null)
  const activeTab = STATUS_TABS.some((t) => t.value === status) ? status : ''

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
        {STATUS_TABS.map((tab) => (
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
                  <ResourceLine icon={<AgricultureOutlined />} text={item.machine_name} />
                  <ResourceLine icon={<PersonOutlined />} text={item.operator_name} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  {formatDateTime(item.planned_start_at)}
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
