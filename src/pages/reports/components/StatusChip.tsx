import { Chip } from '@mui/material'
import { NEUTRAL_INK, OPERATION_STATUS_META, OPERATION_STATUS_SINGULAR } from '../reportUtils'

export default function StatusChip({ status }: { status: string }) {
  const meta = OPERATION_STATUS_META[status]
  return (
    <Chip
      size="small"
      label={OPERATION_STATUS_SINGULAR[status] ?? status}
      sx={{
        bgcolor: `${meta?.color ?? NEUTRAL_INK}1f`,
        color: '#0d1f17',
        fontWeight: 600,
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: meta?.color ?? NEUTRAL_INK,
          ml: 1,
          mr: -0.5,
        },
      }}
    />
  )
}
