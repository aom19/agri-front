import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import { useDeleteFieldOperation, useFieldOperations } from '../../hooks/useFieldOperations'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import type { FieldOperation } from '../../api/fieldOperation.api'
import { FieldOperationsPageHeader, FieldOperationsTable } from './components'

export default function FieldOperationsPage() {
  const navigate = useNavigate()
  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('field_operations:write')
  const canDelete = useHasPermission('field_operations:delete')

  const { data: items, isPending } = useFieldOperations()
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
      <FieldOperationsPageHeader onCreate={openCreate} canWrite={canWrite} />

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <FieldOperationsTable
          items={items ?? []}
          isLoading={isPending}
          canWrite={canWrite}
          canDelete={canDelete}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDeleteDialog}
        />
      )}

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
