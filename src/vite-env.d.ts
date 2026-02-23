/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_USUARIOS_BASE_URL: string
  readonly VITE_API_USUARIOS_BASE_URL_HOMOLOG: string
  readonly VITE_API_USUARIOS_BASE_URL_MAIN: string
  readonly VITE_API_CLIENTES_BASE_URL: string
  readonly VITE_API_CLIENTES_BASE_URL_HOMOLOG: string
  readonly VITE_API_CLIENTES_BASE_URL_MAIN: string
  readonly VITE_API_COMUNICACOES_BASE_URL: string
  readonly VITE_API_COMUNICACOES_BASE_URL_HOMOLOG: string
  readonly VITE_API_COMUNICACOES_BASE_URL_MAIN: string
  readonly VITE_API_CONTRATOS_BASE_URL: string
  readonly VITE_API_CONTRATOS_BASE_URL_HOMOLOG: string
  readonly VITE_API_CONTRATOS_BASE_URL_MAIN: string
  readonly VITE_API_PESSOAS_BASE_URL: string
  readonly VITE_API_PESSOAS_BASE_URL_HOMOLOG: string
  readonly VITE_API_PESSOAS_BASE_URL_MAIN: string
  readonly VITE_API_CONTATOS_BASE_URL: string
  readonly VITE_API_CONTATOS_BASE_URL_HOMOLOG: string
  readonly VITE_API_CONTATOS_BASE_URL_MAIN: string
  readonly VITE_API_RELATORIOS_BASE_URL: string
  readonly VITE_API_RELATORIOS_BASE_URL_HOMOLOG: string
  readonly VITE_API_RELATORIOS_BASE_URL_MAIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

