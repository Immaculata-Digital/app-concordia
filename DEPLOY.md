# 🚀 Guia de Deploy - App ERP

Este guia fornece instruções passo a passo para configurar o deploy automático do App ERP (React/Vite) no servidor VPS da Hostinger usando Docker e GitHub Actions.

## 🖥️ Informações do Servidor

- **IP do Servidor**: `72.61.223.230`
- **Servidor**: VPS Hostinger
- **Porta Homologação**: `5173`
- **Porta Produção**: `3173`

## 📋 Pré-requisitos

- Servidor VPS da Hostinger com acesso SSH
- Conta no GitHub com acesso ao repositório
- Docker e Docker Compose instalados no servidor
- Git instalado no servidor

## 🏗️ Estrutura de Deploy

- **Homologação**: Porta `5173` (branch `homolog`)
- **Produção**: Porta `3173` (branch `main`)

Cada ambiente roda em um container Docker separado com Nginx servindo os arquivos estáticos.

---

## 📝 Passo 1: Configuração Inicial no Servidor VPS

### 1.1 Conectar ao servidor VPS

```bash
ssh seu-usuario@72.61.223.230
# Exemplo: ssh root@72.61.223.230
```

### 1.2 Executar script de configuração inicial

```bash
# Fazer upload do script setup-server.sh para o servidor ou criar manualmente
# Depois executar:
chmod +x setup-server.sh
./setup-server.sh
```

**OU** instalar manualmente:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Git (se necessário)
sudo apt-get update
sudo apt-get install -y git
```

### 1.3 Criar diretório do projeto

```bash
sudo mkdir -p /var/www/app-erp
sudo chown $USER:$USER /var/www/app-erp
cd /var/www/app-erp
```

### 1.4 Clonar o repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git .
# OU se já existe:
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git fetch origin
git checkout -b homolog origin/homolog
```

---

## 🔐 Passo 2: Configurar GitHub Actions Secrets

As variáveis de ambiente serão configuradas como **Secrets** no GitHub Actions.

### 2.1 Acessar configurações de Secrets

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret** para cada variável abaixo

### 2.2 Adicionar as seguintes Secrets:

Configure as seguintes secrets no GitHub Actions:

#### Secrets de Infraestrutura:
- `VPS_SSH_PRIVATE_KEY` - Chave SSH privada para acesso ao servidor (veja **Passo 3** para instruções detalhadas de como gerar)
- `VPS_HOST` - `72.61.223.230`
- `VPS_USER` - Usuário SSH do servidor (ex: `root`)
- `VPS_DEPLOY_PATH` - `/var/www/app-erp`

#### Secrets de APIs (separadas por ambiente):
- `VITE_API_USUARIOS_BASE_URL_HOMOLOG` - URL da API de usuários para homologação (ex: `https://homolog-api-usuarios.marshalltds.com/api`)
- `VITE_API_USUARIOS_BASE_URL_MAIN` - URL da API de usuários para produção (ex: `https://api-usuarios.marshalltds.com/api`)
- `VITE_API_CLIENTES_BASE_URL_HOMOLOG` - URL da API de clientes para homologação (ex: `https://homolog-api-clientes.marshalltds.com/api`)
- `VITE_API_CLIENTES_BASE_URL_MAIN` - URL da API de clientes para produção (ex: `https://api-clientes.marshalltds.com/api`)
- `VITE_API_COMUNICACOES_BASE_URL_HOMOLOG` - URL da API de comunicações para homologação (ex: `https://homolog-api-comunicacoes.marshalltds.com/api`)
- `VITE_API_COMUNICACOES_BASE_URL_MAIN` - URL da API de comunicações para produção (ex: `https://api-comunicacoes.marshalltds.com/api`)
- `VITE_API_CONTRATOS_BASE_URL_HOMOLOG` - URL da API de contratos para homologação (ex: `https://homolog-api-contratos.marshalltds.com/api`)
- `VITE_API_CONTRATOS_BASE_URL_MAIN` - URL da API de contratos para produção (ex: `https://api-contratos.marshalltds.com/api`)
- `VITE_API_PESSOAS_BASE_URL_HOMOLOG` - URL da API de pessoas para homologação (ex: `https://homolog-api-pessoas.marshalltds.com/api`)
- `VITE_API_PESSOAS_BASE_URL_MAIN` - URL da API de pessoas para produção (ex: `https://api-pessoas.marshalltds.com/api`)
- `VITE_API_CONTATOS_BASE_URL_HOMOLOG` - URL da API de contatos para homologação (ex: `https://homolog-api-contatos.marshalltds.com/api`)
- `VITE_API_CONTATOS_BASE_URL_MAIN` - URL da API de contatos para produção (ex: `https://api-contatos.marshalltds.com/api`)

