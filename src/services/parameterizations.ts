import { api } from './api'

const API_USUARIOS_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type ParameterizationDTO = {
  id: string
  seqId?: number
  friendlyName: string
  technicalKey: string
  dataType: string
  value: string
  scopeType: string
  scopeTargetId: string[]
  editable: boolean
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateParameterizationPayload = {
  friendlyName: string
  technicalKey: string
  dataType: string
  value: string
  scopeType: string
  scopeTargetId?: string[]
  editable?: boolean
  createdBy: string
}

export type UpdateParameterizationPayload = {
  friendlyName?: string
  technicalKey?: string
  dataType?: string
  value?: string
  scopeType?: string
  scopeTargetId?: string[]
  editable?: boolean
  updatedBy: string
}

const list = async () => {
  const response = await api.get<ParameterizationDTO[]>('/parameterizations', { baseUrl: API_USUARIOS_URL })
  return response
}

const create = async (payload: CreateParameterizationPayload) => {
  const response = await api.post<ParameterizationDTO>('/parameterizations', payload, { baseUrl: API_USUARIOS_URL })
  return response
}

const update = async (id: string, payload: UpdateParameterizationPayload) => {
  const response = await api.put<ParameterizationDTO>(`/parameterizations/${id}`, payload, { baseUrl: API_USUARIOS_URL })
  return response
}

const remove = (id: string) => api.delete<void>(`/parameterizations/${id}`, { baseUrl: API_USUARIOS_URL })

const getById = async (id: string) => {
  const response = await api.get<ParameterizationDTO>(`/parameterizations/${id}`, { baseUrl: API_USUARIOS_URL })
  return response
}

export const parameterizationService = {
  list,
  create,
  update,
  remove,
  getById,
}

