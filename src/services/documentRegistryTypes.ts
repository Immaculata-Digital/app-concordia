import { api, ApiError } from './api'

const API_RELATORIOS = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type DocumentRegistryTypeDTO = {
  id: string
  name: string
  prefix?: string
  sequence?: number
  year?: number
  createdAt?: string
  createdBy?: string
  updatedAt?: string | null
  updatedBy?: string | null
}

export type CreateDocumentRegistryTypePayload = {
  name: string
  prefix: string
  sequence: number
  year: number
  createdBy?: string
}

export type UpdateDocumentRegistryTypePayload = {
  name?: string
  prefix?: string
  sequence?: number
  year?: number
  updatedBy?: string
}

const adapt = (data: Record<string, unknown>): DocumentRegistryTypeDTO => ({
  id: String(data.id ?? ''),
  name: String(data.name ?? data.nome ?? ''),
  prefix: data.prefix != null ? String(data.prefix) : undefined,
  sequence: data.sequence != null ? Number(data.sequence) : undefined,
  year: data.year != null ? Number(data.year) : undefined,
  createdAt: data.created_at != null ? String(data.created_at) : data.createdAt != null ? String(data.createdAt) : undefined,
  createdBy: data.created_by != null ? String(data.created_by) : data.createdBy != null ? String(data.createdBy) : undefined,
  updatedAt: data.updated_at != null ? String(data.updated_at) : data.updatedAt != null ? String(data.updatedAt) : undefined,
  updatedBy: data.updated_by != null ? String(data.updated_by) : data.updatedBy != null ? String(data.updatedBy) : undefined,
})

const list = async (params?: { search?: string }) => {
  try {
    const response = await api.get<unknown[]>('/document-registry-types', { baseUrl: API_RELATORIOS, params })
    const list = Array.isArray(response) ? response : []
    return list.map((item) => adapt(item as Record<string, unknown>))
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return []
    throw err
  }
}

const create = async (payload: CreateDocumentRegistryTypePayload) => {
  const body = {
    name: payload.name,
    prefix: payload.prefix,
    sequence: payload.sequence,
    year: payload.year,
    created_by: payload.createdBy,
  }
  const response = await api.post<Record<string, unknown>>('/document-registry-types', body, { baseUrl: API_RELATORIOS })
  return adapt(response)
}

const update = async (id: string, payload: UpdateDocumentRegistryTypePayload) => {
  const body: Record<string, unknown> = {
    updated_by: payload.updatedBy,
  }
  if (payload.name !== undefined) body.name = payload.name
  if (payload.prefix !== undefined) body.prefix = payload.prefix
  if (payload.sequence !== undefined) body.sequence = payload.sequence
  if (payload.year !== undefined) body.year = payload.year
  const response = await api.put<Record<string, unknown>>(`/document-registry-types/${id}`, body, { baseUrl: API_RELATORIOS })
  return adapt(response)
}

const remove = (id: string) => api.delete<void>(`/document-registry-types/${id}`, { baseUrl: API_RELATORIOS })

const getById = async (id: string) => {
  const response = await api.get<Record<string, unknown>>(`/document-registry-types/${id}`, { baseUrl: API_RELATORIOS })
  return adapt(response)
}

export const documentRegistryTypeService = {
  list,
  create,
  update,
  remove,
  getById,
}
