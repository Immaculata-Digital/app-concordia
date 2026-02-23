import { useState, useMemo } from 'react'
import {
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Button,
    Stack,
    Chip,
    TextField,
    MenuItem,
    Grid,
    CircularProgress
} from '@mui/material'
import { Add, Close, Payment } from '@mui/icons-material'
import { DashboardModal } from '../../../components/Modals'
import { useComanda, useAddComandaItem, useUpdateComandaStatus } from '../../../hooks/queries/comandas'
import { useProdutosList } from '../../../hooks/queries/produtos'

interface ComandaDetailsDialogProps {
    open: boolean
    onClose: () => void
    comandaId: string | null
}

const STATUS_COLORS: Record<string, any> = {
    ABERTA: 'success',
    FECHADA: 'warning',
    PAGA: 'info',
    CANCELADA: 'error'
}

const ComandaDetailsDialog = ({ open, onClose, comandaId }: ComandaDetailsDialogProps) => {
    const { data: comanda, isLoading } = useComanda(comandaId)
    const { data: produtos = [] } = useProdutosList()

    const addItemMutation = useAddComandaItem()
    const updateStatusMutation = useUpdateComandaStatus()

    const [selectedProdutoId, setSelectedProdutoId] = useState('')
    const [quantidade, setQuantidade] = useState(1)
    const [observacao, setObservacao] = useState('')

    const selectedProduto = useMemo(() => {
        return produtos.find(p => p.uuid === selectedProdutoId)
    }, [selectedProdutoId, produtos])

    const handleAddItem = async () => {
        if (!comandaId || !selectedProdutoId || !selectedProduto) return

        await addItemMutation.mutateAsync({
            uuid: comandaId,
            payload: {
                produtoId: selectedProdutoId,
                quantidade,
                precoUnitario: selectedProduto.precos?.[0]?.preco || 0, // Get price from product price list
                observacao
            }
        })

        setSelectedProdutoId('')
        setQuantidade(1)
        setObservacao('')
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!comandaId) return
        await updateStatusMutation.mutateAsync({ uuid: comandaId, status: newStatus })
    }

    if (isLoading || !comanda) {
        return (
            <DashboardModal open={open} onClose={onClose} title="Carregando Comanda...">
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            </DashboardModal>
        )
    }

    const isEditable = comanda.status === 'ABERTA'

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title={`Comanda - Mesa ${comanda.mesaNumero}`}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="h6">#{comanda.seqId} - {comanda.clienteNome || 'Cliente'}</Typography>
                        <Typography variant="caption" color="text.secondary">Aberta em: {new Date(comanda.abertaEm).toLocaleString()}</Typography>
                    </Box>
                    <Chip label={comanda.status} color={STATUS_COLORS[comanda.status]} variant="filled" />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>Itens Consumidos</Typography>
                        <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', minHeight: 200 }}>
                            {comanda.itens?.length ? (
                                comanda.itens.map((item: any) => (
                                    <ListItem key={item.uuid} divider>
                                        <ListItemText
                                            primary={`${item.quantidade}x ${item.produtoNome}`}
                                            secondary={item.observacao ? `Obs: ${item.observacao}` : null}
                                        />
                                        <Typography variant="body2" fontWeight="bold">
                                            {(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </Typography>
                                    </ListItem>
                                ))
                            ) : (
                                <Box p={4} textAlign="center">
                                    <Typography color="text.secondary">Nenhum item adicionado ainda.</Typography>
                                </Box>
                            )}
                        </List>

                        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor="primary.main" color="white" borderRadius={1}>
                            <Typography variant="h6">TOTAL</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {comanda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        {isEditable ? (
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" mb={2}>Lançar Item</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Produto"
                                        value={selectedProdutoId}
                                        onChange={(e) => setSelectedProdutoId(e.target.value)}
                                    >
                                        {produtos.map(p => (
                                            <MenuItem key={p.uuid} value={p.uuid}>{p.nome}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Quantidade"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(Number(e.target.value))}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Observação"
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        fullWidth
                                        onClick={handleAddItem}
                                        disabled={!selectedProdutoId || addItemMutation.isPending}
                                    >
                                        Adicionar Item
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <Box p={2} textAlign="center" border="1px dashed" borderColor="divider">
                                <Typography color="text.secondary">Esta comanda está {comanda.status.toLowerCase()} e não permite novos lançamentos.</Typography>
                            </Box>
                        )}

                        <Box mt={3}>
                            <Typography variant="subtitle2" mb={1} color="text.secondary">Ações da Comanda</Typography>
                            <Stack spacing={1}>
                                {comanda.status === 'ABERTA' && (
                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<Close />}
                                        fullWidth
                                        onClick={() => handleUpdateStatus('FECHADA')}
                                    >
                                        Fechar p/ Pagamento
                                    </Button>
                                )}
                                {(comanda.status === 'ABERTA' || comanda.status === 'FECHADA') && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<Payment />}
                                        fullWidth
                                        onClick={() => handleUpdateStatus('PAGA')}
                                    >
                                        Confirmar Pagamento
                                    </Button>
                                )}
                                {comanda.status === 'ABERTA' && (
                                    <Button
                                        variant="text"
                                        color="error"
                                        fullWidth
                                        onClick={() => handleUpdateStatus('CANCELADA')}
                                    >
                                        Cancelar Comanda
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </DashboardModal>
    )
}

export default ComandaDetailsDialog
