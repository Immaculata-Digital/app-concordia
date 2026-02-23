import { api } from './api'

export interface ProdutoCategoriaDTO {
    uuid: string
    seqId?: number
    code: string
    tenantId: string | null
    name: string
    description?: string
    icon: string
    sort: number
    enabled: boolean
}

export type CreateProdutoCategoriaPayload = Omit<ProdutoCategoriaDTO, 'uuid' | 'seqId' | 'tenantId'>
export type UpdateProdutoCategoriaPayload = Partial<CreateProdutoCategoriaPayload>

export const produtoCategoriaService = {
    list: () => api.get<ProdutoCategoriaDTO[]>('/produtos-categorias'),
    get: (uuid: string) => api.get<ProdutoCategoriaDTO>(`/produtos-categorias/${uuid}`),
    create: (payload: CreateProdutoCategoriaPayload) => api.post<ProdutoCategoriaDTO>('/produtos-categorias', payload),
    update: (uuid: string, payload: UpdateProdutoCategoriaPayload) => api.put<ProdutoCategoriaDTO>(`/produtos-categorias/${uuid}`, payload),
    delete: (uuid: string) => api.delete(`/produtos-categorias/${uuid}`)
}
