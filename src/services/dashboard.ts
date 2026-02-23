import { api } from "./api";

const RELATORIOS_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

// Tipos para os dados do dashboard
export type VolumePorPeriodo = {
  periodo: string;
  valor: number;
};

export type VolumePorStatus = {
  status: string;
  valor: number;
  quantidade: number;
};

export type DashboardData = {
  volumePorPeriodo: VolumePorPeriodo[];
  volumePorStatus: VolumePorStatus[];
  valorEmOperacao: number;
  volumeTotalContratos: number;
  contratosEmOperacao: number;
  totalContratos: number;
};

// Buscar todos os dados do dashboard
export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      // Processar dados em paralelo chamando os endpoints reais
      const [
        volumePorPeriodo,
        volumePorStatus,
        summary
      ] = await Promise.all([
        api.get<VolumePorPeriodo[]>("/reports/contracts-volume-by-period", { baseUrl: RELATORIOS_BASE_URL }),
        api.get<any[]>("/reports/contracts-volume-by-status", { baseUrl: RELATORIOS_BASE_URL }),
        api.get<any>("/reports/contracts-general-summary", { baseUrl: RELATORIOS_BASE_URL })
      ]);

      return {
        volumePorPeriodo: volumePorPeriodo || [],
        volumePorStatus: (volumePorStatus || []).map(s => ({
          status: s.status,
          valor: Number(s.total_value),
          quantidade: Number(s.count)
        })),
        valorEmOperacao: Number(summary?.valor_em_operacao || 0),
        volumeTotalContratos: Number(summary?.volume_em_contratos || 0),
        contratosEmOperacao: Number(summary?.contratos_em_operacao || 0),
        totalContratos: Number(summary?.total_de_contratos || 0),
      };
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      throw error;
    }
  },

  getVolumePorPeriodo: async (period?: number): Promise<VolumePorPeriodo[]> => {
    const queryParam = period ? `?period=${period}` : '';
    return api.get<VolumePorPeriodo[]>(`/reports/contracts-volume-by-period${queryParam}`, { baseUrl: RELATORIOS_BASE_URL });
  },

  getVolumePorStatus: async (): Promise<VolumePorStatus[]> => {
    const data = await api.get<any[]>("/reports/contracts-volume-by-status", { baseUrl: RELATORIOS_BASE_URL });
    return (data || []).map(s => ({
      status: s.status,
      valor: Number(s.total_value),
      quantidade: Number(s.count)
    }));
  },

  getContratosAtivos: async (): Promise<number> => {
    const summary = await api.get<any>("/reports/contracts-general-summary", { baseUrl: RELATORIOS_BASE_URL });
    return Number(summary?.contratos_em_operacao || 0);
  },

  getTotalContratos: async (): Promise<number> => {
    const summary = await api.get<any>("/reports/contracts-general-summary", { baseUrl: RELATORIOS_BASE_URL });
    return Number(summary?.total_de_contratos || 0);
  },
};