import { WorkOutlineOutlined } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fieldOperationsApi,
  type FieldOperation,
  type FieldOperationSort,
} from '../../api/fieldOperation.api'
import TablePaginationBar from '../../components/TablePaginationBar'
import { FIELD_OPERATIONS_KEY, useFieldOperationStatusCounts } from '../../hooks/useFieldOperations'
import { usePagedQuery } from '../../hooks/usePagedQuery'
import { usePagination } from '../../hooks/usePagination'
import { useHasPermission } from '../../hooks/usePermissions'
import { FieldOperationsTable } from '../field-operations/components'
import { ACTIVE_STATUSES, parseSort } from '../field-operations/filters'

// Alocările sunt lucrările de făcut: planificate și în lucru. Fără „Toate” sau „Finalizate”.
const ASSIGNMENT_TABS = [ACTIVE_STATUSES, 'planned', 'in_progress']
const NO_FILTERS = {}

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const canWrite = useHasPermission('field_operations:write')

  // Tab-ul de status și ordonarea stau în URL; filtrul și paginarea se fac în API.
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status') ?? ''
  const status = ASSIGNMENT_TABS.includes(statusParam) ? statusParam : ACTIVE_STATUSES
  const sort = parseSort(searchParams.get('sort'))
  const setParam = (name: string, value: string, fallback = '') =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value && value !== fallback) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true }
    )

  const { data: statusCounts } = useFieldOperationStatusCounts(NO_FILTERS)
  const pagination = usePagination({ status, sort })
  const { data: operationsPage, isPending } = usePagedQuery(
    FIELD_OPERATIONS_KEY,
    fieldOperationsApi.getPage,
    { status, sort: sort || undefined, ...pagination.params }
  )

  const openView = (operation: FieldOperation) => navigate(`/field-operations/${operation.id}`)
  const openEdit = (operation: FieldOperation) => navigate(`/field-operations/${operation.id}/edit`)

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <WorkOutlineOutlined color="primary" />
          <Typography sx={{ fontWeight: 700, fontSize: '1.45rem', color: '#0d1f17' }}>
            Alocări pe teren
          </Typography>
          {statusCounts && (
            <Typography
              component="span"
              sx={{ fontSize: '1.45rem', fontWeight: 400, color: 'text.secondary' }}
            >
              · {statusCounts.planned + statusCounts.in_progress}
            </Typography>
          )}
        </Stack>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          Lucrările planificate și cele în lucru: cine, cu ce și când.
        </Typography>
      </Stack>

      <FieldOperationsTable
        items={operationsPage?.items ?? []}
        isLoading={isPending}
        canWrite={canWrite}
        canDelete={false}
        onView={openView}
        onEdit={openEdit}
        onDelete={() => undefined}
        footer={<TablePaginationBar pagination={pagination} total={operationsPage?.total} />}
        emptyText="Nu există lucrări planificate sau în lucru."
        status={status}
        onStatusChange={(next) => setParam('status', next, ACTIVE_STATUSES)}
        statusCounts={statusCounts}
        statusTabs={ASSIGNMENT_TABS}
        sort={sort}
        onSortChange={(next: FieldOperationSort | '') => setParam('sort', next)}
      />
    </Box>
  )
}
