import { Chip } from '@mui/material'
import type { FieldCrop, FieldCropStatus } from '../../../api/crops.api'
import { formatIsoDay } from '../../../utils/dateFormat'

const fieldCropStatusMeta: Record<
  FieldCropStatus,
  { label: string; color: 'success' | 'default' | 'warning' }
> = {
  open: { label: 'Deschisă', color: 'success' },
  closed: { label: 'Închisă', color: 'default' },
  compromised: { label: 'Compromisă', color: 'warning' },
}

export default function FieldCropStatusChip({
  item,
}: {
  item: Pick<FieldCrop, 'status' | 'closed_at'>
}) {
  const meta = fieldCropStatusMeta[item.status] ?? fieldCropStatusMeta.open
  const label =
    item.status === 'open' || !item.closed_at
      ? meta.label
      : `${meta.label} · ${formatIsoDay(item.closed_at)}`
  return <Chip size="small" color={meta.color} label={label} />
}
