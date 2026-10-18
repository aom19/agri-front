import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddOutlined, DeleteOutlined, EditOutlined, GrassOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
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
import type { Season } from '../../api/crops.api'
import { ModalConfirmAction } from '../../components'
import { SEASONS_KEY, useDeleteSeason } from '../../hooks/useCrops'
import { useHasPermission } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { formatIsoDay } from '../../utils/dateFormat'
import SeasonDialog from './components/SeasonDialog'
import Section from './components/Section'
import { cropsApi } from '../../api/crops.api'
import { usePagedQuery } from '../../hooks/usePagedQuery'
import { usePagination } from '../../hooks/usePagination'
import TablePaginationBar from '../../components/TablePaginationBar'

/** Sezoanele agricole: etichete de raportare; nu decid de ce cultură se leagă o lucrare. */
export default function SeasonsPage() {
  const navigate = useNavigate()
  const show = useNotificationStore((state) => state.show)
  // click pe rând: culturile pe terenuri din acel sezon
  const openCrops = (seasonId: number) => navigate(`/crops?season_id=${seasonId}`)
  const canWrite = useHasPermission('crops:write')
  const pagination = usePagination()
  const { data: seasonsPage, isPending: seasonsPending } = usePagedQuery(
    SEASONS_KEY,
    cropsApi.getSeasonsPage,
    pagination.params
  )
  const seasons = seasonsPage?.items
  const deleteSeason = useDeleteSeason()
  const [seasonDialog, setSeasonDialog] = useState<{ open: boolean; season: Season | null }>({
    open: false,
    season: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Season | null>(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteSeason.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('Sezonul a fost șters.', 'success')
        setDeleteTarget(null)
      },
      onError: (error: unknown) => {
        show(getApiErrorMessage(error, 'Nu am putut șterge sezonul.'), 'error')
        setDeleteTarget(null)
      },
    })
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
          Sezoane
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Etichete de raportare pentru culturile pe terenuri. Un sezon fără dată de sfârșit e „în
          curs”; sezonul activ e cel propus implicit în rapoarte.
        </Typography>
      </Box>

      <Section
        title="Sezoane"
        subtitle="Sezonul activ este folosit implicit în raportul pe culturi"
        action={
          canWrite && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setSeasonDialog({ open: true, season: null })}
            >
              Sezon nou
            </Button>
          )
        }
      >
        {seasonsPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (seasons ?? []).length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 2 }}>
            Nu există sezoane. Creează primul sezon pentru a putea atribui culturi terenurilor.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume</TableCell>
                <TableCell>Interval</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Observații</TableCell>
                <TableCell align="right">Acțiuni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(seasons ?? []).map((season) => (
                <TableRow
                  key={season.id}
                  hover
                  onClick={() => openCrops(season.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{season.name}</TableCell>
                  <TableCell>
                    {formatIsoDay(season.start_date)} –{' '}
                    {season.end_date ? formatIsoDay(season.end_date) : 'în curs'}
                  </TableCell>
                  <TableCell>
                    {season.is_active ? (
                      <Chip size="small" color="success" label="Activ" />
                    ) : (
                      <Chip size="small" label="Inactiv" />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{season.notes || '-'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Culturile pe terenuri din acest sezon">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(event) => {
                          event.stopPropagation()
                          openCrops(season.id)
                        }}
                        aria-label="Vezi culturile din sezon"
                      >
                        <GrassOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canWrite && (
                      <>
                        <Tooltip title="Editează">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSeasonDialog({ open: true, season })
                            }}
                            aria-label="Editează sezonul"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteTarget(season)
                            }}
                            aria-label="Șterge sezonul"
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <TablePaginationBar pagination={pagination} total={seasonsPage?.total} />
      </Section>

      <SeasonDialog
        open={seasonDialog.open}
        season={seasonDialog.season}
        onClose={() => setSeasonDialog({ open: false, season: null })}
      />
      <ModalConfirmAction
        open={Boolean(deleteTarget)}
        title="Confirmă ștergerea"
        description={
          deleteTarget
            ? `Sezonul „${deleteTarget.name}” va fi șters. Un sezon cu culturi pe terenuri nu se poate șterge.`
            : ''
        }
        confirmText="Șterge"
        loading={deleteSeason.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
