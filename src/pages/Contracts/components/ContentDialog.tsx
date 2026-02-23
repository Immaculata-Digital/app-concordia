import React, { useEffect, useState } from 'react'
import { Box, Button } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import BlockEditorPicker from '../../../components/BlockEditorPicker'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { contractTemplateService } from '../../../services/contractTemplates'

interface ContentDialogProps {
    open: boolean
    onClose: () => void
    onSave: (content: string) => void
    initialContent: string
    templateOptions: Array<{ label: string; value: string }>
    variables: any[]
    permissions: string[]
    saving: boolean
    onToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void
}

const ContentDialog: React.FC<ContentDialogProps> = ({
    open,
    onClose,
    onSave,
    initialContent,
    templateOptions,
    variables,
    permissions,
    saving,
    onToast,
}) => {
    const [content, setContent] = useState(initialContent)
    const [selectedImportTemplate, setSelectedImportTemplate] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setContent(initialContent)
        }
    }, [open, initialContent])

    const accessMode = getAccessMode(permissions, 'contratos:contratos:conteudo')
    const editable = canEdit(accessMode)

    const handleSave = () => {
        onSave(content)
    }

    const handleImportTemplate = async () => {
        if (!selectedImportTemplate) {
            onToast('Selecione um template para importar', 'warning')
            return
        }

        try {
            const template = await contractTemplateService.getById(selectedImportTemplate)
            const templateContent = typeof template.content === 'string'
                ? template.content
                : JSON.stringify(template.content)

            setContent(templateContent)
            setSelectedImportTemplate(null)
            onToast('Template importado para o editor!', 'success')
        } catch (error) {
            console.error('Erro ao importar template:', error)
            onToast('Erro ao importar template', 'error')
        }
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Conteúdo"
            mode={editable ? 'edit' : 'view'}
            maxWidth="md"
            saving={saving}
            canSave={editable}
            isDirty={content !== initialContent}
        >
            {editable && (
                <Box className="content-dialog__import-section">
                    <Box className="content-dialog__import-field">
                        <SelectPicker
                            label="Importar de Template"
                            value={selectedImportTemplate || ''}
                            onChange={(val) => setSelectedImportTemplate(val as string)}
                            options={templateOptions}
                            fullWidth
                            placeholder="Selecione um template..."
                            clearable
                        />
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={handleImportTemplate}
                        disabled={!selectedImportTemplate}
                        className="content-dialog__import-button"
                    >
                        Importar
                    </Button>
                </Box>
            )}

            <BlockEditorPicker
                label="Conteúdo do Contrato"
                value={content}
                onChange={(val) => setContent(val)}
                placeholder="Digite o conteúdo do contrato..."
                required
                mentions={variables}
                disabled={!editable}
            />
        </TableCardModal>
    )
}

export default ContentDialog
