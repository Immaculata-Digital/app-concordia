import { Button, Grid, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

type DashboardClienteCardProps = {
    permissions: string[]
    clienteName: string
    clienteEndereco: string
    onEdit: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardClienteCard = ({ permissions, clienteName, clienteEndereco, onEdit, dragHandleProps, isDragging, sx, className, loading }: DashboardClienteCardProps) => {
    const accessMode = getAccessMode(permissions, 'contratos:contratos:cliente')

    return (
        <DashboardBodyCard
            title="Cliente"
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
                    <Typography variant="caption" className="dashboard-label">Cliente</Typography>
                    <Typography variant="body1">{clienteName || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="dashboard-label">Endereço do Contrato</Typography>
                    <Typography variant="body1" className="dashboard-cliente-card__address">{clienteEndereco || '-'}</Typography>
                </Grid>
            </Grid>
        </DashboardBodyCard>
    )
}
