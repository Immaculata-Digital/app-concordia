import React, { useEffect, useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import { Box, TextField } from '@mui/material'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { toUTCDate } from '../../../utils/date'
import Toast from '../../../components/Toast'

interface VigenciaDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { vigenciaDataInicio: string; vigenciaDataFim: string }) => void
    initialData: { vigenciaDataInicio: string; vigenciaDataFim: string }
    prazoMeses: number
    permissions: string[]
    saving: boolean
}

const VigenciaDialog: React.FC<VigenciaDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    prazoMeses,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)
    const [errors, setErrors] = useState<{ vigenciaDataInicio?: string }>({})
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
        open: false,
        message: '',
        severity: 'error'
    })

    useEffect(() => {
        if (open) {
            setForm(initialData)
            setErrors({})
            setToast({ open: false, message: '', severity: 'error' })
        }
    }, [open, initialData])

    const calculateDataFim = (startDateStr: string) => {
        if (!startDateStr || !prazoMeses) return ''

        try {
            // normalizar para UTC para evitar problemas de fuso
            const date = new Date(`${startDateStr}T12:00:00Z`)
            if (isNaN(date.getTime())) return ''

            // Adicionar meses
            date.setMonth(date.getMonth() + prazoMeses)

            return date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value
        const newEnd = calculateDataFim(newStart)
        setForm({
            vigenciaDataInicio: newStart,
            vigenciaDataFim: newEnd
        })

        if (newStart) {
            setErrors(prev => ({ ...prev, vigenciaDataInicio: undefined }))
        }
    }

    const accessMode = getAccessMode(permissions, 'contratos:contratos:vigencia')
    const editable = canEdit(accessMode)

    const handleSave = () => {
        const newErrors: { vigenciaDataInicio?: string } = {}

        if (!form.vigenciaDataInicio) {
            newErrors.vigenciaDataInicio = 'Data de início é obrigatória'
            setToast({
                open: true,
                message: 'Data de início é obrigatória',
                severity: 'error'
            })
        } else if (!form.vigenciaDataFim) {
            setToast({
                open: true,
                message: 'Não foi possível calcular o fim sem o prazo da modalidade',
                severity: 'error'
            })
            return
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        onSave({
            vigenciaDataInicio: toUTCDate(form.vigenciaDataInicio) || '',
            vigenciaDataFim: toUTCDate(form.vigenciaDataFim) || ''
        })
    }

    return (
        <>
            <TableCardModal
                open={open}
                onClose={onClose}
                onSave={handleSave}
                title="Vigência do Contrato"
                mode={editable ? 'edit' : 'view'}
                saving={saving}
                canSave={editable}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label="Data de Início"
                        type="date"
                        value={form.vigenciaDataInicio?.split('T')[0] || ''}
                        onChange={handleStartDateChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled={!editable}
                        error={!!errors.vigenciaDataInicio}
                        helperText={errors.vigenciaDataInicio}
                    />
                    <TextField
                        label="Data de Fim"
                        type="date"
                        value={form.vigenciaDataFim?.split('T')[0] || ''}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled // Always disabled as per request
                        error={!form.vigenciaDataFim && !!form.vigenciaDataInicio}
                        helperText={
                            !form.vigenciaDataFim && !!form.vigenciaDataInicio
                                ? 'Não foi possível calcular o fim sem o prazo da modalidade'
                                : (prazoMeses ? `Calculado com base no prazo de ${prazoMeses} meses` : 'Selecione uma modalidade com prazo')
                        }
                    />
                </Box>
            </TableCardModal>

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
            />
        </>
    )
}

export default VigenciaDialog
