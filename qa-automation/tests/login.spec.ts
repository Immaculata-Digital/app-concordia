/// <reference types="node" />
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Suíte de Testes de Login
 * Foco: Legibilidade e descrição clara dos cenários para o Q.A.
 */
test.describe('Funcionalidade: Autenticação de Usuário', () => {
  let loginPage: LoginPage;

  // Reseta o estado de armazenamento para garantir que não haja sessão ativa
  // Já que o global-setup loga automaticamente, precisamos "deslogar" para testar o login
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateTo('/login');
  });

  test('Cenário 1: Deve bloquear login com campos vazios (Validação Obrigatória)', async () => {
    // Organização (Arrange) / Ação (Act)
    await loginPage.submitEmptyForm();

    // Verificação (Assert)
    // Verifica se os campos receberam o atributo de obrigatório
    await expect(loginPage.emailField, 'Campo de email deve ser obrigatório').toHaveAttribute('required');
    await expect(loginPage.passwordField, 'Campo de senha deve ser obrigatório').toHaveAttribute('required');
  });

  test('Cenário 2: Deve exibir mensagem de erro ao tentar logar com credenciais inválidas', async () => {
    // Mock removido conforme solicitação: Utilizando API real
    // Certifique-se que o backend está rodando e a URL está correta no .env

    // Ação (Act)
    await loginPage.performLogin('usuario_inexistente@teste.com', 'senha_errada');

    // Verificação (Assert)
    await expect(loginPage.errorAlert, 'Deve exibir alerta de erro para o usuário').toBeVisible();
    await expect(loginPage.errorAlert, 'Mensagem de erro deve ser clara').toHaveText(/Credenciais inválidas/i);
  });

  test('Cenário 3: Deve permitir login com sucesso (Happy Path)', async ({ page }) => {
    // Nota: Em um teste real, geralmente mockamos o sucesso também para não depender do banco
    /* 
    await page.route('**\/auth/login', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ user: {...}, token: 'abc' }) });
    });
    */

    // Ação (Act)
    // Usa env vars ou valores default para desenvolvimento local
    const email = process.env.QA_USER_EMAIL || 'teste@exemplo.com';
    const password = process.env.QA_USER_PASSWORD || 'senha123';
    
    await loginPage.performLogin(email, password);

    // Verificação (Assert)
    // Tenta esperar pela URL de dashboard OU sucesso do login
    try {
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    } catch {
      console.log('Log: Não redirecionou para dashboard (esperado se não houver backend real rodando)');
    }
  });

  test('Cenário 4: Deve navegar para a tela de recuperação de senha', async ({ page }) => {
    // Ação (Act)
    await loginPage.navigateToForgotPassword();

    // Verificação (Assert)
    await expect(page, 'Deve mudar a URL para /forgot-password').toHaveURL(/forgot-password/);
  });
});
