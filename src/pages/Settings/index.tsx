import { Box, Typography, Paper } from '@mui/material'
import './style.css'

const SettingsPage = () => (
  <Box className="placeholder-page">
    <Paper elevation={4} className="placeholder-card">
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Personalize alertas, integrações e parâmetros do ERP conforme sua operação.
      </Typography>
    </Paper>
  </Box>
)

export default SettingsPage

