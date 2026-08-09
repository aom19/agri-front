import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Machine } from '../../../api/machine.api'
import {
  fuelTypeOptions,
  machineStatusOptions,
  machineTypeOptions,
  type FuelTypeValue,
  type MachineStatusValue,
  type MachineTypeValue,
} from '../../../schemas/machine.schema'

type MachinesTableProps = {
  machines: Machine[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onView: (machine: Machine) => void
  onEdit: (machine: Machine) => void
  onDelete: (machine: Machine) => void
}

function statusColor(status: string): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'maintenance') return 'warning'
  return 'default'
}

const machineTypeLabelByValue = new Map(machineTypeOptions.map((option) => [option.value, option.label]))
const fuelTypeLabelByValue = new Map(fuelTypeOptions.map((option) => [option.value, option.label]))
const machineStatusLabelByValue = new Map(machineStatusOptions.map((option) => [option.value, option.label]))

export default function MachinesTable({
  machines,
  isLoading,
  canWrite,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: MachinesTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Cod</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Nume</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Tip</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Brand / Model</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Combustibil</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>Status</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {machines.map((machine) => (
              <TableRow key={machine.id} hover>
                <TableCell>{machine.code}</TableCell>
                <TableCell>{machine.name}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      machineTypeLabelByValue.get(machine.type as MachineTypeValue) ?? machine.type
                    }
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {machine.brand || '-'} / {machine.model || '-'}
                </TableCell>
                <TableCell>
                  {fuelTypeLabelByValue.get((machine.fuel_type ?? '') as FuelTypeValue) ??
                    machine.fuel_type ??
                    '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      machineStatusLabelByValue.get(machine.status as MachineStatusValue) ??
                      machine.status
                    }
                    size="small"
                    color={statusColor(machine.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Vezi detalii">
                    <IconButton
                      size="small"
                      onClick={() => onView(machine)}
                      aria-label="Vezi detalii"
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {canWrite && (
                    <Tooltip title="Editează mașina">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(machine)}
                        aria-label="Editează mașina"
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canDelete && (
                    <Tooltip title="Șterge mașina">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(machine)}
                        aria-label="Șterge mașina"
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {machines.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Nu există mașini pentru filtrul curent.
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
