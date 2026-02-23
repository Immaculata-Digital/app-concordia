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

export type CicloPagamentoDTO = {
  id: string
  descricao: string
  diaInicioCiclo: number
  diaFimCiclo: number
  diaPagamentoCiclo: number
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt?: string | null
}

export type CreateCicloPagamentoPayload = {
  descricao: string
  diaInicioCiclo: number
  diaFimCiclo: number
  diaPagamentoCiclo: number
  createdBy: string
}

export type UpdateCicloPagamentoPayload = {
  descricao?: string
  diaInicioCiclo?: number
  diaFimCiclo?: number
  diaPagamentoCiclo?: number
  updatedBy: string
}

const adaptCicloPagamento = (data: any): CicloPagamentoDTO => {
  return {
    id: data.id,
    descricao: data.descricao,
    diaInicioCiclo: data.diaInicioCiclo,
    diaFimCiclo: data.diaFimCiclo,
    diaPagamentoCiclo: data.diaPagamentoCiclo,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

const list = async () => {
  const response = await api.get<any>('/ciclos-pagamento', { baseUrl: API_CONTRATOS_URL })
  if (Array.isArray(response)) {
    return response.map(adaptCicloPagamento)
  }
  return (response?.data || []).map(adaptCicloPagamento)
}

const create = async (payload: CreateCicloPagamentoPayload) => {
  const response = await api.post<any>('/ciclos-pagamento', payload, { baseUrl: API_CONTRATOS_URL })
  return adaptCicloPagamento(response)
}

const update = async (id: string, payload: UpdateCicloPagamentoPayload) => {
  const response = await api.put<any>(`/ciclos-pagamento/${id}`, payload, { baseUrl: API_CONTRATOS_URL })
  return adaptCicloPagamento(response)
}

const remove = (id: string) => api.delete<void>(`/ciclos-pagamento/${id}`, { baseUrl: API_CONTRATOS_URL })

const getById = async (id: string) => {
  const response = await api.get<any>(`/ciclos-pagamento/${id}`, { baseUrl: API_CONTRATOS_URL })
  return adaptCicloPagamento(response)
}

export const cicloPagamentoService = {
  list,
  create,
  update,
  remove,
  getById,
}

