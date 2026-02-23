import React, { useEffect, useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, canEdit, canCreate } from '../../../utils/accessControl'

interface SignerDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { pessoaId: string }) => void
    initialData: { pessoaId: string }
    isEditing: boolean
    clienteOptions: Array<{ label: string; value: string }>
    permissions: string[]
    saving: boolean
}

const SignerDialog: React.FC<SignerDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    isEditing,
    clienteOptions,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)

    useEffect(() => {
        if (open) {
            setForm(initialData)
        }
    }, [open, initialData])

    const accessMode = getAccessMode(permissions, 'contratos:contratos:assinantes')
    const canSave = (isEditing ? canEdit : canCreate)(accessMode)
    const mode = isEditing ? (canEdit(accessMode) ? 'edit' : 'view') : 'add'

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Assinante"
            mode={mode}
            saving={saving}
            canSave={canSave}
        >
            <SelectPicker
                label="Pessoa"
                value={form.pessoaId}
                onChange={(val) => setForm((prev) => ({ ...prev, pessoaId: val as string }))}
                options={clienteOptions}
                fullWidth
                placeholder="Selecione a pessoa"
                required
                clearable={false}
                disabled={isEditing ? !canEdit(accessMode) : !canCreate(accessMode)}
            />
        </TableCardModal>
    )
}

export default SignerDialog
