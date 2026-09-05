import { Alert, Button, Grid, Skeleton } from '@mui/material'

export function ReportLoading() {
  return (
    <Grid container spacing={2.5} aria-busy="true" aria-label="Se încarcă raportul">
      {[0, 1, 2, 3].map((index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Skeleton variant="rounded" height={112} />
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 7 }}>
        <Skeleton variant="rounded" height={320} />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Skeleton variant="rounded" height={320} />
      </Grid>
      <Grid size={12}>
        <Skeleton variant="rounded" height={260} />
      </Grid>
    </Grid>
  )
}

type ReportErrorProps = {
  message?: string
  onRetry?: () => void
}

export function ReportError({
  message = 'Nu am putut încărca raportul. Verifică conexiunea și permisiunile, apoi reîncearcă.',
  onRetry,
}: ReportErrorProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Reîncearcă
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  )
}
