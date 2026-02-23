import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Box,
} from '@mui/material'
import Toast from '../../components/Toast'

import { VisibilityOutlined } from '@mui/icons-material'
import TableCard, {
    type TableCardColumn,
    type TableCardRow,
    type TableCardRowAction,
} from '../../components/TableCard'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode, canVisualizeItem } from '../../utils/accessControl'

import ProdutoDashboard from './components/ProdutoDashboard'
import ProdutoFormDialog from './components/ProdutoFormDialog'
import { useProdutosList, useCreateProduto, useDeleteProduto } from '../../hooks/queries/produtos'

type ProdutoRow = TableCardRow & {
    id: string
    nome: string
    codigo: string
    unidade: string
    marca: string
    createdAt: string
}

const ProdutosPage = () => {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const { setFilters, setPlaceholder, setQuery } = useSearch()

    const productIdParam = searchParams.get('productId')
    const { permissions, user } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:produtos'), [permissions])

    const dashboardOpen = !!productIdParam && canVisualizeItem(accessMode)
    const dashboardProductId = productIdParam

    const { data: produtosData, isLoading } = useProdutosList(user?.tenantId)

    const createMutation = useCreateProduto()
    const deleteMutation = useDeleteProduto()

    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

    useEffect(() => {
        setPlaceholder('Buscar produtos...')
        const filters = [
            { id: 'nome', label: 'Nome', field: 'nome', type: 'text' as const, page: 'produtos' },
            { id: 'codigo', label: 'Código', field: 'codigo', type: 'text' as const, page: 'produtos' },
            { id: 'marca', label: 'Marca', field: 'marca', type: 'text' as const, page: 'produtos' },
        ]
        setFilters(filters, 'nome')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery])

    const handleCreate = async (data: any) => {
        try {
            await createMutation.mutateAsync(data)
            setToast({ open: true, message: 'Produto criado com sucesso', severity: 'success' })
            setCreateModalOpen(false)
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: 'Erro ao criar produto', severity: 'error' })
        }
    }

    const handleDelete = async (id: TableCardRow['id']) => {
        try {
            await deleteMutation.mutateAsync(id as string)
            setToast({ open: true, message: 'Produto removido com sucesso', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: 'Erro ao remover produto', severity: 'error' })
        }
    }

    const handleOpenDashboard = useCallback((row: TableCardRow) => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('productId', row.id as string)
            return newParams
        })
    }, [setSearchParams])

    const handleCloseDashboard = useCallback(() => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.delete('productId')
            return newParams
        })
    }, [setSearchParams])

    const rowActions: TableCardRowAction<ProdutoRow>[] = useMemo(() => [
        {
            label: 'Ver',
            icon: <VisibilityOutlined fontSize="small" />,
            onClick: handleOpenDashboard,
        },
    ], [handleOpenDashboard])

    const tableColumns = useMemo<TableCardColumn<ProdutoRow>[]>(() => [
        { key: 'nome', label: 'Nome' },
        { key: 'codigo', label: 'Código/SKU' },
        { key: 'marca', label: 'Marca' },
        { key: 'unidade', label: 'Unidade' },
        { key: 'createdAt', label: 'Cadastro', dataType: 'date' },
    ], [])

    // Map backend data to table rows
    const rows = useMemo(() => {
        return (produtosData || []).map(p => ({
            id: p.uuid,
            nome: p.nome,
            codigo: p.codigo,
            unidade: p.unidade,
            marca: p.marca,
            createdAt: p.created_at,
        }))
    }, [produtosData])

    return (
        <Box className="produtos-page">
            <TableCard
                title="Produtos"
                columns={tableColumns}
                rows={rows as ProdutoRow[]}
                totalRows={rows.length}
                loading={isLoading}
                onAddClick={() => setCreateModalOpen(true)}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleOpenDashboard}
                accessMode={accessMode}
            />

            <ProdutoFormDialog
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleCreate}
                title="Produto"
                saving={createMutation.isPending}
            />

            <ProdutoDashboard
                produtoId={dashboardProductId}
                open={dashboardOpen}
                onClose={handleCloseDashboard}
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

export default ProdutosPage