**⚠️ IMPORTANTE**: 
- Todas essas secrets serão usadas automaticamente pelo GitHub Actions durante o deploy
- As variáveis de ambiente são injetadas no build time do Vite
- Não é necessário criar arquivo `.env` no servidor
- Cada ambiente (homolog/main) terá suas próprias URLs configuradas

---

## 🔑 Passo 3: Gerar e Configurar Chave SSH

### 3.1 Conectar ao servidor VPS

Primeiro, conecte-se ao servidor usando suas credenciais:

```bash
ssh seu-usuario@72.61.223.230
```

**Nota**: Se você ainda não tem acesso SSH configurado, use as credenciais fornecidas pela Hostinger (geralmente via painel de controle ou email de boas-vindas).

### 3.2 Gerar chave SSH para deploy

Uma vez conectado ao servidor, execute os seguintes comandos:

```bash
# Gerar uma nova chave SSH específica para o GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Quando solicitado, pressione ENTER para usar a senha padrão (vazio)
# Ou defina uma senha se preferir maior segurança
```

**Importante**: Pressione ENTER quando solicitado a inserir uma passphrase (senha), ou defina uma senha se preferir. Para deploy automatizado, geralmente é melhor deixar sem senha.

### 3.3 Adicionar chave pública ao authorized_keys

Adicione a chave pública ao arquivo `authorized_keys` para permitir o acesso:

```bash
# Adicionar a chave pública ao authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Garantir permissões corretas
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3.4 Obter a chave privada

Agora você precisa copiar a chave **privada** completa. Execute:

```bash
# Exibir a chave privada completa
cat ~/.ssh/github_actions_deploy
```

Você verá algo como:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD...
(muitas linhas de caracteres)
...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ IMPORTANTE**: 
- Copie **TUDO**, incluindo as linhas `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`
- Esta é uma informação sensível - mantenha-a segura
- Você precisará desta chave completa no próximo passo

### 3.5 Alternativa: Usar chave SSH existente

Se você já tem uma chave SSH configurada no servidor e deseja usá-la:

```bash
# Verificar chaves SSH existentes
ls -la ~/.ssh/

# Se você já tem uma chave (ex: id_rsa, id_ed25519), pode usar ela:
cat ~/.ssh/id_ed25519
# OU
cat ~/.ssh/id_rsa
```

**Nota**: Se usar uma chave existente, certifique-se de que a chave pública correspondente já está em `~/.ssh/authorized_keys`.

### 3.6 Adicionar chave SSH como Secret no GitHub

Agora você precisa adicionar a chave privada como uma secret no GitHub Actions:

1. **Acesse seu repositório no GitHub**
   - Vá para: `https://github.com/seu-usuario/seu-repositorio`

2. **Navegue até as configurações de Secrets**
   - Clique em **Settings** (no topo do repositório)
   - No menu lateral esquerdo, clique em **Secrets and variables**
   - Clique em **Actions**

3. **Criar nova secret**
   - Clique no botão **New repository secret**
   - **Name**: Digite exatamente `VPS_SSH_PRIVATE_KEY`
   - **Secret**: Cole a chave privada completa que você copiou no passo 3.4
     - Certifique-se de incluir as linhas `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`
     - Cole tudo em uma única linha ou mantenha a formatação original
   - Clique em **Add secret**

4. **Verificar**
   - Você deve ver `VPS_SSH_PRIVATE_KEY` na lista de secrets
   - O valor não será exibido por segurança (mostra apenas `••••••••`)

