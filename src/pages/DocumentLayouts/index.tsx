import { useState, useEffect, useMemo } from 'react'
import {
    Box,
    Typography,
    Grid,
    TextField,
    MenuItem
} from '@mui/material'
import { Visibility, Edit } from '@mui/icons-material'
import { type DocumentLayoutDTO } from '../../services/documents'
import { authService } from '../../services/auth'
import { useSearch } from '../../context/SearchContext'
import {
    useDocumentLayoutsScreenData,
    useCreateLayoutMutation,
    useUpdateLayoutMutation,
    useDeleteLayoutMutation
} from '../../hooks/queries/documentLayouts'

import Toast from '../../components/Toast'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import { TableCardModal } from '../../components/Modals'
import './styles.css'

// Mock CSS Base for new layouts to avoid breaking
const DEFAULT_CSS = `
main { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.7; color: #333; padding: 0 60px; }
h1 { font-size: 22pt; font-weight: 800; margin-bottom: 24px; color: #111; }
h2 { font-size: 16pt; font-weight: 600; margin-bottom: 16px; color: #222; }
p { margin-bottom: 1.25em; text-align: justify; }
table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; }
td { border: 1px solid #eee; padding: 12px; }
`

type LayoutRow = TableCardRow & DocumentLayoutDTO

