import { Box, Typography } from '@mui/material'
import { CheckCircle, Assignment, PlayArrow, Close, Info, SwapHoriz } from '@mui/icons-material'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { getAccessMode } from '../../../utils/accessControl'
import type { ContractStatusHistoryDTO } from '../../../services/contracts'

type DashboardStatusHistoryCardProps = {
    permissions: string[]
    statusHistory: ContractStatusHistoryDTO[]
    statusMapping: Record<string, string>
    onAdd: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardStatusHistoryCard = ({
    permissions,
    statusHistory,
    statusMapping,
    onAdd,
    dragHandleProps,
    isDragging,
    sx,
    className,
    loading
}: DashboardStatusHistoryCardProps) => {
    return (
        <DashboardBodyCardList<ContractStatusHistoryDTO>
            title="Histórico de Status"
            accessMode={getAccessMode(permissions, 'contratos:contratos:historico')}
            items={statusHistory}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={`${className || ''} status-history-card`}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={(item) => {
                const status = (statusMapping[item.newStatus] || item.newStatus).toLowerCase()
                let icon = <SwapHoriz />

                if (status.includes('vigente')) {
                    icon = <CheckCircle />
                } else if (status.includes('elaboração') || status.includes('rascunho')) {
                    icon = <PlayArrow />
                } else if (status.includes('triagem') || status.includes('aguardando')) {
                    icon = <Assignment />
                } else if (status.includes('cancelado') || status.includes('recusado')) {
                    icon = <Close />
                } else if (status.includes('recebido') || status.includes('processamento')) {
                    icon = <Info />
                }

                return (
                    <Box className="dashboard-icon-badge">
                        {icon}
                    </Box>
                )
            }}
            renderText={(item) => {
                const statusLabel = statusMapping[item.newStatus] || item.newStatus
                const statusLower = statusLabel.toLowerCase()
                let statusType = 'default'
                
                if (statusLower.includes('vigente') || statusLower.includes('ativo')) statusType = 'active'
                else if (statusLower.includes('elaboração') || statusLower.includes('rascunho')) statusType = 'draft'
                else if (statusLower.includes('triagem') || statusLower.includes('pendente')) statusType = 'pending'
                else if (statusLower.includes('cancelado') || statusLower.includes('recusado')) statusType = 'danger'
                
                return (
                    <Box component="span" className={`status-history-item__pill status-history-item__pill--${statusType}`}>
                        {statusLabel}
                    </Box>
                )
            }}
            renderSecondaryText={(item) => (
                <Box className="status-history-item__body">
                    <Typography variant="caption" className="status-history-item__meta-row">
                        <span className="status-history-item__timestamp">
                            {new Date(item.startedAt).toLocaleDateString('pt-BR')} <span className="status-history-item__at-sign">às</span> {new Date(item.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="status-history-item__bullet">•</span>
                        <span className="status-history-item__author">
                            {item.createdBy}
                        </span>
                        {item.changeOrigin && (
                            <>
                                <span className="status-history-item__bullet">•</span>
                                <span className="status-history-item__origin-inline">via {item.changeOrigin}</span>
                            </>
                        )}
                    </Typography>

                    <Box className="status-history-item__message-card">
                        {item.changeReason ? (
                            <Typography variant="body2" className="status-history-item__reason-text">
                                {item.changeReason}
                            </Typography>
                        ) : (
                            <Typography variant="body2" className="status-history-item__reason-text status-history-item__reason-text--empty">
                                Nenhuma observação registrada
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}
            listItemClassName="dashboard-list-item status-history-item"
            onAdd={onAdd}
            emptyText="Nenhum histórico de status encontrado."
            alignTop
            expandable
            initialItemsCount={2}
        />
    )
}
