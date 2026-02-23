import { api } from './api'

export type ComandaItemDTO = {
    id: string
    uuid: string
    comandaId: string
    produtoId: string
    produtoNome: string
    quantidade: number
    precoUnitario: number
    total: number
    status: 'PENDENTE' | 'ENTREGUE' | 'CANCELADO'
    observacao?: string
}

export type ComandaDTO = {
    id: string
    uuid: string
    seqId?: number
    mesaId: string
    mesaNumero: string
    clienteNome?: string
    status: 'ABERTA' | 'FECHADA' | 'PAGA' | 'CANCELADA'
    total: number
    abertaEm: string
    fechadaEm?: string
    itens?: ComandaItemDTO[]
}

export type CreateComandaPayload = {
    mesaId: string
    clienteNome?: string
}

export type AddItemPayload = {
    produtoId: string
    quantidade: number
    precoUnitario: number
    observacao?: string
}

const list = (filters?: { status?: string; mesaId?: string }) =>
    api.get<ComandaDTO[]>('/comandas', { params: filters }).then(data =>
        data.map(c => ({ ...c, id: c.uuid }))
    )

const getById = (uuid: string) =>
    api.get<ComandaDTO>(`/comandas/${uuid}`).then(data => ({
        ...data,
        id: data.uuid,
        itens: data.itens?.map(i => ({ ...i, id: i.uuid }))
    }))

const create = (payload: CreateComandaPayload) =>
    api.post<ComandaDTO>('/comandas', payload)

const addItem = (uuid: string, payload: AddItemPayload) =>
    api.post<ComandaDTO>(`/comandas/${uuid}/itens`, payload)

const updateStatus = (uuid: string, status: string) =>
    api.patch<ComandaDTO>(`/comandas/${uuid}/status`, { status })

export const comandaService = {
    list,
    getById,
    create,
    addItem,
    updateStatus
}
