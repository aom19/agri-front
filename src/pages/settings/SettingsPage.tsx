import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import ChangePasswordForm from './ChangePasswordForm'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 680, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Setări
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
            <LockOutlined color="action" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Schimbă parola
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <ChangePasswordForm />
        </CardContent>
      </Card>
    </Box>
  )
}
