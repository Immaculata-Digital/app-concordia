import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente (prioridade para .env.test)
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

// Gerar timestamp para pasta única por execução
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.join('test_files', `run-${timestamp}`);

/**
 * Configuração Otimizada para QA Local
 * Foco: DX (Developer Experience), visualização e debug
 */
export default defineConfig({
  // Diretório onde estão os testes reformulados
  testDir: './qa-automation/tests',
  
  // Define o diretório de saída dos artefatos (vídeos, screenshots)
  outputDir: outputDir,
  
  // Executar testes em paralelo total para velocidade
  fullyParallel: true,
  
  // Não proibir 'test.only' localmente (Q.A. usa muito para debugar um teste)
  forbidOnly: false,
  
  // Retentativas apenas no CI ou se configurado explicitamente
  retries: 0,
  
  // Relatórios
  reporter: [
    ['html', { outputFolder: `${outputDir}/report`, open: 'on-failure' }],
    ['list']
  ],

  // Configuração global de Setup (Autologin)
  globalSetup: './qa-automation/utils/global-setup.ts',

  use: {
    // URL Base da aplicação rodando localmente
    baseURL: process.env.QA_BASE_URL || 'https://homolog-app.marshalltds.com/',

    // Caminho para carregar/salvar o estado da sessão (Login reutilizável)
    storageState: './qa-automation/utils/storageState.json',

    // Coleta de Trace apenas na primeira falha (ajuda no debug sem pesar tanto)
    trace: 'on-first-retry',
    
    // Screenshots apenas em falhas
    screenshot: 'only-on-failure',
    
    // Vídeo retido em falhas (bom para entender o que aconteceu)
    video: 'retain-on-failure',

    // Ignora erros de SSL em ambiente local
    ignoreHTTPSErrors: true,
  },

  // Configuração de Projetos (Navagadores)
  projects: [
    {
      name: 'Chromium (Google Chrome)',
      use: { 
        ...devices['Desktop Chrome'],
        // Modo Headless (sem abrir navegador) para execução rápida
        headless: true,
      },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'], headless: true }, // Outros rodar headless pra não abrir mil janelas
    },
    {
      name: 'WebKit (Safari)',
      use: { ...devices['Desktop Safari'], headless: true },
    },
  ],

  /* Configuração do Servidor Web
   * Se a app não estiver rodando, o Playwright tenta subir.
   * Reuse: true -> Se já estiver rodando (dx comum), usa ela. 
   */
  /* webServer removido para testes em homolog */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
});
