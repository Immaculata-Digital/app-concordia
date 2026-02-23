import { useEffect, useState, useMemo } from 'react'
import { TextField, Switch, FormControlLabel } from '@mui/material'
import Grid from '@mui/material/Grid'
import {
    useCreateCardapioItem,
    useUpdateCardapioItem
} from '../../../hooks/queries/cardapioItens'
import { useProdutosList } from '../../../hooks/queries/produtos'
import type { CardapioItemDTO, CreateCardapioItemPayload } from '../../../services/cardapioItens'
import { TableCardModal } from '../../../components/Modals/TableCardModal'
import { canEdit, canCreate } from '../../../utils/accessControl'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import SelectPicker from '../../../components/SelectPicker'

interface CardapioItemFormDialogProps {
    open: boolean
    onClose: () => void
    itemToEdit?: CardapioItemDTO | null
    onSuccess: (msg: string) => void
    onError: (msg: string) => void
    accessMode: AccessMode
}

export function CardapioItemFormDialog({
    open,
    onClose,
    itemToEdit,
    onSuccess,
    onError,
    accessMode
}: CardapioItemFormDialogProps) {
    const isEdit = !!itemToEdit
    const mode = isEdit ? (canEdit(accessMode) ? 'edit' : 'view') : (canCreate(accessMode) ? 'add' : 'view')
    const isViewOnly = mode === 'view'

    const createMutation = useCreateCardapioItem()
    const updateMutation = useUpdateCardapioItem()

    const { data: produtos } = useProdutosList()

    const produtoOptions = useMemo(() => {
        if (!produtos) return []
        return produtos.map(p => ({ value: p.uuid, label: p.nome }))
    }, [produtos])

    const [form, setForm] = useState<CreateCardapioItemPayload>({
        produtoId: '',
        ordem: 0,
        ativo: true
    })

    useEffect(() => {
        if (itemToEdit) {
            setForm({
                produtoId: itemToEdit.produtoId,
                ordem: itemToEdit.ordem,
                ativo: itemToEdit.ativo
            })
        } else {
            setForm({
                produtoId: '',
                ordem: 0,
                ativo: true
            })
        }
    }, [itemToEdit, open])

    const handleSave = async () => {
        if (!form.produtoId) {
            onError('Produto é campo obrigatório')
            return
        }

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ uuid: itemToEdit.uuid, payload: form })
                onSuccess('Item do cardápio atualizado')
            } else {
                await createMutation.mutateAsync(form)
                onSuccess('Item do cardápio criado')
            }
            onClose()
        } catch (error) {
            onError('Erro ao salvar item. Verifique se este produto já está no cardápio.')
        }
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={mode}
            title="Item de Cardápio"
            saving={createMutation.isPending || updateMutation.isPending}
            maxWidth="sm"
        >
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Produto para o Cardápio"
                        value={form.produtoId}
                        options={produtoOptions}
                        onChange={(val: any) => setForm((prev) => ({ ...prev, produtoId: val as string }))}
                        disabled={isViewOnly || isEdit}
                        fullWidth
                    />
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        fullWidth
                        label="Ordem de Exibição"
                        type="number"
                        value={form.ordem}
                        onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                        disabled={isViewOnly}
                    />
                </Grid>

                <Grid size={{ xs: 6 }} display="flex" alignItems="center" justifyContent="center">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.ativo}
                                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                                disabled={isViewOnly}
                            />
                        }
                        label={form.ativo ? 'Ativo' : 'Inativo'}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}
