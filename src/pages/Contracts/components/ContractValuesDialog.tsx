import React, { useEffect, useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import NumberPicker from '../../../components/NumberPicker'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

interface ContractValuesDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { cicloId: string; modalidadeId: string; valorContrato: number | undefined }) => void
    initialData: { cicloId: string; modalidadeId: string; valorContrato: number | undefined }
    cicloOptions: Array<{ label: string; value: string }>
    modalidadeOptions: Array<{ label: string; value: string; cicloPagamentoId: string }>
    permissions: string[]
    saving: boolean
}

const ContractValuesDialog: React.FC<ContractValuesDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    cicloOptions,
    modalidadeOptions,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)

    useEffect(() => {
        if (open) {
            setForm(initialData)
        }
    }, [open, initialData])

    const accessMode = getAccessMode(permissions, 'contratos:contratos:valores')
    const editable = canEdit(accessMode)

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Valores do Contrato"
            mode={editable ? 'edit' : 'view'}
            saving={saving}
            canSave={editable}
        >
            <SelectPicker
                label="Ciclo"
                value={form.cicloId}
                onChange={(val) => {
                    setForm((prev) => ({ ...prev, cicloId: val as string, modalidadeId: '' }))
                }}
                options={cicloOptions}
                fullWidth
                placeholder="Selecione o ciclo"
                required
                disabled={!editable}
            />
            <SelectPicker
                label="Modalidade"
                value={form.modalidadeId}
                onChange={(val) => setForm((prev) => ({ ...prev, modalidadeId: val as string }))}
                options={form.cicloId
                    ? modalidadeOptions
                        .filter((m) => m.cicloPagamentoId === form.cicloId)
                        .map((m) => ({ label: m.label, value: m.value }))
                    : []
                }
                fullWidth
                placeholder={form.cicloId ? "Selecione a modalidade" : "Selecione primeiro o ciclo"}
                required
                disabled={!form.cicloId || !editable}
            />
            <NumberPicker
                label="Valor do Contrato"
                value={form.valorContrato}
                onChange={(val) => setForm((prev) => ({ ...prev, valorContrato: val }))}
                fullWidth
                required
                disabled={!editable}
                format="currency"
            />
        </TableCardModal>
    )
}

export default ContractValuesDialog
