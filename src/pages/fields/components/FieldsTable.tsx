import {
  DeleteOutlined,
  EditOutlined,
  FilterAltOutlined,
  PlaceOutlined,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Field } from '../../../api/fields.api'

type FieldsTableProps = {
  fields: Field[]
  isLoading: boolean
  totalFilteredArea: number
  sortBy: 'name' | 'area'
  sortOrder: 'asc' | 'desc'
  onOpenFilters: () => void
  onSortClick: (column: 'name' | 'area') => void
  onEdit: (field: Field) => void
  onDelete: (id: string) => void
  getPointsCount: (field: Field) => number
}

export default function FieldsTable({
  fields,
  isLoading,
  totalFilteredArea,
  sortBy,
  sortOrder,
  onOpenFilters,
  onSortClick,
  onEdit,
  onDelete,
  getPointsCount,
}: FieldsTableProps) {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                    Nume
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
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.1 }}>
                    Suprafață (ha)
                  </Typography>
                  <Tooltip title="Deschide filtre">
                    <IconButton size="small" onClick={onOpenFilters}>
                      <FilterAltOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sortează după suprafață">
                    <IconButton size="small" onClick={() => onSortClick('area')}>
                      {sortBy === 'area' && sortOrder === 'desc' ? (
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
                  Vârfuri
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
            {fields.map((field) => (
              <TableRow key={field.id} hover>
                <TableCell>{field.name}</TableCell>
                <TableCell>{field.area_ha == null ? '—' : field.area_ha.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={<PlaceOutlined />}
                    label={`${getPointsCount(field)} puncte`}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(field)} aria-label="Editează terenul">
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => onDelete(field.id)}
                    aria-label="Șterge terenul"
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu există terenuri încă.
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Total (filtrat)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{totalFilteredArea.toFixed(2)} ha</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}