import { useState, useMemo } from 'react'
import { Box, Chip } from '@mui/material'
import { EditOutlined, Visibility } from '@mui/icons-material'
import { useCardapioItens, useDeleteCardapioItem } from '../../hooks/queries/cardapioItens'
import type { CardapioItemDTO } from '../../services/cardapioItens'
import { CardapioItemFormDialog } from './components/CardapioItemFormDialog'
import ProdutoDashboard from '../Produtos/components/ProdutoDashboard'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import Toast from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'

type CardapioItemRow = TableCardRow & CardapioItemDTO

export default function CardapioItens() {
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:cardapio:itens'), [permissions])

    const [openDialog, setOpenDialog] = useState(false)
    const [selectedItem, setSelectedItem] = useState<CardapioItemDTO | null>(null)
    const [dashboardProdutoId, setDashboardProdutoId] = useState<string | null>(null)

    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const { data: itens = [], isLoading } = useCardapioItens()
    const deleteMutation = useDeleteCardapioItem()

    const handleCreate = () => {
        setSelectedItem(null)
        setOpenDialog(true)
    }

    const handleEditItemCardapio = (item: CardapioItemDTO) => {
        setSelectedItem(item)
        setOpenDialog(true)
    }

    const handleOpenProdutoDashboard = (item: CardapioItemDTO) => {
        setDashboardProdutoId(item.produtoId)
    }

    const handleDelete = (id: string | number) => {
        const item = itens.find(i => i.uuid === id || i.seqId === id)
        if (item) deleteMutation.mutate(item.uuid)
    }

    const columns = useMemo<TableCardColumn<CardapioItemRow>[]>(() => [
        { key: 'produtoNome', label: 'Produto' },
        { key: 'categoriaNome', label: 'Categoria' },
        { key: 'ordem', label: 'Ordem', dataType: 'number' },
        {
            key: 'produtoPreco',
            label: 'Preço Venda',
            dataType: 'number',
            format: (val: number) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        },
        {
            key: 'ativo',
            label: 'Situação',
            format: (val: boolean) => (
                <Chip
                    label={val ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={val ? 'success' : 'error'}
                    variant="outlined"
                />
            )
        }
    ], [])

    const rowActions = useMemo<TableCardRowAction<CardapioItemRow>[]>(() => [
        {
            label: 'Detalhes Produto',
            icon: <Visibility fontSize="small" />,
            onClick: (row) => handleOpenProdutoDashboard(row),
        },
        {
            label: 'Editar Item (Cardápio)',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleEditItemCardapio(row),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Gestão do Cardápio"
                columns={columns}
                rows={itens as CardapioItemRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleOpenProdutoDashboard}
                accessMode={accessMode as any}
            />

            {openDialog && (
                <CardapioItemFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    itemToEdit={selectedItem}
                    onSuccess={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                    onError={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'error' })}
                    accessMode={accessMode as any}
                />
            )}

            {!!dashboardProdutoId && (
                <ProdutoDashboard
                    open={!!dashboardProdutoId}
                    onClose={() => setDashboardProdutoId(null)}
                    produtoId={dashboardProdutoId}
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
