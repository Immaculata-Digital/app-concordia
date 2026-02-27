import { useState, useEffect } from 'react'
import {
    TextField,
    Grid,
    MenuItem,
    CircularProgress,
    IconButton,
    Box
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tenantService } from '../../../services/tenants'
import { useProdutoCategorias } from '../../../hooks/queries/produtoCategorias'
import {
    TableCardModal
} from '../../../components/Modals'
import { useAuth } from '../../../context/AuthContext'
import { isFull, getAccessMode, canCreate } from '../../../utils/accessControl'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { ProdutoCategoriaFormDialog } from '../../ProdutoCategorias/components/ProdutoCategoriaFormDialog'
import {
    Select,
    OutlinedInput,
    Checkbox,
    ListItemText,
    FormControl,
    InputLabel,
    FormControlLabel,
    Switch,
    Typography,
    Divider
} from '@mui/material'
import Toast from '../../../components/Toast'

interface ProdutoFormDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    title?: string
    initialData?: any
    saving?: boolean
    accessMode?: AccessMode
}

const UNIDADES = ['UN', 'PC', 'KG', 'LT', 'MT', 'CX']
const TIPOS = [
    { code: 'P', name: 'Produto' },
    { code: 'S', name: 'Serviço' }
]

const ProdutoFormDialog = ({ open, onClose, onSave, title, initialData, saving, accessMode = 'full' }: ProdutoFormDialogProps) => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        unidade: 'UN',
        marca: '',
        tipo_code: 'P',
        categoria_code: '',
        tenant_id: user?.tenantId || '',
        linkModules: [] as string[],
        cardapio_ordem: 0,
        cardapio_ativo: true,
        recompensa_pontos: 0,
        recompensa_voucher: false,
    })

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })
    const queryClient = useQueryClient()

    const { data: categorias = [] } = useProdutoCategorias()

    const handleCategorySuccess = (msg: string, category?: any) => {
        setSnackbar({ open: true, message: msg, severity: 'success' })
        if (category?.code) {
            setFormData((prev: any) => ({ ...prev, categoria_code: category.code }))
            // Refetch categories to ensure the list is updated
            queryClient.invalidateQueries({ queryKey: ['produto-categorias'] })
        }
    }

    const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: tenantService.list,
        enabled: open
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome || '',
                codigo: initialData.codigo || '',
                unidade: initialData.unidade || 'UN',
                marca: initialData.marca || '',
                tipo_code: initialData.tipo_code || 'P',
                categoria_code: initialData.categoria_code || '',
                tenant_id: initialData.tenant_id || user?.tenantId || '',
                linkModules: [],
                cardapio_ordem: 0,
                cardapio_ativo: true,
                recompensa_pontos: 0,
                recompensa_voucher: false,
            })
        } else {
            setFormData({
                nome: '',
                codigo: '',
                unidade: 'UN',
                marca: '',
                tipo_code: 'P',
                categoria_code: '',
                tenant_id: user?.tenantId || '',
                linkModules: [],
                cardapio_ordem: 0,
                cardapio_ativo: true,
                recompensa_pontos: 0,
                recompensa_voucher: false,
            })
        }
    }, [initialData, user])

    const { permissions } = useAuth()
    const canAccessCardapio = canCreate(getAccessMode(permissions, 'erp:cardapio-itens'))
    const canAccessRecompensas = canCreate(getAccessMode(permissions, 'erp:recompensas'))

    const availableModules = [
        ...(canAccessCardapio ? [{ value: 'cardapio', label: 'Item de Cardápio' }] : []),
        ...(canAccessRecompensas ? [{ value: 'recompensa', label: 'Item de Recompensa' }] : [])
    ]

    const handleModuleChange = (event: any) => {
        const {
            target: { value },
        } = event
        setFormData((prev: any) => ({
            ...prev,
            linkModules: typeof value === 'string' ? value.split(',') : value,
        }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = () => {
        onSave(formData)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title={`${initialData ? 'Editar' : 'Novo'} ${title}`}
            mode={initialData ? 'edit' : 'add'}
            saving={saving}
            canSave={isFull(accessMode)}
            maxWidth="sm"
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Nome do Produto"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={!isFull(accessMode)}
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        label="Código (SKU)"
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isFull(accessMode)}
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        label="Unidade"
                        name="unidade"
                        select
                        value={formData.unidade}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isFull(accessMode)}
                    >
                        {UNIDADES.map(u => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        label="Marca"
                        name="marca"
                        value={formData.marca}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isFull(accessMode)}
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        label="Tipo"
                        name="tipo_code"
                        select
                        value={formData.tipo_code}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isFull(accessMode)}
                    >
                        {TIPOS.map(t => (
                            <MenuItem key={t.code} value={t.code}>{t.name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            label="Categoria"
                            name="categoria_code"
                            select
                            value={formData.categoria_code}
                            onChange={handleChange}
                            fullWidth
                            disabled={!isFull(accessMode)}
                        >
                            <MenuItem value=""><em>Nenhuma</em></MenuItem>
                            {categorias.map(cat => (
                                <MenuItem key={cat.code} value={cat.code}>{cat.name}</MenuItem>
                            ))}
                        </TextField>
                        {isFull(accessMode) && (
                            <IconButton
                                color="primary"
                                onClick={() => setIsCategoryDialogOpen(true)}
                                sx={{ mt: 1 }}
                            >
                                <AddIcon />
                            </IconButton>
                        )}
                    </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Tenant"
                        name="tenant_id"
                        select
                        value={formData.tenant_id}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={!isFull(accessMode) || isLoadingTenants}
                        InputProps={{
                            endAdornment: isLoadingTenants ? <CircularProgress size={20} /> : null
                        }}
                    >
                        {tenants.map(t => (
                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {!initialData && availableModules.length > 0 && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Criação Rápida (Opcional)
                            </Typography>
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth disabled={!isFull(accessMode)}>
                                <InputLabel id="modules-select-label">Adicionar aos Módulos</InputLabel>
                                <Select
                                    labelId="modules-select-label"
                                    multiple
                                    value={formData.linkModules}
                                    onChange={handleModuleChange}
                                    input={<OutlinedInput label="Adicionar aos Módulos" />}
                                    renderValue={(selected) => selected.map(val => availableModules.find(m => m.value === val)?.label).join(', ')}
                                >
                                    {availableModules.map((mod) => (
                                        <MenuItem key={mod.value} value={mod.value}>
                                            <Checkbox checked={formData.linkModules.indexOf(mod.value) > -1} />
                                            <ListItemText primary={mod.label} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {formData.linkModules.includes('cardapio') && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Configuração Cardápio</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                label="Ordem Módulo"
                                                name="cardapio_ordem"
                                                type="number"
                                                value={formData.cardapio_ordem}
                                                onChange={handleChange}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formData.cardapio_ativo}
                                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, cardapio_ativo: e.target.checked }))}
                                                        color="primary"
                                                    />
                                                }
                                                label="Item Ativo"
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        )}

                        {formData.linkModules.includes('recompensa') && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Configuração Recompensa</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                label="Custo em Pontos"
                                                name="recompensa_pontos"
                                                type="number"
                                                value={formData.recompensa_pontos}
                                                onChange={handleChange}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formData.recompensa_voucher}
                                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, recompensa_voucher: e.target.checked }))}
                                                        color="primary"
                                                    />
                                                }
                                                label="Gera Voucher Digital"
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        )}
                    </>
                )}

            </Grid>

            <ProdutoCategoriaFormDialog
                open={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                onSuccess={handleCategorySuccess}
                onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
                accessMode={accessMode}
            />

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            />
        </TableCardModal>
    )
}

export default ProdutoFormDialog
