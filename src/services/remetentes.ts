const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type RemetenteDTO = {
  id: string
  seqId?: number
  nome: string
  email: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateRemetentePayload = {
  nome: string
  email: string
  senha: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  createdBy: string
}

export type UpdateRemetentePayload = {
  nome?: string
  email?: string
  senha?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  updatedBy: string
}

const list = (params?: Record<string, any>) => {
  const token = localStorage.getItem('marshall_access_token')
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  return fetch(`${API_BASE_URL}/remetentes${query}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: `Erro ${res.status}` }))
      throw new Error(error.message || `Erro ${res.status}`)
    }
    return res.json() as Promise<RemetenteDTO[]>
  })
}

const create = (payload: CreateRemetentePayload) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/remetentes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: `Erro ${res.status}` }))
      throw new Error(error.message || `Erro ${res.status}`)
    }
    return res.json() as Promise<RemetenteDTO>
  })
}

const update = (id: string, payload: UpdateRemetentePayload) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/remetentes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: `Erro ${res.status}` }))
      throw new Error(error.message || `Erro ${res.status}`)
    }
    return res.json() as Promise<RemetenteDTO>
  })
}

const remove = (id: string) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/remetentes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: `Erro ${res.status}` }))
      throw new Error(error.message || `Erro ${res.status}`)
    }
    return undefined
  })
}

export const remetenteService = {
  list,
  create,
  update,
  remove,
}

