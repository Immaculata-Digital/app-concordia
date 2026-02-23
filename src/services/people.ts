import { api } from './api'

const API_PESSOAS_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type PeopleAddress = {
    id: string
    addressType: string
    postalCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    createdAt: string
    updatedAt: string
}

export type PeopleContact = {
    id: string
    contactType: string
    contactValue: string
    label?: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

export type PeopleBankAccount = {
    id: string
    bankCode: string
    branchCode: string
    accountNumber: string
    accountType: string
    pixKey?: string
    isDefaultReceipt: boolean
    createdAt: string
    updatedAt: string
}

export type PeopleDocument = {
    id: string
    categoryCode: string | null
    categoryName?: string
    file: string
    verificationStatus: string
    rejectionReason?: string
    expirationDate?: string
    documentInternalData?: any
    fileName?: string
    fileSize?: string
    createdAt: string
    updatedAt: string
}

export type PeopleRelationshipType = {
    id: string
    code: string
    connectorPrefix: string
    relationshipSource: string
    connectorSuffix: string
    relationshipTarget: string
    inverseTypeId: string
    createdAt: string
    updatedAt: string
}

export type PeopleRelationship = {
    id: string
    peopleRelationshipTypesId: string
    peopleIdSource: string
    peopleIdTarget: string
    inverseTypeId: string
    connectorPrefix: string
    relationshipSource: string
    connectorSuffix: string
    relationshipTarget: string
    targetName: string
    targetCpfCnpj?: string
    createdAt: string
    updatedAt: string
}

export type PeopleDTO = {
    id: string
    seqId?: number
    name: string
    cpfCnpj: string
    birthDate?: string | null
    tenantId?: string
    tenantName?: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    usuarioId?: string | null
    usuarioLogin?: string | null
    usuarioNome?: string | null
    addresses?: PeopleAddress[]
    contacts?: PeopleContact[]
    bankAccounts?: PeopleBankAccount[]
    documents?: PeopleDocument[]
    relationships?: PeopleRelationship[]
    details?: PeopleDetail | null
}

export type PeoplePaginatedResponse = {
    data: PeopleDTO[]
    total: number
}

export type CreatePeoplePayload = {
    name: string
    cpfCnpj: string
    birthDate?: string | null
    tenantId?: string
    createdBy: string
    usuarioId?: string | null
}

export type UpdatePeoplePayload = {
    name?: string
    cpfCnpj?: string
    birthDate?: string | null
    tenantId?: string
    updatedBy: string
    usuarioId?: string | null
}

// Adapters
const adaptAddress = (data: any): PeopleAddress => ({
    id: data.id,
    addressType: data.address_type,
    postalCode: data.postal_code,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptContact = (data: any): PeopleContact => ({
    id: data.id,
    contactType: data.contact_type,
    contactValue: data.contact_value,
    label: data.label,
    isDefault: data.is_default,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptBankAccount = (data: any): PeopleBankAccount => ({
    id: data.id,
    bankCode: data.bank_code,
    branchCode: data.branch_code,
    accountNumber: data.account_number,
    accountType: data.account_type,
    pixKey: data.pix_key,
    isDefaultReceipt: data.is_default_receipt,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptDocument = (data: any): PeopleDocument => ({
    id: data.id,
    categoryCode: data.category_code,
    categoryName: data.category_name,
    file: data.file,
    verificationStatus: data.verification_status,
    rejectionReason: data.rejection_reason,
    expirationDate: data.expiration_date,
    documentInternalData: data.document_internal_data,
    fileName: data.file_name,
    fileSize: data.file_size,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptRelationshipType = (data: any): PeopleRelationshipType => ({
    id: data.id,
    code: data.code,
    connectorPrefix: data.connector_prefix,
    relationshipSource: data.relationship_source,
    connectorSuffix: data.connector_suffix,
    relationshipTarget: data.relationship_target,
    inverseTypeId: data.inverse_type_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptRelationship = (data: any): PeopleRelationship => ({
    id: data.id,
    peopleRelationshipTypesId: data.people_relationship_types_id,
    peopleIdSource: data.people_id_source,
    peopleIdTarget: data.people_id_target,
    inverseTypeId: data.inverse_type_id,
    connectorPrefix: data.connector_prefix,
    relationshipSource: data.relationship_source,
    connectorSuffix: data.connector_suffix,
    relationshipTarget: data.relationship_target,
    targetName: data.target_name,
    targetCpfCnpj: data.target_cpf_cnpj,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const adaptPeople = (data: any): PeopleDTO => {
    return {
        id: data.id || data.uuid,
        seqId: data.seq_id,
        name: data.name,
        cpfCnpj: data.cpf_cnpj || data.cpfCnpj,
        birthDate: data.birth_date || data.birthDate,
        tenantId: data.tenant_id || data.tenantId,
        tenantName: data.tenant_name || data.tenantName,
        createdAt: data.created_at || data.createdAt,
        createdBy: data.created_by || data.createdBy,
        updatedAt: data.updated_at || data.updatedAt,
        updatedBy: data.updated_by || data.updatedBy,
        usuarioId: data.usuario_id || data.usuarioId,
        usuarioLogin: data.usuario_login || data.usuarioLogin,
        usuarioNome: data.usuario_nome || data.usuarioNome,
        addresses: data.addresses?.map(adaptAddress),
        contacts: data.contacts?.map(adaptContact),
        bankAccounts: data.bankAccounts?.map(adaptBankAccount),
        documents: data.documents?.map(adaptDocument),
        relationships: data.relationships?.map(adaptRelationship),
        details: data.details ? adaptDetail(data.details) : null,
    }
}

const list = async (): Promise<PeopleDTO[]> => {
    const response = await api.get<any>('/peoples', {
        baseUrl: API_PESSOAS_URL,
        params: { limit: 1000 }
    })
    if (Array.isArray(response)) {
        return response.map(adaptPeople)
    }
    return (response?.data || []).map(adaptPeople)
}

const listPaginated = async (params: { page: number; limit: number; query?: string; filters?: any; sorts?: any[] }): Promise<PeoplePaginatedResponse> => {
    const response = await api.get<any>('/peoples', {
        baseUrl: API_PESSOAS_URL,
        params: {
            page: params.page,
            limit: params.limit,
            search: params.query,
            filters: params.filters ? JSON.stringify(params.filters) : undefined,
            sorts: params.sorts ? JSON.stringify(params.sorts) : undefined,
        }
    })

    if (Array.isArray(response)) {
        return {
            data: response.map(adaptPeople),
            total: response.length
        }
    }

    return {
        data: (response?.data || []).map(adaptPeople),
        total: response?.total ?? (response?.data?.length || 0)
    }
}

const create = async (payload: CreatePeoplePayload) => {
    const response = await api.post<any>('/peoples', payload, { baseUrl: API_PESSOAS_URL })
    return adaptPeople(response)
}

const update = async (id: string, payload: UpdatePeoplePayload) => {
    const response = await api.put<any>(`/peoples/${id}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptPeople(response)
}

const remove = (id: string) => api.delete<void>(`/peoples/${id}`, { baseUrl: API_PESSOAS_URL })

const getById = async (id: string) => {
    const response = await api.get<any>(`/peoples/${id}`, { baseUrl: API_PESSOAS_URL })
    return adaptPeople(response)
}

export type CreateContactPayload = {
    contactType: string
    contactValue: string
    label?: string
    isDefault?: boolean
}

export type UpdateContactPayload = {
    contactType?: string
    contactValue?: string
    label?: string
    isDefault?: boolean
}

const createContact = async (peopleId: string, payload: CreateContactPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/contacts`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptContact(response)
}

const updateContact = async (peopleId: string, contactId: string, payload: UpdateContactPayload) => {
    const response = await api.put<any>(`/peoples/${peopleId}/contacts/${contactId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptContact(response)
}

const removeContact = (peopleId: string, contactId: string) =>
    api.delete<void>(`/peoples/${peopleId}/contacts/${contactId}`, { baseUrl: API_PESSOAS_URL })

// Addresses
export type CreateAddressPayload = {
    addressType: string
    postalCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>

const createAddress = async (peopleId: string, payload: CreateAddressPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/addresses`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptAddress(response)
}

const updateAddress = async (peopleId: string, addressId: string, payload: UpdateAddressPayload) => {
    const response = await api.put<any>(`/peoples/${peopleId}/addresses/${addressId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptAddress(response)
}

const removeAddress = (peopleId: string, addressId: string) =>
    api.delete<void>(`/peoples/${peopleId}/addresses/${addressId}`, { baseUrl: API_PESSOAS_URL })

// Bank Accounts
export type CreateBankAccountPayload = {
    bankCode: string
    branchCode: string
    accountNumber: string
    accountType: string
    pixKey?: string
    isDefaultReceipt?: boolean
}

export type UpdateBankAccountPayload = Partial<CreateBankAccountPayload>

const createBankAccount = async (peopleId: string, payload: CreateBankAccountPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/bank-accounts`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptBankAccount(response)
}

const updateBankAccount = async (peopleId: string, accountId: string, payload: UpdateBankAccountPayload) => {
    const response = await api.put<any>(`/peoples/${peopleId}/bank-accounts/${accountId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptBankAccount(response)
}

const removeBankAccount = (peopleId: string, accountId: string) =>
    api.delete<void>(`/peoples/${peopleId}/bank-accounts/${accountId}`, { baseUrl: API_PESSOAS_URL })

// Documents
export type CreateDocumentPayload = {
    categoryCode: string
    file: string
    expirationDate?: string // Format YYYY-MM-DD
    documentInternalData?: any
    fileName?: string
    fileSize?: string
}

export type UpdateDocumentPayload = Partial<CreateDocumentPayload> & {
    verificationStatus?: string
    rejectionReason?: string
}

const createDocument = async (peopleId: string, payload: CreateDocumentPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/documents`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptDocument(response)
}

const updateDocument = async (peopleId: string, documentId: string, payload: UpdateDocumentPayload) => {
    const response = await api.put<any>(`/peoples/${peopleId}/documents/${documentId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptDocument(response)
}

const removeDocument = (peopleId: string, documentId: string) =>
    api.delete<void>(`/peoples/${peopleId}/documents/${documentId}`, { baseUrl: API_PESSOAS_URL })

export type PeopleDocumentCategoryEnumDTO = {
    code: string
    name: string
    description?: string
    sort: number
    enabled: boolean
}

const listDocumentCategories = async (): Promise<PeopleDocumentCategoryEnumDTO[]> => {
    const response = await api.get<any>('/peoples/documents-categories', { baseUrl: API_PESSOAS_URL })
    return Array.isArray(response) ? response : (response?.data || [])
}

// Details
export type PeopleDetail = {
    id: string
    sex?: string
    maritalStatus?: string
    nationality?: string
    occupation?: string
    birthDate?: string | null
    firstName?: string
    surname?: string
    legalName?: string
    tradeName?: string
    createdAt: string
    updatedAt: string
}

export type CreateDetailPayload = {
    sex?: string | null
    maritalStatus?: string | null
    nationality?: string | null
    occupation?: string | null
    birthDate?: string | null
    firstName?: string | null
    surname?: string | null
    legalName?: string | null
    tradeName?: string | null
}

export type UpdateDetailPayload = Partial<CreateDetailPayload>

const adaptDetail = (data: any): PeopleDetail => ({
    id: data.id,
    sex: data.sex,
    maritalStatus: data.marital_status,
    nationality: data.nationality,
    occupation: data.occupation,
    birthDate: data.birth_date,
    firstName: data.first_name,
    surname: data.surname,
    legalName: data.legal_name,
    tradeName: data.trade_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
})

const createDetail = async (peopleId: string, payload: CreateDetailPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/details`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptDetail(response)
}

const updateDetail = async (peopleId: string, detailId: string, payload: UpdateDetailPayload) => {
    const response = await api.put<any>(`/peoples/${peopleId}/details/${detailId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptDetail(response)
}

const removeDetail = (peopleId: string, detailId: string) =>
    api.delete<void>(`/peoples/${peopleId}/details/${detailId}`, { baseUrl: API_PESSOAS_URL })

// Relationship Types
const listRelationshipTypes = async () => {
    const response = await api.get<any[]>('/peoples/relationship-types', { baseUrl: API_PESSOAS_URL })
    return response.map(adaptRelationshipType)
}

const createRelationshipType = async (payload: any) => {
    const response = await api.post<any>('/peoples/relationship-types', payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationshipType(response)
}

const updateRelationshipType = async (id: string, payload: any) => {
    const response = await api.put<any>(`/peoples/relationship-types/${id}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationshipType(response)
}

const removeRelationshipType = (id: string) =>
    api.delete<void>(`/peoples/relationship-types/${id}`, { baseUrl: API_PESSOAS_URL })

// Relationships
export type CreateRelationshipPayload = {
    peopleRelationshipTypesId: string
    peopleIdSource: string
    peopleIdTarget: string
    inverseTypeId: string
}

const createRelationship = async (peopleId: string, payload: CreateRelationshipPayload) => {
    const response = await api.post<any>(`/peoples/${peopleId}/relationships`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationship(response)
}

const updateRelationship = async (peopleId: string, relationshipId: string, payload: any) => {
    const response = await api.put<any>(`/peoples/${peopleId}/relationships/${relationshipId}`, payload, { baseUrl: API_PESSOAS_URL })
    return adaptRelationship(response)
}

const removeRelationship = (peopleId: string, relationshipId: string) =>
    api.delete<void>(`/peoples/${peopleId}/relationships/${relationshipId}`, { baseUrl: API_PESSOAS_URL })

const getByCpfCnpj = async (cpfCnpj: string, token: string): Promise<any> => {
    const response = await api.post<any>('/peoples/public/get-by-cpf-cnpj', {
        cpfCnpj,
        token,
    }, { baseUrl: API_PESSOAS_URL, skipAuth: true })
    return response
}

export type CreatePeopleFromPublicFormPayload = {
    contractId: string
    name: string
    cpfCnpj?: string
    birthDate?: string | null
    maritalStatus?: string
    nationality?: string
    occupation?: string
    addressType?: string
    postalCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    email: string
    documents?: Array<{
        categoryCode: string
        file: string
        fileName?: string
        fileSize?: string
    }>
    observacoes?: string
}

const createFromPublicForm = async (payload: CreatePeopleFromPublicFormPayload) => {
    const response = await api.post<any>('/peoples/public/create-from-form', payload, {
        baseUrl: API_PESSOAS_URL,
        skipAuth: true,
    })
    return response
}

export const peopleService = {
    list,
    listPaginated,
    create,
    update,
    remove,
    getById,
    getByCpfCnpj,
    createFromPublicForm,
    // Contacts
    createContact,
    updateContact,
    removeContact,
    // Addresses
    createAddress,
    updateAddress,
    removeAddress,
    // Bank Accounts
    createBankAccount,
    updateBankAccount,
    removeBankAccount,
    // Documents
    createDocument,
    updateDocument,
    removeDocument,
    listDocumentsCategories: listDocumentCategories,
    // Details
    createDetail,
    updateDetail,
    removeDetail,
    // Relationship Types
    listRelationshipTypes,
    createRelationshipType,
    updateRelationshipType,
    removeRelationshipType,
    // Relationships
    createRelationship,
    updateRelationship,
    removeRelationship,
}
