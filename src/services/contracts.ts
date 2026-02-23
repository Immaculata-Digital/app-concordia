import { api } from './api'

// Obter a URL da API de contratos, tratando undefined e strings vazias
const getApiContratosUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    // Se a variável existir e não for vazia, usar ela
    if (envUrl && envUrl.trim() !== '') {
        return envUrl
    }

    // Fallback: detectar ambiente baseado no hostname
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        // Se estiver em um domínio de homologação
        if (hostname.includes('homolog') || hostname.includes('staging')) {
            return 'https://homolog-api-contratos.marshalltds.com/api'
        }
        // Se estiver em produção
        if (hostname.includes('marshalltds.com') && !hostname.includes('homolog')) {
            return 'https://api-contratos.marshalltds.com/api'
        }
    }

    // Fallback padrão para desenvolvimento local
    return 'http://localhost:3001/api'
}

const API_CONTRATOS_URL = getApiContratosUrl()

export type ContractDTO = {
    id: string
    seqId?: number
    clienteId?: string
    clienteEnderecoId?: string
    cicloId?: string
    modalidadeId?: string
    status: string
    promotorId?: string
    snapshotData?: any
    valorContrato?: number
    vigenciaDataInicio?: string
    vigenciaDataFim?: string
    conteudo?: any
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export type CreateContractPayload = {
    clienteId?: string
    clienteEnderecoId?: string
    cicloId?: string
    modalidadeId?: string
    status?: string
    promotorId?: string
    snapshotData?: any
    valorContrato?: number
    vigenciaDataInicio?: string
    vigenciaDataFim?: string
    conteudo?: any
    createdBy: string
}

export type UpdateContractPayload = {
    clienteId?: string
    clienteEnderecoId?: string
    cicloId?: string
    modalidadeId?: string
    status?: string
    promotorId?: string
    snapshotData?: any
    valorContrato?: number
    vigenciaDataInicio?: string
    vigenciaDataFim?: string
    conteudo?: any
    updatedBy: string
}

export type ContractAttachmentDTO = {
    id: string
    seqId?: number
    contractId: string
    file: string
    fileName: string
    categoryCode: string
    fileSize?: number | string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export type CreateContractAttachmentPayload = {
    contractId: string
    file: string
    fileName: string
    categoryCode: string
    fileSize?: string
    createdBy: string
}

export type UpdateContractAttachmentPayload = {
    file?: string
    fileName?: string
    categoryCode?: string
    fileSize?: string
    updatedBy: string
}

export type ContractSignerDTO = {
    id: string
    seqId?: number
    contractId: string
    pessoaId: string
    vinculo?: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export type CreateContractSignerPayload = {
    contractId: string
    pessoaId: string
    vinculo?: string
    createdBy: string
}

export type UpdateContractSignerPayload = {
    vinculo?: string
    updatedBy: string
}

export type ContractStatusEnumDTO = {
    code: string
    status: string
    sort: number
    enabled: boolean
}

const adaptContractAttachmentCategoryEnum = (data: any): ContractAttachmentCategoryEnumDTO => {
    return {
        code: data.code,
        name: data.name,
        description: data.description,
        sort: data.sort,
        enabled: data.enabled,
    }
}

const adaptContractStatusEnum = (data: any): ContractStatusEnumDTO => {
    return {
        code: data.code,
        status: data.status,
        sort: data.sort,
        enabled: data.enabled,
    }
}

const adaptContract = (data: any): ContractDTO => {
    return {
        id: data.id,
        seqId: data.seqId,
        clienteId: data.clienteId,
        clienteEnderecoId: data.clienteEnderecoId,
        cicloId: data.cicloId,
        modalidadeId: data.modalidadeId,
        status: data.status,
        promotorId: data.promotorId,
        snapshotData: data.snapshotData,
        valorContrato: data.valorContrato,
        vigenciaDataInicio: data.vigenciaDataInicio,
        vigenciaDataFim: data.vigenciaDataFim,
        conteudo: data.conteudo,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
    }
}

const adaptContractAttachment = (data: any): ContractAttachmentDTO => {
    return {
        id: data.id,
        seqId: data.seqId,
        contractId: data.contractId,
        file: data.file,
        fileName: data.fileName,
        categoryCode: data.categoryCode,
        fileSize: data.fileSize,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
    }
}

const adaptContractSigner = (data: any): ContractSignerDTO => {
    return {
        id: data.id,
        seqId: data.seqId,
        contractId: data.contractId,
        pessoaId: data.pessoaId,
        vinculo: data.vinculo,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
    }
}

export type ContractPaginatedResponse = {
    data: ContractDTO[]
    total: number
}

const list = async (): Promise<ContractDTO[]> => {
    const response = await api.get<any>('/contratos', { baseUrl: API_CONTRATOS_URL })
    if (Array.isArray(response)) {
        return response.map(adaptContract)
    }
    if (response && Array.isArray(response.data)) {
        return response.data.map(adaptContract)
    }
    return []
}

const listPaginated = async (params: {
    page: number
    limit: number
    query?: string
    filters?: any
    sorts?: any
}): Promise<ContractPaginatedResponse> => {
    const response = await api.get<any>('/contratos', {
        baseUrl: API_CONTRATOS_URL,
        params: {
            page: params.page,
            limit: params.limit,
            search: params.query,
            filters: params.filters ? JSON.stringify(params.filters) : undefined,
            sorts: params.sorts ? JSON.stringify(params.sorts) : undefined,
        },
    })

    return {
        data: response.data.map(adaptContract),
        total: response.total,
    }
}

const create = async (payload: CreateContractPayload) => {
    const response = await api.post<any>('/contratos', {
        ...payload,
        changeOrigin: 'ERP'
    }, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContract(data)
}

const update = async (id: string, payload: UpdateContractPayload) => {
    const response = await api.patch<any>(`/contratos/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContract(data)
}

const remove = (id: string) => api.delete<void>(`/contratos/${id}`, { baseUrl: API_CONTRATOS_URL })

const getById = async (id: string) => {
    const response = await api.get<any>(`/contratos/${id}`, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContract(data)
}

// Attachments
const listAttachments = async (contractId?: string) => {
    const url = contractId
        ? `/contratos/${contractId}/anexos`
        : '/contratos/anexos'
    const response = await api.get<any>(url, { baseUrl: API_CONTRATOS_URL })
    const items = Array.isArray(response) ? response : (response?.data || [])
    return items.map(adaptContractAttachment)
}

const createAttachment = async (payload: CreateContractAttachmentPayload) => {
    const response = await api.post<any>(`/contratos/${payload.contractId}/anexos`, payload, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractAttachment(data)
}

const updateAttachment = async (id: string, payload: UpdateContractAttachmentPayload) => {
    const response = await api.patch<any>(`/contratos/anexos/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractAttachment(data)
}

const removeAttachment = (id: string) => api.delete<void>(`/contratos/anexos/${id}`, { baseUrl: API_CONTRATOS_URL })

const getAttachmentById = async (id: string) => {
    const response = await api.get<any>(`/contratos/anexos/${id}`, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractAttachment(data)
}

export type ContractAttachmentCategoryEnumDTO = {
    code: string
    name: string
    description?: string
    sort: number
    enabled: boolean
}

// Categories Enum
const listCategoriesEnum = async (): Promise<ContractAttachmentCategoryEnumDTO[]> => {
    const response = await api.get<any>('/contratos/anexos-categorias', { baseUrl: API_CONTRATOS_URL })
    const items = Array.isArray(response) ? response : (response?.data || [])
    return items.map(adaptContractAttachmentCategoryEnum)
}

// Signers
const listSigners = async (contractId?: string) => {
    const url = contractId
        ? `/contratos/${contractId}/assinantes`
        : '/contratos/assinantes'
    const response = await api.get<any>(url, { baseUrl: API_CONTRATOS_URL })
    const items = Array.isArray(response) ? response : (response?.data || [])
    return items.map(adaptContractSigner)
}

const createSigner = async (payload: CreateContractSignerPayload) => {
    const response = await api.post<any>(`/contratos/${payload.contractId}/assinantes`, payload, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractSigner(data)
}

const updateSigner = async (id: string, payload: UpdateContractSignerPayload) => {
    const response = await api.patch<any>(`/contratos/assinantes/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractSigner(data)
}

const removeSigner = (id: string) => api.delete<void>(`/contratos/assinantes/${id}`, { baseUrl: API_CONTRATOS_URL })

const getSignerById = async (id: string) => {
    const response = await api.get<any>(`/contratos/assinantes/${id}`, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractSigner(data)
}

export type ContractStatusHistoryDTO = {
    id: string
    seqId?: number
    contractId: string
    previousStatus?: string
    newStatus: string
    startedAt: string
    endAt?: string
    changeReason?: string
    changeOrigin: string
    isCurrent: boolean
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

const adaptContractStatusHistory = (data: any): ContractStatusHistoryDTO => {
    return {
        id: data.id,
        seqId: data.seqId,
        contractId: data.contractId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        startedAt: data.startedAt,
        endAt: data.endAt,
        changeReason: data.changeReason,
        changeOrigin: data.changeOrigin,
        isCurrent: data.isCurrent,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    }
}

// Status Enum
const listStatusEnum = async (): Promise<ContractStatusEnumDTO[]> => {
    const response = await api.get<any>('/contratos/status-enum', { baseUrl: API_CONTRATOS_URL })
    const items = Array.isArray(response) ? response : (response?.data || [])
    return items.map(adaptContractStatusEnum)
}

const getStatusHistory = async (id: string): Promise<ContractStatusHistoryDTO[]> => {
    const response = await api.get<any>(`/contratos/${id}/status-history`, { baseUrl: API_CONTRATOS_URL })
    const items = Array.isArray(response) ? response : (response?.data || [])
    return items.map(adaptContractStatusHistory)
}

const changeContractStatus = async (contractId: string, payload: { newStatus: string; changeReason?: string; updatedBy: string; changeOrigin?: string }) => {
    const response = await api.patch<any>(`/contratos/${contractId}/status`, {
        ...payload,
        changeOrigin: payload.changeOrigin || 'Dashboard de Contratos - Manual'
    }, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return adaptContractStatusHistory(data)
}

export type GenerateClientLinkPayload = {
    contatoId: string
    cicloId: string
    modalidadeId: string
    valorContrato: number
    promotorId: string
    changeOrigin: string
    createdBy: string
}

export type GenerateClientLinkResponse = {
    contractId: string
}

const generateClientLink = async (payload: GenerateClientLinkPayload): Promise<GenerateClientLinkResponse> => {
    const response = await api.post<GenerateClientLinkResponse>('/contratos/gerar-link-cliente', payload, { baseUrl: API_CONTRATOS_URL })
    return response
}

const validateContractUuid = async (contractId: string): Promise<{ valid: boolean; contractId?: string; status?: string; message?: string }> => {

    try {
        const response = await api.get<{ valid: boolean; contractId?: string; status?: string; message?: string }>(
            `/contratos/validar-uuid/${contractId}`,
            { baseUrl: API_CONTRATOS_URL, skipAuth: true }
        )
        console.log('[contractsService] Resposta recebida:', response)
        return response
    } catch (error: any) {
        console.error('[contractsService] Erro na requisição:', error)
        console.error('[contractsService] Detalhes:', {
            message: error?.message,
            status: error?.status,
        })
        throw error
    }
}

const getDashboardDetails = async (id: string): Promise<ContractDashboardDetailsDTO> => {
    const response = await api.get<any>(`/contratos/${id}/dashboard-details`, { baseUrl: API_CONTRATOS_URL })
    const data = response?.data || response
    return {
        contract: {
            ...adaptContract(data.contract),
            conteudo: data.contract.content || data.contract.conteudo,
            ciclo: data.contract.ciclo,
            modalidade: data.contract.modalidade,
        },
        attachments: (data.attachments || []).map(adaptContractAttachment),
        signers: (data.signers || []).map(adaptContractSigner),
        statusHistory: (data.statusHistory || []).map(adaptContractStatusHistory)
    }
}

export type ContractDashboardDetailsDTO = {
    contract: ContractDTO & {
        ciclo?: { id: string; descricao: string }
        modalidade?: { id: string; rentabilidadePercentual: number; prazoMeses: number }
    }
    attachments: ContractAttachmentDTO[]
    signers: ContractSignerDTO[]
    statusHistory: ContractStatusHistoryDTO[]
}

export const contractsService = {
    list,
    listPaginated,
    create,
    update,
    remove,
    getById,
    getDashboardDetails, // Added
    generateClientLink,
    validateContractUuid,
    attachments: {
        list: listAttachments,
        create: createAttachment,
        update: updateAttachment,
        remove: removeAttachment,
        getById: getAttachmentById,
        listCategories: listCategoriesEnum,
    },
    signers: {
        list: listSigners,
        create: createSigner,
        update: updateSigner,
        remove: removeSigner,
        getById: getSignerById,
    },
    status: {
        list: listStatusEnum,
        history: getStatusHistory,
        change: changeContractStatus,
    },
}

