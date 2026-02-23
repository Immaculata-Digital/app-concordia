# 🔒 Tutorial: Configurar Proxy Reverso com Nginx e SSL

Este tutorial explica como configurar o Nginx como proxy reverso para o App ERP com certificado SSL usando Let's Encrypt (Certbot).

## 📋 Pré-requisitos

- Servidor VPS com acesso root/sudo
- DNS configurado apontando para o servidor (registro A)
- Container Docker rodando na porta correta
- Portas 80 e 443 abertas no firewall

## 🎯 Domínios Configurados

- **Homologação**: `https://homolog-app.marshalltds.com` → Porta `5173`
- **Produção**: `https://app.marshalltds.com` → Porta `3173`

## 🚀 Passo a Passo

### 1. Conectar ao Servidor

```bash
ssh seu-usuario@72.61.223.230
```

### 2. Navegar para o Diretório do Projeto

```bash
cd /var/www/app-erp
```

### 3. Garantir que o Container Está Rodando

```bash
# Para homologação
docker-compose ps app-erp-homolog

# Para produção
docker-compose ps app-erp-main

# Se não estiver rodando, inicie:
docker-compose up -d app-erp-homolog
# ou
docker-compose up -d app-erp-main
```

### 4. Testar se a Aplicação Está Respondendo

```bash
# Homologação
curl http://localhost:5173/health

# Produção
curl http://localhost:3173/health
```

### 5. Executar o Script de Configuração

```bash
# Dar permissão de execução
chmod +x scripts/setup-nginx-ssl.sh

# Para homologação
sudo ./scripts/setup-nginx-ssl.sh homolog

# Para produção
sudo ./scripts/setup-nginx-ssl.sh main
```

### 6. Durante a Execução

O script irá:
1. ✅ Instalar Nginx (se não estiver instalado)
2. ✅ Instalar Certbot (se não estiver instalado)
3. ✅ Criar configuração do Nginx
4. ✅ Testar a configuração
5. ✅ Recarregar o Nginx
6. ✅ Solicitar certificado SSL do Let's Encrypt

**Importante**: Quando o script perguntar sobre o DNS, certifique-se de que o registro A já está configurado e propagado antes de continuar.

### 7. Verificar Configuração

Após a execução, teste o acesso:

```bash
# Homologação
curl https://homolog-app.marshalltds.com/health

# Produção
curl https://app.marshalltds.com/health
```

## 🔍 Verificações

### Ver Status do Nginx

```bash
sudo systemctl status nginx
```

### Ver Logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/homolog-app.marshalltds.com-access.log

# Logs de erro
sudo tail -f /var/log/nginx/homolog-app.marshalltds.com-error.log
```

### Ver Configuração do Nginx

```bash
# Ver configuração criada
sudo cat /etc/nginx/sites-available/homolog-app.marshalltds.com

# Testar configuração
sudo nginx -t
```

### Ver Certificados SSL

```bash
# Listar certificados
sudo certbot certificates

# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

## 🔄 Renovação Automática do Certificado

O Certbot configura automaticamente a renovação dos certificados. Para verificar:

```bash
# Ver cron job de renovação
sudo systemctl status certbot.timer

# Testar renovação manual
sudo certbot renew --dry-run
```

## 🛠️ Comandos Úteis

### Recarregar Nginx

```bash
sudo systemctl reload nginx
# ou
sudo nginx -s reload
```

### Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### Verificar Portas Abertas

```bash
sudo netstat -tlnp | grep -E ':(80|443)'
```

### Abrir Portas no Firewall (UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## 🐛 Troubleshooting

### Erro: "Container não está respondendo"

- Verifique se o container está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs app-erp-homolog`
- Teste a porta diretamente: `curl http://localhost:5173/health`

### Erro: "DNS não está configurado"

- Verifique o DNS: `nslookup homolog-app.marshalltds.com`
- Aguarde a propagação do DNS (pode levar até 24 horas, geralmente alguns minutos)
- Verifique se o registro A está apontando para `72.61.223.230`

### Erro: "Porta 80 já está em uso"

- Verifique qual processo está usando: `sudo lsof -i :80`
- Pare o processo ou configure o Nginx para usar outra porta

### Erro no Certbot

- Verifique se o DNS está propagado: `dig +short homolog-app.marshalltds.com`
- Verifique se a porta 80 está acessível externamente
- Verifique os logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Certificado não renova automaticamente

```bash
# Verificar timer do Certbot
sudo systemctl status certbot.timer

# Habilitar timer se não estiver ativo
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 📝 Estrutura de Arquivos Criados

Após a execução do script, os seguintes arquivos serão criados:

```
/etc/nginx/sites-available/homolog-app.marshalltds.com
/etc/nginx/sites-enabled/homolog-app.marshalltds.com -> (link simbólico)
/var/log/nginx/homolog-app.marshalltds.com-access.log
/var/log/nginx/homolog-app.marshalltds.com-error.log
/etc/letsencrypt/live/homolog-app.marshalltds.com/ (certificados SSL)
```

## ✅ Checklist

- [ ] DNS configurado e propagado
- [ ] Container Docker rodando
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Script executado com sucesso
- [ ] Certificado SSL obtido
- [ ] Acesso HTTPS funcionando
- [ ] Renovação automática configurada

## 🎉 Pronto!

Agora sua aplicação está acessível via HTTPS com certificado SSL válido!

- **Homologação**: `https://homolog-app.marshalltds.com`
- **Produção**: `https://app.marshalltds.com`

