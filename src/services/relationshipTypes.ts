
import { api } from './api'

const API_PESSOAS_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type RelationshipTypeDTO = {
    id: string
    seqId?: number
    connectorPrefix: string
    relationshipSource: string
    connectorSuffix: string
    relationshipTarget: string
    inverseTypeId: string
    createdAt: string
    createdBy: string
    updatedAt?: string | null
    updatedBy?: string | null
}

export type CreateRelationshipTypePayload = {
    connectorPrefix: string
    relationshipSource: string
    connectorSuffix: string
    relationshipTarget: string
    inverseTypeId: string
    createdBy: string
}

export type UpdateRelationshipTypePayload = Partial<CreateRelationshipTypePayload> & {
    updatedBy?: string
}

const adaptRelationshipType = (data: any): RelationshipTypeDTO => ({
    id: data.id,
    seqId: data.seq_id,
    connectorPrefix: data.connector_prefix,
    relationshipSource: data.relationship_source,
    connectorSuffix: data.connector_suffix,
    relationshipTarget: data.relationship_target,
    inverseTypeId: data.inverse_type_id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
})

const list = async (params?: any) => {
    const response = await api.get<any[]>('/peoples/relationship-types', { baseUrl: API_PESSOAS_URL, params })
    return response.map(adaptRelationshipType)
}

const create = async (payload: CreateRelationshipTypePayload) => {
    const response = await api.post<any>('/peoples/relationship-types', payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationshipType(response)
}

const update = async (id: string, payload: UpdateRelationshipTypePayload) => {
    const response = await api.put<any>(`/peoples/relationship-types/${id}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationshipType(response)
}

const remove = (id: string) => api.delete<void>(`/peoples/relationship-types/${id}`, { baseUrl: API_PESSOAS_URL })

const getById = async (id: string) => {
    const response = await api.get<any>(`/peoples/relationship-types/${id}`, { baseUrl: API_PESSOAS_URL })
    return adaptRelationshipType(response)
}

export const relationshipTypeService = {
    list,
    create,
    update,
    remove,
    getById,
}
