import type { FieldOperationStatus } from '../../api/fieldOperation.api'

export const statusLabels: Record<FieldOperationStatus, string> = {
  planned: 'Planificată',
  in_progress: 'În lucru',
  completed: 'Finalizată',
  canceled: 'Anulată',
}
