
import { useState, useEffect } from 'react'
import { Grid, MenuItem } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import TextPicker from '../../../components/TextPicker'
import SelectPicker from '../../../components/SelectPicker'
import FileUpload from '../../../components/FileUpload'
import { produtoService } from '../../../services/produto'
import { useQuery } from '@tanstack/react-query'
import { getAccessMode, getContextualAccessMode, canCreate } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'

interface ProdutoSubResourceDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    type: 'media' | 'kit' | 'variacoes'
    saving: boolean
}

const MEDIA_TIPOS = [
    { value: 'IMG', label: 'Imagem' },
    { value: 'VID', label: 'Vídeo' },
    { value: 'DOC', label: 'Documento' },
]

const ProdutoSubResourceDialog = ({ open, onClose, onSave, type, saving }: ProdutoSubResourceDialogProps) => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:produtos')
    const [form, setForm] = useState<any>({})

    const { data: produtos = [] } = useQuery({
        queryKey: ['produtos', 'list-simple'],
        queryFn: () => produtoService.list(),
        enabled: open && (type === 'kit' || type === 'variacoes')
    })

    useEffect(() => {
        if (open) {
            if (type === 'media') setForm({ tipo_code: 'IMG', ordem: 0 })
            else if (type === 'kit') setForm({ quantidade: 1 })
            else setForm({ grade: {} })
        }
    }, [open, type])

    const handleSave = () => {
        onSave(form)
    }

    const renderFields = () => {
        switch (type) {
            case 'media':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <SelectPicker
                                label="Tipo de Mídia"
                                value={form.tipo_code || 'IMG'}
                                onChange={(val) => setForm({ ...form, tipo_code: val })}
                                options={MEDIA_TIPOS}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="URL da Mídia"
                                value={form.url || ''}
                                onChange={(val) => setForm({ ...form, url: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FileUpload
                                label="Upload de Mídia (Arquivo)"
                                value={form.arquivo || ''}
                                fileName={form.file_name || ''}
                                fileSize={form.file_size || 0}
                                onChange={(val: string, meta: any) => setForm({
                                    ...form,
                                    arquivo: val,
                                    file_name: meta ? meta.name : form.file_name,
                                    file_size: meta ? meta.size : form.file_size
                                })}
                                onFileNameChange={(newName: string) => setForm({
                                    ...form,
                                    file_name: newName
                                })}
                                fullWidth
                                showPreview
                                showDownload
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Ordem de Exibição"
                                value={form.ordem?.toString() || '0'}
                                onChange={(val) => setForm({ ...form, ordem: parseInt(val) || 0 })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                    </Grid>
                )
            case 'kit':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <SelectPicker
                                label="Produto Componente"
                                value={form.produto_filho_id || ''}
                                onChange={(val) => setForm({ ...form, produto_filho_id: val })}
                                options={produtos.map(p => ({ value: p.uuid, label: p.nome }))}
                                fullWidth
                                required
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Quantidade"
                                value={form.quantidade?.toString() || '1'}
                                onChange={(val) => setForm({ ...form, quantidade: parseInt(val) || 1 })}
                                type="number"
                                fullWidth
                                required
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                    </Grid>
                )
            case 'variacoes':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <SelectPicker
                                label="Produto Variação"
                                value={form.produto_filho_id || ''}
                                onChange={(val) => setForm({ ...form, produto_filho_id: val })}
                                options={produtos.map(p => ({ value: p.uuid, label: p.nome }))}
                                fullWidth
                                required
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Grade (Ex: Cor: Azul, Tam: G)"
                                value={form.grade_text || ''}
                                onChange={(val) => setForm({ ...form, grade_text: val, grade: { info: val } })}
                                fullWidth
                                required
                                accessMode={getContextualAccessMode(accessMode, false)}
                            />
                        </Grid>
                    </Grid>
                )
            default:
                return null
        }
    }

    const titles = {
        media: 'Adicionar Mídia',
        kit: 'Adicionar Componente ao Kit',
        variacoes: 'Adicionar Variação'
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title={titles[type]}
            mode="add"
            saving={saving}
            canSave={canCreate(accessMode)}
            maxWidth="sm"
        >
            {renderFields()}
        </TableCardModal>
    )
}

export default ProdutoSubResourceDialog
