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

// Debug: verificar se a variável está sendo lida corretamente
if (typeof window !== 'undefined') {
  console.log('[DEBUG] VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('[DEBUG] Hostname:', window.location.hostname)
  console.log('[DEBUG] API_CONTRATOS_URL final:', API_CONTRATOS_URL)
  console.log('[DEBUG] Todas as variáveis VITE_API_*:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_API_')))
}

export type ModalidadeRentabilidadeDTO = {
  id: string
  seqId?: number | null
  rentabilidadePercentual: number
  prazoMeses: number
  cicloPagamentoId: string
  cicloDescricao?: string
  frequenciaPagamento: number
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt?: string | null
}

export type CreateModalidadeRentabilidadePayload = {
  rentabilidadePercentual: number
  prazoMeses: number
  cicloPagamentoId: string
  frequenciaPagamento: number
  createdBy: string
}

export type UpdateModalidadeRentabilidadePayload = {
  rentabilidadePercentual?: number
  prazoMeses?: number
  cicloPagamentoId?: string
  frequenciaPagamento?: number
  updatedBy: string
}

const adaptModalidadeRentabilidade = (data: any): ModalidadeRentabilidadeDTO => {
  return {
    id: data.id,
    seqId: data.seqId,
    rentabilidadePercentual: data.rentabilidadePercentual,
    prazoMeses: data.prazoMeses,
    cicloPagamentoId: data.cicloPagamentoId,
    cicloDescricao: data.cicloDescricao,
    frequenciaPagamento: data.frequenciaPagamento,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

const list = async (search?: string) => {
  const response = await api.get<any>('/modalidades-rentabilidade', {
    baseUrl: API_CONTRATOS_URL,
    params: search ? { search } : undefined
  })
  if (Array.isArray(response)) {
    return response.map(adaptModalidadeRentabilidade)
  }
  return (response?.data || []).map(adaptModalidadeRentabilidade)
}

const create = async (payload: CreateModalidadeRentabilidadePayload) => {
  const response = await api.post<any>('/modalidades-rentabilidade', payload, { baseUrl: API_CONTRATOS_URL })
  return adaptModalidadeRentabilidade(response)
}

const update = async (id: string, payload: UpdateModalidadeRentabilidadePayload) => {
  const response = await api.put<any>(`/modalidades-rentabilidade/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
  return adaptModalidadeRentabilidade(response)
}

const remove = (id: string) => api.delete<void>(`/modalidades-rentabilidade/${id}`, { baseUrl: API_CONTRATOS_URL })

const getById = async (id: string) => {
  const response = await api.get<any>(`/modalidades-rentabilidade/${id}`, { baseUrl: API_CONTRATOS_URL })
  return adaptModalidadeRentabilidade(response)
}

export const modalidadeRentabilidadeService = {
  list,
  create,
  update,
  remove,
  getById,
}

