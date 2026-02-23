# ⚙️ Configuração do Servidor

## Informações do Servidor de Deploy

- **IP**: `72.61.223.230`
- **Servidor**: VPS Hostinger
- **Diretório de Deploy**: `/var/www/app-erp`

## Portas Configuradas

- **Homologação (homolog)**: Porta `5173`
- **Produção (main)**: Porta `3173`

## GitHub Actions Secrets Necessárias

Configure as seguintes secrets no GitHub (Settings → Secrets and variables → Actions):

### Secrets de Infraestrutura:
| Secret | Valor |
|--------|-------|
| `VPS_SSH_PRIVATE_KEY` | Chave SSH privada para acesso ao servidor |
| `VPS_HOST` | `72.61.223.230` |
| `VPS_USER` | Usuário SSH (ex: `root` ou seu usuário) |
| `VPS_DEPLOY_PATH` | `/var/www/app-erp` |

### Secrets de APIs:
| Secret | Descrição |
|--------|-----------|
| `VITE_API_USUARIOS_BASE_URL_HOMOLOG` | URL da API de usuários para homologação |
| `VITE_API_USUARIOS_BASE_URL_MAIN` | URL da API de usuários para produção |
| `VITE_API_CLIENTES_BASE_URL_HOMOLOG` | URL da API de clientes para homologação |
| `VITE_API_CLIENTES_BASE_URL_MAIN` | URL da API de clientes para produção |
| `VITE_API_COMUNICACOES_BASE_URL_HOMOLOG` | URL da API de comunicações para homologação |
| `VITE_API_COMUNICACOES_BASE_URL_MAIN` | URL da API de comunicações para produção |
| `VITE_API_CONTRATOS_BASE_URL_HOMOLOG` | URL da API de contratos para homologação |
| `VITE_API_CONTRATOS_BASE_URL_MAIN` | URL da API de contratos para produção |
| `VITE_API_PESSOAS_BASE_URL_HOMOLOG` | URL da API de pessoas para homologação |
| `VITE_API_PESSOAS_BASE_URL_MAIN` | URL da API de pessoas para produção |

**Nota**: As variáveis de ambiente são injetadas no build time do Vite. Cada ambiente terá suas próprias URLs configuradas.

## Comandos Rápidos

### Conectar ao servidor
```bash
ssh seu-usuario@72.61.223.230
```

### Verificar containers
```bash
ssh seu-usuario@72.61.223.230 "cd /var/www/app-erp && docker-compose ps"
```

### Ver logs de homologação
```bash
ssh seu-usuario@72.61.223.230 "cd /var/www/app-erp && docker-compose logs -f app-erp-homolog"
```

### Ver logs de produção
```bash
ssh seu-usuario@72.61.223.230 "cd /var/www/app-erp && docker-compose logs -f app-erp-main"
```

### Testar App de homologação
```bash
curl http://72.61.223.230:5173/health
```

### Testar App de produção
```bash
curl http://72.61.223.230:3173/health
```

