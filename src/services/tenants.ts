import { api } from './api'

const API_CONCORDIA_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type TenantDTO = {
    id: string
    seqId?: number
    name: string
    slug: string
    createdAt: string
    createdBy?: string
    updatedAt: string
    updatedBy?: string
    // Complementary data
    address?: TenantAddressDTO | null
    contacts?: TenantContactDTO[]
}

export type TenantAddressDTO = {
    id: string
    postalCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
}

export type TenantContactDTO = {
    id: string
    contactType: string
    contactValue: string
    label?: string
    isDefault: boolean
}

export type CreateTenantPayload = {
    name: string
    slug: string
}

export type UpdateTenantPayload = {
    name?: string
    slug?: string
}

const list = async (): Promise<TenantDTO[]> => {
    const response = await api.get<any[]>('/tenants', { baseUrl: API_CONCORDIA_URL })
    return response.map(t => ({
        id: t.uuid || t.id,
        seqId: t.seqId ?? t.seq_id,
        name: t.name,
        slug: t.slug,
        createdAt: t.createdAt ?? t.created_at,
        createdBy: t.createdBy ?? t.created_by,
        updatedAt: t.updatedAt ?? t.updated_at,
        updatedBy: t.updatedBy ?? t.updated_by
    }))
}

const create = async (payload: CreateTenantPayload): Promise<TenantDTO> => {
    const response = await api.post<any>('/tenants', payload, { baseUrl: API_CONCORDIA_URL })
    return {
        id: response.uuid || response.id,
        seqId: response.seqId ?? response.seq_id,
        name: response.name,
        slug: response.slug,
        createdAt: response.createdAt ?? response.created_at,
        createdBy: response.createdBy ?? response.created_by,
        updatedAt: response.updatedAt ?? response.updated_at,
        updatedBy: response.updatedBy ?? response.updated_by
    }
}

const update = async (id: string, payload: UpdateTenantPayload): Promise<TenantDTO> => {
    const response = await api.put<any>(`/tenants/${id}`, payload, { baseUrl: API_CONCORDIA_URL })
    return {
        id: response.uuid || response.id,
        seqId: response.seqId ?? response.seq_id,
        name: response.name,
        slug: response.slug,
        createdAt: response.createdAt ?? response.created_at,
        createdBy: response.createdBy ?? response.created_by,
        updatedAt: response.updatedAt ?? response.updated_at,
        updatedBy: response.updatedBy ?? response.updated_by
    }
}

const remove = async (id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`, { baseUrl: API_CONCORDIA_URL })
}

const getById = async (id: string): Promise<TenantDTO> => {
    const response = await api.get<any>(`/tenants/${id}`, { baseUrl: API_CONCORDIA_URL })
    return {
        id: response.uuid || response.id,
        seqId: response.seqId ?? response.seq_id,
        name: response.name,
        slug: response.slug,
        createdAt: response.createdAt ?? response.created_at,
        createdBy: response.createdBy ?? response.created_by,
        updatedAt: response.updatedAt ?? response.updated_at,
        updatedBy: response.updatedBy ?? response.updated_by,
        address: response.address ? {
            id: response.address.uuid || response.address.id,
            postalCode: response.address.postal_code || response.address.postalCode,
            street: response.address.street,
            number: response.address.number,
            complement: response.address.complement,
            neighborhood: response.address.neighborhood,
            city: response.address.city,
            state: response.address.state
        } : null,
        contacts: response.contacts?.map((c: any) => ({
            id: c.uuid || c.id,
            contactType: c.contact_type || c.contactType,
            contactValue: c.contact_value || c.contactValue,
            label: c.label,
            isDefault: c.is_default ?? c.isDefault
        })) || []
    }
}

const saveAddress = async (tenantId: string, payload: Partial<TenantAddressDTO>): Promise<void> => {
    await api.post(`/tenants/${tenantId}/address`, payload, { baseUrl: API_CONCORDIA_URL })
}

const createContact = async (tenantId: string, payload: Partial<TenantContactDTO>): Promise<void> => {
    await api.post(`/tenants/${tenantId}/contacts`, payload, { baseUrl: API_CONCORDIA_URL })
}

const updateContact = async (tenantId: string, contactId: string, payload: Partial<TenantContactDTO>): Promise<void> => {
    await api.put(`/tenants/${tenantId}/contacts/${contactId}`, payload, { baseUrl: API_CONCORDIA_URL })
}

const removeContact = async (tenantId: string, contactId: string): Promise<void> => {
    await api.delete(`/tenants/${tenantId}/contacts/${contactId}`, { baseUrl: API_CONCORDIA_URL })
}

export const tenantService = {
    list,
    getById,
    create,
    update,
    remove,
    saveAddress,
    createContact,
    updateContact,
    removeContact
}
