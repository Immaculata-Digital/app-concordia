import { chromium, type FullConfig } from '@playwright/test';


/**
 * Global Setup: Executado uma vez ANTES de todos os testes.
 * Objetivo: Realizar login e salvar o estado da sessão (cookies/tokens) para reutilização.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const username = process.env.QA_USER;
  const password = process.env.QA_PASSWORD;

  if (!username || !password) {
    console.warn('⚠️  Aviso: QA_USER ou QA_PASSWORD não definidos no .env. Pulei o autologin.');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔄 Autologin: Iniciando sessão global...');

  try {
    // 1. Acessa a página de login
    await page.goto(baseURL + '/login');

    // 2. Preenche credenciais (usando seletores diretos para ser self-contained)
    // Note: Poderíamos importar LoginPage, mas manter isolado aqui evita dependências circulares complexas
    await page.getByPlaceholder('Digite seu login ou e-mail').fill(username);
    await page.getByPlaceholder('Digite sua senha').fill(password);
    
    // 3. Clica em entrar
    await page.getByRole('button', { name: 'Entrar' }).click();

    // 4. Aguarda login com sucesso (URL muda ou elemento aparece)
    // Esperamos redirecionar para fora do login
    await page.waitForURL(/.*(dashboard|home|painel).*/, { timeout: 15000 });
    
    // 5. Salva o estado (cookies/storage) no arquivo definido no config
    if (storageState) {
        await page.context().storageState({ path: storageState as string });
        console.log('✅ Autologin: Sessão salva com sucesso!');
    }

  } catch (error) {
    console.error('❌ Autologin falhou:', error);
    // Não vamos lançar erro para não bloquear os testes, mas eles podem falhar se precisarem de login
  } finally {
    await browser.close();
  }
}

export default globalSetup;
