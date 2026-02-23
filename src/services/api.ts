import { loadingManager } from '../utils/loading'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  message: string
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.message = message
    this.status = status
  }
}

const TOKEN_KEY = 'marshall_access_token'
const REFRESH_TOKEN_KEY = 'marshall_refresh_token'
const USER_KEY = 'marshall_user'

const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export type RequestOptions = RequestInit & {
  parseJson?: boolean
  skipAuth?: boolean
  baseUrl?: string
  params?: Record<string, string | number | boolean | undefined>
}

async function request<TResponse>(path: string, options: RequestOptions = {}) {
  const { parseJson = true, headers, skipAuth = false, baseUrl, params, ...rest } = options

  loadingManager.start()
  try {
    let fullPath = path
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullPath += (path.includes('?') ? '&' : '?') + queryString
      }
    }

    const authHeaders: Record<string, string> = {}
    if (!skipAuth) {
      const token = getAccessToken()
      if (token) {
        authHeaders.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(`${baseUrl ?? API_BASE_URL}${fullPath}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
        ...headers,
      },
      ...rest,
    })

    if (response.status === 401 && !skipAuth) {
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }

    if (!response.ok) {
      let message = `Erro ${response.status}`
      try {
        const data = await response.json()
        message = data?.message ?? message
      } catch {
        // ignore
      }
      throw new ApiError(message, response.status)
    }

    if (!parseJson || response.status === 204) {
      return null as TResponse
    }

    return (await response.json()) as TResponse
  } catch (error) {
    throw error
  } finally {
    loadingManager.stop()
  }
}

export const api = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>(path, { method: 'GET', ...options }),
  post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>(path, { method: 'DELETE', ...options }),
}
