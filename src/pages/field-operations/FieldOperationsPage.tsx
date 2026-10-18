import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box } from '@mui/material'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  FIELD_OPERATIONS_KEY,
  useDeleteFieldOperation,
  useFieldOperationStatusCounts,
} from '../../hooks/useFieldOperations'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import {
  fieldOperationsApi,
  type FieldOperation,
  type FieldOperationSort,
  type FieldOperationsPageFilter,
} from '../../api/fieldOperation.api'
import {
  FieldOperationsFilters,
  FieldOperationsPageHeader,
  FieldOperationsTable,
} from './components'
import {
  EMPTY_FIELD_OPERATIONS_FILTERS,
  FILTER_PARAMS,
  dayStart,
  parseSort,
  type FieldOperationsFilterState,
} from './filters'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { isOperationType } from '../../schemas/operation.schema'
import { usePagedQuery } from '../../hooks/usePagedQuery'
import { usePagination } from '../../hooks/usePagination'
import TablePaginationBar from '../../components/TablePaginationBar'

export default function FieldOperationsPage() {
  const navigate = useNavigate()
  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('field_operations:write')

  // Filtrele stau în URL (revenirea din detalii le păstrează) și se aplică toate în API.
  const [searchParams, setSearchParams] = useSearchParams()
  const filterState: FieldOperationsFilterState = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? '',
    operationType: searchParams.get('operation_type') ?? '',
    fieldId: searchParams.get('field_id') ?? '',
    machineId: searchParams.get('machine_id') ?? '',
    operatorId: searchParams.get('operator_id') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  }
  const updateFilters = (patch: Partial<FieldOperationsFilterState>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch)) {
          const param = FILTER_PARAMS[key as keyof FieldOperationsFilterState]
          if (value) next.set(param, value)
          else next.delete(param)
        }
        return next
      },
      { replace: true }
    )
  }

  const debouncedQ = useDebouncedValue(filterState.q.trim(), 300)
  const { status, operationType, fieldId, machineId, operatorId, from, to } = filterState
  const filters: FieldOperationsPageFilter = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: status || undefined,
      operation_type: isOperationType(operationType) ? operationType : undefined,
      field_id: fieldId || undefined,
      machine_id: Number(machineId) || undefined,
      operator_id: Number(operatorId) || undefined,
      planned_from: from ? dayStart(from) : undefined,
      planned_to: to ? dayStart(to, 1) : undefined,
    }),
    [debouncedQ, status, operationType, fieldId, machineId, operatorId, from, to]
  )
  const hasFilters = Object.values(filterState).some(Boolean)
  const sort = parseSort(searchParams.get('sort'))
  const setSort = (next: FieldOperationSort | '') =>
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous)
        if (next) params.set('sort', next)
        else params.delete('sort')
        return params
      },
      { replace: true }
    )

  // Numărătorile tab-urilor: aceleași filtre, fără status (fiecare tab își arată numărul).
  const countFilters = useMemo(() => ({ ...filters, status: undefined }), [filters])
  const { data: statusCounts } = useFieldOperationStatusCounts(countFilters)

  const pagination = usePagination({ filters, sort })
  const { data: itemsPage, isPending } = usePagedQuery(
    FIELD_OPERATIONS_KEY,
    fieldOperationsApi.getPage,
    { ...filters, sort: sort || undefined, ...pagination.params }
  )
  const items = itemsPage?.items
  const deleteMutation = useDeleteFieldOperation()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<FieldOperation | null>(null)

  const deleting = deleteMutation.isPending

  const openCreate = () => navigate('/field-operations/new')
  const openView = (item: FieldOperation) => navigate(`/field-operations/${item.id}`)
  const openEdit = (item: FieldOperation) => navigate(`/field-operations/${item.id}/edit`)

  const openDeleteDialog = (item: FieldOperation) => {
    setToDelete(item)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      show('Operațiunea a fost ștearsă.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge operațiunea.'), 'error')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <FieldOperationsPageHeader
        onCreate={openCreate}
        canWrite={canWrite}
        total={statusCounts?.total}
      />
      <FieldOperationsFilters
        value={filterState}
        onChange={updateFilters}
        onReset={() =>
          updateFilters({ ...EMPTY_FIELD_OPERATIONS_FILTERS, status: filterState.status })
        }
      />

      <FieldOperationsTable
        items={items ?? []}
        isLoading={isPending}
        canWrite={canWrite}
        canDelete={canWrite}
        onView={openView}
        onEdit={openEdit}
        onDelete={openDeleteDialog}
        footer={<TablePaginationBar pagination={pagination} total={itemsPage?.total} />}
        emptyText={hasFilters ? 'Nicio operațiune nu corespunde filtrelor.' : undefined}
        status={filterState.status}
        onStatusChange={(next) => updateFilters({ status: next })}
        statusCounts={statusCounts}
        sort={sort}
        onSortChange={setSort}
      />

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge operațiunea"
        description={
          toDelete ? `Confirmi ștergerea operațiunii pentru terenul „${toDelete.field_name}”?` : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}
