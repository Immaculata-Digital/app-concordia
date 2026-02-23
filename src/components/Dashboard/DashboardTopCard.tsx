import { Box, Stack, Typography } from '@mui/material'
import { type AccessMode } from './DashboardBodyCard'
import { isHidden as checkIsHidden } from '../../utils/accessControl'

type DashboardTopCardProps = {
    title: string
    children?: React.ReactNode
    action?: React.ReactNode
    accessMode?: AccessMode
    className?: string
    layoutKey?: string
}

export const DashboardTopCard = ({ title, children, action, accessMode = 'full', className }: DashboardTopCardProps) => {
    if (checkIsHidden(accessMode)) return null

    return (
        <Box className={`dashboard-card ${className || ''}`} sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="h4" className="dashboard-title">
                    {title}
                </Typography>
                {action && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        {action}
                    </Stack>
                )}
            </Stack>
            {children}
        </Box>
    )
}
