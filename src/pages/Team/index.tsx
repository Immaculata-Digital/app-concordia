import { Box, Typography, Paper } from '@mui/material'
import './style.css'

const TeamPage = () => (
  <Box className="placeholder-page">
    <Paper elevation={4} className="placeholder-card">
      <Typography variant="h4" gutterBottom>
        Equipe
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Gerencie permissões, papéis e acompanhe a produtividade do seu time.
      </Typography>
    </Paper>
  </Box>
)

export default TeamPage

