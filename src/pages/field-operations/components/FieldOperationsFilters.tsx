import { useState, type ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { CloseOutlined, SearchOutlined, TuneOutlined } from '@mui/icons-material'
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useFields } from '../../../hooks/useFields'
import { useMachines } from '../../../hooks/useMachines'
import { useOperators } from '../../../hooks/useOperators'
import { useHasPermission } from '../../../hooks/usePermissions'
import { operationTypeOptions } from '../../../schemas/operation.schema'
import { formatIsoDay } from '../../../utils/dateFormat'
import type { FieldOperationsFilterState } from '../filters'

type Props = {
  value: FieldOperationsFilterState
  onChange: (patch: Partial<FieldOperationsFilterState>) => void
  onReset: () => void
}

type Option = { value: string; label: string }

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

// Listele de terenuri, mașini și operatori se cer doar de cei care au voie să le vadă
// (operatorul nu are): hook-urile stau în componente afișate doar cu permisiunea respectivă.
function useEntityOptions() {
  const canSeeFields = useHasPermission('fields:read')
  const canSeeMachines = useHasPermission('machines:read')
  const canSeeOperators = useHasPermission('operators:read')
  return { canSeeFields, canSeeMachines, canSeeOperators }
}

type OptionsProps = { render: (options: Option[]) => ReactNode }

function FieldOptions({ render }: OptionsProps) {
  const { data } = useFields()
  return <>{render((data ?? []).map((f) => ({ value: f.id, label: f.name })))}</>
}

function MachineOptions({ render }: OptionsProps) {
  const { data } = useMachines()
  return <>{render((data ?? []).map((m) => ({ value: String(m.id), label: m.name })))}</>
}

function OperatorOptions({ render }: OptionsProps) {
  const { data } = useOperators()
  return <>{render((data ?? []).map((o) => ({ value: String(o.id), label: o.name })))}</>
}

