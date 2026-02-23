
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, FormControlLabel, Switch, Box, Typography, Button } from '@mui/material'
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material'
import { TableCardModal } from '../../../components/Modals'
import TextPicker from '../../../components/TextPicker'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, canEdit, canCreate, getContextualAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import type { Recompensa as RecompensaType } from '../../../services/recompensa'
import { useProdutosList } from '../../../hooks/queries/produtos'

interface RecompensaFormDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    initialData?: RecompensaType | null
    saving?: boolean
}

const RecompensaFormDialog = ({ open, onClose, onSave, initialData, saving }: RecompensaFormDialogProps) => {
    const navigate = useNavigate()
    const { permissions, user } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:recompensas')
    const isEditing = !!initialData

    const { data: produtos } = useProdutosList(user?.tenantId)

    const [form, setForm] = useState<any>({
        produtoId: '',
        qtd_pontos_resgate: 0,
        voucher_digital: false
    })

    const produtoOptions = useMemo(() => {
        return (produtos || []).map(p => ({
            value: p.uuid,
            label: p.nome + (p.codigo ? ` (${p.codigo})` : '')
        }))
    }, [produtos])

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    produtoId: initialData.produto_id,
                    qtd_pontos_resgate: initialData.qtd_pontos_resgate,
                    voucher_digital: initialData.voucher_digital
                })
            } else {
                setForm({
                    produtoId: '',
                    qtd_pontos_resgate: 0,
                    voucher_digital: false
                })
            }
        }
    }, [open, initialData])

    const handleSave = () => {
        onSave({
            ...form,
            tenantId: user?.tenantId
        })
    }

    const handleGoToProduct = () => {
        if (form.produtoId) {
            navigate(`/produtos?productId=${form.produtoId}`)
            onClose()
        }
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title={isEditing ? 'Editar Recompensa' : 'Nova Recompensa'}
            mode={isEditing ? 'edit' : 'add'}
            saving={saving}
            canSave={isEditing ? (form.produtoId && canEdit(accessMode)) : (form.produtoId && canCreate(accessMode))}
        >
            <Grid container spacing={3}>
                {isEditing && (
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 1,
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px border dashed rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Dados do Produto Base
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Para alterar nome, fotos ou estoque, edite o produto original.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={handleGoToProduct}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Editar Produto
                            </Button>
                        </Box>
                    </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Selecionar Produto"
                        value={form.produtoId}
                        onChange={(val) => setForm({ ...form, produtoId: val })}
                        options={produtoOptions}
                        fullWidth
                        required
                        disabled={isEditing}
                        accessMode={getContextualAccessMode(accessMode, isEditing)}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextPicker
                        label="Custo em Pontos"
                        value={form.qtd_pontos_resgate.toString()}
                        onChange={(val) => setForm({ ...form, qtd_pontos_resgate: parseInt(val) || 0 })}
                        type="number"
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, isEditing)}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', pl: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.voucher_digital}
                                    onChange={(e) => setForm({ ...form, voucher_digital: e.target.checked })}
                                    disabled={!canEdit(accessMode) && isEditing}
                                />
                            }
                            label="Voucher Digital"
                        />
                    </Box>
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default RecompensaFormDialog
