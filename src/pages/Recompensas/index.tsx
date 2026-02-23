
import { useEffect, useMemo, useState } from 'react'
import {
    Box,
    Chip,
} from '@mui/material'
import Toast from '../../components/Toast'

import { EditOutlined, CheckCircle, Cancel } from '@mui/icons-material'
import TableCard, {
    type TableCardColumn,
    type TableCardRow,
    type TableCardRowAction,
} from '../../components/TableCard'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'

import RecompensaFormDialog from './components/RecompensaFormDialog'
import { useRecompensasList, useCreateRecompensa, useDeleteRecompensa, useUpdateRecompensa } from '../../hooks/queries/recompensas'

type RecompensaRow = TableCardRow & {
    id: string
    nome: string
    codigo: string
    pontos: number
    voucher: boolean
    createdAt: string
}

const RecompensasPage = () => {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [selectedRecompensa, setSelectedRecompensa] = useState<any>(null)
    const { setFilters, setPlaceholder, setQuery } = useSearch()

    const { permissions, user } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:recompensas'), [permissions])

    const { data: recompensasData, isLoading } = useRecompensasList(user?.tenantId)

    const createMutation = useCreateRecompensa()
    const updateMutation = useUpdateRecompensa()
    const deleteMutation = useDeleteRecompensa()

    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

    useEffect(() => {
        setPlaceholder('Buscar recompensas...')
        const filters = [
            { id: 'nome', label: 'Nome', field: 'nome', type: 'text' as const, page: 'recompensas' },
        ]
        setFilters(filters, 'nome')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery])

    const handleSave = async (data: any) => {
        try {
            if (selectedRecompensa) {
                await updateMutation.mutateAsync({ id: selectedRecompensa.uuid, payload: data })
                setToast({ open: true, message: 'Recompensa atualizada', severity: 'success' })
            } else {
                await createMutation.mutateAsync(data)
                setToast({ open: true, message: 'Recompensa criada', severity: 'success' })
            }
            setCreateModalOpen(false)
            setSelectedRecompensa(null)
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: 'Erro ao salvar recompensa', severity: 'error' })
        }
    }

    const handleDelete = async (id: TableCardRow['id']) => {
        try {
            await deleteMutation.mutateAsync(id as string)
            setToast({ open: true, message: 'Recompensa removida', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: 'Erro ao remover recompensa', severity: 'error' })
        }
    }

    const handleEdit = (row: TableCardRow) => {
        const item = recompensasData?.find(r => r.uuid === row.id)
        setSelectedRecompensa(item)
        setCreateModalOpen(true)
    }

    const rowActions: TableCardRowAction<RecompensaRow>[] = useMemo(() => [
        {
            label: 'Editar',
            icon: <EditOutlined fontSize="small" />,
            onClick: handleEdit,
        },
    ], [recompensasData])

    const tableColumns = useMemo<TableCardColumn<RecompensaRow>[]>(() => [
        { key: 'nome', label: 'Item de Recompensa' },
        {
            key: 'pontos',
            label: 'Custo em Pontos',
            render: (val) => (
                <Chip
                    label={`${val} pts`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            )
        },
        {
            key: 'voucher',
            label: 'Tipo',
            render: (val) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {val ? (
                        <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Digital" size="small" color="success" />
                    ) : (
                        <Chip icon={<Cancel sx={{ fontSize: '1rem !important' }} />} label="Físico" size="small" variant="outlined" />
                    )}
                </Box>
            )
        },
        { key: 'codigo', label: 'Referência' },
        { key: 'createdAt', label: 'Lançamento', dataType: 'date' },
    ], [])

    const rows = useMemo(() => {
        return (recompensasData || []).map(r => ({
            id: r.uuid,
            nome: r.produto?.nome || 'N/A',
            codigo: r.produto?.codigo || '-',
            pontos: r.qtd_pontos_resgate,
            voucher: r.voucher_digital,
            createdAt: r.created_at,
        }))
    }, [recompensasData])

    return (
        <Box className="recompensas-page">
            <TableCard
                title="Itens de Recompensa"
                columns={tableColumns}
                rows={rows as RecompensaRow[]}
                totalRows={rows.length}
                loading={isLoading}
                onAddClick={() => {
                    setSelectedRecompensa(null)
                    setCreateModalOpen(true)
                }}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleEdit}
                accessMode={accessMode}
            />

            <RecompensaFormDialog
                open={createModalOpen}
                onClose={() => {
                    setCreateModalOpen(false)
                    setSelectedRecompensa(null)
                }}
                onSave={handleSave}
                initialData={selectedRecompensa}
                saving={createMutation.isPending || updateMutation.isPending}
            />

            <Toast
                open={toast.open}
                message={toast.message}
                onClose={() => setToast({ open: false, message: '' })}
                severity={toast.severity}
            />
        </Box>
    )
}

export default RecompensasPage
