import React, { useEffect, useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import FileUpload from '../../../components/FileUpload'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, canEdit, canCreate } from '../../../utils/accessControl'
import { contractsService, type ContractAttachmentCategoryEnumDTO } from '../../../services/contracts'
import { Box } from '@mui/material'

interface AttachmentDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { file: string; fileName: string; fileSize: number; categoryCode: string }) => void
    initialData: { file: string; fileName: string; fileSize: number; categoryCode: string }
    isEditing: boolean
    permissions: string[]
    saving: boolean
}

const AttachmentDialog: React.FC<AttachmentDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    isEditing,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)
    const [categories, setCategories] = useState<ContractAttachmentCategoryEnumDTO[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)

    useEffect(() => {
        if (open) {
            setForm(initialData)
            loadCategories()
        }
    }, [open, initialData])

    const loadCategories = async () => {
        try {
            setLoadingCategories(true)
            const data = await contractsService.attachments.listCategories()
            setCategories(data.filter(c => c.enabled).sort((a, b) => a.sort - b.sort))
        } catch (err) {
            console.error('Erro ao carregar categorias de anexos:', err)
        } finally {
            setLoadingCategories(false)
        }
    }

    const accessMode = getAccessMode(permissions, 'contratos:contratos:anexos')
    const canSave = (isEditing ? canEdit : canCreate)(accessMode)
    const mode = isEditing ? (canEdit(accessMode) ? 'edit' : 'view') : 'add'

    const handleSave = () => {
        if (!form.categoryCode) return
        onSave(form)
    }

    const isFormValid = !!form.file && !!form.fileName && !!form.categoryCode

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Anexo"
            mode={mode}
            saving={saving}
            canSave={canSave && isFormValid && !loadingCategories}
        >
            <Box className="attachment-dialog__form">
                <SelectPicker
                    label="Categoria do Anexo"
                    value={form.categoryCode}
                    onChange={(val) => setForm(prev => ({ ...prev, categoryCode: val as string }))}
                    options={categories.map(c => ({ value: c.code, label: c.name }))}
                    disabled={loadingCategories || (isEditing && !canEdit(accessMode))}
                    placeholder={loadingCategories ? 'Carregando categorias...' : 'Selecione uma opção'}
                    fullWidth
                    required
                    error={!form.categoryCode && open}
                    helperText={!form.categoryCode && open ? 'A categoria é obrigatória' : undefined}
                />

                <FileUpload
                    label="Arquivo do Documento"
                    value={form.file}
                    fileName={form.fileName}
                    fileSize={form.fileSize}
                    onChange={(val, meta: any) => setForm(prev => ({
                        ...prev,
                        file: val,
                        fileName: meta ? meta.name : prev.fileName,
                        fileSize: meta ? meta.size : prev.fileSize
                    }))}
                    onFileNameChange={(newName) => setForm(prev => ({
                        ...prev,
                        fileName: newName
                    }))}
                    fullWidth
                    required
                    showPreview={true}
                    showDownload={true}
                    accessMode={accessMode}
                />
            </Box>
        </TableCardModal>
    )
}

export default AttachmentDialog
