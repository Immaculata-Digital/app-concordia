import { api } from './api'

const API_CONTATOS_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface ContactDTO {
  id: string;
  seqId?: number;
  name: string;
  profession?: string;
  enterprise?: string;
  sector?: string;
  phone?: string;
  email?: string;
  lgpdPrivacidade?: boolean;
  lgpdComunicacao?: boolean;
  usuarioAcesso: string[];
  ufCidade?: string;
  observacoes?: string;
  status: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ContactsPaginatedResponse {
  data: ContactDTO[];
  total: number;
}

export interface ContactDashboardData {
  contact: ContactDTO;
  // Aqui poderiam vir outros dados agregados do BFF
}

export interface CreateContactDTO {
  name: string;
  profession?: string;
  enterprise?: string;
  sector?: string;
  phone?: string;
  email?: string;
  lgpdPrivacidade?: boolean;
  lgpdComunicacao?: boolean;
  usuarioAcesso?: string[];
  ufCidade?: string;
  observacoes?: string;
  status?: boolean;
  createdBy: string;
}

export interface UpdateContactDTO {
  name?: string;
  profession?: string;
  enterprise?: string;
  sector?: string;
  phone?: string;
  email?: string;
  lgpdPrivacidade?: boolean;
  lgpdComunicacao?: boolean;
  usuarioAcesso?: string[];
  ufCidade?: string;
  observacoes?: string;
  status?: boolean;
  updatedBy: string;
}

export const contatosService = {
  getAll: async (params?: {
    search?: string;
    status?: boolean;
  }): Promise<ContactDTO[]> => {
    const response = await api.get<any>('/contacts', {
      baseUrl: API_CONTATOS_URL,
      params: {
        search: params?.search,
        status: params?.status !== undefined ? String(params.status) : undefined,
      }
    });

    if (Array.isArray(response)) {
      return response;
    }
    return response?.data || [];
  },

  listPaginated: async (params: {
    page: number;
    limit: number;
    query?: string;
    filters?: any;
    sorts?: any[];
  }): Promise<ContactsPaginatedResponse> => {
    const response = await api.get<any>('/contacts', {
      baseUrl: API_CONTATOS_URL,
      params: {
        page: params.page,
        limit: params.limit,
        search: params.query,
        filters: params.filters ? JSON.stringify(params.filters) : undefined,
        sorts: params.sorts ? JSON.stringify(params.sorts) : undefined,
      }
    });

    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length
      };
    }

    return {
      data: response?.data || [],
      total: response?.total ?? (response?.data?.length || 0)
    };
  },

  getById: async (id: string): Promise<ContactDTO> => {
    return api.get<ContactDTO>(`/contacts/${id}`, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  getDashboardDetails: async (id: string): Promise<ContactDashboardData> => {
    return api.get<ContactDashboardData>(`/contacts/${id}/dashboard-details`, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  create: async (data: CreateContactDTO): Promise<ContactDTO> => {
    return api.post<ContactDTO>('/contacts', data, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  update: async (id: string, data: UpdateContactDTO): Promise<ContactDTO> => {
    return api.put<ContactDTO>(`/contacts/${id}`, data, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/contacts/${id}`, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  inactivate: async (id: string, updatedBy: string): Promise<void> => {
    return api.patch<void>(`/contacts/${id}/inactivate`, { updatedBy }, {
      baseUrl: API_CONTATOS_URL,
    });
  },

  reactivate: async (id: string, updatedBy: string): Promise<ContactDTO> => {
    return api.patch<ContactDTO>(`/contacts/${id}/reactivate`, { updatedBy }, {
      baseUrl: API_CONTATOS_URL,
    });
  },
};

