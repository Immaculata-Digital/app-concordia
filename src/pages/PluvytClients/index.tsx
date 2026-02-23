import { useState, useMemo } from 'react'
import { Box } from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pluvytClientService } from '../../services/pluvytClients'
import type { PluvytClientDTO } from '../../services/pluvytClients'
import { PluvytClientFormDialog } from './components/PluvytClientFormDialog'
import Toast from '../../components/Toast'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode, canVisualizeItem } from '../../utils/accessControl'
import { useSearchParams } from 'react-router-dom'
import PluvytClientDashboard from './components/PluvytClientDashboard'

type PluvytClientRow = TableCardRow & PluvytClientDTO

export default function PluvytClients() {
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedClient, setSelectedClient] = useState<PluvytClientDTO | null>(null)
    const queryClient = useQueryClient()
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:pluvyt-clients'), [permissions])

    // Toast State
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const [searchParams, setSearchParams] = useSearchParams()
    const clientIdParam = searchParams.get('clientId')
    const dashboardOpen = !!clientIdParam && canVisualizeItem(accessMode)

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['pluvyt-clients'],
        queryFn: () => pluvytClientService.list()
    })

    const deleteMutation = useMutation({
        mutationFn: pluvytClientService.remove,
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Cliente Pluvyt removido com sucesso', severity: 'success' })
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        },
        onError: () => setSnackbar({ open: true, message: 'Erro ao remover cliente Pluvyt', severity: 'error' })
    })

    const handleCreate = () => {
        setSelectedClient(null)
        setOpenDialog(true)
    }


    const handleDelete = (id: string | number) => {
        deleteMutation.mutate(id as string)
    }

    const handleBulkDelete = async (ids: (string | number)[]) => {
        try {
            await Promise.all(ids.map(id => deleteMutation.mutateAsync(id as string)))
            setSnackbar({ open: true, message: 'Clientes removidos com sucesso', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao remover alguns clientes', severity: 'error' })
        }
    }

    const handleFormSuccess = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'success' })
    }

    const handleFormError = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'error' })
    }

    const columns = useMemo<TableCardColumn<PluvytClientRow>[]>(() => [
        { key: 'personName', label: 'Nome' },
        { key: 'personCpfCnpj', label: 'CPF/CNPJ' },
        {
            key: 'saldo',
            label: 'Saldo',
            dataType: 'number' as const,
            format: (val: number) => val.toLocaleString('pt-BR')
        },
        { key: 'createdAt', label: 'Desde', dataType: 'date' as const },
    ], [])

    const handleOpenDashboard = (client: PluvytClientRow) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set('clientId', client.id)
            return next
        })
    }

    const handleCloseDashboard = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.delete('clientId')
            return next
        })
    }

    const rowActions = useMemo<TableCardRowAction<PluvytClientRow>[]>(() => [
        {
            label: 'Ver',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleOpenDashboard(row),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Clientes Pluvyt"
                columns={columns}
                rows={clients as PluvytClientRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                rowActions={rowActions}
                onRowClick={handleOpenDashboard}
                accessMode={accessMode}
            />

            {openDialog && (
                <PluvytClientFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    clientToEdit={selectedClient}
                    onSuccess={handleFormSuccess}
                    onError={handleFormError}
                    accessMode={accessMode}
                />
            )}

            <PluvytClientDashboard
                clientId={clientIdParam}
                open={dashboardOpen}
                onClose={handleCloseDashboard}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })}
            />

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </Box>
    )
}
