import { useState } from 'react'
import { AddOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
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
import { cropsApi, type Crop } from '../../api/crops.api'
import { ModalConfirmAction } from '../../components'
import { CROPS_KEY, useDeleteCrop } from '../../hooks/useCrops'
import { useHasPermission } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import CropDialog from './components/CropDialog'
import Section from './components/Section'
import { usePagedQuery } from '../../hooks/usePagedQuery'
import { usePagination } from '../../hooks/usePagination'
import TablePaginationBar from '../../components/TablePaginationBar'

/** Catalogul de culturi: nomenclatorul din care se atribuie culturi pe terenuri. */
export default function CropCatalogPage() {
  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('crops:write')
  const pagination = usePagination()
  const { data: cropsPage, isPending: cropsPending } = usePagedQuery(
    CROPS_KEY,
    cropsApi.getCropsPage,
    pagination.params
  )
  const crops = cropsPage?.items
  const deleteCrop = useDeleteCrop()
  const [cropDialog, setCropDialog] = useState<{ open: boolean; crop: Crop | null }>({
    open: false,
    crop: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Crop | null>(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCrop.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('Cultura a fost ștearsă din catalog.', 'success')
        setDeleteTarget(null)
      },
      onError: (error: unknown) => {
        show(getApiErrorMessage(error, 'Nu am putut șterge cultura.'), 'error')
        setDeleteTarget(null)
      },
    })
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
          Catalog de culturi
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Culturile disponibile pentru atribuire pe terenuri. O cultură folosită pe un teren nu se
          poate șterge.
        </Typography>
      </Box>

      <Section
        title="Catalog de culturi"
        subtitle="Culturile disponibile pentru atribuire pe terenuri"
        action={
          canWrite && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddOutlined />}
              onClick={() => setCropDialog({ open: true, crop: null })}
            >
              Cultură nouă
            </Button>
          )
        }
      >
        {cropsPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume</TableCell>
                <TableCell>Cod</TableCell>
                <TableCell>Categorie</TableCell>
                <TableCell>Unitate</TableCell>
                {canWrite && <TableCell align="right">Acțiuni</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(crops ?? []).map((crop) => (
                <TableRow key={crop.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{crop.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{crop.code ?? '-'}</TableCell>
                  <TableCell>{crop.category || '-'}</TableCell>
                  <TableCell>{crop.yield_unit}</TableCell>
                  {canWrite && (
                    <TableCell align="right">
                      <Tooltip title="Editează">
                        <IconButton
                          size="small"
                          onClick={() => setCropDialog({ open: true, crop })}
                          aria-label="Editează cultura"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Șterge">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(crop)}
                          aria-label="Șterge cultura"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <TablePaginationBar pagination={pagination} total={cropsPage?.total} />
      </Section>

      <CropDialog
        open={cropDialog.open}
        crop={cropDialog.crop}
        onClose={() => setCropDialog({ open: false, crop: null })}
      />
      <ModalConfirmAction
        open={Boolean(deleteTarget)}
        title="Confirmă ștergerea"
        description={
          deleteTarget ? `Cultura „${deleteTarget.name}” va fi ștearsă din catalog.` : ''
        }
        confirmText="Șterge"
        loading={deleteCrop.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
