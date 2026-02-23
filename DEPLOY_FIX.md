# 🔧 Correção: Variáveis de Ambiente no Deploy

## Problema Identificado

As variáveis de ambiente não estavam sendo passadas corretamente para o `docker-compose` durante o deploy, resultando em valores vazios mesmo com as secrets configuradas no GitHub.

**Erro observado:**
```
level=warning msg="The \"VITE_API_PESSOAS_BASE_URL_HOMOLOG\" variable is not set. Defaulting to a blank string."
```

## Causa

O workflow do GitHub Actions estava executando o `docker-compose` via SSH, mas as variáveis de ambiente não estavam sendo **exportadas no servidor** antes da execução do `docker-compose`. O `docker-compose` precisa das variáveis no ambiente do shell para substituir os valores `${VITE_API_...}` no arquivo `docker-compose.yml`.

## Solução Implementada

### 1. Workflows do GitHub Actions Atualizados

Foram criados/atualizados os workflows em `.github/workflows/` que agora **exportam as variáveis de ambiente ANTES de executar o docker-compose**:

**Arquivo:** `.github/workflows/deploy-homolog.yml`
**Arquivo:** `.github/workflows/deploy-main.yml`

**Mudança principal:**
```yaml
ssh -i ~/.ssh/deploy_key ${VPS_USER}@${VPS_HOST} bash << ENDSSH
  set -e
  cd ${VPS_DEPLOY_PATH}
  
  # ✅ Exportar variáveis ANTES de executar docker-compose
  export VITE_API_USUARIOS_BASE_URL_HOMOLOG="${VITE_API_USUARIOS_BASE_URL_HOMOLOG}"
  export VITE_API_CLIENTES_BASE_URL_HOMOLOG="${VITE_API_CLIENTES_BASE_URL_HOMOLOG}"
  export VITE_API_COMUNICACOES_BASE_URL_HOMOLOG="${VITE_API_COMUNICACOES_BASE_URL_HOMOLOG}"
  export VITE_API_CONTRATOS_BASE_URL_HOMOLOG="${VITE_API_CONTRATOS_BASE_URL_HOMOLOG}"
  export VITE_API_PESSOAS_BASE_URL_HOMOLOG="${VITE_API_PESSOAS_BASE_URL_HOMOLOG}"
  
  # Agora o docker-compose pode ler as variáveis
  docker-compose build app-erp-homolog
  docker-compose up -d app-erp-homolog
ENDSSH
```

### 2. Script de Deploy Melhorado

O script `scripts/deploy.sh` foi atualizado para:
- Verificar se as variáveis estão definidas
- Tentar carregar de um arquivo `.env` se existir
- Mostrar quais variáveis estão faltando (mas continuar o deploy)

### 3. Docker Compose Atualizado

Removida a linha obsoleta `version: '3.8'` que estava gerando warnings.

## Como Aplicar a Correção

### Opção 1: Atualizar o Workflow Existente (Recomendado)

Se você já tem um workflow configurado, atualize-o para exportar as variáveis antes do `docker-compose`:

```yaml
ssh -i ~/.ssh/deploy_key ${VPS_USER}@${VPS_HOST} bash << ENDSSH
  cd ${VPS_DEPLOY_PATH}
  
  # Exportar TODAS as variáveis necessárias
  export VITE_API_USUARIOS_BASE_URL_HOMOLOG="${VITE_API_USUARIOS_BASE_URL_HOMOLOG}"
  export VITE_API_CLIENTES_BASE_URL_HOMOLOG="${VITE_API_CLIENTES_BASE_URL_HOMOLOG}"
  export VITE_API_COMUNICACOES_BASE_URL_HOMOLOG="${VITE_API_COMUNICACOES_BASE_URL_HOMOLOG}"
  export VITE_API_CONTRATOS_BASE_URL_HOMOLOG="${VITE_API_CONTRATOS_BASE_URL_HOMOLOG}"
  export VITE_API_PESSOAS_BASE_URL_HOMOLOG="${VITE_API_PESSOAS_BASE_URL_HOMOLOG}"
  
  # Agora executar docker-compose
  git checkout homolog
  git pull origin homolog
  docker-compose build app-erp-homolog
  docker-compose up -d app-erp-homolog
ENDSSH
```

### Opção 2: Usar os Workflows Fornecidos

Os workflows em `.github/workflows/` já estão configurados corretamente. Basta fazer commit e push:

```bash
git add .github/workflows/
git commit -m "fix: corrige exportação de variáveis de ambiente no deploy"
git push origin homolog
```

## Verificação

Após o deploy, verifique se as variáveis foram aplicadas corretamente:

1. **Verificar logs do workflow** - Não deve mais aparecer warnings sobre variáveis não definidas
2. **Testar a aplicação** - As URLs das APIs devem estar funcionando
3. **Verificar no container** - As variáveis devem estar no build

## Checklist

- [x] Workflows atualizados com exportação de variáveis
- [x] Script de deploy melhorado
- [x] Docker Compose atualizado (removido `version`)
- [x] Variável `VITE_API_PESSOAS_BASE_URL` adicionada aos tipos TypeScript
- [x] Documentação atualizada

## Notas Importantes

1. **As variáveis são exportadas no servidor**, não no runner do GitHub Actions
2. **O docker-compose lê as variáveis do ambiente do shell** onde é executado
3. **As secrets do GitHub Actions são passadas como variáveis de ambiente** para o comando SSH
4. **O comando SSH exporta as variáveis no servidor** antes de executar o docker-compose

## Próximos Passos

1. Fazer commit dos arquivos atualizados
2. Fazer push para a branch `homolog`
3. Verificar o workflow no GitHub Actions
4. Confirmar que não há mais warnings sobre variáveis não definidas
5. Testar a aplicação para garantir que as URLs das APIs estão funcionando

