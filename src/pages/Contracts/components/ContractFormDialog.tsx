import {
    Grid,
} from '@mui/material'
import SelectPicker from '../../../components/SelectPicker'
import NumberPicker from '../../../components/NumberPicker'
import { useState, useEffect, useMemo } from 'react'
import { isFull, canEdit } from '../../../utils/accessControl'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { TableCardModal } from '../../../components/Modals'
import Toast from '../../../components/Toast'

type ContractFormDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (data: { clienteId: string; cicloId: string; modalidadeId: string; valorContrato: number }) => void
    clienteOptions: Array<{ label: string; value: string; addresses?: any[] }>
    cicloOptions: Array<{ label: string; value: string }>
    modalidadeOptions: Array<{ label: string; value: string; cicloPagamentoId: string }>
    title?: string
    saving?: boolean
    accessMode?: AccessMode
}

const ContractFormDialog = ({
    open,
    onClose,
    onSave,
    clienteOptions,
    cicloOptions,
    modalidadeOptions,
    title = 'Contrato',
    saving = false,
    accessMode = 'full'
}: ContractFormDialogProps) => {
    const [form, setForm] = useState({
        clienteId: '',
        cicloId: '',
        modalidadeId: '',
        valorContrato: undefined as number | undefined,
    })
    const [initialForm, setInitialForm] = useState({
        clienteId: '',
        cicloId: '',
        modalidadeId: '',
        valorContrato: undefined as number | undefined,
    })

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            const initial = { clienteId: '', cicloId: '', modalidadeId: '', valorContrato: undefined }
            setForm(initial as any)
            setInitialForm(initial as any)
            setError(null)
        }
    }, [open])

    // Filtrar modalidades baseado no ciclo selecionado
    const filteredModalidadeOptions = form.cicloId
        ? modalidadeOptions.filter((m) => m.cicloPagamentoId === form.cicloId)
        : []

    // Limpar modalidade quando o ciclo mudar
    const handleCicloChange = (val: string | number | (string | number)[] | null) => {
        setForm(prev => ({ ...prev, cicloId: (val as string) || '', modalidadeId: '' }))
    }

    const handleClienteChange = (val: string | number | (string | number)[] | null) => {
        const clienteId = (val as string) || ''
        setForm(prev => ({ ...prev, clienteId }))
    }

    const handleSave = () => {
        const requiredFields = []
        if (!form.clienteId) requiredFields.push('Cliente')
        if (!form.cicloId) requiredFields.push('Ciclo')
        if (!form.modalidadeId) requiredFields.push('Modalidade')
        if (form.valorContrato === undefined || form.valorContrato === null) requiredFields.push('Valor do Contrato')

        if (requiredFields.length > 0) {
            setError(`Preencha os campos obrigatórios: ${requiredFields.join(', ')}`)
            return
        }

        if (form.valorContrato !== undefined && form.valorContrato <= 0) {
            setError('O valor do contrato deve ser maior que zero')
            return
        }

        onSave(form as any)
    }

    const isDirty = useMemo(() => {
        return JSON.stringify(form) !== JSON.stringify(initialForm)
    }, [form, initialForm])

    return (
        <>
            <TableCardModal
                open={open}
                onClose={onClose}
                onSave={handleSave}
                title={title}
                mode="add"
                saving={saving}
                isDirty={isDirty}
                canSave={isFull(accessMode)}
                maxWidth="sm"
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Cliente"
                            value={form.clienteId}
                            onChange={handleClienteChange}
                            options={clienteOptions}
                            fullWidth
                            placeholder="Selecione o cliente"
                            required
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Ciclo"
                            value={form.cicloId}
                            onChange={handleCicloChange}
                            options={cicloOptions}
                            fullWidth
                            placeholder="Selecione o ciclo"
                            required
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Modalidade"
                            value={form.modalidadeId}
                            onChange={(val) => setForm(prev => ({ ...prev, modalidadeId: val as string }))}
                            options={filteredModalidadeOptions.map((m) => ({ label: m.label, value: m.value }))}
                            fullWidth
                            placeholder={form.cicloId ? "Selecione a modalidade" : "Selecione primeiro o ciclo"}
                            required
                            disabled={!form.cicloId}
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <NumberPicker
                            label="Valor do Contrato"
                            value={form.valorContrato}
                            onChange={(val) => setForm(prev => ({ ...prev, valorContrato: val }))}
                            fullWidth
                            required
                            disabled={!canEdit(accessMode)}
                            format="currency"
                        />
                    </Grid>
                </Grid>
            </TableCardModal>
            <Toast
                open={Boolean(error)}
                message={error}
                onClose={() => setError(null)}
                severity="error"
            />
        </>
    )
}

export default ContractFormDialog
