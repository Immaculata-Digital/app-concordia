#!/bin/bash

# Script de deploy manual para servidor VPS
# Uso: ./scripts/deploy.sh [homolog|main]
# 
# As variáveis de ambiente devem estar exportadas no shell ou
# o script tentará carregá-las de um arquivo .env se existir

set -e

ENVIRONMENT=${1:-homolog}
PROJECT_DIR="/var/www/app-erp"

if [ "$ENVIRONMENT" != "homolog" ] && [ "$ENVIRONMENT" != "main" ]; then
  echo "❌ Ambiente inválido. Use 'homolog' ou 'main'"
  exit 1
fi

echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"

cd "$PROJECT_DIR"

# Determinar branch e container baseado no ambiente
if [ "$ENVIRONMENT" == "homolog" ]; then
  BRANCH="homolog"
  CONTAINER="app-erp-homolog"
  ENV_SUFFIX="HOMOLOG"
else
  BRANCH="main"
  CONTAINER="app-erp-main"
  ENV_SUFFIX="MAIN"
fi

# Carregar variáveis de ambiente se arquivo .env existir
if [ -f "$PROJECT_DIR/.env" ]; then
  echo "📋 Carregando variáveis de ambiente do arquivo .env..."
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Exportar variáveis de ambiente necessárias para o docker-compose
# Verificar se as variáveis estão definidas e exportá-las
echo "🔧 Configurando variáveis de ambiente para $ENVIRONMENT..."

# Lista de variáveis necessárias
VARS=(
  "VITE_API_USUARIOS_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_CLIENTES_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_COMUNICACOES_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_CONTRATOS_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_PESSOAS_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_CONTATOS_BASE_URL_${ENV_SUFFIX}"
  "VITE_API_RELATORIOS_BASE_URL_${ENV_SUFFIX}"
)

# Verificar e exportar variáveis
MISSING_VARS=()
for VAR in "${VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    MISSING_VARS+=("$VAR")
  else
    export "$VAR"
    echo "  ✅ $VAR=${!VAR}"
  fi
done

# Se houver variáveis faltando, avisar mas continuar (pode estar vindo do GitHub Actions)
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "⚠️  Variáveis não definidas (podem estar vindo do GitHub Actions):"
  for VAR in "${MISSING_VARS[@]}"; do
    echo "    - $VAR"
  done
  echo "   Continuando o deploy... (docker-compose pode usar valores do ambiente do GitHub Actions)"
fi

# Fazer pull da branch
echo "📥 Fazendo pull da branch $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Parar container se estiver rodando
echo "🛑 Parando container $CONTAINER..."
docker-compose stop "$CONTAINER" || true
docker-compose rm -f "$CONTAINER" || true

# Rebuild e iniciar container
echo "🔨 Rebuild e iniciando container $CONTAINER..."
docker-compose build "$CONTAINER"
docker-compose up -d "$CONTAINER"

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

# Verificar status
echo "⏳ Aguardando container iniciar..."
sleep 5

echo "📊 Status do container:"
docker-compose ps "$CONTAINER"

echo "✅ Deploy concluído com sucesso para $ENVIRONMENT!"

