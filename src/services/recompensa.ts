
import { api } from './api'

export interface Recompensa {
    uuid: string
    seq_id: number
    tenant_id: string
    produto_id: string
    qtd_pontos_resgate: number
    voucher_digital: boolean
    created_at: string
    updated_at: string
    produto?: {
        nome: string
        codigo?: string
        unidade: string
        marca?: string
    }
}

const adaptRecompensa = (data: any): Recompensa => ({
    uuid: data.uuid || data.id,
    seq_id: data.seq_id || data.seqId,
    tenant_id: data.tenant_id || data.tenantId,
    produto_id: data.produto_id || data.produtoId,
    qtd_pontos_resgate: data.qtd_pontos_resgate,
    voucher_digital: !!data.voucher_digital,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
    produto: data.produto
})

export const recompensaService = {
    async list(tenantId?: string): Promise<Recompensa[]> {
        const response = await api.get<any>('/recompensas', { params: { tenantId } })
        if (Array.isArray(response)) {
            return response.map(adaptRecompensa)
        }
        return (response?.data || []).map(adaptRecompensa)
    },

    async getById(id: string): Promise<Recompensa> {
        const response = await api.get<any>(`/recompensas/${id}`)
        return adaptRecompensa(response)
    },

    async create(data: Partial<Recompensa>): Promise<Recompensa> {
        const response = await api.post<any>('/recompensas', data)
        return adaptRecompensa(response)
    },

    async update(id: string, data: Partial<Recompensa>): Promise<Recompensa> {
        const response = await api.put<any>(`/recompensas/${id}`, data)
        return adaptRecompensa(response)
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/recompensas/${id}`)
    }
}
