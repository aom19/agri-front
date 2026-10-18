/** Filtrele listei, așa cum stau în URL; toate se aplică în API. */
export type FieldOperationsFilterState = {
  q: string
  status: string
  operationType: string
  fieldId: string
  machineId: string
  operatorId: string
  /** Începutul planificat, zile YYYY-MM-DD (inclusiv). */
  from: string
  to: string
}

export const EMPTY_FIELD_OPERATIONS_FILTERS: FieldOperationsFilterState = {
  q: '',
  status: '',
  operationType: '',
  fieldId: '',
  machineId: '',
  operatorId: '',
  from: '',
  to: '',
}

/** Statusurile „active”, ca o singură opțiune: ce mai e de făcut. */
export const ACTIVE_STATUSES = 'planned,in_progress'

export const FILTER_PARAMS: Record<keyof FieldOperationsFilterState, string> = {
  q: 'q',
  status: 'status',
  operationType: 'operation_type',
  fieldId: 'field_id',
  machineId: 'machine_id',
  operatorId: 'operator_id',
  from: 'from',
  to: 'to',
}

/** Miezul nopții (ora locală) al zilei YYYY-MM-DD, plus `addDays`, ca ISO pentru API. */
export function dayStart(day: string, addDays = 0) {
  const date = new Date(`${day}T00:00:00`)
  date.setDate(date.getDate() + addDays)
  return date.toISOString()
}
