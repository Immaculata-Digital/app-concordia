import { api } from './api'

export type PointTransactionDTO = {
    id: string
    seqId?: number
    tenantId: string
    clientId: string
    type: 'CREDITO' | 'DEBITO' | 'ESTORNO'
    points: number
    resultingBalance: number
    origin: 'MANUAL' | 'RESGATE' | 'AJUSTE' | 'PROMO' | 'OUTRO'
    rewardItemId?: string
    lojaId?: string
    observation?: string
    createdAt: string
    createdBy?: string
    updatedAt: string
    updatedBy?: string
    clientName?: string
    rewardItemName?: string
}

export type CreatePointTransactionPayload = {
    clientId: string
    type: 'CREDITO' | 'DEBITO' | 'ESTORNO'
    points: number
    resultingBalance: number
    origin: 'MANUAL' | 'RESGATE' | 'AJUSTE' | 'PROMO' | 'OUTRO'
    rewardItemId?: string
    lojaId?: string
    observation?: string
}

export type UpdatePointTransactionPayload = Partial<CreatePointTransactionPayload>

const list = (filters?: { clientId?: string }) =>
    api.get<PointTransactionDTO[]>('/point-transactions', { params: filters })

const getById = (id: string) =>
    api.get<PointTransactionDTO>(`/point-transactions/${id}`)

const create = (payload: CreatePointTransactionPayload) =>
    api.post<PointTransactionDTO>('/point-transactions', payload)

const update = (id: string, payload: UpdatePointTransactionPayload) =>
    api.put<PointTransactionDTO>(`/point-transactions/${id}`, payload)

const remove = (id: string) =>
    api.delete<void>(`/point-transactions/${id}`)

export const pointTransactionService = {
    list,
    getById,
    create,
    update,
    remove
}
