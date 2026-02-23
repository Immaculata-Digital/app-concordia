import { useState, useEffect, useMemo } from 'react'
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { type DocumentDTO } from '../../services/documents'
import { useSearch } from '../../context/SearchContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useDocumentList, useDeleteDocumentMutation } from '../../hooks/queries/documents'
import Toast from '../../components/Toast'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'

type DocumentRow = TableCardRow & DocumentDTO

const DocumentosPage = () => {
    const navigate = useNavigate()
    const { setFilters, setPlaceholder, setQuery, query } = useSearch()
    const debouncedQuery = useDebounce(query, 500)

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

    const fetchParams = useMemo(() => ({
        title: debouncedQuery,
        code: debouncedQuery
    }), [debouncedQuery])

    const { data: documents = [], isLoading: loading } = useDocumentList(fetchParams)
    const deleteMutation = useDeleteDocumentMutation()

    useEffect(() => {
        setPlaceholder('Buscar documento (título, código)...')
        const filters = [
            { id: 'title', label: 'Título', field: 'title', type: 'text' as const, page: 'documents' },
            { id: 'code', label: 'Código', field: 'code', type: 'text' as const, page: 'documents' }
        ]
        setFilters(filters, 'title')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery])

    const handleDeleteClick = (id: string | number) => {
        setDocumentToDelete(id as string)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!documentToDelete) return

        try {
            await deleteMutation.mutateAsync(documentToDelete)
            setToast({ open: true, message: 'Documento excluído com sucesso!', severity: 'success' })
        } catch (error) {
            console.error(error)
            setToast({ open: true, message: 'Erro ao excluir documento', severity: 'error' })
        } finally {
            setDeleteDialogOpen(false)
            setDocumentToDelete(null)
        }
    }

    const columns = useMemo<TableCardColumn<DocumentRow>[]>(() => [
        { key: 'code', label: 'Código', width: '100px' },
        { key: 'title', label: 'Título' },
        {
            key: 'created_at',
            label: 'Criado em',
            dataType: 'date',
            width: '150px'
        }
    ], [])

    const rowActions: TableCardRowAction<DocumentRow>[] = []

    const documentRows = useMemo(() => documents as DocumentRow[], [documents])

    return (
        <Box sx={{ p: 0, zIndex: 1002 }}>
            <TableCard
                title="Meus Documentos"
                columns={columns}
                rows={documentRows}
                loading={loading}
                onAddClick={() => navigate('/documentos/editor')}
                onRowClick={(row) => navigate(`/documentos/editor?id=${row.id}`)}
                rowActions={rowActions}
                onDelete={handleDeleteClick}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </Box>
    )
}

export default DocumentosPage
