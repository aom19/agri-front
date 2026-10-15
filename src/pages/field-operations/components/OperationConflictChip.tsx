import { EventBusyOutlined } from '@mui/icons-material'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import type { FieldOperationConflict } from '../../../api/fieldOperation.api'
import { describeConflict } from '../conflict.helpers'

type Props = {
  conflicts?: FieldOperationConflict[] | null
}

/** Chip de avertisment când lucrarea împarte operatorul, mașina sau echipamentul cu altă lucrare
 * în același interval; tooltip-ul spune cu care. */
export default function OperationConflictChip({ conflicts }: Props) {
  if (!conflicts || conflicts.length === 0) return null
  return (
    <Tooltip
      title={
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>
            Se suprapune cu:
          </Typography>
          {conflicts.map((conflict) => (
            <Typography key={conflict.operation_id} sx={{ fontSize: '0.78rem' }}>
              {describeConflict(conflict)}
            </Typography>
          ))}
        </Box>
      }
    >
      <Chip
        icon={<EventBusyOutlined />}
        label={conflicts.length === 1 ? 'Suprapunere' : `${conflicts.length} suprapuneri`}
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontWeight: 700 }}
      />
    </Tooltip>
  )
}
