const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export type ComunicacaoDTO = {
  id: string
  seqId?: number
  tipo: 'email'
  descricao: string
  assunto: string
  html: string
  remetenteId: string
  tipoEnvio: 'imediato' | 'agendado'
  chave: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateComunicacaoPayload = {
  tipo: 'email'
  descricao: string
  assunto: string
  html: string
  remetenteId: string
  tipoEnvio: 'imediato' | 'agendado'
  chave?: string
  createdBy: string
}

export type UpdateComunicacaoPayload = {
  tipo?: 'email'
  descricao?: string
  assunto?: string
  html?: string
  remetenteId?: string
  tipoEnvio?: 'imediato' | 'agendado'
  chave?: string
  updatedBy: string
}

export type SendEmailPayload = {
  chave: string
  destinatario: string
  variaveis: string[]
  anexos?: Array<{
    filename: string
    content: string // base64
    contentType?: string
  }>
}

const list = () => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/comunicacoes`, {
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
    return res.json() as Promise<ComunicacaoDTO[]>
  })
}

export type NotificationDTO = {
  id: string
  userId: string
  senderId?: string
  category: string
  isPriority: boolean
  title: string
  body: string
  actions: Array<{
    label: string
    url?: string
    action?: string
    primary?: boolean
  }>
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  currentStatusState: 'read' | 'unread'
  categoryName?: string
  categoryIcon?: string
}

export type ListNotificationsResponse = {
  items: NotificationDTO[]
  total: number
}

const listNotifications = (page = 1, limit = 10, onlyUnread = false, search?: string, sort?: string, order?: 'asc' | 'desc', filters?: any) => {
  const token = localStorage.getItem('marshall_access_token')
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
    onlyUnread: String(onlyUnread),
  }

  if (search) params.search = search
  if (sort) params.sort = sort
  if (order) params.order = order
  if (filters) params.filters = JSON.stringify(filters)

  const query = new URLSearchParams(params)

  return fetch(`${API_BASE_URL}/notifications?${query}`, {
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
    return res.json() as Promise<ListNotificationsResponse>
  })
}

const getUnreadCount = () => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/notifications/unread-count`, {
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
    return res.json() as Promise<{ count: number }>
  })
}

const listNotificationCategories = () => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/notifications/categories`, {
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
    return res.json() as Promise<Array<{ code: string; name: string }>>
  })
}

const markAsRead = (id: string) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
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

const markAllRead = () => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
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

const markAsUnread = (id: string) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/notifications/${id}/unread`, {
    method: 'PATCH',
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


const create = (payload: CreateComunicacaoPayload) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/comunicacoes`, {
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
    return res.json() as Promise<ComunicacaoDTO>
  })
}

const update = (id: string, payload: UpdateComunicacaoPayload) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/comunicacoes/${id}`, {
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
    return res.json() as Promise<ComunicacaoDTO>
  })
}

const remove = (id: string) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/comunicacoes/${id}`, {
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

const send = (payload: SendEmailPayload) => {
  const token = localStorage.getItem('marshall_access_token')
  return fetch(`${API_BASE_URL}/comunicacoes/enviar`, {
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
    return res.json() as Promise<{ status: string; message: string }>
  })
}

export const comunicacaoService = {
  list,
  create,
  update,
  remove,
  send,
  listNotifications,
  listNotificationCategories,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
}

