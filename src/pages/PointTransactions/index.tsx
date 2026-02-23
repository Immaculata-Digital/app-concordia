import { useState, useMemo } from 'react'
import { Box, Chip } from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import { usePointTransactions, useDeletePointTransaction } from '../../hooks/queries/pointTransactions'
import type { PointTransactionDTO } from '../../services/pointTransactions'
import { PointTransactionFormDialog } from './components/PointTransactionFormDialog'
import { PointTransactionDashboard } from './components/PointTransactionDashboard'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import Toast from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'

type PointTransactionRow = TableCardRow & PointTransactionDTO

export default function PointTransactions() {
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:transacoes-pontos'), [permissions])

    const [openDialog, setOpenDialog] = useState(false)
    const [openDashboard, setOpenDashboard] = useState<string | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const { data: transactions = [], isLoading } = usePointTransactions()
    const deleteMutation = useDeletePointTransaction()

    const handleCreate = () => {
        setOpenDialog(true)
    }

    const handleEdit = (transaction: PointTransactionDTO) => {
        setOpenDashboard(transaction.id)
    }

    const handleDelete = (id: string | number) => {
        deleteMutation.mutate(id as string)
    }

    const columns = useMemo<TableCardColumn<PointTransactionRow>[]>(() => [
        { key: 'clientName', label: 'Cliente' },
        {
            key: 'type',
            label: 'Tipo',
            format: (val: string) => (
                <Chip
                    label={val}
                    size="small"
                    color={val === 'CREDITO' ? 'success' : val === 'DEBITO' ? 'error' : 'warning'}
                    variant="outlined"
                />
            )
        },
        {
            key: 'points',
            label: 'Pontos',
            dataType: 'number' as const,
            format: (val: number) => val.toLocaleString('pt-BR')
        },
        {
            key: 'origin',
            label: 'Origem',
            format: (val: string) => <Chip label={val} size="small" variant="filled" />
        },
        { key: 'createdAt', label: 'Data', dataType: 'date' as const },
        {
            key: 'resultingBalance',
            label: 'Saldo Resultante',
            dataType: 'number' as const,
            format: (val: number) => val.toLocaleString('pt-BR')
        }
    ], [])

    const rowActions = useMemo<TableCardRowAction<PointTransactionRow>[]>(() => [
        {
            label: 'Detalhes',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleEdit(row),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Transações de Pontos"
                columns={columns}
                rows={transactions as PointTransactionRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleEdit}
                accessMode={accessMode}
            />

            {openDialog && (
                <PointTransactionFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    transactionToEdit={null}
                    onSuccess={(msg) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                    onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
                    accessMode={accessMode as any}
                />
            )}

            {!!openDashboard && (
                <PointTransactionDashboard
                    open={!!openDashboard}
                    onClose={() => setOpenDashboard(null)}
                    transactionId={openDashboard}
                    onUpdate={() => { }}
                />
            )}

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            />
        </Box>
    )
}
