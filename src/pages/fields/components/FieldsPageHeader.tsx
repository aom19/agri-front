import { AddOutlined, MapOutlined } from '@mui/icons-material'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'

type FieldsPageHeaderProps = {
  totalResults: number
  totalFilteredArea: number
  activeFilterCount: number
  onOpenMap: () => void
  onCreate: () => void
}

export default function FieldsPageHeader({
  totalResults,
  totalFilteredArea,
  activeFilterCount,
  onOpenMap,
  onCreate,
}: FieldsPageHeaderProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2, gap: 1 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Terenuri
        </Typography>
        <Typography variant="body2" color="text.secondary">
          CRUD complet cu desenare poligon direct pe hartă (Leaflet).
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`${totalResults} rezultate`} size="small" />
          <Chip
            label={`${totalFilteredArea.toFixed(2)} ha total`}
            size="small"
            variant="outlined"
          />
          {activeFilterCount > 0 && (
            <Chip label={`${activeFilterCount} filtre active`} size="small" color="primary" />
          )}
        </Stack>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<MapOutlined />} onClick={onOpenMap}>
          Vezi toate terenurile
        </Button>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>
          Teren nou
        </Button>
      </Stack>
    </Stack>
  )
}
