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

export type ContractTemplateDTO = {
    id: string
    name: string
    description: string
    content: any
    createdBy: string
    updatedBy?: string | null
    createdAt: string
    updatedAt?: string | null
}

export type CreateContractTemplatePayload = {
    name: string
    description: string
    content: any
    createdBy: string
}

export type UpdateContractTemplatePayload = {
    name?: string
    description?: string
    content?: any
    updatedBy: string
}

const adaptContractTemplate = (data: any): ContractTemplateDTO => {
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        content: data.content,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    }
}

const list = async () => {
    const response = await api.get<any>('/templates-contrato', { baseUrl: API_CONTRATOS_URL })
    if (Array.isArray(response)) {
        return response.map(adaptContractTemplate)
    }
    return (response?.data || []).map(adaptContractTemplate)
}

const create = async (payload: CreateContractTemplatePayload) => {
    const response = await api.post<any>('/templates-contrato', payload, { baseUrl: API_CONTRATOS_URL })
    return adaptContractTemplate(response)
}

const update = async (id: string, payload: UpdateContractTemplatePayload) => {
    const response = await api.patch<any>(`/templates-contrato/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
    return adaptContractTemplate(response)
}

const remove = (id: string) => api.delete<void>(`/templates-contrato/${id}`, { baseUrl: API_CONTRATOS_URL })

const getById = async (id: string) => {
    const response = await api.get<any>(`/templates-contrato/${id}`, { baseUrl: API_CONTRATOS_URL })
    return adaptContractTemplate(response)
}

const getVariables = async () => {
    return api.get<{ id: string; name: string }[]>('/templates-contrato/variables', { baseUrl: API_CONTRATOS_URL })
}

const getScreenData = async () => {
    const response = await api.get<{ templates: any[]; variables: any[] }>('/templates-contrato/screen-data', { baseUrl: API_CONTRATOS_URL })
    return {
        templates: response.templates.map(adaptContractTemplate),
        variables: response.variables
    }
}

export const contractTemplateService = {
    list,
    create,
    update,
    remove,
    getById,
    getVariables,
    getScreenData,
}
