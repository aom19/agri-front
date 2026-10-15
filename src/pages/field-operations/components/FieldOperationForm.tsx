import { useEffect, useMemo } from 'react'
import { Alert, Chip, ListSubheader, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import type { Field } from '../../../api/fields.api'
import type { Machine } from '../../../api/machine.api'
import type { Implement } from '../../../api/implement.api'
import type { Operator } from '../../../api/operator.api'
import type { OperationTemplate } from '../../../api/operation.api'
import { operationTypeOptions, type OperationTypeValue } from '../../../schemas/operation.schema'
import type { FieldCrop } from '../../../api/crops.api'
import { useFieldOperationConflicts } from '../../../hooks/useFieldOperations'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { conflictParamsFromForm, describeConflict } from '../conflict.helpers'
import {
  FIELD_OPERATION_STATUSES,
  type FieldOperationStatus,
} from '../../../api/fieldOperation.api'
import type {
  FieldOperationFormErrors,
  FieldOperationFormMode,
  FieldOperationFormState,
} from '../formState'

type Props = {
  mode: FieldOperationFormMode
  state: FieldOperationFormState
  errors: FieldOperationFormErrors
  fields: Field[]
  operationTemplates: OperationTemplate[]
  machines: Machine[]
  implementItems: Implement[]
  operators: Operator[]
  fieldCrops?: FieldCrop[]
  /** Lucrarea editată: nu intră în verificarea suprapunerilor cu ea însăși. */
  operationId?: number | null
  onChange: (next: FieldOperationFormState) => void
}

const statusLabels: Record<FieldOperationStatus, string> = {
  planned: 'Planificată',
  in_progress: 'În lucru',
  completed: 'Finalizată',
  canceled: 'Anulată',
}

export default function FieldOperationForm({
  mode,
  state,
  errors,
  fields,
  operationTemplates,
  machines,
  implementItems,
  operators,
  fieldCrops = [],
  operationId = null,
  onChange,
}: Props) {
  const readOnly = mode === 'view'
  // Suprapunerile cu alte lucrări pe operator, mașină sau echipament: doar avertisment, salvarea
  // nu e blocată (orele planificate sunt estimări). Pornirea e cea refuzată de API.
  const conflictParamsNow = useMemo(
    () => (readOnly ? null : conflictParamsFromForm(state, operationId)),
    // doar câmpurile care contează: un obiect nou la fiecare randare ar reporni debounce-ul
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      readOnly,
      operationId,
      state.status,
      state.operator_id,
      state.machine_id,
      state.implement_id,
      state.planned_start_at,
      state.planned_end_at,
    ]
  )
  const conflictParams = useDebouncedValue(conflictParamsNow, 400)
  const { data: conflicts } = useFieldOperationConflicts(conflictParams)

  const selectedTemplate = useMemo(
    () =>
      state.operation_template_id
        ? (operationTemplates.find((t) => String(t.id) === state.operation_template_id) ?? null)
        : null,
    [operationTemplates, state.operation_template_id]
  )

  // Culturile terenului ales: cea deschisă e implicită; cele închise rămân disponibile pentru
  // lucrări introduse târziu. Data planificată nu influențează nimic.
  const fieldCropOptions = useMemo(
    () => fieldCrops.filter((fc) => fc.field_id === state.field_id),
    [fieldCrops, state.field_id]
  )
  const openCrop = useMemo(
    () => fieldCropOptions.find((fc) => fc.status === 'open') ?? null,
    [fieldCropOptions]
  )
  const closedCrops = useMemo(
    () => fieldCropOptions.filter((fc) => fc.status !== 'open'),
    [fieldCropOptions]
  )
  const selectedCrop = useMemo(
    () => fieldCropOptions.find((fc) => String(fc.id) === state.field_crop_id) ?? null,
    [fieldCropOptions, state.field_crop_id]
  )
  // la creare, cultura deschisă a terenului se preselectează când lista de culturi ajunge
  useEffect(() => {
    if (mode !== 'create' || state.field_crop_id || !openCrop) return
    onChange({ ...state, field_crop_id: String(openCrop.id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, openCrop?.id, state.field_id])
  const templateOptions = useMemo(() => {
    if (!state.operation_type) return []
    const forType = operationTemplates.filter((t) => t.operation_type === state.operation_type)
    const rank = (t: OperationTemplate) => {
      if (!t.crop_id) return 1
      if (selectedCrop && t.crop_id === selectedCrop.crop_id) return 0
      return 2
    }
    return forType
      .map((template) => ({
        template,
        rank: rank(template),
        tag:
          rank(template) === 0
            ? `recomandat pentru ${template.crop_name ?? 'cultura curentă'}`
            : rank(template) === 2
              ? `pentru ${template.crop_name ?? 'altă cultură'}`
              : '',
      }))
      .sort((a, b) => a.rank - b.rank || a.template.name.localeCompare(b.template.name, 'ro'))
  }, [operationTemplates, state.operation_type, selectedCrop])

  const filteredMachines = useMemo(() => {
    if (!selectedTemplate?.machine_types || selectedTemplate.machine_types.length === 0) {
      return machines
    }
    return machines.filter((m) => selectedTemplate.machine_types!.includes(m.type))
  }, [machines, selectedTemplate])

  const filteredImplements = useMemo(() => {
    if (!selectedTemplate?.implement_types || selectedTemplate.implement_types.length === 0) {
      return implementItems
    }
    return implementItems.filter((i) => selectedTemplate.implement_types!.includes(i.type))
  }, [implementItems, selectedTemplate])

  const patch = <K extends keyof FieldOperationFormState>(
    key: K,
    value: FieldOperationFormState[K]
  ) => {
    onChange({ ...state, [key]: value })
  }

  const handleFieldChange = (value: string) => {
    const field = fields.find((f) => f.id === value)
    const nextArea =
      !state.area_planned_ha && field?.area_ha != null
        ? String(field.area_ha)
        : state.area_planned_ha
    const nextOpenCrop = fieldCrops.find((fc) => fc.field_id === value && fc.status === 'open')
    onChange({
      ...state,
      field_id: value,
      area_planned_ha: nextArea,
      field_crop_id: nextOpenCrop ? String(nextOpenCrop.id) : '',
    })
  }

  const handleOperationTypeChange = (value: OperationTypeValue) => {
    onChange({
      ...state,
      operation_type: value,
      operation_template_id: '',
      machine_id: '',
      implement_id: '',
      operator_id: '',
    })
  }

  const handleTemplateChange = (value: string) => {
    onChange({
      ...state,
      operation_template_id: value,
      machine_id: '',
      implement_id: '',
      operator_id: '',
    })
  }

  const handleMachineChange = (value: string) => {
    onChange({
      ...state,
      machine_id: value,
      operator_id: '',
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ro">
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            required
            label="Teren"
            value={state.field_id}
            onChange={(e) => handleFieldChange(e.target.value)}
            error={!!errors.field_id}
            helperText={errors.field_id}
            disabled={readOnly}
          >
            {fields.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
                {f.area_ha != null ? ` • ${f.area_ha} ha` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            required
            label="Tip operațiune"
            value={state.operation_type}
            onChange={(e) => handleOperationTypeChange(e.target.value as OperationTypeValue)}
            error={!!errors.operation_type}
            helperText={errors.operation_type}
            disabled={readOnly}
          >
            {operationTypeOptions.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Template (opțional)"
            value={state.operation_template_id}
            onChange={(e) => handleTemplateChange(e.target.value)}
            helperText={
              !state.operation_type
                ? 'Alege întâi tipul operațiunii'
                : 'Lasă gol pentru operațiune manuală (fără template)'
            }
            disabled={readOnly || !state.operation_type}
          >
            <MenuItem value="">
              <em>Fără template (manual)</em>
            </MenuItem>
            {templateOptions.map(({ template, tag, rank }) => (
              <MenuItem key={template.id} value={String(template.id)}>
                {template.name}
                {tag ? (
                  <Typography
                    component="span"
                    sx={{
                      ml: 1,
                      fontSize: '0.72rem',
                      color: rank === 0 ? '#1a5c38' : 'text.secondary',
                      fontWeight: rank === 0 ? 700 : 400,
                    }}
                  >
                    · {tag}
                  </Typography>
                ) : null}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Status"
            value={state.status}
            onChange={(e) => patch('status', e.target.value as FieldOperationStatus)}
            disabled={readOnly}
          >
            {FIELD_OPERATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {statusLabels[s]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {state.field_id ? (
          <Stack spacing={1}>
            <TextField
              select
              fullWidth
              label="Cultură"
              value={state.field_crop_id}
              onChange={(e) => patch('field_crop_id', e.target.value)}
              disabled={readOnly}
              helperText={
                selectedCrop
                  ? selectedCrop.status === 'open'
                    ? 'Cultura deschisă a terenului. Costul lucrării intră la ea.'
                    : 'Cultură închisă: folosește-o doar pentru lucrări introduse târziu.'
                  : 'Lucrarea nu intră în costul niciunei culturi.'
              }
            >
              <ListSubheader>Deschisă · implicit</ListSubheader>
              {openCrop ? (
                <MenuItem value={String(openCrop.id)}>
                  {openCrop.crop_name}
                  <Chip size="small" color="success" label={openCrop.season_name} sx={{ ml: 1 }} />
                </MenuItem>
              ) : (
                <MenuItem disabled value="__none_open">
                  <em>Terenul nu are nicio cultură deschisă</em>
                </MenuItem>
              )}
              {closedCrops.length > 0 && (
                <ListSubheader>Închise · pentru lucrări introduse târziu</ListSubheader>
              )}
              {closedCrops.map((fc) => (
                <MenuItem key={fc.id} value={String(fc.id)}>
                  {fc.crop_name}
                  <Chip
                    size="small"
                    color={fc.status === 'compromised' ? 'warning' : 'default'}
                    label={`${fc.season_name} · ${fc.status === 'compromised' ? 'compromisă' : 'închisă'}`}
                    sx={{ ml: 1 }}
                  />
                </MenuItem>
              ))}
              <ListSubheader>Fără cultură</ListSubheader>
              <MenuItem value="">
                <em>Fără cultură · nu intră în niciun cost</em>
              </MenuItem>
            </TextField>
            {!openCrop && !state.field_crop_id && !readOnly ? (
              <Alert severity="warning" sx={{ py: 0 }}>
                Terenul nu are nicio cultură deschisă. Lucrarea se salvează fără cultură și nu intră
                în niciun cost. Deschide o cultură în pagina Culturi sau alege una închisă din
                listă.
              </Alert>
            ) : null}
          </Stack>
        ) : null}

        {selectedTemplate &&
        (selectedTemplate.machine_types?.length || selectedTemplate.implement_types?.length) ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Filtrare activă din template: mașini [
            {selectedTemplate.machine_types?.join(', ') || '-'}] • echipamente [
            {selectedTemplate.implement_types?.join(', ') || '-'}]
          </Typography>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Mașină"
            value={state.machine_id}
            onChange={(e) => handleMachineChange(e.target.value)}
            disabled={readOnly}
          >
            <MenuItem value="">
              <em>Neatribuit</em>
            </MenuItem>
            {filteredMachines.map((m) => (
              <MenuItem key={m.id} value={String(m.id)}>
                {m.name} • {m.type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Echipament"
            value={state.implement_id}
            onChange={(e) => patch('implement_id', e.target.value)}
            disabled={readOnly}
          >
            <MenuItem value="">
              <em>Neatribuit</em>
            </MenuItem>
            {filteredImplements.map((i) => (
              <MenuItem key={i.id} value={String(i.id)}>
                {i.name} • {i.type}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Operator"
            value={state.operator_id}
            onChange={(e) => patch('operator_id', e.target.value)}
            disabled={readOnly}
          >
            <MenuItem value="">
              <em>Neatribuit</em>
            </MenuItem>
            {operators.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>
                {o.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Suprafață (ha)"
            type="number"
            value={state.area_planned_ha}
            onChange={(e) => patch('area_planned_ha', e.target.value)}
            error={!!errors.area_planned_ha}
            helperText={errors.area_planned_ha ?? 'Se completează automat din teren'}
            disabled={readOnly}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <DateTimePicker
            label="Start planificat"
            value={state.planned_start_at ? dayjs(state.planned_start_at) : null}
            onChange={(v: Dayjs | null) =>
              patch('planned_start_at', v ? v.format('YYYY-MM-DDTHH:mm') : '')
            }
            disabled={readOnly}
            ampm={false}
            format="DD.MM.YYYY HH:mm"
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.planned_start_at,
                helperText: errors.planned_start_at,
              },
            }}
          />
          <DateTimePicker
            label="Sfârșit planificat"
            value={state.planned_end_at ? dayjs(state.planned_end_at) : null}
            onChange={(v: Dayjs | null) =>
              patch('planned_end_at', v ? v.format('YYYY-MM-DDTHH:mm') : '')
            }
            disabled={readOnly}
            ampm={false}
            format="DD.MM.YYYY HH:mm"
            minDateTime={state.planned_start_at ? dayjs(state.planned_start_at) : undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.planned_end_at,
                helperText: errors.planned_end_at,
              },
            }}
          />
        </Stack>

        {conflictParams && conflicts && conflicts.length > 0 ? (
          <Alert severity="warning">
            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
              Intervalul se suprapune cu{' '}
              {conflicts.length === 1 ? 'o lucrare' : `${conflicts.length} lucrări`} care folosesc
              aceleași resurse:
            </Typography>
            {conflicts.map((conflict) => (
              <Typography key={conflict.operation_id} sx={{ fontSize: '0.82rem' }}>
                {describeConflict(conflict)}
              </Typography>
            ))}
            <Typography sx={{ fontSize: '0.78rem', mt: 0.5 }}>
              Poți salva oricum; lucrarea nu va putea porni cât timp una dintre ele e în lucru.
            </Typography>
          </Alert>
        ) : null}

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Note"
          value={state.notes}
          onChange={(e) => patch('notes', e.target.value)}
          disabled={readOnly}
        />
      </Stack>
    </LocalizationProvider>
  )
}
