import type { ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { RestartAltOutlined } from '@mui/icons-material'
import { Box, Button, Card, Chip, MenuItem, Stack, TextField } from '@mui/material'
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

/** Clasa câmpurilor care ocupă tot rândul pe telefon (selecturile din `children` o primesc și ele). */
export const WIDE = 'report-filter-wide'

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
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
          {/* Pe telefon: datele una lângă alta, restul câmpurilor pe toată lățimea. */}
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              alignItems: 'center',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fill, minmax(170px, 1fr))' },
              [`& .${WIDE}`]: { gridColumn: { xs: '1 / -1', sm: 'auto' } },
            }}
          >
            <DatePicker
              label="De la"
              value={dayjs(value.from)}
              onChange={handleDate('from')}
              maxDate={dayjs(value.to)}
              format="DD.MM.YYYY"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Până la"
              value={dayjs(value.to)}
              onChange={handleDate('to')}
              minDate={dayjs(value.from)}
              format="DD.MM.YYYY"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Tip operațiune"
              className={WIDE}
              value={value.operationType}
              onChange={(event) => onChange({ operationType: event.target.value })}
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
              className={WIDE}
              sx={{ justifySelf: 'start' }}
            >
              Resetează
            </Button>
          </Box>
        </Stack>
      </Card>
    </LocalizationProvider>
  )
}
