import { Box, CircularProgress } from '@mui/material'
const PageLoader = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress size={32} />
    </Box>
  )
}

export default PageLoader