**Nota**: As outras secrets (VPS_HOST, VPS_USER, VPS_DEPLOY_PATH) devem ser configuradas no **Passo 2.2** acima.

---

## 🐳 Passo 4: Testar Deploy Manual (Opcional)

Antes de configurar o deploy automático, teste manualmente:

**Importante**: Para deploy manual, você precisa exportar as variáveis de ambiente antes de executar:

```bash
cd /var/www/app-erp

# Para homologação - exportar variáveis primeiro
export VITE_API_USUARIOS_BASE_URL_HOMOLOG="https://homolog-api-usuarios.marshalltds.com/api"
export VITE_API_CLIENTES_BASE_URL_HOMOLOG="https://homolog-api-clientes.marshalltds.com/api"
export VITE_API_COMUNICACOES_BASE_URL_HOMOLOG="https://homolog-api-comunicacoes.marshalltds.com/api"
export VITE_API_CONTRATOS_BASE_URL_HOMOLOG="https://homolog-api-contratos.marshalltds.com/api"
export VITE_API_PESSOAS_BASE_URL_HOMOLOG="https://homolog-api-pessoas.marshalltds.com/api"
export VITE_API_CONTATOS_BASE_URL_HOMOLOG="https://homolog-api-contatos.marshalltds.com/api"
./scripts/deploy.sh homolog

# Para produção - exportar variáveis primeiro
export VITE_API_USUARIOS_BASE_URL_MAIN="https://api-usuarios.marshalltds.com/api"
export VITE_API_CLIENTES_BASE_URL_MAIN="https://api-clientes.marshalltds.com/api"
export VITE_API_COMUNICACOES_BASE_URL_MAIN="https://api-comunicacoes.marshalltds.com/api"
export VITE_API_CONTRATOS_BASE_URL_MAIN="https://api-contratos.marshalltds.com/api"
export VITE_API_PESSOAS_BASE_URL_MAIN="https://api-pessoas.marshalltds.com/api"
export VITE_API_CONTATOS_BASE_URL_MAIN="https://api-contatos.marshalltds.com/api"
./scripts/deploy.sh main
```

Ou manualmente:

```bash
# Para homologação
export VITE_API_USUARIOS_BASE_URL_HOMOLOG="https://homolog-api-usuarios.marshalltds.com/api"
export VITE_API_CLIENTES_BASE_URL_HOMOLOG="https://homolog-api-clientes.marshalltds.com/api"
export VITE_API_COMUNICACOES_BASE_URL_HOMOLOG="https://homolog-api-comunicacoes.marshalltds.com/api"
export VITE_API_CONTRATOS_BASE_URL_HOMOLOG="https://homolog-api-contratos.marshalltds.com/api"
export VITE_API_PESSOAS_BASE_URL_HOMOLOG="https://homolog-api-pessoas.marshalltds.com/api"
export VITE_API_CONTATOS_BASE_URL_HOMOLOG="https://homolog-api-contatos.marshalltds.com/api"
git checkout homolog
git pull origin homolog
docker-compose build app-erp-homolog
docker-compose up -d app-erp-homolog

# Para produção
export VITE_API_USUARIOS_BASE_URL_MAIN="https://api-usuarios.marshalltds.com/api"
export VITE_API_CLIENTES_BASE_URL_MAIN="https://api-clientes.marshalltds.com/api"
export VITE_API_COMUNICACOES_BASE_URL_MAIN="https://api-comunicacoes.marshalltds.com/api"
export VITE_API_CONTRATOS_BASE_URL_MAIN="https://api-contratos.marshalltds.com/api"
export VITE_API_PESSOAS_BASE_URL_MAIN="https://api-pessoas.marshalltds.com/api"
export VITE_API_CONTATOS_BASE_URL_MAIN="https://api-contatos.marshalltds.com/api"
git checkout main
git pull origin main
docker-compose build app-erp-main
docker-compose up -d app-erp-main
```

### Verificar se os containers estão rodando:

```bash
docker-compose ps
docker-compose logs app-erp-homolog
docker-compose logs app-erp-main
```

### Testar a aplicação:

```bash
# Homologação
curl http://localhost:5173/health

# Produção
curl http://localhost:3173/health
```

---

