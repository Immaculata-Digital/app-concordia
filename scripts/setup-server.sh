#!/bin/bash

# Script de configuração inicial do servidor VPS
# Execute este script uma vez no servidor para configurar o ambiente

set -e

echo "🔧 Configurando servidor VPS para deploy do App ERP..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
  echo "📦 Instalando Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo "✅ Docker instalado"
else
  echo "✅ Docker já está instalado"
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
  echo "📦 Instalando Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo "✅ Docker Compose instalado"
else
  echo "✅ Docker Compose já está instalado"
fi

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
  echo "📦 Instalando Git..."
  sudo apt-get update
  sudo apt-get install -y git
  echo "✅ Git instalado"
else
  echo "✅ Git já está instalado"
fi

# Criar diretório do projeto (ajuste o caminho conforme necessário)
PROJECT_DIR="/var/www/app-erp"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "📁 Criando diretório do projeto..."
  sudo mkdir -p "$PROJECT_DIR"
  sudo chown $USER:$USER "$PROJECT_DIR"
  echo "✅ Diretório criado: $PROJECT_DIR"
else
  echo "✅ Diretório já existe: $PROJECT_DIR"
fi

echo ""
echo "✅ Configuração inicial concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Clone o repositório em $PROJECT_DIR"
echo "2. Configure as secrets no GitHub Actions"
echo "3. Faça push para a branch homolog para iniciar o deploy automático"

