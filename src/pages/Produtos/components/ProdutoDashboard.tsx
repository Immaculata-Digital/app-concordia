
import { useState } from 'react'
import Toast from '../../../components/Toast'

import {
    Edit,
    Inventory2,
    Storage,
    ListAlt,
    Image as ImageIcon,
    Layers,
    Add
} from '@mui/icons-material'

import {
    Divider,
    Grid,
    Typography,
    Box,
    Button,
    Stack,
    Chip,
    IconButton,
} from '@mui/material'
import { useAuth } from '../../../context/AuthContext'
import {
    getAccessMode,
    canEdit,
    canCreate,
} from '../../../utils/accessControl'
import { DashboardTopCard } from '../../../components/Dashboard/DashboardTopCard'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { DashboardModal } from '../../../components/Modals'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardStack } from '../../../components/Dashboard/DashboardStack'
import {
    useProduto,
    useUpdateProduto,
    useUpdateProdutoComplementary,
    useAddProdutoSubResource,
    useDeleteProdutoSubResource
} from '../../../hooks/queries/produtos'
import ProdutoFormDialog from './ProdutoFormDialog'
import ProdutoComplementaryDialog from './ProdutoComplementaryDialog'
import ProdutoFichaTecnicaDialog from './ProdutoFichaTecnicaDialog'
import ProdutoSubResourceDialog from './ProdutoSubResourceDialog'

interface ProdutoDashboardProps {
    open: boolean
    onClose: () => void
    produtoId: string | null
    onUpdate?: () => void
}

