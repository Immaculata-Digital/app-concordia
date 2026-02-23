import { Box, Typography, Button, Stack } from '@mui/material'
import { Home, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import './style.css'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Box className="not-found-container">
      <Stack spacing={3} alignItems="center">
        <Typography variant="h1" className="not-found-title">
          404
        </Typography>
        <Typography variant="h4" className="not-found-subtitle">
          Página não encontrada
        </Typography>
        <Typography variant="body1" className="not-found-message">
          A página que você está procurando não existe ou foi movida.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
            }}
          >
            Voltar
          </Button>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/dashboard')}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
            }}
          >
            Ir para Dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default NotFound

