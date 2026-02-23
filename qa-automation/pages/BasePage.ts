import type { Page, Locator } from '@playwright/test';

/**
 * BasePage: Classe abstrata que contém métodos e propriedades comuns a todas as páginas.
 * Implementa princípios de SOLID (Single Responsibility) encapsulando lógica de baixo nível.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navega para uma URL relativa
   * @param path Caminho da URL (ex: /login)
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Aguarda um elemento estar visível na tela
   * @param selector Seletor ou Locator do elemento
   * @param timeout Tempo máximo de espera em ms (padrão: 10000ms)
   */
  async waitForElementVisible(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Tira um screenshot da página atual para debug
   * @param name Nome do arquivo
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `qa-automation/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Método auxiliar para logar ações (facilita debug no console)
   * @param message Mensagem de log
   */
  protected log(message: string): void {
    console.log(`[PAGE ACTION]: ${message}`);
  }
}
