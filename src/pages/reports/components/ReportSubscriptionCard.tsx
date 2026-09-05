import { useState } from 'react'
import { MailOutlined, SendOutlined } from '@mui/icons-material'
import {
  Alert,
  Button,
  Card,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type { ReportFrequency, ReportSubscription } from '../../../api/reports.api'
import {
  useReportSubscription,
  useSaveReportSubscription,
  useSendReportNow,
} from '../../../hooks/useReports'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { formatDateTime } from '../reportUtils'

const WEEKDAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

export default function ReportSubscriptionCard() {
  const { data: subscription, isPending } = useReportSubscription()
  if (isPending) return null
  return (
    <SubscriptionForm key={subscription?.updated_at ?? 'new'} subscription={subscription ?? null} />
  )
}

function SubscriptionForm({ subscription }: { subscription: ReportSubscription | null }) {
  const show = useNotificationStore((state) => state.show)
  const save = useSaveReportSubscription()
  const sendNow = useSendReportNow()
  const [active, setActive] = useState(subscription?.is_active ?? false)
  const [frequency, setFrequency] = useState<ReportFrequency>(subscription?.frequency ?? 'weekly')
  const [hour, setHour] = useState(subscription?.send_hour ?? 7)
  const [weekday, setWeekday] = useState(subscription?.weekday ?? 1)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    save.mutate(
      { frequency, send_hour: hour, weekday, is_active: active },
      {
        onSuccess: () =>
          show(
            active ? 'Raportul programat a fost activat.' : 'Raportul programat a fost dezactivat.',
            'success'
          ),
        onError: (mutationError) =>
          setError(getApiErrorMessage(mutationError, 'Nu am putut salva abonamentul.')),
      }
    )
  }

  const handleSendNow = () => {
    setError(null)
    sendNow.mutate(undefined, {
      onSuccess: (result) => show(result.message, 'success'),
      onError: (mutationError) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut trimite raportul.')),
    })
  }

  return (
    <Card className="no-print" sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 260 }}>
          <MailOutlined sx={{ color: '#1a5c38' }} />
          <div>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17' }}>
              Raport pe e-mail
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              {subscription?.last_sent_at
                ? `Ultima trimitere: ${formatDateTime(subscription.last_sent_at)}`
                : 'Primești sumarul automat, la ora aleasă.'}
            </Typography>
          </div>
        </Stack>
        <FormControlLabel
          control={
            <Switch checked={active} onChange={(event) => setActive(event.target.checked)} />
          }
          label={active ? 'Activ' : 'Inactiv'}
        />
        <TextField
          select
          size="small"
          label="Frecvență"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as ReportFrequency)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="daily">Zilnic (ziua anterioară)</MenuItem>
          <MenuItem value="weekly">Săptămânal (ultimele 7 zile)</MenuItem>
          <MenuItem value="monthly">Lunar (luna anterioară)</MenuItem>
        </TextField>
        {frequency === 'weekly' && (
          <TextField
            select
            size="small"
            label="Ziua"
            value={weekday}
            onChange={(event) => setWeekday(Number(event.target.value))}
            sx={{ minWidth: 130 }}
          >
            {WEEKDAYS.map((label, index) => (
              <MenuItem key={label} value={index + 1}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          size="small"
          label="Ora"
          value={hour}
          onChange={(event) => setHour(Number(event.target.value))}
          sx={{ minWidth: 100 }}
        >
          {Array.from({ length: 24 }, (_, index) => (
            <MenuItem key={index} value={index}>
              {String(index).padStart(2, '0')}:00
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={1} sx={{ ml: { md: 'auto' } }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SendOutlined />}
            onClick={handleSendNow}
            disabled={sendNow.isPending}
          >
            {sendNow.isPending ? 'Se trimite...' : 'Trimite acum'}
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? 'Se salvează...' : 'Salvează'}
          </Button>
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </Card>
  )
}
