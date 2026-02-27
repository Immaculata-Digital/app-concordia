import { api } from './api'

export interface Produto {
    uuid: string
    seq_id: number
    tenant_id: string
    nome: string
    codigo: string
    unidade: string
    marca: string
    tipo_code: string
    situacao_code: string
    classe_produto_code: string
    categoria_code: string
    categoria_nome?: string
    garantia: string
    descricao_complementar: string
    obs: string
    dias_preparacao: number
    tags: string[]
    created_at: string
    updated_at: string
    created_by?: string
    updated_by?: string
    fiscal?: any
    logistica?: any
    precos?: any
    seo?: any
    fichaTecnica?: any[]
    media?: any[]
    kit?: any[]
    variacoes?: any[]
}

// Adapters
const adaptProduto = (data: any): Produto => ({
    uuid: data.uuid || data.id,
    seq_id: data.seq_id || data.seqId,
    tenant_id: data.tenant_id || data.tenantId,
    nome: data.nome,
    codigo: data.codigo,
    unidade: data.unidade,
    marca: data.marca,
    tipo_code: data.tipo_code,
    situacao_code: data.situacao_code,
    classe_produto_code: data.classe_produto_code,
    categoria_code: data.categoria_code,
    categoria_nome: data.categoria_nome,
    garantia: data.garantia,
    descricao_complementar: data.descricao_complementar,
    obs: data.obs,
    dias_preparacao: data.dias_preparacao,
    tags: Array.isArray(data.tags) ? data.tags : [],
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
    fiscal: data.fiscal,
    logistica: data.logistica,
    precos: data.precos,
    seo: data.seo,
    fichaTecnica: data.fichaTecnica || [],
    media: data.media || [],
    kit: data.kit || [],
    variacoes: data.variacoes || []
})

export const produtoService = {
    async list(tenantId?: string): Promise<Produto[]> {
        const response = await api.get<any>('/produtos', { params: { tenantId } })
        if (Array.isArray(response)) {
            return response.map(adaptProduto)
        }
        return (response?.data || []).map(adaptProduto)
    },

    async getById(id: string): Promise<Produto> {
        const response = await api.get<any>(`/produtos/${id}`)
        return adaptProduto(response)
    },

    async create(produto: Partial<Produto>): Promise<Produto> {
        const response = await api.post<any>('/produtos', produto)
        return adaptProduto(response)
    },

    async update(id: string, produto: Partial<Produto>): Promise<Produto> {
        const response = await api.put<any>(`/produtos/${id}`, produto)
        return adaptProduto(response)
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/produtos/${id}`)
    },

    // Complementary methods
    async updateFiscal(id: string, fiscal: any): Promise<void> {
        await api.post(`/produtos/${id}/fiscal`, fiscal)
    },

    async updateLogistica(id: string, logistica: any): Promise<void> {
        await api.post(`/produtos/${id}/logistica`, logistica)
    },

    async updatePrecos(id: string, precos: any): Promise<void> {
        await api.post(`/produtos/${id}/precos`, precos)
    },

    async updateSeo(id: string, seo: any): Promise<void> {
        await api.post(`/produtos/${id}/seo`, seo)
    },

    async addFichaTecnica(id: string, item: any): Promise<void> {
        await api.post(`/produtos/${id}/ficha-tecnica`, item)
    },

    async deleteFichaTecnica(itemId: string): Promise<void> {
        await api.delete(`/produtos/ficha-tecnica/${itemId}`)
    },

    async addMedia(id: string, media: any): Promise<void> {
        await api.post(`/produtos/${id}/media`, media)
    },

    async deleteMedia(mediaId: string): Promise<void> {
        await api.delete(`/produtos/media/${mediaId}`)
    },

    async addKitItem(id: string, item: any): Promise<void> {
        await api.post(`/produtos/${id}/kit`, item)
    },

    async deleteKitItem(itemId: string): Promise<void> {
        await api.delete(`/produtos/kit/${itemId}`)
    },

    async addVariacao(id: string, variacao: any): Promise<void> {
        await api.post(`/produtos/${id}/variacoes`, variacao)
    },

    async updateMedia(mediaId: string, media: any): Promise<void> {
        await api.put(`/produtos/media/${mediaId}`, media)
    },

    async deleteVariacao(id: string): Promise<void> {
        await api.delete(`/produtos/variacoes/${id}`)
    }
}
