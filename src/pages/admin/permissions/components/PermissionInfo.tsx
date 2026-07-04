import { Box, Stack, Typography } from '@mui/material'
import type { Permission } from './PermissionTable'

type SinglePermissionInfoProps = {
  selectedPermission: Permission
}

export const SinglePermissionInfo = ({ selectedPermission }: SinglePermissionInfoProps) => {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Box>
        <Typography variant="h6" color="text.secondary">
          ID
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {selectedPermission.id}
        </Typography>
      </Box>
      <Box>
        <Typography variant="h6" color="text.secondary">
          Permisiune
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
          {selectedPermission.name}
        </Typography>
      </Box>
      <Box>
        <Typography variant="h6" color="text.secondary">
          Descriere
        </Typography>
        <Typography variant="body1">{selectedPermission.description || '—'}</Typography>
      </Box>
    </Stack>
  )
}
