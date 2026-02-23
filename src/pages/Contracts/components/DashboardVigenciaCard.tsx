import { Button, Grid, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { formatDateDisplay } from '../../../utils/date'

type DashboardVigenciaCardProps = {
    permissions: string[]
    vigenciaDataInicio?: string
    vigenciaDataFim?: string
    onEdit: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardVigenciaCard = ({
    permissions,
    vigenciaDataInicio,
    vigenciaDataFim,
    onEdit,
    dragHandleProps,
    isDragging,
    sx,
    className,
    loading
}: DashboardVigenciaCardProps) => {
    const accessMode = getAccessMode(permissions, 'contratos:contratos:vigencia') // Using valores permission as proxy or common access

    return (
        <DashboardBodyCard
            title="Vigência"
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
                <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" className="dashboard-label">Data de Início</Typography>
                    <Typography variant="body1">{formatDateDisplay(vigenciaDataInicio)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" className="dashboard-label">Data de Fim</Typography>
                    <Typography variant="body1">{formatDateDisplay(vigenciaDataFim)}</Typography>
                </Grid>
            </Grid>
        </DashboardBodyCard>
    )
}
