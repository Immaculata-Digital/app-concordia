import { useState } from 'react'
import { Box, Chip, Typography, InputLabel, Button, Grid } from '@mui/material'
import {
    Edit, Storefront, LocalOffer
} from '@mui/icons-material'

import { useAuth } from '../../../context/AuthContext'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { usePointTransaction } from '../../../hooks/queries/pointTransactions'
import { useTenant } from '../../../hooks/queries/tenants'
import { useRecompensa } from '../../../hooks/queries/recompensas'

import { DashboardModal } from '../../../components/Modals'
import { DashboardTopCard } from '../../../components/Dashboard/DashboardTopCard'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { PointTransactionFormDialog } from './PointTransactionFormDialog'

interface PointTransactionDashboardProps {
    open: boolean
    onClose: () => void
    transactionId: string | null
    onUpdate?: () => void
}

export function PointTransactionDashboard({ open, onClose, transactionId, onUpdate }: PointTransactionDashboardProps) {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:transacoes-pontos')

    const { data: transaction, isLoading } = usePointTransaction(transactionId)
    const { data: loja } = useTenant(transaction?.lojaId || null)
    const { data: recompensa } = useRecompensa(transaction?.rewardItemId || null)

    const [editOpen, setEditOpen] = useState(false)

    if (!transaction && !isLoading) return null

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title="Dashboard de Transação"
        >
            <Box mb={3}>
                <DashboardTopCard
                    title={`Transação - ${transaction?.clientName || 'Cliente'}`}
                    action={
                        <Box textAlign="right">
                            <Typography variant="caption" color="textSecondary" display="block">Valor Transacionado</Typography>
                            <Typography variant="h6" color={transaction?.type === 'CREDITO' ? 'success.main' : 'error.main'}>
                                {transaction?.type === 'CREDITO' ? '+' : '-'}{transaction?.points?.toLocaleString('pt-BR')} pts
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <DashboardBodyCard
                        title="Detalhes da Transação"
                        loading={isLoading}
                        accessMode={accessMode}
                        action={canEdit(accessMode) ? (
                            <Button variant="outlined" size="small" onClick={() => setEditOpen(true)}>
                                <Edit fontSize="small" /> Editar
                            </Button>
                        ) : undefined}
                    >
                        <Box mb={2}>
                            <InputLabel shrink>Tipo</InputLabel>
                            <Chip
                                label={transaction?.type}
                                size="small"
                                color={transaction?.type === 'CREDITO' ? 'success' : transaction?.type === 'DEBITO' ? 'error' : 'warning'}
                            />
                        </Box>
                        <Box mb={2}>
                            <InputLabel shrink>Origem</InputLabel>
                            <Typography variant="body2">{transaction?.origin}</Typography>
                        </Box>
                        <Box mb={2}>
                            <InputLabel shrink>Data da Transação</InputLabel>
                            <Typography variant="body2">
                                {transaction?.createdAt ? new Date(transaction.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                            </Typography>
                        </Box>
                        <Box mb={2}>
                            <InputLabel shrink>Saldo Resultante</InputLabel>
                            <Typography variant="body2">{transaction?.resultingBalance?.toLocaleString('pt-BR')} pts</Typography>
                        </Box>
                        <Box>
                            <InputLabel shrink>Observação</InputLabel>
                            <Typography variant="body2">{transaction?.observation || 'Nenhuma observação'}</Typography>
                        </Box>
                    </DashboardBodyCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <DashboardBodyCard
                        title="Vínculos Complementares"
                        loading={isLoading}
                        accessMode={accessMode}
                    >
                        {transaction?.type === 'CREDITO' && (
                            <Box mb={3}>
                                <InputLabel shrink>Loja (Tenant) de Crédito</InputLabel>
                                {loja ? (
                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                        <Storefront color="action" fontSize="small" />
                                        <Typography variant="body2" fontWeight={500}>{loja.name}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">Sem loja vinculada</Typography>
                                )}
                            </Box>
                        )}

                        {(transaction?.type === 'DEBITO' || transaction?.type === 'ESTORNO') && transaction?.origin === 'RESGATE' && (
                            <Box>
                                <InputLabel shrink>Item de Recompensa Resgatado</InputLabel>
                                {transaction?.rewardItemName ? (
                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                        <LocalOffer color="action" fontSize="small" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>{transaction.rewardItemName}</Typography>
                                            {recompensa?.qtd_pontos_resgate && (
                                                <Typography variant="caption" color="textSecondary">Custo base: {recompensa.qtd_pontos_resgate} pts</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">Sem item vinculado</Typography>
                                )}
                            </Box>
                        )}

                        {!(transaction?.type === 'CREDITO') && !(transaction?.origin === 'RESGATE') && (
                            <Typography variant="body2" color="textSecondary">Não há vínculos especiais para essa origem e tipo.</Typography>
                        )}
                    </DashboardBodyCard>
                </Grid>
            </Grid>

            {editOpen && (
                <PointTransactionFormDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    transactionToEdit={transaction || null}
                    onSuccess={(_msg) => {
                        setEditOpen(false)
                        if (onUpdate) onUpdate()
                    }}
                    onError={(_err) => { }}
                    accessMode={accessMode}
                />
            )}
        </DashboardModal>
    )
}
