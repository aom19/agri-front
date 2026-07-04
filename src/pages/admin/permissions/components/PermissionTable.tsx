import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  FilterAltOutlined,
  InfoOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
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

export type Permission = {
  id: number
  name: string
  description: string
}

type PermissionTableProps = {
  permissions: Permission[]
  isLoading: boolean
  sortBy: 'name' | 'id'
  sortOrder: 'asc' | 'desc'
  onOpenFilters: () => void
  onSortClick: (column: 'name' | 'id') => void
  onOpenDetails: (permission: Permission) => void
}

export default function PermissionTable({
  permissions,
  isLoading,
  sortBy,
  sortOrder,
  onOpenFilters,
  onSortClick,
  onOpenDetails,
}: PermissionTableProps) {
  return (
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
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                      Permisiune
                    </Typography>
                    <Tooltip title="Deschide filtre">
                      <IconButton size="small" onClick={onOpenFilters}>
                        <FilterAltOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sortează după nume">
                      <IconButton size="small" onClick={() => onSortClick('name')}>
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
              {permissions.map((permission) => (
                <TableRow key={permission.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{permission.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {permission.description || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Vezi detalii">
                      <IconButton
                        size="small"
                        onClick={() => onOpenDetails(permission)}
                        aria-label="Vezi detalii"
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {permissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
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
  )
}
