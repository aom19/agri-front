import type { ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { RestartAltOutlined } from '@mui/icons-material'
import { Button, Card, Chip, MenuItem, Stack, TextField } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { operationTypeOptions } from '../../../schemas/operation.schema'
import { REPORT_PRESETS, type ReportFilterState } from '../reportFilterState'

type ReportFilterBarProps = {
  value: Pick<ReportFilterState, 'from' | 'to' | 'operationType'>
  onChange: (patch: Partial<ReportFilterState>) => void
  onReset: () => void
  /** Filtre suplimentare (teren, mașină, operator), afișate după tipul operațiunii. */
  children?: ReactNode
}

const DATE_FORMAT = 'YYYY-MM-DD'

/** Perioada (presetări + date) și tipul operațiunii: filtrele comune tuturor rapoartelor. */
export default function ReportFilterBar({
  value,
  onChange,
  onReset,
  children,
}: ReportFilterBarProps) {
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
              label="Tip operațiune"
              value={value.operationType}
              onChange={(event) => onChange({ operationType: event.target.value })}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Toate tipurile</MenuItem>
              {operationTypeOptions.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            {children}
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
