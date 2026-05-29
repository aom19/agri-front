import { useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  CameraAltOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CalendarTodayOutlined,
  BadgeOutlined,
  EmailOutlined,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ro'
import { useProfile, useUpdateProfile, useUploadPhoto } from '../../hooks/useProfile'

const schema = z.object({
  first_name: z.string().min(1, 'Prenumele este obligatoriu'),
  last_name: z.string().min(1, 'Numele este obligatoriu'),
  date_of_birth: z
    .instanceof(dayjs as unknown as typeof Dayjs)
    .nullable()
    .optional(),
})

type FormValues = z.infer<typeof schema>

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return dayjs(iso).locale('ro').format('D MMMM YYYY, HH:mm')
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: 'Administrator',
    operator: 'Operator',
    manager: 'Manager',
  }
  return map[role] ?? role
}

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      date_of_birth: profile?.date_of_birth ? dayjs(profile.date_of_birth) : null,
    },
  })

  const onSubmit = handleSubmit((data) => {
    updateProfile.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth ? data.date_of_birth.format('YYYY-MM-DD') : undefined,
      },
      {
        onSuccess: (p) => {
          reset({
            first_name: p.first_name,
            last_name: p.last_name,
            date_of_birth: p.date_of_birth ? dayjs(p.date_of_birth) : null,
          })
          setEditing(false)
        },
      }
    )
  })

  const handleCancel = () => {
    reset()
    setEditing(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    uploadPhoto.mutate(file, { onSuccess: () => setPhotoPreview(null) })
  }

  const avatarSrc = photoPreview ?? (profile?.profile_photo || undefined)
  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`
    : (profile?.email ?? '')

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ro">
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Profilul meu
          </Typography>
          {!editing ? (
            <Button
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              Editează
            </Button>
          ) : (
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Anulează
              </Button>
              <Button
                variant="contained"
                startIcon={
                  updateProfile.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveOutlined />
                  )
                }
                onClick={onSubmit}
                disabled={!isDirty || updateProfile.isPending}
              >
                Salvează
              </Button>
            </Stack>
          )}
        </Stack>

        <Grid container spacing={3}>
          {/* Avatar + info card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack sx={{ alignItems: 'center', gap: 2, py: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    {isLoading ? (
                      <CircularProgress size={120} />
                    ) : (
                      <Avatar
                        src={avatarSrc}
                        alt={profile?.first_name ? `${profile.first_name} ${profile.last_name}` : (profile?.email ?? 'Avatar utilizator')}
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: '2.5rem',
                          bgcolor: 'primary.main',
                        }}
                      >
                        {profile?.first_name?.[0]?.toUpperCase() ??
                          profile?.email?.[0]?.toUpperCase()}
                      </Avatar>
                    )}
                    <IconButton
                      size="small"
                      aria-label="Schimbă poza de profil"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhoto.isPending}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: 30,
                        height: 30,
                      }}
                    >
                      {uploadPhoto.isPending ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <CameraAltOutlined sx={{ fontSize: 15 }} />
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
                      {displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile?.email}
                    </Typography>
                    <Chip
                      label={roleLabel(profile?.role ?? '')}
                      size="small"
                      sx={{ mt: 1, bgcolor: '#e8f5ee', color: 'primary.main', fontWeight: 600 }}
                    />
                  </Box>

                  <Divider sx={{ width: '100%' }} />

                  <Stack sx={{ width: '100%', gap: 1.5 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <CalendarTodayOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Box>
                        <Typography variant="caption" color="text.disabled">
                          Creat la
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                          {formatDate(profile?.created_at)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <CalendarTodayOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Box>
                        <Typography variant="caption" color="text.disabled">
                          Modificat la
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                          {formatDate(profile?.updated_at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Form card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5 }}>
                  Informații personale
                </Typography>
                <Box component="form" onSubmit={onSubmit}>
                  <Stack sx={{ gap: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Prenume"
                          fullWidth
                          disabled={!editing}
                          {...register('first_name')}
                          error={!!errors.first_name}
                          helperText={errors.first_name?.message}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Nume"
                          fullWidth
                          disabled={!editing}
                          {...register('last_name')}
                          error={!!errors.last_name}
                          helperText={errors.last_name?.message}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      label="Email"
                      fullWidth
                      value={profile?.email ?? ''}
                      disabled
                      slotProps={{
                        input: {
                          startAdornment: (
                            <EmailOutlined sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} />
                          ),
                        },
                      }}
                      helperText="Email-ul nu poate fi modificat"
                    />

                    <TextField
                      label="Rol"
                      fullWidth
                      value={roleLabel(profile?.role ?? '')}
                      disabled
                      slotProps={{
                        input: {
                          startAdornment: (
                            <BadgeOutlined sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} />
                          ),
                        },
                      }}
                    />

                    <Controller
                      name="date_of_birth"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Data nașterii"
                          value={field.value ?? null}
                          onChange={field.onChange}
                          disabled={!editing}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.date_of_birth,
                              helperText: errors.date_of_birth?.message ?? 'Opțional',
                            },
                          }}
                        />
                      )}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}
