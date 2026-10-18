import { MenuItem, TextField } from '@mui/material'
import { useFields } from '../../../hooks/useFields'
import { useMachines } from '../../../hooks/useMachines'
import { useOperators } from '../../../hooks/useOperators'
import type { ReportFilterState } from '../reportFilterState'
import ReportFilterBar from './ReportFilterBar'

type ReportFiltersProps = {
  value: ReportFilterState
  onChange: (patch: Partial<ReportFilterState>) => void
  onReset: () => void
}

export default function ReportFilters({ value, onChange, onReset }: ReportFiltersProps) {
  const { data: fields } = useFields()
  const { data: machines } = useMachines()
  const { data: operators } = useOperators()

  return (
    <ReportFilterBar value={value} onChange={onChange} onReset={onReset}>
      <TextField
        select
        size="small"
        label="Teren"
        value={value.fieldId}
        onChange={(event) => onChange({ fieldId: event.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Toate terenurile</MenuItem>
        {(fields ?? []).map((field) => (
          <MenuItem key={field.id} value={field.id}>
            {field.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Mașină"
        value={value.machineId}
        onChange={(event) => onChange({ machineId: event.target.value })}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Toate mașinile</MenuItem>
        {(machines ?? []).map((machine) => (
          <MenuItem key={machine.id} value={String(machine.id)}>
            {machine.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Operator"
        value={value.operatorId}
        onChange={(event) => onChange({ operatorId: event.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Toți operatorii</MenuItem>
        {(operators ?? []).map((operator) => (
          <MenuItem key={operator.id} value={String(operator.id)}>
            {operator.name}
          </MenuItem>
        ))}
      </TextField>
    </ReportFilterBar>
  )
}
