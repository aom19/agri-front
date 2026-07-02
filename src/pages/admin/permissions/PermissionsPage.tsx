import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  ClearOutlined,
  FilterAltOutlined,
  InfoOutlined,
} from '@mui/icons-material'
import { useAllPermissions } from '../../../hooks/usePermissions'
import { RequirePermission } from '../../../components/RequirePermission'

type Permission = {
  id: number
  name: string
  description: string
}

export default function PermissionsPage() {
  const [filterNameDraft, setFilterNameDraft] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'id'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data: permissions, isLoading } = useAllPermissions()

  const filteredSortedPermissions = useMemo(() => {
    return [...(permissions ?? [])]
      .filter(
        (perm) =>
          perm.name.toLowerCase().includes(filterName.trim().toLowerCase()) ||
          perm.description?.toLowerCase().includes(filterName.trim().toLowerCase())
      )
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1

        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ro') * direction
        }

        return (a.id - b.id) * direction
      })
  }, [permissions, filterName, sortBy, sortOrder])

  const handleSortClick = (column: 'name' | 'id') => {
    if (sortBy !== column) {
      setSortBy(column)
      setSortOrder('asc')
      return
    }
    setSortOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'))
  }

  const openFiltersDialog = () => {
    setFilterNameDraft(filterName)
    setFiltersOpen(true)
  }

  const closeFiltersDialog = () => {
    setFiltersOpen(false)
  }

  const applyFilters = () => {
    setFilterName(filterNameDraft)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilterNameDraft('')
    setFilterName('')
  }

  const openDetails = (permission: Permission) => {
    setSelectedPermission(permission)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedPermission(null)
  }

  const activeFilterCount = Number(Boolean(filterName.trim()))

  return (
    <RequirePermission permission="permissions:read">
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2, gap: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Permisiuni
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vizualizare completă a tuturor permisiunilor disponibile în sistem.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Chip label={`${filteredSortedPermissions.length} rezultate`} size="small" />
              {activeFilterCount > 0 && (
                <Chip label={`${activeFilterCount} filtre active`} size="small" color="primary" />
              )}
            </Stack>
          </Box>
        </Stack>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {/* <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                          ID
                        </Typography>
                        <Tooltip title="Sortează după ID">
                          <IconButton size="small" onClick={() => handleSortClick('id')}>
                            {sortBy === 'id' && sortOrder === 'desc' ? (
                              <ArrowDownwardOutlined sx={{ fontSize: 18 }} />
                            ) : (
                              <ArrowUpwardOutlined sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell> */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                          Permisiune
                        </Typography>
                        <Tooltip title="Deschide filtre">
                          <IconButton size="small" onClick={openFiltersDialog}>
                            <FilterAltOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sortează după nume">
                          <IconButton size="small" onClick={() => handleSortClick('name')}>
                            {sortBy === 'name' && sortOrder === 'desc' ? (
                              <ArrowDownwardOutlined sx={{ fontSize: 18 }} />
                            ) : (
                              <ArrowUpwardOutlined sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                        Descriere
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                        Acțiuni
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSortedPermissions.map((permission) => (
                    <TableRow key={permission.id} hover>
                      {/* <TableCell>
                        <Chip size="small" label={permission.id} variant="outlined" />
                      </TableCell> */}
                      <TableCell sx={{ fontWeight: 500 }}>{permission.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {permission.description || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Vezi detalii">
                          <IconButton
                            size="small"
                            onClick={() => openDetails(permission)}
                            aria-label="Vezi detalii"
                          >
                            <InfoOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSortedPermissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                          Nu există permisiuni cu aceste criterii.
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={filtersOpen} onClose={closeFiltersDialog} fullWidth maxWidth="sm">
        <DialogTitle>Filtrare permisiuni</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Caută"
              value={filterNameDraft}
              onChange={(event) => setFilterNameDraft(event.target.value)}
              fullWidth
              placeholder="caută după nume sau descriere..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterAltOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ClearOutlined />} onClick={clearFilters} color="inherit">
              Resetează
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={closeFiltersDialog} color="inherit">
              Anulează
            </Button>
            <Button onClick={applyFilters} variant="contained">
              Aplică
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle>Detalii permisiune</DialogTitle>
        <DialogContent>
          {selectedPermission && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedPermission.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Permisiune
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                  {selectedPermission.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Descriere
                </Typography>
                <Typography variant="body1">{selectedPermission.description || '—'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </RequirePermission>
  )
}
