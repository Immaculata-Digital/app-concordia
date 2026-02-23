import React, { useEffect, useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

interface ComercialDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { promotorId: string }) => void
    initialData: { promotorId: string }
    promotorOptions: Array<{ label: string; value: string }>
    permissions: string[]
    saving: boolean
}

const ComercialDialog: React.FC<ComercialDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    promotorOptions,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)

    useEffect(() => {
        if (open) {
            setForm(initialData)
        }
    }, [open, initialData])

    const accessMode = getAccessMode(permissions, 'contratos:contratos:comercial')
    const editable = canEdit(accessMode)

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Informações Comerciais"
            mode={editable ? 'edit' : 'view'}
            saving={saving}
            canSave={editable}
        >
            <SelectPicker
                label="Promotor"
                value={form.promotorId}
                onChange={(val) => setForm((prev) => ({ ...prev, promotorId: val as string }))}
                options={promotorOptions}
                fullWidth
                placeholder="Selecione o promotor"
                clearable
                disabled={!editable}
            />
        </TableCardModal>
    )
}

export default ComercialDialog
