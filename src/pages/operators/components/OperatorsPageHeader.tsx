import { AddOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type OperatorsPageHeaderProps = {
  onCreate: () => void
  canWrite: boolean
}

export default function OperatorsPageHeader({ onCreate, canWrite }: OperatorsPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Operatori
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administrare personal operator utilaje.
        </Typography>
      </Box>

      {canWrite && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Operator nou
        </Button>
      )}
    </Stack>
  )
}
