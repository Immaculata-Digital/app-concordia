# 🧪 Automação de QA (Playwright)

Bem-vindo ao ambiente de testes automatizados do projeto ERP. Este ambiente foi desenhado para ser **100% local e independente**, priorizando a experiência do desenvolvedor/QA.

## 🚀 Como Começar (Setup Rápido)

1.  **Instale as dependências** do projeto (se ainda não fez):
    ```bash
    npm install
    ```

2.  **Instale os navegadores** do Playwright:
    ```bash
    npx playwright install
    ```

3.  **Inicie o servidor de desenvolvimento** (em um terminal separado):
    ```bash
    npm run dev
    ```

---

## 🔑 Configuração de Ambiente (`.env`)

Para que os testes funcionem corretamente (Autologin e API Real), seu arquivo `.env` na raiz deve conter:

```properties
# ============================================
# Credenciais para Autologin (QA Automation)
# ============================================
QA_USER=seu_email@exemplo.com
QA_PASSWORD=sua_senha

# ============================================
# URLs das APIs (Use as de Homologação)
# ============================================
VITE_API_USUARIOS_BASE_URL=https://homolog-api-usuarios.marshalltds.com/api
VITE_API_PESSOAS_BASE_URL=https://homolog-api-pessoas.marshalltds.com/api
# ... (demais APIs conforme projeto)
```

---

## 🎮 Comandos do Dia a Dia

Aqui estão os atalhos criados para facilitar sua vida. Rode-os no terminal:

| Comando | O que faz? | Quando usar? |
| :--- | :--- | :--- |
| `npm run test:ui` | **Abre o Modo Interativo** (Recomendado) | Para rodar testes visualmente, ver o navegador, e debugar com "Time Travel". |
| `npm run test:gen` | **Gerador de Código** | Para gravar suas ações no site e gerar código de teste automaticamente. |
| `npm run test:debug` | **Modo Debug Passo a Passo** | Quando um teste falha e você precisa inspecionar linha por linha. |
| `npm run test:report` | **Ver Relatório** | Abre o HTML do último teste executado. |

---

## 📂 Estrutura do Projeto (`/qa-automation`)

Seguimos o padrão **Page Object Model (POM)** para organização:

-   **`pages/`**: Onde "escondemos" os seletores feios.
    -   `BasePage.ts`: Comandos comuns a todas as páginas.
    -   `LoginPage.ts`: Ações específicas da tela de login.
-   **`tests/`**: Onde ficam os arquivos `.spec.ts` (os testes de fato).
    -   Devem ser legíveis e focar em "O QUE" está sendo testado, não "COMO".
-   **`fixtures/`** (Futuro): Para massas de dados.
-   **`utils/`** (Futuro): Funções auxiliares.

## 💡 Dicas de Arquitetura

1.  **Navegador Visível**: Por padrão, o Chrome abre na sua tela (`headless: false`) com um leve delay (`slowMo: 50`) para você conseguir acompanhar.
2.  **API Real**: Os testes utilizam a API real configurada no `.env` (ex: `VITE_API_USUARIOS_BASE_URL`). Certifique-se que o backend está rodando!
3.  **Independência**: Rode seus testes à vontade. Eles não rodam no `pre-commit` nem no CI/CD do time de dev.

Happy Testing! 🕵️‍♂️ bug hunter

---

## 🤖 Contexto para I.A. (Copie e Cole)

Caso utilize um Agent de I.A. para criar novos testes, forneça o seguinte contexto:

```markdown
Role: Você é um Especialista em Automação de Testes com foco em Playwright e TypeScript. Sua missão é auxiliar o Q.A. a criar testes robustos, escaláveis e legíveis para o sistema ERP, seguindo rigorosamente a arquitetura Page Object Model (POM).

Core Principles:

Isolamento Local: Os testes são executados apenas localmente. Nunca sugira integrações com CI/CD ou Git Hooks, a menos que solicitado explicitamente.

Clean Architecture (POM):

Pages: Devem conter apenas seletores (locators) e métodos de ação (ex: preencherLogin, clicarBotaoSalvar).

Tests (.spec.ts): Devem conter apenas o fluxo de negócio e as asserções (expect). Devem ser legíveis como um manual de usuário.

Código Verboso e Semântico: Prefira nomes de métodos longos e descritivos (ex: aguardarCarregamentoDaTabelaDeUsuarios) em vez de nomes genéricos.

SOLID: Aplique o princípio da responsabilidade única. Uma Page representa uma tela ou um componente complexo.

Diretrizes de Implementação:

Diretório Raiz: Todo o código deve residir em /qa-automation.

BasePage: Sempre herde de uma BasePage que contém helpers comuns (waiters, logs, screenshot helpers).

Environment: Utilize process.env.QA_USER e process.env.QA_PASSWORD para autenticação.

Estilo de Código: Utilize TypeScript estrito. Use async/await em todas as interações.

Fluxo de Trabalho Sugerido para o Usuário:

Se o usuário quiser criar um novo teste, peça para ele descrever o fluxo ou colar o output do npx playwright codegen.

Gere primeiro a Page Object necessária em /qa-automation/pages/.

Gere o arquivo de teste em /qa-automation/tests/ utilizando a Page criada.

Explique como o Q.A. deve rodar o teste usando npm run test:ui.

Exemplo de Padrão de Escrita (Output Esperado): Ao gerar um teste, siga este padrão de verbosidade:

TypeScript

// Exemplo de como você deve escrever para o QA entender
test('Deve realizar login com sucesso e visualizar o dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navegarParaPaginaDeLogin();
  await loginPage.realizarLoginComCredenciaisDoEnv();
  
  await expect(page).toHaveURL(/.*dashboard/);
});
```
