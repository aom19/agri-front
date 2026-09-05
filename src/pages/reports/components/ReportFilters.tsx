import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { RestartAltOutlined } from '@mui/icons-material'
import { Button, Card, Chip, MenuItem, Stack, TextField } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useFields } from '../../../hooks/useFields'
import { useMachines } from '../../../hooks/useMachines'
import { useOperators } from '../../../hooks/useOperators'
import { useOperationTypes } from '../../../hooks/useOperations'
import { REPORT_PRESETS, type ReportFilterState } from '../reportFilterState'

type ReportFiltersProps = {
  value: ReportFilterState
  onChange: (patch: Partial<ReportFilterState>) => void
  onReset: () => void
}

const DATE_FORMAT = 'YYYY-MM-DD'

export default function ReportFilters({ value, onChange, onReset }: ReportFiltersProps) {
  const { data: fields } = useFields()
  const { data: operationTypes } = useOperationTypes()
  const { data: machines } = useMachines()
  const { data: operators } = useOperators()

  const handleDate = (key: 'from' | 'to') => (date: Dayjs | null) => {
    if (!date || !date.isValid()) return
    onChange({ [key]: date.format(DATE_FORMAT) })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ro">
      <Card component="section" aria-label="Filtre raport" sx={{ p: 2, mb: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {REPORT_PRESETS.map((preset) => {
              const range = preset.range()
              const active = range.from === value.from && range.to === value.to
              return (
                <Chip
                  key={preset.key}
                  label={preset.label}
                  size="small"
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => onChange(range)}
                />
              )
            })}
          </Stack>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexWrap: 'wrap', rowGap: 1.5, alignItems: 'center' }}
          >
            <DatePicker
              label="De la"
              value={dayjs(value.from)}
              onChange={handleDate('from')}
              maxDate={dayjs(value.to)}
              format="DD.MM.YYYY"
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
            <DatePicker
              label="Până la"
              value={dayjs(value.to)}
              onChange={handleDate('to')}
              minDate={dayjs(value.from)}
              format="DD.MM.YYYY"
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
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
              label="Tip operațiune"
              value={value.operationTypeId}
              onChange={(event) => onChange({ operationTypeId: event.target.value })}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Toate tipurile</MenuItem>
              {(operationTypes ?? []).map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name}
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
            <Button
              size="small"
              variant="text"
              startIcon={<RestartAltOutlined />}
              onClick={onReset}
              sx={{ ml: 'auto' }}
            >
              Resetează
            </Button>
          </Stack>
        </Stack>
      </Card>
    </LocalizationProvider>
  )
}
