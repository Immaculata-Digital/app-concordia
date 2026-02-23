import { Box, Typography, Paper } from '@mui/material'
import './style.css'

const InventoryPage = () => (
  <Box className="placeholder-page">
    <Paper elevation={4} className="placeholder-card">
      <Typography variant="h4" gutterBottom>
        Estoque
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Em breve você poderá acompanhar movimentações e níveis de estoque por aqui.
      </Typography>
    </Paper>
  </Box>
)

export default InventoryPage

