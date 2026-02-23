import { api } from './api'

export type UserDTO = {
  id: string
  seqId?: number
  fullName: string
  login: string
  email: string
  groupIds: string[]
  allowFeatures: string[]
  deniedFeatures: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateUserPayload = {
  fullName: string
  login: string
  email: string
  groupIds: string[]
  allowFeatures: string[]
  deniedFeatures: string[]
  createdBy: string
}

export type UpdateUserPayload = {
  fullName?: string
  login?: string
  email?: string
  groupIds?: string[]
  allowFeatures?: string[]
  deniedFeatures?: string[]
  updatedBy: string
}

export type UpdateUserBasicPayload = {
  fullName: string
  login: string
  email: string
  updatedBy: string
}

export type UpdateUserGroupsPayload = {
  groupIds: string[]
  updatedBy: string
}

export type UpdateUserPermissionsPayload = {
  allowFeatures: string[]
  deniedFeatures: string[]
  updatedBy: string
}

const list = (filters?: { search?: string; groupId?: string; feature?: string; tenantId?: string }) =>
  api.get<UserDTO[]>('/usuarios', { params: filters })
const create = (payload: CreateUserPayload) => api.post<UserDTO>('/usuarios', payload)
const update = (id: string, payload: UpdateUserPayload) => api.put<UserDTO>(`/usuarios/${id}`, payload)
const updateBasic = (id: string, payload: UpdateUserBasicPayload) => api.put<UserDTO>(`/usuarios/${id}/basic`, payload)
const updateGroups = (id: string, payload: UpdateUserGroupsPayload) => api.put<UserDTO>(`/usuarios/${id}/groups`, payload)
const updatePermissions = (id: string, payload: UpdateUserPermissionsPayload) => api.put<UserDTO>(`/usuarios/${id}/permissions`, payload)
const remove = (id: string) => api.delete<void>(`/usuarios/${id}`)
const resetPassword = (payload: { token: string; password: string; confirmPassword: string }) =>
  api.post<void>('/auth/password/reset', payload, { skipAuth: true })

const requestPasswordReset = (email: string) =>
  api.post<{ status: string; message: string }>('/auth/password/reset-request', { email })

const getById = (id: string) => api.get<UserDTO>(`/usuarios/${id}`)

export const userService = {
  list,
  getById, // Added
  create,
  update,
  updateBasic,
  updateGroups,
  updatePermissions,
  remove,
  resetPassword,
  requestPasswordReset,
}

