# Dockerfile para App ERP (React/Vite)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação com variáveis de ambiente
ARG VITE_API_USUARIOS_BASE_URL
ARG VITE_API_CLIENTES_BASE_URL
ARG VITE_API_COMUNICACOES_BASE_URL
ARG VITE_API_CONTRATOS_BASE_URL
ARG VITE_API_PESSOAS_BASE_URL
ARG VITE_API_CONTATOS_BASE_URL
ARG VITE_API_RELATORIOS_BASE_URL
ARG VITE_WS_SERVICE_BASE_URL
ENV VITE_API_USUARIOS_BASE_URL=$VITE_API_USUARIOS_BASE_URL
ENV VITE_API_CLIENTES_BASE_URL=$VITE_API_CLIENTES_BASE_URL
ENV VITE_API_COMUNICACOES_BASE_URL=$VITE_API_COMUNICACOES_BASE_URL
ENV VITE_API_CONTRATOS_BASE_URL=$VITE_API_CONTRATOS_BASE_URL
ENV VITE_API_PESSOAS_BASE_URL=$VITE_API_PESSOAS_BASE_URL
ENV VITE_API_CONTATOS_BASE_URL=$VITE_API_CONTATOS_BASE_URL
ENV VITE_API_RELATORIOS_BASE_URL=$VITE_API_RELATORIOS_BASE_URL
ENV VITE_WS_SERVICE_BASE_URL=$VITE_WS_SERVICE_BASE_URL

RUN npm run build

# Stage de produção com Nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

