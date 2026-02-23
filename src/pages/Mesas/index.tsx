import { useState, useMemo } from 'react'
import {
    Box,
    Chip,
    Snackbar,
    Alert
} from '@mui/material'
import TableCard from '../../components/TableCard'
import type { TableCardColumn } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'
import {
    useMesasList,
    useCreateMesa,
    useUpdateMesa,
    useDeleteMesa
} from '../../hooks/queries/mesas'
import MesaFormDialog from './components/MesaFormDialog'
import { type MesaDTO } from '../../services/mesas'

const STATUS_MAP: Record<string, { label: string, color: any }> = {
    LIVRE: { label: 'Livre', color: 'success' },
    OCUPADA: { label: 'Ocupada', color: 'error' },
    RESERVADA: { label: 'Warning', color: 'warning' },
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
                accessMode={accessMode as any}
            />

            <MesaFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleSave}
                title="Mesa"
                initialData={selectedMesa}
                saving={createMutation.isPending || updateMutation.isPending}
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