const DocumentLayouts = () => {
    const { setFilters, setPlaceholder, setQuery } = useSearch()

    // React Query
    const { data: screenData, isLoading: loading } = useDocumentLayoutsScreenData()
    const layouts = (screenData?.layouts || []) as LayoutRow[]
    const categories = screenData?.categories || []

    const createMutation = useCreateLayoutMutation()
    const updateMutation = useUpdateLayoutMutation()
    const deleteMutation = useDeleteLayoutMutation()

    // Optimization: Map for category lookup O(1)
    const categoriesMap = useMemo(() =>
        new Map(categories.map(c => [c.code, c.description || c.code])),
        [categories])

    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
    const [selectedLayout, setSelectedLayout] = useState<LayoutRow | null>(null)
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

    const [formData, setFormData] = useState({
        name: '',
        category_code: '',
        header_html: '',
        footer_html: '',
        css: DEFAULT_CSS
    })
    const [initialFormData, setInitialFormData] = useState<any>({})

    useEffect(() => {
        setPlaceholder('Buscar layout...')
        const filters = [
            { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'layouts' },
            { id: 'category_code', label: 'Categoria', field: 'category_code', type: 'text' as const, page: 'layouts' }
        ]
        setFilters(filters, 'name')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery])

    const handleCreate = async () => {
        if (!formData.name) {
            setToast({ open: true, message: 'Nome é obrigatório', severity: 'error' })
            return
        }

        const user = authService.getUser()
        const currentUser = user?.login || user?.email || 'admin'

        try {
            await createMutation.mutateAsync({
                name: formData.name,
                category_code: formData.category_code,
                header_html: formData.header_html,
                footer_html: formData.footer_html,
                css: formData.css,
                created_by: currentUser,
                enabled: true
            })

            setToast({ open: true, message: 'Layout criado com sucesso!', severity: 'success' })
            setModalOpen(false)
        } catch (error: any) {
            console.error(error)
            setToast({ open: true, message: `Erro ao criar layout: ${error.message || 'Erro desconhecido'}`, severity: 'error' })
        }
    }

    const handleUpdate = async () => {
        if (!selectedLayout || !formData.name) return

        const user = authService.getUser()
        const currentUser = user?.login || user?.email || 'admin'

        try {
            await updateMutation.mutateAsync({
                id: selectedLayout.id as string,
                data: {
                    name: formData.name,
                    category_code: formData.category_code,
                    header_html: formData.header_html,
                    footer_html: formData.footer_html,
                    css: formData.css,
                    updated_by: currentUser
                }
            })

            setToast({ open: true, message: 'Layout atualizado com sucesso!', severity: 'success' })
            setModalOpen(false)
        } catch (error: any) {
            console.error(error)
            setToast({ open: true, message: `Erro ao atualizar layout: ${error.message || 'Erro desconhecido'}`, severity: 'error' })
        }
    }

    const handleSave = () => {
        if (modalMode === 'add') handleCreate()
        else if (modalMode === 'edit') handleUpdate()
    }

    const openAddModal = () => {
        setModalMode('add')
        setSelectedLayout(null)
        const initial = { name: '', category_code: '', header_html: '', footer_html: '', css: DEFAULT_CSS }
        setFormData(initial)
        setInitialFormData(initial)
        setModalOpen(true)
    }

    const openModal = (layout: LayoutRow, mode: 'view' | 'edit') => {
        setModalMode(mode)
        setSelectedLayout(layout)
        const l = layout as any
        const data = {
            name: layout.name,
            category_code: layout.category_code || '',
            header_html: l.header_html || layout.headerHtml || '',
            footer_html: l.footer_html || layout.footerHtml || '',
            css: layout.css || DEFAULT_CSS
        }
        setFormData(data)
        setInitialFormData(data)
        setModalOpen(true)
    }

    const columns = useMemo<TableCardColumn<LayoutRow>[]>(() => [
        { key: 'name', label: 'Nome' },
        {
            key: 'category_code',
            label: 'Categoria',
            render: (val) => categoriesMap.get(val as string) || (val as string || '-')
        },
        {
            key: 'updated_at',
            label: 'Atualizado em',
            dataType: 'date'
        }
    ], [categoriesMap])

    const rowActions: TableCardRowAction<LayoutRow>[] = [
        {
            label: 'Visualizar',
            icon: <Visibility fontSize="small" />,
            onClick: (row) => openModal(row, 'view')
        },
        {
            label: 'Editar',
            icon: <Edit fontSize="small" />,
            onClick: (row) => openModal(row, 'edit')
        }
    ]

    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData)

    const handleDelete = async (id: string | number) => {
        try {
            await deleteMutation.mutateAsync(id as string)
            setToast({ open: true, message: 'Layout excluído com sucesso!', severity: 'success' })
        } catch (error: any) {
            console.error(error)
            setToast({ open: true, message: `Erro ao excluir layout: ${error.message || 'Erro desconhecido'}`, severity: 'error' })
        }
    }

    return (
        <Box sx={{ p: 0 }}>
            <TableCard
                title="Layouts de Documentos"
                columns={columns}
                rows={layouts}
                loading={loading}
                onAddClick={openAddModal}
                onRowClick={(row) => openModal(row, 'view')}
                rowActions={rowActions}
                onDelete={handleDelete}
            />

            <TableCardModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                title="Layout"
                addTitle="Novo Layout"
                viewTitle="Visualizar Layout"
                editTitle="Editar Layout"
                mode={modalMode}
                saving={createMutation.isPending || updateMutation.isPending}
                isDirty={isDirty}
                maxWidth="lg"
                canSave={modalMode === 'add' || modalMode === 'edit'}
            >
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            label="Nome do Layout"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            disabled={modalMode === 'view'}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            label="Categoria"
                            fullWidth
                            value={formData.category_code}
                            onChange={(e) => setFormData(prev => ({ ...prev, category_code: e.target.value }))}
                            disabled={modalMode === 'view'}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        >
                            <MenuItem value=""><em>Nenhuma</em></MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat.id} value={cat.code}>
                                    {cat.description || cat.code}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#e0e0e0' }}>HTML do Cabeçalho</Typography>
                        <TextField
                            multiline
                            rows={8}
                            fullWidth
                            placeholder="<header>...</header>"
                            value={formData.header_html}
                            onChange={(e) => setFormData(prev => ({ ...prev, header_html: e.target.value }))}
                            disabled={modalMode === 'view'}
                            className="code-editor-input"
                            InputProps={{ disableUnderline: true } as any}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#e0e0e0' }}>HTML do Rodapé</Typography>
                        <TextField
                            multiline
                            rows={8}
                            fullWidth
                            placeholder="<footer>...</footer>"
                            value={formData.footer_html}
                            onChange={(e) => setFormData(prev => ({ ...prev, footer_html: e.target.value }))}
                            disabled={modalMode === 'view'}
                            className="code-editor-input"
                            InputProps={{ disableUnderline: true } as any}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#e0e0e0' }}>CSS Base (Injetado no Cabeçalho)</Typography>
                        <TextField
                            multiline
                            rows={6}
                            fullWidth
                            placeholder="body { ... }"
                            value={formData.css}
                            onChange={(e) => setFormData(prev => ({ ...prev, css: e.target.value }))}
                            disabled={modalMode === 'view'}
                            className="code-editor-input"
                            InputProps={{ disableUnderline: true } as any}
                        />
                    </Grid>
                </Grid>
            </TableCardModal>

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </Box>
    )
}

export default DocumentLayouts
