import { useState, useMemo } from 'react'
import { Box } from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import { useProdutoCategorias, useDeleteProdutoCategoria } from '../../hooks/queries/produtoCategorias'
import type { ProdutoCategoriaDTO } from '../../services/produtoCategorias'
import { ProdutoCategoriaFormDialog } from './components/ProdutoCategoriaFormDialog'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import Toast from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'

type ProdutoCategoriaRow = TableCardRow & ProdutoCategoriaDTO

export default function ProdutoCategorias() {
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:produtos:categorias'), [permissions])

    const [openDialog, setOpenDialog] = useState(false)
    const [selectedCategoria, setSelectedCategoria] = useState<ProdutoCategoriaDTO | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const { data: categorias = [], isLoading } = useProdutoCategorias()
    const deleteMutation = useDeleteProdutoCategoria()

    const handleCreate = () => {
        setSelectedCategoria(null)
        setOpenDialog(true)
    }

    const handleEdit = (categoria: ProdutoCategoriaDTO) => {
        setSelectedCategoria(categoria)
        setOpenDialog(true)
    }

    const handleDelete = (id: string | number) => {
        // Find by uuid
        const cat = categorias.find((c: ProdutoCategoriaDTO) => c.uuid === id || c.seqId === id)
        if (cat) deleteMutation.mutate(cat.uuid)
    }

    const columns = useMemo<TableCardColumn<ProdutoCategoriaRow>[]>(() => [
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nome' },
        { key: 'sort', label: 'Ordem', dataType: 'number' },
        {
            key: 'tenantId',
            label: 'Abrangência',
            render: (val) => val ? 'Local' : 'Global'
        }
    ], [])

    const rowActions = useMemo<TableCardRowAction<ProdutoCategoriaRow>[]>(() => [
        {
            label: 'Editar',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleEdit(row),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Categ. Produtos"
                columns={columns}
                rows={categorias as ProdutoCategoriaRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                rowActions={rowActions}
                onRowClick={handleEdit}
                accessMode={accessMode as any}
            />

            {openDialog && (
                <ProdutoCategoriaFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    categoriaToEdit={selectedCategoria}
                    onSuccess={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                    onError={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'error' })}
                    accessMode={accessMode as any}
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
