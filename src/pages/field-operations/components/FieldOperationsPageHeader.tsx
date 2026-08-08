import { AddOutlined, BuildOutlined } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

type Props = {
  onCreate: () => void
  canWrite: boolean
}

export default function FieldOperationsPageHeader({ onCreate, canWrite }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
    >
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <BuildOutlined sx={{ color: '#1a5c38' }} />
          <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: '#0d1f17' }}>
            Operațiuni pe teren
          </Typography>
        </Stack>
        <Typography sx={{ color: 'text.secondary', maxWidth: 720 }}>
          Planifică operațiunile agricole pe terenuri, alege template sau introdu manual.
        </Typography>
      </Box>

      {canWrite && (
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={onCreate}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          Operațiune nouă
        </Button>
      )}
    </Stack>
  )
}
