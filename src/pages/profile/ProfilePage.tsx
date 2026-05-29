import { useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CameraAltOutlined, SaveOutlined } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProfile, useUpdateProfile, useUploadPhoto } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/auth.store'

const schema = z.object({
  first_name: z.string().min(1, 'Prenumele este obligatoriu'),
  last_name: z.string().min(1, 'Numele este obligatoriu'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format invalid (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    },
  })

  const onSubmit = handleSubmit((data) => {
    updateProfile.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth || undefined,
      },
      {
        onSuccess: (p) =>
          reset({
            first_name: p.first_name,
            last_name: p.last_name,
            date_of_birth: p.date_of_birth ?? '',
          }),
      }
    )
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    uploadPhoto.mutate(file, { onSuccess: () => setPhotoPreview(null) })
  }

  const avatarSrc = photoPreview ?? profile?.profile_photo ?? undefined

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Profilul meu
      </Typography>

      <Grid container spacing={3}>
        {/* Avatar card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Stack sx={{ alignItems: 'center', gap: 2, py: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  {isLoading ? (
                    <CircularProgress size={96} />
                  ) : (
                    <Avatar
                      src={avatarSrc}
                      sx={{ width: 120, height: 120, fontSize: '2rem', bgcolor: 'primary.main' }}
                    >
                      {profile?.first_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
                    </Avatar>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 28,
                      height: 28,
                    }}
                  >
                    {uploadPhoto.isPending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <CameraAltOutlined sx={{ fontSize: 14 }} />
                    )}
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleFileChange}
                  />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {profile?.first_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                    {user?.role}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Form card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Informații personale
              </Typography>
              <Box component="form" onSubmit={onSubmit}>
                <Stack sx={{ gap: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Prenume"
                        fullWidth
                        {...register('first_name')}
                        error={!!errors.first_name}
                        helperText={errors.first_name?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Nume"
                        fullWidth
                        {...register('last_name')}
                        error={!!errors.last_name}
                        helperText={errors.last_name?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <TextField
                        label="Email"
                        fullWidth
                        value={user?.email ?? ''}
                        disabled
                        helperText="Email-ul nu poate fi modificat"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Data nașterii"
                        fullWidth
                        placeholder="YYYY-MM-DD"
                        {...register('date_of_birth')}
                        error={!!errors.date_of_birth}
                        helperText={errors.date_of_birth?.message ?? 'Opțional, format: 2000-01-31'}
                      />
                    </Grid>{' '}
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        updateProfile.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveOutlined />
                        )
                      }
                      disabled={!isDirty || updateProfile.isPending}
                    >
                      Salvează
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
