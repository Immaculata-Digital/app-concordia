import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Snackbar,
    Alert,
    Chip,
    Box
} from '@mui/material'
import TableCard from '../../components/TableCard'
import type { TableCardColumn } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'
import {
    useComandasList,
    useCreateComanda
} from '../../hooks/queries/comandas'
import ComandaFormDialog from './components/ComandaFormDialog'
import ComandaDetailsDialog from './components/ComandaDetailsDialog'
import type { ComandaDTO } from '../../services/comandas'

const STATUS_MAP: Record<string, { label: string, color: any }> = {
    ABERTA: { label: 'Aberta', color: 'success' },
    FECHADA: { label: 'Aguardando Pag.', color: 'warning' },
    PAGA: { label: 'Paga', color: 'info' },
    CANCELADA: { label: 'Cancelada', color: 'error' }
}

const Comandas = () => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:comandas')

    const { data: comandas = [], isLoading } = useComandasList()
    const createMutation = useCreateComanda()
    const [searchParams, setSearchParams] = useSearchParams()

    const [formOpen, setFormOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    // Auto-open details if id is in URL
    useEffect(() => {
        const id = searchParams.get('id')
        if (id) {
            setSelectedComandaId(id)
            setDetailsOpen(true)
            // Clear param after opening so it doesn't re-open on refresh if closed
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('id')
            setSearchParams(newParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const columns: TableCardColumn<ComandaDTO>[] = useMemo(() => [
        { key: 'mesaNumero', label: 'Mesa' },
        { key: 'clienteNome', label: 'Cliente' },
        {
            key: 'total',
            label: 'Total',
            render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        },
        {
            key: 'status',
            label: 'Situação',
            render: (val: string) => (
                <Chip
                    label={STATUS_MAP[val]?.label || val}
                    color={STATUS_MAP[val]?.color || 'default'}
                    size="small"
                />
            )
        },
        {
            key: 'abertaEm',
            label: 'Aberta em',
            render: (val: string) => new Date(val).toLocaleString('pt-BR')
        }
    ], [])

    const handleAdd = () => {
        setFormOpen(true)
    }

    const handleOpenDetails = (row: ComandaDTO) => {
        setSelectedComandaId(row.uuid)
        setDetailsOpen(true)
    }

    const handleCreate = (data: any) => {
        createMutation.mutate(data, {
            onSuccess: (res: any) => {
                setFormOpen(false)
                setSelectedComandaId(res.uuid)
                setDetailsOpen(true)
                setSnackbar({ open: true, message: 'Comanda aberta com sucesso', severity: 'success' })
            },
            onError: (error: any) => setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao abrir comanda', severity: 'error' })
        })
    }

    return (
        <Box p={0}>
            <TableCard
                title="Comandas e Vendas"
                columns={columns}
                rows={comandas}
                loading={isLoading}
                onAddClick={handleAdd}
                onRowClick={handleOpenDetails}
                accessMode={accessMode as any}
                disableEdit={true}
                disableDelete={true}
            />

            <ComandaFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleCreate}
                title="Comanda"
                saving={createMutation.isPending}
                accessMode={accessMode as any}
            />

            <ComandaDetailsDialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                comandaId={selectedComandaId}
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

export default Comandas
