import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { RestartAltOutlined, SearchOutlined } from '@mui/icons-material'
import { Box, Button, Card, InputAdornment, MenuItem, TextField } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { FIELD_OPERATION_STATUSES } from '../../../api/fieldOperation.api'
import { useFields } from '../../../hooks/useFields'
import { useMachines } from '../../../hooks/useMachines'
import { useOperators } from '../../../hooks/useOperators'
import { useHasPermission } from '../../../hooks/usePermissions'
import { operationTypeOptions } from '../../../schemas/operation.schema'
import { statusLabels } from '../status'
import { ACTIVE_STATUSES, type FieldOperationsFilterState } from '../filters'

type Props = {
  value: FieldOperationsFilterState
  onChange: (patch: Partial<FieldOperationsFilterState>) => void
  onReset: () => void
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
}

// Listele de terenuri, mașini și operatori se cer doar de cei care au voie să le vadă
// (operatorul nu are), deci fiecare select își face cererea doar când e afișat.
function FieldSelect({ value, onChange }: SelectProps) {
  const { data: fields } = useFields()
  return (
    <TextField
      select
      size="small"
      label="Teren"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <MenuItem value="">Toate terenurile</MenuItem>
      {(fields ?? []).map((field) => (
        <MenuItem key={field.id} value={field.id}>
          {field.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

function MachineSelect({ value, onChange }: SelectProps) {
  const { data: machines } = useMachines()
  return (
    <TextField
      select
      size="small"
      label="Mașină"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <MenuItem value="">Toate mașinile</MenuItem>
      {(machines ?? []).map((machine) => (
        <MenuItem key={machine.id} value={String(machine.id)}>
          {machine.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

function OperatorSelect({ value, onChange }: SelectProps) {
  const { data: operators } = useOperators()
  return (
    <TextField
      select
      size="small"
      label="Operator"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <MenuItem value="">Toți operatorii</MenuItem>
      {(operators ?? []).map((operator) => (
        <MenuItem key={operator.id} value={String(operator.id)}>
          {operator.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

const DATE_FORMAT = 'YYYY-MM-DD'

// Anul viitor (lucrări planificate din timp) și ultimii cinci.
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 7 }, (_, index) => CURRENT_YEAR + 1 - index)

/** Anul e o scurtătură pentru perioada 1 ian – 31 dec; se deduce din datele alese. */
function selectedYear(from: string, to: string) {
  if (!from && !to) return ''
  const year = from.slice(0, 4)
  const wholeYear = from === `${year}-01-01` && to === `${year}-12-31`
  return wholeYear && YEARS.includes(Number(year)) ? year : 'custom'
}

function yearRange(year: string) {
  return year ? { from: `${year}-01-01`, to: `${year}-12-31` } : { from: '', to: '' }
}

export default function FieldOperationsFilters({ value, onChange, onReset }: Props) {
  const canSeeFields = useHasPermission('fields:read')
  const canSeeMachines = useHasPermission('machines:read')
  const canSeeOperators = useHasPermission('operators:read')
  const hasFilters = Object.values(value).some(Boolean)

  const handleDate = (key: 'from' | 'to') => (date: Dayjs | null) => {
    onChange({ [key]: date && date.isValid() ? date.format(DATE_FORMAT) : '' })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ro">
      <Card component="section" aria-label="Filtre operațiuni" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Caută"
            placeholder="teren, mașină, operator, note…"
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
            sx={{ gridColumn: { sm: 'span 2' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={value.status}
            onChange={(e) => onChange({ status: e.target.value })}
          >
            <MenuItem value="">Toate statusurile</MenuItem>
            <MenuItem value={ACTIVE_STATUSES}>Active (planificate și în lucru)</MenuItem>
            {FIELD_OPERATION_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {statusLabels[status]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Tip operațiune"
            value={value.operationType}
            onChange={(e) => onChange({ operationType: e.target.value })}
          >
            <MenuItem value="">Toate tipurile</MenuItem>
            {operationTypeOptions.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
          {canSeeFields && (
            <FieldSelect value={value.fieldId} onChange={(fieldId) => onChange({ fieldId })} />
          )}
          {canSeeMachines && (
            <MachineSelect
              value={value.machineId}
              onChange={(machineId) => onChange({ machineId })}
            />
          )}
          {canSeeOperators && (
            <OperatorSelect
              value={value.operatorId}
              onChange={(operatorId) => onChange({ operatorId })}
            />
          )}
          <TextField
            select
            size="small"
            label="An"
            value={selectedYear(value.from, value.to)}
            onChange={(e) => onChange(yearRange(e.target.value))}
          >
            <MenuItem value="">Toți anii</MenuItem>
            {YEARS.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
            {/* perioadă aleasă manual: anul nu se aplică, dar selectul are nevoie de o valoare */}
            <MenuItem value="custom" sx={{ display: 'none' }}>
              Perioadă personalizată
            </MenuItem>
          </TextField>
          <DatePicker
            label="Planificată de la"
            value={value.from ? dayjs(value.from) : null}
            onChange={handleDate('from')}
            maxDate={value.to ? dayjs(value.to) : undefined}
            format="DD.MM.YYYY"
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <DatePicker
            label="Până la"
            value={value.to ? dayjs(value.to) : null}
            onChange={handleDate('to')}
            minDate={value.from ? dayjs(value.from) : undefined}
            format="DD.MM.YYYY"
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          {hasFilters && (
            <Button
              size="small"
              variant="text"
              startIcon={<RestartAltOutlined />}
              onClick={onReset}
              sx={{ justifySelf: 'start' }}
            >
              Resetează filtrele
            </Button>
          )}
        </Box>
      </Card>
    </LocalizationProvider>
  )
}
