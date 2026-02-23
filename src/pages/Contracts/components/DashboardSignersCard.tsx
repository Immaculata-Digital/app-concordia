import { Box, Typography } from '@mui/material'
import { Person } from '@mui/icons-material'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { getAccessMode } from '../../../utils/accessControl'
import type { ContractSigner } from '../hooks/useContractDashboard'

type DashboardSignersCardProps = {
    permissions: string[]
    signers: ContractSigner[]
    onAdd: () => void
    onEdit: (item: ContractSigner) => void
    onDelete: (item: ContractSigner) => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardSignersCard = ({
    permissions,
    signers,
    onAdd,
    onEdit,
    onDelete,
    dragHandleProps,
    isDragging,
    sx,
    className,
    loading
}: DashboardSignersCardProps) => {
    return (
        <DashboardBodyCardList<ContractSigner>
            title="Assinantes"
            accessMode={getAccessMode(permissions, 'contratos:contratos:assinantes')}
            items={signers}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><Person /></Box>}
            renderText={(item) => item.name}
            renderSecondaryText={(item) => (
                <Typography variant="caption" className="dashboard-text-secondary">
                    {item.document || 'Sem documento'}
                </Typography>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            emptyText="Nenhum assinante registrado."
        />
    )
}