function SelectField({
  label,
  allLabel,
  value,
  onChange,
  options,
}: {
  label: string
  allLabel: string
  value: string
  onChange: (value: string) => void
  options: Option[]
}) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={options.some((o) => o.value === value) ? value : ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

/** Câmpurile din panoul „Filtre”: tot ce nu e mereu la vedere. */
function MoreFilters({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const { canSeeFields, canSeeMachines, canSeeOperators } = useEntityOptions()
  const handleDate = (key: 'from' | 'to') => (date: Dayjs | null) => {
    onChange({ [key]: date && date.isValid() ? date.format(DATE_FORMAT) : '' })
  }

  return (
    <Stack spacing={2}>
      <SelectField
        label="Tip operațiune"
        allLabel="Toate tipurile"
        value={value.operationType}
        onChange={(operationType) => onChange({ operationType })}
        options={operationTypeOptions.map((t) => ({ value: t.value, label: t.label }))}
      />
      {canSeeFields && (
        <FieldOptions
          render={(options) => (
            <SelectField
              label="Teren"
              allLabel="Toate terenurile"
              value={value.fieldId}
              onChange={(fieldId) => onChange({ fieldId })}
              options={options}
            />
          )}
        />
      )}
      {canSeeMachines && (
        <MachineOptions
          render={(options) => (
            <SelectField
              label="Mașină"
              allLabel="Toate mașinile"
              value={value.machineId}
              onChange={(machineId) => onChange({ machineId })}
              options={options}
            />
          )}
        />
      )}
      {canSeeOperators && (
        <OperatorOptions
          render={(options) => (
            <SelectField
              label="Operator"
              allLabel="Toți operatorii"
              value={value.operatorId}
              onChange={(operatorId) => onChange({ operatorId })}
              options={options}
            />
          )}
        />
      )}
      <Box>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
          Perioadă personalizată (data planificată)
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <DatePicker
            label="De la"
            value={value.from ? dayjs(value.from) : null}
            onChange={handleDate('from')}
            maxDate={value.to ? dayjs(value.to) : undefined}
            format="DD.MM.YYYY"
            slotProps={{
              textField: { size: 'small', fullWidth: true },
              field: { clearable: true },
            }}
          />
          <DatePicker
            label="Până la"
            value={value.to ? dayjs(value.to) : null}
            onChange={handleDate('to')}
            minDate={value.from ? dayjs(value.from) : undefined}
            format="DD.MM.YYYY"
            slotProps={{
              textField: { size: 'small', fullWidth: true },
              field: { clearable: true },
            }}
          />
        </Stack>
      </Box>
    </Stack>
  )
}

/** Eticheta chip-ului unui filtru pe entitate: numele din lista deja încărcată. */
function EntityChip({
  prefix,
  value,
  options,
  onDelete,
}: {
  prefix: string
  value: string
  options: Option[]
  onDelete: () => void
}) {
  const label = options.find((o) => o.value === value)?.label ?? '…'
  return <Chip size="small" label={`${prefix}: ${label}`} onDelete={onDelete} />
}

/** Filtrele active (în afară de status, care are tab-urile lui), fiecare cu ✕. */
function ActiveFilterChips({ value, onChange, onReset }: Props) {
  const { canSeeFields, canSeeMachines, canSeeOperators } = useEntityOptions()
  const year = selectedYear(value.from, value.to)
  const typeLabel = operationTypeOptions.find((t) => t.value === value.operationType)?.label
  const chips: ReactNode[] = []

  if (value.q) {
    chips.push(
      <Chip
        key="q"
        size="small"
        label={`Caută: „${value.q}”`}
        onDelete={() => onChange({ q: '' })}
      />
    )
  }
  if (typeLabel) {
    chips.push(
      <Chip
        key="type"
        size="small"
        label={`Tip: ${typeLabel}`}
        onDelete={() => onChange({ operationType: '' })}
      />
    )
  }
  if (value.fieldId && canSeeFields) {
    chips.push(
      <FieldOptions
        key="field"
        render={(options) => (
          <EntityChip
            prefix="Teren"
            value={value.fieldId}
            options={options}
            onDelete={() => onChange({ fieldId: '' })}
          />
        )}
      />
    )
  }
  if (value.machineId && canSeeMachines) {
    chips.push(
      <MachineOptions
        key="machine"
        render={(options) => (
          <EntityChip
            prefix="Mașină"
            value={value.machineId}
            options={options}
            onDelete={() => onChange({ machineId: '' })}
          />
        )}
      />
    )
  }
  if (value.operatorId && canSeeOperators) {
    chips.push(
      <OperatorOptions
        key="operator"
        render={(options) => (
          <EntityChip
            prefix="Operator"
            value={value.operatorId}
            options={options}
            onDelete={() => onChange({ operatorId: '' })}
          />
        )}
      />
    )
  }
  if (year === 'custom') {
    const from = value.from ? formatIsoDay(value.from) : '…'
    const to = value.to ? formatIsoDay(value.to) : '…'
    chips.push(
      <Chip
        key="period"
        size="small"
        label={`Perioadă: ${from} – ${to}`}
        onDelete={() => onChange({ from: '', to: '' })}
      />
    )
  }
  if (chips.length === 0) return null

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center', mt: 1.5 }}
      aria-label="Filtre active"
    >
      {chips}
      <Button size="small" variant="text" onClick={onReset} sx={{ ml: 'auto' }}>
        Resetează tot
      </Button>
    </Stack>
  )
}

/** Câte filtre din panoul „Filtre” sunt active (pentru badge-ul butonului). */
function countPanelFilters(value: FieldOperationsFilterState) {
  const custom = selectedYear(value.from, value.to) === 'custom' ? 1 : 0
  return (
    [value.operationType, value.fieldId, value.machineId, value.operatorId].filter(Boolean).length +
    custom
  )
}

export default function FieldOperationsFilters({ value, onChange, onReset }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const panelCount = countPanelFilters(value)
  const close = () => setAnchor(null)

  const panel = (
    <Box sx={{ p: 2.5, width: { xs: 'auto', sm: 360 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>Filtre</Typography>
        <IconButton size="small" onClick={close} aria-label="Închide filtrele">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Stack>
      <MoreFilters value={value} onChange={onChange} />
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        <Button
          size="small"
          onClick={() =>
            onChange({
              operationType: '',
              fieldId: '',
              machineId: '',
              operatorId: '',
              ...(selectedYear(value.from, value.to) === 'custom' ? { from: '', to: '' } : {}),
            })
          }
          disabled={panelCount === 0}
        >
          Golește
        </Button>
        <Button size="small" variant="contained" onClick={close}>
          Gata
        </Button>
      </Stack>
    </Box>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ro">
      <Box component="section" aria-label="Filtre operațiuni" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Caută teren, mașină, operator, note…"
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
            sx={{ flex: 1, bgcolor: 'background.paper' }}
            slotProps={{
              htmlInput: { 'aria-label': 'Caută operațiuni' },
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
            value={selectedYear(value.from, value.to)}
            onChange={(e) => onChange(yearRange(e.target.value === 'custom' ? '' : e.target.value))}
            sx={{ width: { xs: 110, sm: 150 }, bgcolor: 'background.paper' }}
            slotProps={{
              htmlInput: { 'aria-label': 'An' },
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return 'Toți anii'
                  if (selected === 'custom') return 'Perioadă'
                  return `An ${selected as string}`
                },
              },
            }}
          >
            <MenuItem value="">Toți anii</MenuItem>
            {YEARS.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
            {/* perioadă aleasă manual: selectul are nevoie de o valoare, dar nu e o opțiune */}
            <MenuItem value="custom" sx={{ display: 'none' }}>
              Perioadă personalizată
            </MenuItem>
          </TextField>
          <Badge badgeContent={panelCount} color="primary">
            <Button
              variant={panelCount > 0 ? 'contained' : 'outlined'}
              startIcon={<TuneOutlined />}
              onClick={(e) => setAnchor(e.currentTarget)}
              aria-haspopup="dialog"
              aria-expanded={open}
              sx={{ whiteSpace: 'nowrap', minWidth: 0, px: { xs: 1.25, sm: 2 } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Filtre
              </Box>
            </Button>
          </Badge>
        </Stack>

        <ActiveFilterChips value={value} onChange={onChange} onReset={onReset} />

        {isMobile ? (
          <Drawer
            anchor="bottom"
            open={open}
            onClose={close}
            slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
          >
            {panel}
          </Drawer>
        ) : (
          <Popover
            open={open}
            anchorEl={anchor}
            onClose={close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { mt: 1 } } }}
          >
            {panel}
          </Popover>
        )}
      </Box>
    </LocalizationProvider>
  )
}
