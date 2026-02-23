import { useState, useEffect } from 'react'
import {
    Stack,
} from '@mui/material'
import SelectPicker from '../../../components/SelectPicker'
import TextPicker from '../../../components/TextPicker'
import { TableCardModal } from '../../../components/Modals'

type StatusHistoryDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (data: { newStatus: string; changeReason: string }) => Promise<void>
    initialData?: { newStatus?: string; changeReason?: string }
    statusOptions: Array<{ label: string; value: string }>
    permissions: string[]
    saving: boolean
    onToast?: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void
}

const StatusHistoryDialog = ({
    open,
    onClose,
    onSave,
    initialData,
    statusOptions,
    saving,
    onToast,
}: StatusHistoryDialogProps) => {
    const [formData, setFormData] = useState({
        newStatus: '',
        changeReason: '',
    })


    useEffect(() => {
        if (open) {
            setFormData({
                newStatus: initialData?.newStatus || '',
                changeReason: initialData?.changeReason || '',
            })
        }
    }, [open, initialData])

    const handleSave = () => {
        if (!formData.newStatus) {
            if (onToast) {
                onToast('O campo Novo Status é obrigatório', 'warning')
            }
            return
        }
        onSave({
            newStatus: formData.newStatus,
            changeReason: formData.changeReason,
        })
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Status"
            addTitle="Alterar Status"
            mode="add"
            saving={saving}
            maxWidth="sm"
        >
            <Stack spacing={3}>
                <SelectPicker
                    label="Novo Status"
                    value={formData.newStatus}
                    onChange={(val: any) => setFormData({ ...formData, newStatus: String(val || '') })}
                    options={statusOptions}
                    disabled={saving}
                    required
                    fullWidth
                />
                <TextPicker
                    label="Motivo da Alteração"
                    value={formData.changeReason}
                    onChange={(val: string) => setFormData({ ...formData, changeReason: val })}
                    disabled={saving}
                    multiline
                    rows={3}
                    fullWidth
                />
            </Stack>
        </TableCardModal>
    )
}

export default StatusHistoryDialog
