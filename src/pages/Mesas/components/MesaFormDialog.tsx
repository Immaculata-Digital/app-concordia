import { useState, useEffect } from 'react'
import {
    TextField,
    Grid,
    MenuItem
} from '@mui/material'
import {
    TableCardModal
} from '../../../components/Modals'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { isFull } from '../../../utils/accessControl'

interface MesaFormDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    title?: string
    initialData?: any
    saving?: boolean
    accessMode?: AccessMode
}

const STATUS_OPTIONS = [
    { value: 'LIVRE', label: 'Livre' },
    { value: 'OCUPADA', label: 'Ocupada' },
    { value: 'RESERVADA', label: 'Reservada' },
    { value: 'MANUTENCAO', label: 'Manutenção' }
]

const MesaFormDialog = ({ open, onClose, onSave, title, initialData, saving, accessMode = 'full' }: MesaFormDialogProps) => {
    const [form, setForm] = useState({
        numero: '',
        capacidade: 4,
        status: 'LIVRE'
    })

    useEffect(() => {
        if (initialData) {
            setForm({
                numero: initialData.numero || '',
                capacidade: initialData.capacidade || 4,
                status: initialData.status || 'LIVRE'
            })
        } else {
            setForm({
                numero: '',
                capacidade: 4,
                status: 'LIVRE'
            })
        }
    }, [initialData, open])

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title={`${initialData ? 'Editar' : 'Nova'} ${title}`}
            mode={initialData ? 'edit' : 'add'}
            saving={saving}
            canSave={isFull(accessMode)}
            maxWidth="xs"
        >
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Número da Mesa"
                        value={form.numero}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })}
                        disabled={!isFull(accessMode)}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Capacidade"
                        type="number"
                        value={form.capacidade}
                        onChange={(e) => setForm({ ...form, capacidade: Number(e.target.value) })}
                        disabled={!isFull(accessMode)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        select
                        label="Status"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        disabled={!isFull(accessMode)}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default MesaFormDialog
