import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage: Responsável exclusivamente pelos elementos e ações da página de Login.
 * Herda de BasePage para reutilizar funcionalidades comuns.
 */
export class LoginPage extends BasePage {
  // Encapsulamento dos seletores (Locators)
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly forgotPasswordButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Inicialização dos locators usando melhores práticas (Role, Placeholder, etc)
    this.emailInput = page.getByPlaceholder('Digite seu login ou e-mail');
    this.passwordInput = page.getByPlaceholder('Digite sua senha');
    this.loginButton = page.getByRole('button', { name: 'Entrar' });
    this.forgotPasswordButton = page.getByRole('button', { name: 'Esqueci minha senha' });
    // Seletor genérico para alertas, permitindo flexibilidade na mensagem
    this.errorMessage = page.locator('[role="alert"], .MuiAlert-message');
  }

  /**
   * Ação de alto nível: Realizar Login
   * @param email Email ou usuário
   * @param password Senha
   */
  async performLogin(email: string, password: string): Promise<void> {
    this.log(`Iniciando login com usuário: ${email}`);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Ação: Apenas preencher o formulário (útil para testes de validação sem submit)
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    this.log(`Preenchendo credenciais: ${email} / ***`);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Ação: Tentar submeter o formulário vazio
   */
  async submitEmptyForm(): Promise<void> {
    this.log('Clicando em Entrar sem preencher campos');
    await this.loginButton.click();
  }

  /**
   * Ação: Navegar para recuperação de senha
   */
  async navigateToForgotPassword(): Promise<void> {
    this.log('Navegando para recuperação de senha');
    await this.forgotPasswordButton.click();
  }

  // Getters para asserções nos testes (Expose Locators safely)
  
  get errorAlert(): Locator {
    return this.errorMessage;
  }

  get emailField(): Locator {
    return this.emailInput;
  }

  get passwordField(): Locator {
    return this.passwordInput;
  }
  
  get loginBtn(): Locator {
    return this.loginButton;
  }
}