## ⚙️ Passo 5: Configurar Deploy Automático

### 5.1 Fazer commit e push dos arquivos de configuração

```bash
# No seu ambiente local
cd app-erp

git add .
git commit -m "ci: adiciona configuração de deploy com Docker e GitHub Actions"
git push origin homolog
```

### 5.2 Verificar o workflow no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Actions**
3. Você verá o workflow "Deploy App ERP - Homologação" sendo executado
4. Clique para ver os logs em tempo real

### 5.3 Deploy automático

Agora, sempre que você fizer push para a branch `homolog`, o deploy será executado automaticamente!

Para a branch `main`, o deploy também será automático quando houver push.

---

## 🔍 Passo 6: Verificar e Monitorar

### 6.1 Verificar status dos containers

```bash
ssh seu-usuario@72.61.223.230
cd /var/www/app-erp
docker-compose ps
```

### 6.2 Ver logs

```bash
# Logs de homologação
docker-compose logs -f app-erp-homolog

# Logs de produção
docker-compose logs -f app-erp-main
```

### 6.3 Verificar saúde da aplicação

```bash
# Homologação
curl http://localhost:5173/health

# Produção
curl http://localhost:3173/health
```

---

## 🛠️ Comandos Úteis

### Parar containers

```bash
docker-compose stop app-erp-homolog
docker-compose stop app-erp-main
```

### Reiniciar containers

```bash
docker-compose restart app-erp-homolog
docker-compose restart app-erp-main
```

### Rebuild completo

```bash
docker-compose build --no-cache app-erp-homolog
docker-compose up -d app-erp-homolog
```

### Limpar recursos não utilizados

```bash
docker system prune -a
```

### Ver uso de recursos

```bash
docker stats
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app-erp-homolog

# Verificar configuração
docker-compose config
```

### Erro no build

- Verifique se o `package.json` está correto
- Verifique se todas as dependências estão instaladas
- Verifique os logs do build: `docker-compose build app-erp-homolog`

### Porta já em uso

```bash
# Verificar qual processo está usando a porta
sudo lsof -i :5173
sudo lsof -i :3173

# Parar o processo ou mudar a porta no docker-compose.yml
```

### Erro no GitHub Actions

- Verifique se todas as secrets estão configuradas corretamente
- Verifique se a chave SSH está correta e tem permissões adequadas
- Verifique os logs do workflow no GitHub Actions

### Container para após iniciar

```bash
# Ver logs para identificar o erro
docker-compose logs app-erp-homolog

# Verificar healthcheck
docker inspect app-erp-homolog | grep -A 10 Health
```

---

## 📚 Estrutura de Arquivos Criados

```
app-erp/
├── Dockerfile                    # Imagem Docker da aplicação (build + Nginx)
├── nginx.conf                    # Configuração do Nginx
├── docker-compose.yml            # Orquestração dos containers
├── .dockerignore                # Arquivos ignorados no build
├── .github/
│   └── workflows/
│       ├── deploy-homolog.yml   # Workflow para branch homolog
│       └── deploy-main.yml      # Workflow para branch main
├── scripts/
│   ├── deploy.sh                # Script de deploy manual
│   ├── setup-server.sh          # Script de configuração inicial
│   └── setup-nginx-ssl.sh       # Script de configuração Nginx e SSL
├── DEPLOY.md                    # Esta documentação
└── NGINX_SSL_SETUP.md           # Tutorial de configuração Nginx e SSL
```

---

## ✅ Checklist de Deploy

- [ ] Docker e Docker Compose instalados no servidor
- [ ] Repositório clonado no servidor
- [ ] Secrets configuradas no GitHub
- [ ] Chave SSH configurada e testada
- [ ] Deploy manual testado com sucesso
- [ ] Containers rodando e acessíveis
- [ ] GitHub Actions workflow funcionando
- [ ] Healthcheck respondendo corretamente

---

## 🎉 Pronto!

Agora você tem um sistema de deploy automatizado configurado! 

- Push para `homolog` → Deploy automático na porta 5173
- Push para `main` → Deploy automático na porta 3173

Para dúvidas ou problemas, consulte a seção de Troubleshooting acima.

