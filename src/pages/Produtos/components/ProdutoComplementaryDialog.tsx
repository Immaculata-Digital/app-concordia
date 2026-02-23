
import { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import TextPicker from '../../../components/TextPicker'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, getContextualAccessMode, canEdit } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'

interface ProdutoComplementaryDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    type: 'fiscal' | 'logistica' | 'precos' | 'seo'
    initialData: any
    saving: boolean
}

const ORIGEM_OPTIONS = [
    { value: '0', label: '0 - Nacional' },
    { value: '1', label: '1 - Estrangeira - Importação Direta' },
    { value: '2', label: '2 - Estrangeira - Adquirida no Mercado Interno' },
]

const ProdutoComplementaryDialog = ({ open, onClose, onSave, type, initialData, saving }: ProdutoComplementaryDialogProps) => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:produtos')
    const [form, setForm] = useState<any>({})

    useEffect(() => {
        if (open) {
            setForm(initialData || {})
        }
    }, [open, initialData])

    const handleSave = () => {
        onSave(form)
    }

    const renderFields = () => {
        switch (type) {
            case 'fiscal':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="NCM"
                                value={form.ncm || ''}
                                onChange={(val) => setForm({ ...form, ncm: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="GTIN"
                                value={form.gtin || ''}
                                onChange={(val) => setForm({ ...form, gtin: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="GTIN Embalagem"
                                value={form.gtin_embalagem || ''}
                                onChange={(val) => setForm({ ...form, gtin_embalagem: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="CEST"
                                value={form.cest || ''}
                                onChange={(val) => setForm({ ...form, cest: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <SelectPicker
                                label="Origem"
                                value={form.origem_code || ''}
                                onChange={(val) => setForm({ ...form, origem_code: val })}
                                options={ORIGEM_OPTIONS}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </Grid>
                )
            case 'precos':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Preço de Venda"
                                value={form.preco || ''}
                                onChange={(val) => setForm({ ...form, preco: val })}
                                type="number"
                                fullWidth
                                required
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Preço de Custo"
                                value={form.preco_custo || ''}
                                onChange={(val) => setForm({ ...form, preco_custo: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Preço Promocional"
                                value={form.preco_promocional || ''}
                                onChange={(val) => setForm({ ...form, preco_promocional: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Valor Máximo"
                                value={form.valor_max || ''}
                                onChange={(val) => setForm({ ...form, valor_max: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </Grid>
                )
            case 'logistica':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Peso Líquido"
                                value={form.peso_liquido || ''}
                                onChange={(val) => setForm({ ...form, peso_liquido: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextPicker
                                label="Peso Bruto"
                                value={form.peso_bruto || ''}
                                onChange={(val) => setForm({ ...form, peso_bruto: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Estoque Atual"
                                value={form.estoque_atual || ''}
                                onChange={(val) => setForm({ ...form, estoque_atual: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Mínimo"
                                value={form.estoque_minimo || ''}
                                onChange={(val) => setForm({ ...form, estoque_minimo: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Máximo"
                                value={form.estoque_maximo || ''}
                                onChange={(val) => setForm({ ...form, estoque_maximo: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Localização"
                                value={form.localizacao || ''}
                                onChange={(val) => setForm({ ...form, localizacao: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Altura"
                                value={form.altura_embalagem || ''}
                                onChange={(val) => setForm({ ...form, altura_embalagem: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Largura"
                                value={form.largura_embalagem || ''}
                                onChange={(val) => setForm({ ...form, largura_embalagem: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextPicker
                                label="Comprimento"
                                value={form.comprimento_embalagem || ''}
                                onChange={(val) => setForm({ ...form, comprimento_embalagem: val })}
                                type="number"
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </Grid>
                )
            case 'seo':
                return (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Slug"
                                value={form.slug || ''}
                                onChange={(val) => setForm({ ...form, slug: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="SEO Title"
                                value={form.seo_title || ''}
                                onChange={(val) => setForm({ ...form, seo_title: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="SEO Keywords"
                                value={form.seo_keywords || ''}
                                onChange={(val) => setForm({ ...form, seo_keywords: val })}
                                fullWidth
                                multiline
                                rows={2}
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="SEO Description"
                                value={form.seo_description || ''}
                                onChange={(val) => setForm({ ...form, seo_description: val })}
                                fullWidth
                                multiline
                                rows={3}
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Link do Vídeo"
                                value={form.link_video || ''}
                                onChange={(val) => setForm({ ...form, link_video: val })}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </Grid>
                )
            default:
                return null
        }
    }

    const titles = {
        fiscal: 'Dados Fiscais',
        logistica: 'Logística e Estoque',
        precos: 'Preços e Custos',
        seo: 'SEO e Marketing'
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title={titles[type]}
            mode="edit"
            saving={saving}
            canSave={canEdit(accessMode)}
            maxWidth="sm"
        >
            {renderFields()}
        </TableCardModal>
    )
}

export default ProdutoComplementaryDialog
