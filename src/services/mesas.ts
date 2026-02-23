import { api } from './api'

export type MesaDTO = {
    id: string
    uuid: string
    seqId?: number
    numero: string
    capacidade: number
    status: 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO'
    createdAt: string
    updatedAt: string
}

export type CreateMesaPayload = {
    numero: string
    capacidade: number
    status?: 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO'
}

export type UpdateMesaPayload = Partial<CreateMesaPayload>

const list = () =>
    api.get<MesaDTO[]>('/mesas').then(data =>
        data.map(m => ({ ...m, id: m.uuid }))
    )

const getById = (uuid: string) =>
    api.get<MesaDTO>(`/mesas/${uuid}`).then(data => ({
        ...data,
        id: data.uuid
    }))

const create = (payload: CreateMesaPayload) =>
    api.post<MesaDTO>('/mesas', payload)

const update = (uuid: string, payload: UpdateMesaPayload) =>
    api.put<MesaDTO>(`/mesas/${uuid}`, payload)

const remove = (uuid: string) =>
    api.delete<void>(`/mesas/${uuid}`)

export const mesaService = {
    list,
    getById,
    create,
    update,
    remove
}
