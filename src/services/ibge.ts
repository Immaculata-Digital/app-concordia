// Serviço para buscar dados de estados e municípios do IBGE
// API: https://servicodados.ibge.gov.br/api/v1/localidades

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

export interface Municipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
        regiao: {
          id: number;
          sigla: string;
          nome: string;
        };
      };
    };
  };
}

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export const ibgeService = {
  /**
   * Busca todos os estados brasileiros
   */
  getEstados: async (): Promise<Estado[]> => {
    try {
      const response = await fetch(`${IBGE_BASE_URL}/estados`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar estados: ${response.status}`);
      }
      const estados = await response.json();
      // Ordenar por nome
      return estados.sort((a: Estado, b: Estado) =>
        a.nome.localeCompare(b.nome)
      );
    } catch (error) {
      console.error("Erro ao buscar estados:", error);
      throw error;
    }
  },

  /**
   * Busca todos os municípios de um estado específico
   * @param ufSigla - Sigla do estado (ex: "SP", "RJ")
   */
  getMunicipiosByUF: async (ufSigla: string): Promise<Municipio[]> => {
    try {
      const response = await fetch(
        `${IBGE_BASE_URL}/estados/${ufSigla}/municipios`
      );
      if (!response.ok) {
        throw new Error(`Erro ao buscar municípios: ${response.status}`);
      }
      const municipios = await response.json();
      // Ordenar por nome
      return municipios.sort((a: Municipio, b: Municipio) =>
        a.nome.localeCompare(b.nome)
      );
    } catch (error) {
      console.error("Erro ao buscar municípios:", error);
      throw error;
    }
  },
};


