
import { useState, useMemo } from 'react'
import {
    Box,
    Typography,
    Stack,
    Divider,
    LinearProgress,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material'
import {
    InfoOutlined,
    ReceiptLongOutlined,
    DoneAllOutlined,
} from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardModal } from '../../../components/Modals'
import { useMesa, useCloseMesa } from '../../../hooks/queries/mesas'
import { useComandasList, useUpdateComandaStatus } from '../../../hooks/queries/comandas'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { formatCurrency } from '../../../utils/format'

interface Props {
    mesaId: string | null
    open: boolean
    onClose: () => void
    accessMode?: AccessMode
}

export default function MesaDashboard({ mesaId, open, onClose, accessMode = 'full' }: Props) {
    const { data: mesa, isLoading: loadingMesa } = useMesa(mesaId)
    const { data: comandas = [], isLoading: loadingComandas } = useComandasList({ mesaId: mesaId || '', status: 'ABERTA' })
    const closeMesaMutation = useCloseMesa()
    const updateStatusMutation = useUpdateComandaStatus()

    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

    const isLoading = loadingMesa || loadingComandas

    const totalOcupado = useMemo(() => {
        return comandas.reduce((acc, c) => acc + (c.total || 0), 0)
    }, [comandas])

    const defaultLayout = useMemo(() => ({
        col1: ['comandas'],
        col2: ['system'],
        col3: []
    }), [])

    const handleConfirmClose = async () => {
        if (!mesaId) return
        await closeMesaMutation.mutateAsync(mesaId)
        setCloseConfirmOpen(false)
        onClose()
    }

    const items = useMemo(() => {
        if (!mesa) return {}

        return {
            comandas: (
                <DashboardBodyCard
                    id="comandas"
                    title="Comandas Ativas"
                    accessMode={accessMode}
                    action={
                        mesa.status === 'OCUPADA' ? (
                            <Button
                                size="small"
                                color="error"
                                variant="contained"
                                startIcon={<DoneAllOutlined />}
                                onClick={() => setCloseConfirmOpen(true)}
                            >
                                Fechar Mesa
                            </Button>
                        ) : null
                    }
                >
                    <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">Total Acumulado:</Typography>
                            <Typography variant="h6" color="primary.main" style={{ fontWeight: 700 }}>
                                {formatCurrency(totalOcupado)}
                            </Typography>
                        </Box>

                        <Divider />

                        {comandas.length > 0 ? (
                            <Stack spacing={1} divider={<Divider />}>
                                {comandas.map((c) => (
                                    <Box key={c.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {c.clienteNome || 'Cliente'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                Aberta em {new Date(c.abertaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                                                {formatCurrency(c.total)}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updateStatusMutation.mutate({ uuid: c.uuid, status: 'FECHADA' })}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                Fechar
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                onClick={() => updateStatusMutation.mutate({ uuid: c.uuid, status: 'PAGA' })}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                Pagar
                                            </Button>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <Box py={3} textAlign="center">
                                <ReceiptLongOutlined sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Nenhuma comanda aberta nesta mesa.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </DashboardBodyCard>
            ),
            system: (
                <DashboardBodyCard
                    id="system"
                    title="Informações da Mesa"
                    accessMode={accessMode}
                    action={<InfoOutlined color="action" />}
                >
                    <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Status Atual:</Typography>
                            <Chip
                                label={mesa.status}
                                size="small"
                                color={mesa.status === 'LIVRE' ? 'success' : 'error'}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Capacidade:</Typography>
                            <Typography variant="caption">{mesa.capacidade} pessoas</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">UUID:</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{mesa.uuid}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Criada em:</Typography>
                            <Typography variant="caption">{new Date(mesa.createdAt).toLocaleString('pt-BR')}</Typography>
                        </Box>
                    </Stack>
                </DashboardBodyCard>
            )
        }
    }, [mesa, comandas, totalOcupado, accessMode])

    return (
        <DashboardModal
            title={`Mesa ${mesa?.numero || ''}`}
            open={open}
            onClose={onClose}
        >
            {isLoading ? (
                <Box p={4}>
                    <LinearProgress />
                </Box>
            ) : (
                <Box p={2}>
                    <DashboardDnDGrid
                        layoutKey={`mesa-dashboard-${mesaId}`}
                        defaultLayout={defaultLayout}
                        items={items}
                    />

                    <Dialog open={closeConfirmOpen} onClose={() => setCloseConfirmOpen(false)}>
                        <DialogTitle>Confirmar Fechamento</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Deseja fechar a mesa <strong>{mesa?.numero}</strong>?
                                Todas as comandas serão pagas e a mesa será liberada.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setCloseConfirmOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={handleConfirmClose}
                                color="error"
                                variant="contained"
                                disabled={closeMesaMutation.isPending}
                            >
                                {closeMesaMutation.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}
        </DashboardModal>
    )
}
