import { Button, Grid, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

type DashboardValoresCardProps = {
    permissions: string[]
    modalidadeName: string
    cicloName: string
    valorContrato?: number
    onEdit: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardValoresCard = ({ permissions, modalidadeName, cicloName, valorContrato, onEdit, dragHandleProps, isDragging, sx, className, loading }: DashboardValoresCardProps) => {
    const accessMode = getAccessMode(permissions, 'contratos:contratos:valores')

    return (
        <DashboardBodyCard
            title="Valores"
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
                    <Typography variant="caption" className="dashboard-label">Modalidade</Typography>
                    <Typography variant="body1">{modalidadeName || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" className="dashboard-label">Ciclo</Typography>
                    <Typography variant="body1">{cicloName || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="dashboard-label">Valor do Contrato</Typography>
                    <Typography variant="body1">
                        {valorContrato ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorContrato) : '-'}
                    </Typography>
                </Grid>
            </Grid>
        </DashboardBodyCard>
    )
}
