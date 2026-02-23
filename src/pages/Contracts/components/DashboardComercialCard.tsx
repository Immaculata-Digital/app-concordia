import { Button, Grid, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

type DashboardComercialCardProps = {
    permissions: string[]
    promotorName: string
    onEdit: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardComercialCard = ({ permissions, promotorName, onEdit, dragHandleProps, isDragging, sx, className, loading }: DashboardComercialCardProps) => {
    const accessMode = getAccessMode(permissions, 'contratos:contratos:comercial')

    return (
        <DashboardBodyCard
            title="Comercial"
            accessMode={accessMode}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
            action={canEdit(accessMode) && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onEdit}
                >
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="dashboard-label">Promotor</Typography>
                    <Typography variant="body1">{promotorName || '-'}</Typography>
                </Grid>
            </Grid>
        </DashboardBodyCard>
    )
}
