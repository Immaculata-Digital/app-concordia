import { LinearProgress, Box } from '@mui/material'
import { useLoading } from '../../context/LoadingContext'

const GlobalLoadingBar = () => {
    const { isLoading } = useLoading()

    if (!isLoading) return null

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                height: '3px',
            }}
        >
            <LinearProgress
                sx={{
                    height: '3px',
                    backgroundColor: 'transparent',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: 'var(--color-primary, #dbaa3d)',
                    },
                }}
            />
        </Box>
    )
}

export default GlobalLoadingBar
