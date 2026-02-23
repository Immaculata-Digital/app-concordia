import { useState, useEffect, useMemo } from 'react'
import {
    TextField,
    Grid,
    MenuItem,
    CircularProgress
} from '@mui/material'
import {
    TableCardModal
} from '../../../components/Modals'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { isFull } from '../../../utils/accessControl'
import { useMesasList } from '../../../hooks/queries/mesas'

interface ComandaFormDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    title?: string
    saving?: boolean
    accessMode?: AccessMode
}

const ComandaFormDialog = ({ open, onClose, onSave, title, saving, accessMode = 'full' }: ComandaFormDialogProps) => {
    const { data: mesas = [], isLoading: isLoadingMesas } = useMesasList()

    // Only LIVRE mesas for new comandas
    const availableMesas = useMemo(() => {
        return mesas.filter(m => m.status === 'LIVRE')
    }, [mesas])

    const [form, setForm] = useState({
        mesaId: '',
        clienteNome: ''
    })

    useEffect(() => {
        if (open) {
            setForm({
                mesaId: '',
                clienteNome: ''
            })
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
            title={`Abrir ${title}`}
            mode="add"
            saving={saving}
            canSave={isFull(accessMode) && !!form.mesaId}
            maxWidth="xs"
        >
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        select
                        label="Mesa"
                        value={form.mesaId}
                        onChange={(e) => setForm({ ...form, mesaId: e.target.value })}
                        disabled={!isFull(accessMode) || isLoadingMesas}
                        required
                        InputProps={{
                            endAdornment: isLoadingMesas ? <CircularProgress size={20} /> : null
                        }}
                    >
                        {availableMesas.length > 0 ? (
                            availableMesas.map((mesa) => (
                                <MenuItem key={mesa.uuid} value={mesa.uuid}>
                                    Mesa {mesa.numero}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled value="">
                                Nenhuma mesa livre disponível
                            </MenuItem>
                        )}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Nome do Cliente (Opcional)"
                        value={form.clienteNome}
                        onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
                        disabled={!isFull(accessMode)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default ComandaFormDialog
