import { useState, useMemo } from 'react'
import {
    Box,
} from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantService, type TenantDTO } from '../../services/tenants'
import { TenantFormDialog } from './components/TenantFormDialog'
import Toast from '../../components/Toast'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode, canVisualizeItem } from '../../utils/accessControl'
import { useSearchParams } from 'react-router-dom'
import TenantDashboard from './components/TenantDashboard'

type TenantRow = TableCardRow & TenantDTO

export default function Tenants() {
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedTenant, setSelectedTenant] = useState<TenantDTO | null>(null)
    const queryClient = useQueryClient()
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:tenants'), [permissions])

    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const [searchParams, setSearchParams] = useSearchParams()
    const tenantIdParam = searchParams.get('tenantId')
    const dashboardOpen = !!tenantIdParam && canVisualizeItem(accessMode)

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['tenants'],
        queryFn: tenantService.list
    })

    const deleteMutation = useMutation({
        mutationFn: tenantService.remove,
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Tenant removido', severity: 'success' })
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
        },
        onError: () => setSnackbar({ open: true, message: 'Erro ao remover tenant', severity: 'error' })
    })

    const handleCreate = () => {
        setSelectedTenant(null)
        setOpenDialog(true)
    }

    const handleDelete = (id: string | number) => {
        deleteMutation.mutate(id as string)
    }

    const handleFormSuccess = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'success' })
    }

    const handleBulkDelete = async (ids: (string | number)[]) => {
        try {
            await Promise.all(ids.map(id => deleteMutation.mutateAsync(id as string)))
            setSnackbar({ open: true, message: 'Tenants removidos', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao remover tenants', severity: 'error' })
        }
    }

    const handleFormError = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'error' })
    }

    const columns = useMemo<TableCardColumn<TenantRow>[]>(() => [
        { key: 'name', label: 'Nome' },
        { key: 'slug', label: 'Slug' },
        { key: 'createdAt', label: 'Cadastro', dataType: 'date' as const },
    ], [])

    const handleOpenDashboard = (tenant: TenantRow) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set('tenantId', tenant.id)
            return next
        })
    }

    const handleCloseDashboard = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.delete('tenantId')
            return next
        })
    }

    const rowActions = useMemo<TableCardRowAction<TenantRow>[]>(() => [
        {
            label: 'Ver',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleOpenDashboard(row),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Tenants"
                columns={columns}
                rows={tenants as TenantRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                rowActions={rowActions}
                onRowClick={handleOpenDashboard}
                accessMode={accessMode}
            />

            {openDialog && (
                <TenantFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    tenantToEdit={selectedTenant}
                    onSuccess={handleFormSuccess}
                    onError={handleFormError}
                    accessMode={accessMode}
                />
            )}

            <TenantDashboard
                tenantId={tenantIdParam}
                open={dashboardOpen}
                onClose={handleCloseDashboard}
                accessMode={accessMode}
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
