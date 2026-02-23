import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import FileUpload from '../../../components/FileUpload'
import DatePicker from '../../../components/DatePicker'
import { getContextualAccessMode, canEdit, canCreate, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleDocument, peopleService } from '../../../services/people'

interface PeopleDocumentDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingDocument: PeopleDocument | null
    saving: boolean
}

const PeopleDocumentDialog = ({ open, onClose, onSave, editingDocument, saving }: PeopleDocumentDialogProps) => {
    const { permissions } = useAuth()
    const [categories, setCategories] = useState<any[]>([])
    const [documentForm, setDocumentForm] = useState({
        categoryCode: '',
        file: '',
        expirationDate: '',
        fileName: '',
        fileSize: 0 as number | string
    })

    const initialDocumentForm = useMemo(() => ({
        categoryCode: editingDocument?.categoryCode || '',
        file: editingDocument?.file || '',
        expirationDate: editingDocument?.expirationDate || '',
        fileName: editingDocument?.fileName || '',
        fileSize: editingDocument?.fileSize || 0
    }), [editingDocument])

    useEffect(() => {
        if (open) {
            setDocumentForm(initialDocumentForm)
            // Load categories
            peopleService.listDocumentsCategories().then(setCategories).catch(console.error)
        }
    }, [open, initialDocumentForm])

    const isDocumentDirty = useMemo(() => JSON.stringify(documentForm) !== JSON.stringify(initialDocumentForm), [documentForm, initialDocumentForm])

    const categoryOptions = useMemo(() =>
        categories.map(cat => ({ value: cat.code, label: cat.name })),
        [categories])

    const handleSave = () => {
        onSave(documentForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingDocument ? 'edit' : 'add'}
            saving={saving}
            isDirty={isDocumentDirty}
            title="Documento"
            maxWidth="sm"
            canSave={(editingDocument ? canEdit : canCreate)(accessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Tipo de Documento"
                        value={documentForm.categoryCode}
                        onChange={(val: any) => setDocumentForm(prev => ({ ...prev, categoryCode: val as string }))}
                        options={categoryOptions}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingDocument)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <FileUpload
                        label="Arquivo do Documento"
                        value={documentForm.file}
                        fileName={documentForm.fileName}
                        fileSize={documentForm.fileSize}
                        onChange={(val: string, meta: any) => setDocumentForm(prev => ({
                            ...prev,
                            file: val,
                            fileName: meta ? meta.name : prev.fileName,
                            fileSize: meta ? meta.size : prev.fileSize
                        }))}
                        onFileNameChange={(newName: string) => setDocumentForm(prev => ({
                            ...prev,
                            fileName: newName
                        }))}
                        fullWidth
                        required
                        showPreview={permissions.includes('erp:pessoas:documentos:preview')}
                        showDownload={permissions.includes('erp:pessoas:documentos:download')}
                        accessMode={getContextualAccessMode(accessMode, !!editingDocument)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <DatePicker
                        label="Data de Expiração"
                        value={documentForm.expirationDate}
                        onChange={(val: any) => setDocumentForm(prev => ({ ...prev, expirationDate: val }))}
                        fullWidth
                        accessMode={getContextualAccessMode(accessMode, !!editingDocument)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default PeopleDocumentDialog
