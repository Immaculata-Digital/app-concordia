import { api } from './api'

export type PluvytClientDTO = {
    id: string
    seqId?: number
    tenantId: string
    personId: string
    saldo: number
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    // Enriched fields
    personName?: string
    personCpfCnpj?: string
}

export type CreatePluvytClientPayload = {
    personId: string
    saldo: number
}

export type UpdatePluvytClientPayload = {
    saldo: number
}

const list = () => api.get<PluvytClientDTO[]>('/pluvyt-clients')
const getById = (id: string) => api.get<PluvytClientDTO>(`/pluvyt-clients/${id}`)
const create = (payload: CreatePluvytClientPayload) => api.post<PluvytClientDTO>('/pluvyt-clients', payload)
const update = (id: string, payload: UpdatePluvytClientPayload) => api.put<PluvytClientDTO>(`/pluvyt-clients/${id}`, payload)
const remove = (id: string) => api.delete<void>(`/pluvyt-clients/${id}`)

export const pluvytClientService = {
    list,
    getById,
    create,
    update,
    remove,
}
