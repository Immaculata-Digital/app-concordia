import { useState, useMemo } from 'react'
import {
    Box,
    Chip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import TableCard from '../../components/TableCard'
import type { TableCardColumn } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'
import {
    useMesasList,
    useCreateMesa,
    useUpdateMesa,
    useDeleteMesa,
} from '../../hooks/queries/mesas'
import MesaFormDialog from './components/MesaFormDialog'
import MesaDashboard from './components/MesaDashboard'
import { type MesaDTO } from '../../services/mesas'

const STATUS_MAP: Record<string, { label: string, color: any }> = {
    LIVRE: { label: 'Livre', color: 'success' },
    OCUPADA: { label: 'Ocupada', color: 'error' },
    RESERVADA: { label: 'Reservada', color: 'warning' },
    MANUTENCAO: { label: 'Manutenção', color: 'default' }
}

const Mesas = () => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:mesas')

    const { data: mesas = [], isLoading } = useMesasList()
    const createMutation = useCreateMesa()
    const updateMutation = useUpdateMesa()
    const deleteMutation = useDeleteMesa()

    const [formOpen, setFormOpen] = useState(false)
    const [selectedMesa, setSelectedMesa] = useState<MesaDTO | null>(null)
    const [dashboardOpen, setDashboardOpen] = useState(false)
    const [dashboardMesaId, setDashboardMesaId] = useState<string | null>(null)
    const [qrOpen, setQrOpen] = useState(false)
    const [qrMesa, setQrMesa] = useState<MesaDTO | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const columns: TableCardColumn<MesaDTO>[] = useMemo(() => [
        { key: 'numero', label: 'Número' },
        { key: 'capacidade', label: 'Capacidade', dataType: 'number' },
        {
            key: 'status',
            label: 'Status',
            render: (val: string) => (
                <Chip
                    label={STATUS_MAP[val]?.label || val}
                    color={STATUS_MAP[val]?.color || 'default'}
                    size="small"
                />
            )
        }
    ], [])

    const rowActions = useMemo(() => [
        {
            label: 'Gerar QR Code',
            icon: <QrCodeScannerIcon fontSize="small" />,
            onClick: (row: MesaDTO) => {
                setQrMesa(row)
                setQrOpen(true)
            }
        }
    ], [])

    const handleAdd = () => {
        setSelectedMesa(null)
        setFormOpen(true)
    }

    const handleEdit = (row: MesaDTO) => {
        setSelectedMesa(row)
        setFormOpen(true)
    }

    const handleDelete = (id: string | number) => {
        deleteMutation.mutate(id as string, {
            onSuccess: () => setSnackbar({ open: true, message: 'Mesa removida com sucesso', severity: 'success' }),
            onError: () => setSnackbar({ open: true, message: 'Erro ao remover mesa', severity: 'error' })
        })
    }

    const handleSave = (data: any) => {
        if (selectedMesa) {
            updateMutation.mutate({ uuid: selectedMesa.uuid, payload: data }, {
                onSuccess: () => {
                    setFormOpen(false)
                    setSnackbar({ open: true, message: 'Mesa atualizada com sucesso', severity: 'success' })
                },
                onError: (error: any) => setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao atualizar mesa', severity: 'error' })
            })
        } else {
            createMutation.mutate(data, {
                onSuccess: () => {
                    setFormOpen(false)
                    setSnackbar({ open: true, message: 'Mesa criada com sucesso', severity: 'success' })
                },
                onError: (error: any) => setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao criar mesa', severity: 'error' })
            })
        }
    }

    const handleRowClick = (row: MesaDTO) => {
        setDashboardMesaId(row.uuid)
        setDashboardOpen(true)
    }

    return (
        <Box p={0}>
            <TableCard
                title="Gestão de Mesas"
                columns={columns}
                rows={mesas}
                loading={isLoading}
                onAddClick={handleAdd}
                onEdit={(id) => handleEdit(mesas.find(m => m.uuid === id)!)}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleRowClick}
                accessMode={accessMode as any}
            />

            <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>QR Code da Mesa {qrMesa?.numero}</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    {qrMesa && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="img"
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                    `https://cardapio.marshalltds.com/?tenantId=${useAuth().user?.tenantId}&mesaUuid=${qrMesa.uuid}`
                                )}`}
                                sx={{ width: 250, height: 250, border: '1px solid #eee', p: 1, borderRadius: 2 }}
                                alt="Mesa QR Code"
                            />
                            <Typography variant="body2" color="textSecondary">
                                Aponte a câmera para acessar o cardápio desta mesa
                            </Typography>
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%', wordBreak: 'break-all' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                    {`https://cardapio.marshalltds.com/?tenantId=${useAuth().user?.tenantId}&mesaUuid=${qrMesa.uuid}`}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrOpen(false)}>Fechar</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                                `https://cardapio.marshalltds.com/?tenantId=${useAuth().user?.tenantId}&mesaUuid=${qrMesa?.uuid}`
                            )}`
                            window.open(url, '_blank')
                        }}
                    >
                        Imprimir / Baixar
                    </Button>
                </DialogActions>
            </Dialog>

            <MesaFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleSave}
                title="Mesa"
                initialData={selectedMesa}
                saving={createMutation.isPending || updateMutation.isPending}
                accessMode={accessMode as any}
            />

            <MesaDashboard
                mesaId={dashboardMesaId}
                open={dashboardOpen}
                onClose={() => setDashboardOpen(false)}
                accessMode={accessMode as any}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default Mesas
