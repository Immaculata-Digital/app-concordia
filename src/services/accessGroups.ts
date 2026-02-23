import { api } from './api'

export type FeatureDefinition = {
  key: string
  name: string
  description: string
}

export type AccessGroupDTO = {
  id: string
  seqId?: number
  name: string
  code: string
  features: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateAccessGroupPayload = {
  name: string
  code: string
  features: string[]
  createdBy: string
}

export type UpdateAccessGroupPayload = {
  name?: string
  code?: string
  features?: string[]
  updatedBy: string
}

const list = () => api.get<AccessGroupDTO[]>('/grupos-acesso')
const create = (payload: CreateAccessGroupPayload) => api.post<AccessGroupDTO>('/grupos-acesso', payload)
const update = (id: string, payload: UpdateAccessGroupPayload) =>
  api.put<AccessGroupDTO>(`/grupos-acesso/${id}`, payload)
const remove = (id: string) => api.delete<void>(`/grupos-acesso/${id}`)
const listFeatures = () => api.get<FeatureDefinition[]>('/funcionalidades')

export const accessGroupService = {
  list,
  create,
  update,
  remove,
  listFeatures,
}

