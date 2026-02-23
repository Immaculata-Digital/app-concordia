export interface CreateDocumentLayoutDTO {
  name: string
  category_code?: string
  header_html?: string
  footer_html?: string
  css?: string
  enabled?: boolean
  created_by: string
}

export interface DocumentLayoutDTO {
  id: string
  name: string
  category_code?: string
  description: string
  header_html: string
  footer_html: string
  css?: string
  updated_at: string
}

export interface LayoutCategoryDTO {
  id: string
  code: string
  description: string
}

export interface DocumentLayoutsScreenData {
  layouts: DocumentLayoutDTO[]
  categories: LayoutCategoryDTO[]
}

export interface DocumentDTO {
  id: string
  code: string
  title: string
  content: any
  has_watermark?: boolean
  document_layout_id?: string
  category_code?: string
  enabled?: boolean
  created_at?: string
  created_by: string
  updated_by?: string
  status?: 'draft' | 'finalized'
}

import { api } from './api'

const API_RELATORIOS = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export const documentService = {
  listDocuments: async (params?: { title?: string, code?: string, category_code?: string, enabled?: boolean }): Promise<DocumentDTO[]> => {
    try {
      const docs = await api.get<DocumentDTO[]>('/documents', {
        baseUrl: API_RELATORIOS,
        params
      })
      return docs || []
    } catch (error) {
      console.warn('API Error', error)
      return []
    }
  },

  getDocumentById: async (id: string): Promise<DocumentDTO> => {
    try {
      const doc = await api.get<DocumentDTO>(`/documents/${id}`, { baseUrl: API_RELATORIOS })
      return doc
    } catch (error) {
      console.warn(`API Error for doc ${id}`, error)
      throw error
    }
  },

  saveDocument: async (doc: Partial<DocumentDTO>): Promise<DocumentDTO> => {
    try {
      if (doc.id) {
        return await api.patch<DocumentDTO>(`/documents/${doc.id}`, {
          ...doc,
          category_code: doc.category_code || 'geral'
        }, { baseUrl: API_RELATORIOS })
      } else {
        return await api.post<DocumentDTO>('/documents', {
          ...doc,
          category_code: doc.category_code || 'geral'
        }, { baseUrl: API_RELATORIOS })
      }
    } catch (error) {
      console.warn('API Error on save', error)
      throw error
    }
  },

  listLayouts: async (params?: { name?: string, category_code?: string, enabled?: boolean }): Promise<DocumentLayoutDTO[]> => {
    try {
      return await api.get<DocumentLayoutDTO[]>('/document-layouts', {
        baseUrl: API_RELATORIOS,
        params
      })
    } catch (error) {
      console.warn('Failed to fetch layouts from API', error)
      return []
    }
  },

  getLayoutsScreenData: async (): Promise<DocumentLayoutsScreenData> => {
    try {
      return await api.get<DocumentLayoutsScreenData>('/document-layouts/screen-data', { baseUrl: API_RELATORIOS })
    } catch (error) {
      console.warn('Failed to fetch screen data', error)
      return { layouts: [], categories: [] }
    }
  },

  getLayoutById: async (id: string): Promise<DocumentLayoutDTO> => {
    try {
      return await api.get<DocumentLayoutDTO>(`/document-layouts/${id}`, { baseUrl: API_RELATORIOS })
    } catch (error) {
      console.warn(`Failed to fetch layout ${id}`, error)
      throw error
    }
  },

  createLayout: async (data: CreateDocumentLayoutDTO): Promise<DocumentLayoutDTO> => {
    // Inject CSS into header if present, as backend doesn't support separate CSS field
    if (data.css && data.header_html) {
      data.header_html = `<style>${data.css}</style>\n` + data.header_html
    }

    // API expects snake_case for html fields based on validator
    const payload = {
      name: data.name,
      category_code: data.category_code,
      header_html: data.header_html,
      footer_html: data.footer_html,
      enabled: true,
      created_by: data.created_by
    }
    return await api.post<DocumentLayoutDTO>('/document-layouts', payload, { baseUrl: API_RELATORIOS })
  },

  updateLayout: async (id: string, data: Partial<CreateDocumentLayoutDTO> & { updated_by: string }): Promise<DocumentLayoutDTO> => {
    // Inject CSS into header if present
    if (data.css && data.header_html) {
      data.header_html = `<style>${data.css}</style>\n` + data.header_html
    }

    const payload = {
      name: data.name,
      category_code: data.category_code,
      header_html: data.header_html,
      footer_html: data.footer_html,
      enabled: data.enabled,
      updated_by: data.updated_by
    }
    return await api.patch<DocumentLayoutDTO>(`/document-layouts/${id}`, payload, { baseUrl: API_RELATORIOS })
  },

  listLayoutCategories: async (): Promise<LayoutCategoryDTO[]> => {
    try {
      return await api.get<LayoutCategoryDTO[]>('/layout-categories-enum', { baseUrl: API_RELATORIOS })
    } catch (error) {
      console.warn('Failed to fetch categories', error)
      return []
    }
  },

  deleteDocument: async (id: string): Promise<void> => {
    try {
      await api.delete(`/documents/${id}`, { baseUrl: API_RELATORIOS })
    } catch (error) {
      console.warn(`API Error on delete doc ${id}`, error)
      throw error
    }
  },

  deleteLayout: async (id: string): Promise<void> => {
    try {
      await api.delete(`/document-layouts/${id}`, { baseUrl: API_RELATORIOS })
    } catch (error) {
      console.warn(`API Error on delete layout ${id}`, error)
      throw error
    }
  }
}
