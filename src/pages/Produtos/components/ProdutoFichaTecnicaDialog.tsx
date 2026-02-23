
import { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import TextPicker from '../../../components/TextPicker'
import { getAccessMode, getContextualAccessMode, canCreate } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'

interface ProdutoFichaTecnicaDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    saving: boolean
}

const ProdutoFichaTecnicaDialog = ({ open, onClose, onSave, saving }: ProdutoFichaTecnicaDialogProps) => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:produtos')
    const [form, setForm] = useState({
        chave: '',
        valor: '',
        sort: 0
    })

    useEffect(() => {
        if (open) {
            setForm({ chave: '', valor: '', sort: 0 })
        }
    }, [open])

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Adicionar Especificação"
            mode="add"
            saving={saving}
            canSave={canCreate(accessMode)}
            maxWidth="xs"
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Chave (Ex: Cor, Material)"
                        value={form.chave}
                        onChange={(val) => setForm({ ...form, chave: val })}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, false)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Valor (Ex: Azul, Algodão)"
                        value={form.valor}
                        onChange={(val) => setForm({ ...form, valor: val })}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, false)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Ordem"
                        value={form.sort.toString()}
                        onChange={(val) => setForm({ ...form, sort: parseInt(val) || 0 })}
                        type="number"
                        fullWidth
                        accessMode={getContextualAccessMode(accessMode, false)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default ProdutoFichaTecnicaDialog
