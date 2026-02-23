import { useState, useEffect } from 'react'
import {
    TextField,
    Grid,
    MenuItem,
    CircularProgress
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { tenantService } from '../../../services/tenants'
import { useProdutoCategorias } from '../../../hooks/queries/produtoCategorias'
import {
    TableCardModal
} from '../../../components/Modals'
import { useAuth } from '../../../context/AuthContext'
import { isFull } from '../../../utils/accessControl'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'

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
        tenantId: user?.tenantId || '',
    })

    const { data: categorias = [] } = useProdutoCategorias()

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
                tenantId: initialData.tenant_id || user?.tenantId || '',
            })
        } else {
            setFormData({
                nome: '',
                codigo: '',
                unidade: 'UN',
                marca: '',
                tipo_code: 'P',
                categoria_code: '',
                tenantId: user?.tenantId || '',
            })
        }
    }, [initialData, user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Tenant"
                        name="tenantId"
                        select
                        value={formData.tenantId}
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
            </Grid>
        </TableCardModal>
    )
}

export default ProdutoFormDialog