const ProdutoDashboard = ({ open, onClose, produtoId }: ProdutoDashboardProps) => {
    const { permissions } = useAuth()
    const accessMode = getAccessMode(permissions, 'erp:produtos')

    // Data Query
    const { data: produto, isLoading: loading } = useProduto(produtoId)

    // Mutations
    const updateProdutoMutation = useUpdateProduto()
    const updateFiscal = useUpdateProdutoComplementary('fiscal')
    const updateLogistica = useUpdateProdutoComplementary('logistica')
    const updatePrecos = useUpdateProdutoComplementary('precos')
    const updateSeo = useUpdateProdutoComplementary('seo')

    const addSubMutation = {
        'ficha-tecnica': useAddProdutoSubResource('ficha-tecnica'),
        'media': useAddProdutoSubResource('media'),
        'kit': useAddProdutoSubResource('kit'),
        'variacoes': useAddProdutoSubResource('variacoes')
    }

    const delSubMutation = {
        'ficha-tecnica': useDeleteProdutoSubResource('ficha-tecnica'),
        'media': useDeleteProdutoSubResource('media'),
        'kit': useDeleteProdutoSubResource('kit'),
        'variacoes': useDeleteProdutoSubResource('variacoes')
    }

    // Modal States
    const [editOpen, setEditOpen] = useState(false)
    const [compType, setCompType] = useState<'fiscal' | 'logistica' | 'precos' | 'seo' | null>(null)
    const [fichaOpen, setFichaOpen] = useState(false)
    const [subType, setSubType] = useState<'media' | 'kit' | 'variacoes' | null>(null)

    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const handleSaveComplementary = async (data: any) => {
        if (!produto || !compType) return
        try {
            const mut = {
                fiscal: updateFiscal,
                logistica: updateLogistica,
                precos: updatePrecos,
                seo: updateSeo
            }[compType]

            // Ensure tenantId is present in the payload
            const payload = {
                ...data,
                tenantId: data.tenantId || data.tenant_id || produto.tenant_id
            }

            await mut.mutateAsync({ id: produto.uuid, data: payload })
            setCompType(null)
            setSnackbar({ open: true, message: 'Sucesso!', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao salvar', severity: 'error' })
        }
    }

    const handleAddSub = async (data: any) => {
        if (!produto || !subType) return
        try {
            // Ensure tenantId is present in the payload
            const payload = {
                ...data,
                tenantId: data.tenantId || data.tenant_id || produto.tenant_id
            }

            await addSubMutation[subType].mutateAsync({ id: produto.uuid, data: payload })
            setSubType(null)
            setSnackbar({ open: true, message: 'Adicionado!', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao adicionar', severity: 'error' })
        }
    }

    const handleDeleteSub = async (type: 'ficha-tecnica' | 'media' | 'kit' | 'variacoes', item: any) => {
        if (!produto) return
        try {
            await delSubMutation[type].mutateAsync({ id: produto.uuid, itemId: item.uuid })
            setSnackbar({ open: true, message: 'Removido!', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao remover', severity: 'error' })
        }
    }

    // --- Cards Sections ---

    const generalCard = (
        <DashboardBodyCard
            title="Informações Gerais"
            accessMode={accessMode}
            loading={loading}
            action={produto && canEdit(accessMode) && (
                <Button variant="outlined" size="small" onClick={() => setEditOpen(true)}>
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            {produto && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" className="dashboard-label">Nome do Produto</Typography>
                        <Typography variant="body1" fontWeight="bold">{produto.nome}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Código (SKU)</Typography>
                        <Typography variant="body1">{produto.codigo || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Unidade</Typography>
                        <Typography variant="body1">{produto.unidade}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Marca</Typography>
                        <Typography variant="body1">{produto.marca || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Tipo</Typography>
                        <Typography variant="body1">{produto.tipo_code === 'P' ? 'Produto' : 'Serviço'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Categoria de Produto</Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>{produto.categoria_nome || '-'}</Typography>
                    </Grid>
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const fiscalCard = (
        <DashboardBodyCard
            title="Dados Fiscais"
            accessMode={accessMode}
            loading={loading}
            action={produto && canEdit(accessMode) && (
                <Button variant="outlined" size="small" onClick={() => setCompType('fiscal')}>
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            {produto && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">NCM</Typography>
                        <Typography variant="body1">{produto.fiscal?.ncm || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">GTIN</Typography>
                        <Typography variant="body1">{produto.fiscal?.gtin || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">CEST</Typography>
                        <Typography variant="body1">{produto.fiscal?.cest || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Origem</Typography>
                        <Typography variant="body1">{produto.fiscal?.origem_code || '-'}</Typography>
                    </Grid>
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const logisticsCard = (
        <DashboardBodyCard
            title="Logística e estoque"
            accessMode={accessMode}
            loading={loading}
            action={produto && canEdit(accessMode) && (
                <Button variant="outlined" size="small" onClick={() => setCompType('logistica')}>
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            {produto && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Estoque Atual</Typography>
                        <Typography variant="body1" color="primary.main" fontWeight="bold">
                            {produto.logistica?.estoque_atual || 0} {produto.unidade}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Esq. Mín/Máx</Typography>
                        <Typography variant="body1">
                            {produto.logistica?.estoque_minimo || 0} / {produto.logistica?.estoque_maximo || 0}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Peso Líquido</Typography>
                        <Typography variant="body1">{produto.logistica?.peso_liquido || 0} kg</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Peso Bruto</Typography>
                        <Typography variant="body1">{produto.logistica?.peso_bruto || 0} kg</Typography>
                    </Grid>
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const pricingCard = (
        <DashboardBodyCard
            title="Preços e Custos"
            accessMode={accessMode}
            loading={loading}
            action={produto && canEdit(accessMode) && (
                <Button variant="outlined" size="small" onClick={() => setCompType('precos')}>
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            {produto && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" className="dashboard-label">Preço de Venda</Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                            R$ {Number(produto.precos?.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Preço de Custo</Typography>
                        <Typography variant="body1">
                            R$ {Number(produto.precos?.preco_custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" className="dashboard-label">Preço Promo</Typography>
                        <Typography variant="body1" color="secondary.main">
                            {produto.precos?.preco_promocional ? `R$ ${Number(produto.precos.preco_promocional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </Typography>
                    </Grid>
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const seoCard = (
        <DashboardBodyCard
            title="SEO e Marketing"
            accessMode={accessMode}
            loading={loading}
            action={produto && canEdit(accessMode) && (
                <Button variant="outlined" size="small" onClick={() => setCompType('seo')}>
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            {produto && (
                <Stack spacing={1.5}>
                    <Box>
                        <Typography variant="caption" className="dashboard-label">URL Amigável (Slug)</Typography>
                        <Typography variant="body2">{produto.seo?.slug || '-'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" className="dashboard-label">SEO Title</Typography>
                        <Typography variant="body2">{produto.seo?.seo_title || '-'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" className="dashboard-label">Link do Vídeo</Typography>
                        <Typography variant="body2" color="primary">{produto.seo?.link_video || '-'}</Typography>
                    </Box>
                </Stack>
            )}
        </DashboardBodyCard>
    )

    const fichaTecnicaCard = (
        <DashboardBodyCardList<any>
            title="Ficha Técnica"
            accessMode={accessMode}
            items={produto?.fichaTecnica || []}
            loading={loading}
            keyExtractor={(item) => item.uuid}
            renderText={(item) => item.chave}
            renderSecondaryText={(item) => item.valor}
            renderIcon={() => <Box className="dashboard-icon-badge"><ListAlt /></Box>}
            onAdd={() => setFichaOpen(true)}
            onDelete={(item) => handleDeleteSub('ficha-tecnica', item)}
            emptyText="Nenhuma especificação na ficha técnica."
        />
    )

    const mediaCard = (
        <DashboardBodyCardList<any>
            title="Mídias e Arquivos"
            accessMode={accessMode}
            items={produto?.media || []}
            loading={loading}
            keyExtractor={(item) => item.uuid}
            renderIcon={(item) => (
                <Box className="dashboard-icon-badge" sx={{ overflow: 'hidden', p: 0 }}>
                    {(item.tipo_code === 'imagem' || item.arquivo?.startsWith('data:image')) ? (
                        <img
                            src={item.arquivo || item.url}
                            alt={item.file_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <ImageIcon />
                    )}
                </Box>
            )}
            renderText={(item) => item.file_name || item.url || 'Arquivo sem nome'}
            renderSecondaryText={(item) => `Ordem: ${item.ordem}`}
            onAdd={() => setSubType('media')}
            onDelete={(item) => handleDeleteSub('media', item)}
            emptyText="Nenhuma mídia vinculada."
        />
    )

    const compositionCard = (
        <DashboardBodyCard
            title="Composição e Variações"
            accessMode={accessMode}
            loading={loading}
            action={produto && canCreate(accessMode) && (
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" onClick={() => setSubType('kit')}>
                        <Add fontSize="small" sx={{ mr: 0.5 }} /> Kit
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => setSubType('variacoes')}>
                        <Add fontSize="small" sx={{ mr: 0.5 }} /> Var
                    </Button>
                </Stack>
            )}
        >
            {produto && (
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Layers fontSize="small" /> Kit / Combo
                        </Typography>
                        {produto.kit && produto.kit.length > 0 ? (
                            produto.kit.map((item: any) => (
                                <Box key={item.uuid} sx={{ ml: 4, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">{item.quantidade}x {item.produto_nome}</Typography>
                                    {canEdit(accessMode) && (
                                        <IconButton size="small" onClick={() => handleDeleteSub('kit', item)}>
                                            <Add sx={{ transform: 'rotate(45deg)', fontSize: '1rem' }} />
                                        </IconButton>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>Não é um produto composto.</Typography>
                        )}
                    </Box>
                    <Divider />
                    <Box>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Inventory2 fontSize="small" /> Variações / Grades
                        </Typography>
                        {produto.variacoes && produto.variacoes.length > 0 ? (
                            produto.variacoes.map((item: any) => (
                                <Box key={item.uuid} sx={{ ml: 4, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">{item.produto_nome} ({typeof item.grade === 'string' ? item.grade : JSON.stringify(item.grade)})</Typography>
                                    {canEdit(accessMode) && (
                                        <IconButton size="small" onClick={() => handleDeleteSub('variacoes', item)}>
                                            <Add sx={{ transform: 'rotate(45deg)', fontSize: '1rem' }} />
                                        </IconButton>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>Sem variações de grade.</Typography>
                        )}
                    </Box>
                </Stack>
            )}
        </DashboardBodyCard>
    )

    const tenantCard = (
        <DashboardBodyCard
            title="Institucional / Tenant"
            accessMode={getAccessMode(permissions, 'erp:tenants')}
            loading={loading}
        >
            {produto && (
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" className="dashboard-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Storage sx={{ fontSize: '0.75rem' }} /> Tenant Responsável
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                            {produto.tenant_id || 'Tenant Padrão'}
                        </Typography>
                    </Box>
                </Stack>
            )}
        </DashboardBodyCard>
    )

    const systemInfoCard = (
        <DashboardBodyCard
            title="Informações do Sistema"
            accessMode={accessMode}
            loading={loading}
        >
            {produto && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">UUID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{produto.uuid}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Criado em</Typography>
                        <Typography variant="body2">{new Date(produto.created_at).toLocaleString()} por {produto.created_by || 'system'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Última atualização</Typography>
                        <Typography variant="body2">{new Date(produto.updated_at).toLocaleString()} por {produto.updated_by || 'system'}</Typography>
                    </Grid>
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const items = {
        general: generalCard,
        pricing: pricingCard,
        logistics: logisticsCard,
        fiscal: fiscalCard,
        seo: seoCard,
        ficha: fichaTecnicaCard,
        media: mediaCard,
        composition: compositionCard,
        tenant: tenantCard,
        system: systemInfoCard,
    }

    const defaultLayout = {
        col1: ['general', 'pricing', 'logistics', 'ficha', 'tenant'],
        col2: ['fiscal', 'seo', 'media', 'composition', 'system'],
    }

    return (
        <>
            <DashboardModal
                open={open}
                onClose={onClose}
                title={produto && !loading ? produto.nome : 'Carregando...'}
                hasData={!!produto}
                loading={loading}
                useSkeleton={true}
                layoutKey="product-dashboard-layout"
            >
                {produto && (
                    <DashboardStack>
                        <DashboardTopCard
                            title={produto.nome}
                            accessMode={accessMode}
                            layoutKey="product-dashboard-layout"
                            action={canEdit(accessMode) && (
                                <Button
                                    variant="outlined"
                                    onClick={() => setEditOpen(true)}
                                >
                                    <Edit fontSize="small" />
                                </Button>
                            )}
                        >
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    SKU: {produto.codigo || 'S/C'}
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />
                                <Chip
                                    label={produto.marca || 'Marca Própria'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, px: 0.5 }}
                                />
                                <Chip
                                    label={produto.tipo_code === 'P' ? 'Produto' : 'Serviço'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                />
                            </Box>
                        </DashboardTopCard>

                        <DashboardDnDGrid
                            items={items}
                            defaultLayout={defaultLayout}
                            layoutKey="product-dashboard-layout"
                        />
                    </DashboardStack>
                )}
            </DashboardModal>

            {produto && (
                <>
                    <ProdutoFormDialog
                        open={editOpen}
                        onClose={() => setEditOpen(false)}
                        onSave={(data) => updateProdutoMutation.mutateAsync({ id: produto.uuid, payload: data }).then(() => setEditOpen(false))}
                        title="Produto"
                        initialData={produto}
                        saving={updateProdutoMutation.isPending}
                    />

                    {compType && (
                        <ProdutoComplementaryDialog
                            open={!!compType}
                            onClose={() => setCompType(null)}
                            type={compType}
                            initialData={produto[compType] || {}}
                            onSave={handleSaveComplementary}
                            saving={updateFiscal.isPending || updateLogistica.isPending || updatePrecos.isPending || updateSeo.isPending}
                        />
                    )}

                    <ProdutoFichaTecnicaDialog
                        open={fichaOpen}
                        onClose={() => setFichaOpen(false)}
                        onSave={(data) => addSubMutation['ficha-tecnica'].mutateAsync({ id: produto.uuid, data }).then(() => setFichaOpen(false))}
                        saving={addSubMutation['ficha-tecnica'].isPending}
                    />

                    {subType && (
                        <ProdutoSubResourceDialog
                            open={!!subType}
                            onClose={() => setSubType(null)}
                            type={subType}
                            onSave={handleAddSub}
                            saving={subType ? addSubMutation[subType].isPending : false}
                        />
                    )}
                </>
            )}

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </>
    )
}

export default ProdutoDashboard
