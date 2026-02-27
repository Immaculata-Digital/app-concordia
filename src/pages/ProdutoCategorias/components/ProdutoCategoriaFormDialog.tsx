import { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import Grid from '@mui/material/Grid'
import {
    useCreateProdutoCategoria,
    useUpdateProdutoCategoria
} from '../../../hooks/queries/produtoCategorias'
import type { ProdutoCategoriaDTO, CreateProdutoCategoriaPayload } from '../../../services/produtoCategorias'
import { TableCardModal } from '../../../components/Modals/TableCardModal'
import { canEdit, canCreate } from '../../../utils/accessControl'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'

interface ProdutoCategoriaFormDialogProps {
    open: boolean
    onClose: () => void
    categoriaToEdit?: ProdutoCategoriaDTO | null
    onSuccess: (msg: string, category?: ProdutoCategoriaDTO) => void
    onError: (msg: string) => void
    accessMode: AccessMode
}

export function ProdutoCategoriaFormDialog({
    open,
    onClose,
    categoriaToEdit,
    onSuccess,
    onError,
    accessMode
}: ProdutoCategoriaFormDialogProps) {
    const isEdit = !!categoriaToEdit
    const mode = isEdit ? (canEdit(accessMode) ? 'edit' : 'view') : (canCreate(accessMode) ? 'add' : 'view')
    const isViewOnly = mode === 'view'

    const createMutation = useCreateProdutoCategoria()
    const updateMutation = useUpdateProdutoCategoria()

    const [form, setForm] = useState<CreateProdutoCategoriaPayload>({
        code: '',
        name: '',
        description: '',
        icon: 'Category',
        sort: 0,
        enabled: true
    })

    useEffect(() => {
        if (categoriaToEdit) {
            setForm({
                code: categoriaToEdit.code,
                name: categoriaToEdit.name,
                description: categoriaToEdit.description || '',
                icon: categoriaToEdit.icon,
                sort: categoriaToEdit.sort,
                enabled: categoriaToEdit.enabled
            })
        } else {
            setForm({
                code: '',
                name: '',
                description: '',
                icon: 'Category',
                sort: 0,
                enabled: true
            })
        }
    }, [categoriaToEdit, open])

    const handleSave = async () => {
        if (!form.name || !form.code) {
            onError('Nome e Código são obrigatórios')
            return
        }

        try {
            if (isEdit) {
                const updated = await updateMutation.mutateAsync({ uuid: categoriaToEdit.uuid, payload: form })
                onSuccess('Categoria atualizada', updated)
            } else {
                const created = await createMutation.mutateAsync(form)
                onSuccess('Categoria criada', created)
            }
            onClose()
        } catch (error) {
            onError('Erro ao salvar categoria. Verifique se o código é único.')
        }
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={mode}
            title="Categoria de Produto"
            saving={createMutation.isPending || updateMutation.isPending}
            maxWidth="sm"
        >
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Código (Único)"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        disabled={isViewOnly || isEdit}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Nome"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={isViewOnly}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Descrição"
                        multiline
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        disabled={isViewOnly}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Ordem (Peso)"
                        type="number"
                        value={form.sort}
                        onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
                        disabled={isViewOnly}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}
