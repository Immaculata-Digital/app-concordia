#!/bin/bash

# Script para configurar Nginx como proxy reverso e SSL com Certbot
# Uso: ./scripts/setup-nginx-ssl.sh [homolog|main]

set -e

ENVIRONMENT=${1:-homolog}
DOMAIN=""
PORT=""

if [ "$ENVIRONMENT" == "homolog" ]; then
  DOMAIN="homolog-app.marshalltds.com"
  PORT="5173"
elif [ "$ENVIRONMENT" == "main" ]; then
  DOMAIN="app.marshalltds.com"
  PORT="3173"
else
  echo "❌ Ambiente inválido. Use 'homolog' ou 'main'"
  exit 1
fi

echo "🚀 Configurando Nginx e SSL para $DOMAIN (porta $PORT)"

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  Este script precisa ser executado com sudo"
  echo "   Execute: sudo ./scripts/setup-nginx-ssl.sh $ENVIRONMENT"
  exit 1
fi

# Instalar Nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
  echo "📦 Instalando Nginx..."
  apt-get update
  apt-get install -y nginx
  echo "✅ Nginx instalado"
else
  echo "✅ Nginx já está instalado"
fi

# Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
  echo "📦 Instalando Certbot..."
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
  echo "✅ Certbot instalado"
else
  echo "✅ Certbot já está instalado"
fi

# Criar diretório de configuração do Nginx se não existir
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
mkdir -p "$NGINX_SITES_DIR"
mkdir -p "$NGINX_ENABLED_DIR"

# Criar configuração do Nginx
CONFIG_FILE="$NGINX_SITES_DIR/$DOMAIN"
echo "📝 Criando configuração do Nginx em $CONFIG_FILE"

cat > "$CONFIG_FILE" << EOF
# Configuração para $DOMAIN
# Proxy reverso para App ERP ($ENVIRONMENT)

server {
    listen 80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;

    # Tamanho máximo do body (para uploads)
    client_max_body_size 1024M;

    # Proxy reverso para o container Docker
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        
        # Headers importantes
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$PORT/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }
}
EOF

echo "✅ Configuração do Nginx criada"

# Criar link simbólico se não existir
if [ ! -L "$NGINX_ENABLED_DIR/$DOMAIN" ]; then
  echo "🔗 Criando link simbólico..."
  ln -s "$CONFIG_FILE" "$NGINX_ENABLED_DIR/$DOMAIN"
  echo "✅ Link simbólico criado"
else
  echo "✅ Link simbólico já existe"
fi

# Remover configuração padrão do Nginx se existir
if [ -L "$NGINX_ENABLED_DIR/default" ]; then
  echo "🗑️  Removendo configuração padrão do Nginx..."
  rm "$NGINX_ENABLED_DIR/default"
  echo "✅ Configuração padrão removida"
fi

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
  echo "✅ Configuração do Nginx está válida"
else
  echo "❌ Erro na configuração do Nginx"
  exit 1
fi

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
systemctl reload nginx || systemctl restart nginx
echo "✅ Nginx recarregado"

# Verificar se o container está rodando
echo "🔍 Verificando se o container está rodando na porta $PORT..."
if ! curl -s http://localhost:$PORT/health > /dev/null; then
  echo "⚠️  AVISO: O container não está respondendo na porta $PORT"
  echo "   Certifique-se de que o container está rodando antes de continuar"
  echo "   Execute: docker-compose ps"
  read -p "   Deseja continuar mesmo assim? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
else
  echo "✅ Container está respondendo corretamente"
fi

# Configurar SSL com Certbot
echo ""
echo "🔒 Configurando SSL com Certbot..."
echo "   Certifique-se de que o DNS está apontando para este servidor antes de continuar"
read -p "   O DNS já está configurado? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "⏸️  Configure o DNS primeiro e execute este script novamente"
  exit 0
fi

# Solicitar email para o Certbot
echo ""
read -p "📧 Digite seu email para notificações do Let's Encrypt: " CERTBOT_EMAIL
if [ -z "$CERTBOT_EMAIL" ]; then
  echo "❌ Email é obrigatório"
  exit 1
fi

# Executar Certbot
echo "🔐 Executando Certbot para obter certificado SSL..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$CERTBOT_EMAIL" --redirect

if [ $? -eq 0 ]; then
  echo "✅ Certificado SSL configurado com sucesso!"
  echo ""
  echo "🎉 Configuração concluída!"
  echo ""
  echo "📋 Próximos passos:"
  echo "   1. Teste o acesso: https://$DOMAIN"
  echo "   2. O certificado será renovado automaticamente pelo Certbot"
  echo "   3. Para verificar a renovação: certbot renew --dry-run"
else
  echo "❌ Erro ao configurar SSL"
  echo "   Verifique se:"
  echo "   - O DNS está apontando corretamente para este servidor"
  echo "   - A porta 80 está aberta no firewall"
  echo "   - O Nginx está rodando corretamente"
  exit 1
fi

