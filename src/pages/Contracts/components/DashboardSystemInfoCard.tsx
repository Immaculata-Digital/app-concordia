import { Grid, Typography } from '@mui/material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode } from '../../../utils/accessControl'
import type { ContractDTO } from '../../../services/contracts'

type DashboardSystemInfoCardProps = {
    permissions: string[]
    contract: ContractDTO
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardSystemInfoCard = ({ permissions, contract, dragHandleProps, isDragging, sx, className, loading }: DashboardSystemInfoCardProps) => {
    return (
        <DashboardBodyCard
            title="Informações do Sistema"
            accessMode={getAccessMode(permissions, 'contratos:contratos')}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" className="dashboard-label">ID do Sistema</Typography>
                    <Typography variant="body2" className="dashboard-value dashboard-value--monospace">
                        {contract.id}
                    </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" className="dashboard-label">Criado por</Typography>
                    <Typography variant="body2" className="dashboard-value">
                        {contract.createdBy} em {new Date(contract.createdAt).toLocaleString()}
                    </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" className="dashboard-label">Atualizado por</Typography>
                    <Typography variant="body2" className="dashboard-value">
                        {contract.updatedBy} em {new Date(contract.updatedAt).toLocaleString()}
                    </Typography>
                </Grid>
            </Grid>
        </DashboardBodyCard>
    )
}
