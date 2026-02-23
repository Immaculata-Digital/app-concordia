import { Box, Typography } from '@mui/material'
import { AttachFile } from '@mui/icons-material'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { getAccessMode } from '../../../utils/accessControl'
import type { ContractAttachment } from '../hooks/useContractDashboard'

type DashboardAttachmentsCardProps = {
    permissions: string[]
    attachments: ContractAttachment[]
    categoryMapping?: Record<string, string>
    onAdd: () => void
    onEdit: (item: ContractAttachment) => void
    onDelete: (item: ContractAttachment) => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardAttachmentsCard = ({
    permissions,
    attachments,
    categoryMapping = {},
    onAdd,
    onEdit,
    onDelete,
    dragHandleProps,
    isDragging,
    sx,
    className,
    loading
}: DashboardAttachmentsCardProps) => {
    return (
        <DashboardBodyCardList<ContractAttachment>
            title="Anexos"
            accessMode={getAccessMode(permissions, 'contratos:contratos:anexos')}
            items={attachments}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><AttachFile /></Box>}
            renderText={(item) => (
                <Box className="dashboard-attachments-card__item-text">
                    <Typography variant="body2" className="dashboard-text--semibold">
                        {item.name}
                    </Typography>
                    <Typography variant="caption" color="primary" className="dashboard-text--medium">
                        {categoryMapping[item.categoryCode] || item.categoryCode || 'Sem categoria'}
                    </Typography>
                </Box>
            )}
            renderSecondaryText={(item) => (
                <Typography component="span" variant="caption" display="block" className="dashboard-text-secondary">
                    Enviado: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                </Typography>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            emptyText="Nenhum anexo registrado."
        />
    )
}
