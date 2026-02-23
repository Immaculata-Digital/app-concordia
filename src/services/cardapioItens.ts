import { api } from './api'

export type CardapioItemDTO = {
    uuid: string
    seqId?: number
    tenantId: string
    produtoId: string
    ordem: number
    ativo: boolean
    produtoNome?: string
    produtoPreco?: number
    categoriaCode?: string
    categoriaNome?: string
    createdAt: string
    updatedAt: string
}

export type CreateCardapioItemPayload = {
    produtoId: string
    ordem: number
    ativo?: boolean
}

export type UpdateCardapioItemPayload = Partial<CreateCardapioItemPayload>

const list = (filters?: { categoriaCode?: string }) =>
    api.get<CardapioItemDTO[]>('/cardapio-itens', { params: filters })

const getById = (uuid: string) =>
    api.get<CardapioItemDTO>(`/cardapio-itens/${uuid}`)

const create = (payload: CreateCardapioItemPayload) =>
    api.post<CardapioItemDTO>('/cardapio-itens', payload)

const update = (uuid: string, payload: UpdateCardapioItemPayload) =>
    api.put<CardapioItemDTO>(`/cardapio-itens/${uuid}`, payload)

const remove = (uuid: string) =>
    api.delete<void>(`/cardapio-itens/${uuid}`)

export const cardapioItemService = {
    list,
    getById,
    create,
    update,
    remove
}
