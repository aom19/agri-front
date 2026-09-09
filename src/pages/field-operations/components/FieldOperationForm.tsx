import { useMemo } from 'react'
import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import type { Field } from '../../../api/fields.api'
import type { Machine } from '../../../api/machine.api'
import type { Implement } from '../../../api/implement.api'
import type { Operator } from '../../../api/operator.api'
import type { OperationTemplate, OperationType } from '../../../api/operation.api'
import type { FieldCrop } from '../../../api/crops.api'
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
  operationTypes: OperationType[]
  operationTemplates: OperationTemplate[]
  machines: Machine[]
  implementItems: Implement[]
  operators: Operator[]
  fieldCrops?: FieldCrop[]
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
  operationTypes,
  operationTemplates,
  machines,
  implementItems,
  operators,
  fieldCrops = [],
  onChange,
}: Props) {
  const readOnly = mode === 'view'

  const selectedTemplate = useMemo(
    () =>
      state.operation_template_id
        ? (operationTemplates.find((t) => String(t.id) === state.operation_template_id) ?? null)
        : null,
    [operationTemplates, state.operation_template_id]
  )

  // Cultura de pe terenul ales, în sezonul în care cade data planificată (sau azi).
  const detectedCrop = useMemo(() => {
    if (!state.field_id) return null
    const reference = state.planned_start_at
      ? state.planned_start_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
    return (
      fieldCrops.find(
        (fc) =>
          fc.field_id === state.field_id &&
          fc.season_start <= reference &&
          fc.season_end >= reference
      ) ?? null
    )
  }, [fieldCrops, state.field_id, state.planned_start_at])
  const templateOptions = useMemo(() => {
    if (!state.operation_type_id) return []
    const forType = operationTemplates.filter(
      (t) => String(t.operation_type_id) === state.operation_type_id
    )
    const rank = (t: OperationTemplate) => {
      if (!t.crop_id) return 1
      if (detectedCrop && t.crop_id === detectedCrop.crop_id) return 0
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
  }, [operationTemplates, state.operation_type_id, detectedCrop])

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

  const selectedMachine = useMemo(
    () =>
      state.machine_id ? (machines.find((m) => String(m.id) === state.machine_id) ?? null) : null,
    [machines, state.machine_id]
  )

  const filteredOperators = useMemo(() => {
    if (!selectedMachine) return operators
    return operators.filter(
      (o) =>
        !o.allowed_machine_types?.length || o.allowed_machine_types.includes(selectedMachine.type)
    )
  }, [operators, selectedMachine])

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
    onChange({
      ...state,
      field_id: value,
      area_planned_ha: nextArea,
    })
  }

  const handleOperationTypeChange = (value: string) => {
    onChange({
      ...state,
      operation_type_id: value,
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
            value={state.operation_type_id}
            onChange={(e) => handleOperationTypeChange(e.target.value)}
            error={!!errors.operation_type_id}
            helperText={errors.operation_type_id}
            disabled={readOnly}
          >
            {operationTypes.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.name}
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
              !state.operation_type_id
                ? 'Alege întâi tipul operațiunii'
                : 'Lasă gol pentru operațiune manuală (fără template)'
            }
            disabled={readOnly || !state.operation_type_id}
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
          <Typography variant="caption" sx={{ color: detectedCrop ? '#1a5c38' : 'text.secondary' }}>
            {detectedCrop
              ? `Cultură pe teren: ${detectedCrop.crop_name} (${detectedCrop.season_name}). Operațiunea va fi legată automat de această cultură.`
              : 'Terenul nu are o cultură atribuită în sezonul datei planificate; operațiunea nu va fi legată de o cultură.'}
          </Typography>
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
            {filteredOperators.map((o) => (
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
