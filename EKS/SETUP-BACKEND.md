# 🔧 Setup Backend - Configuração Rápida

**Problema**: Backend não está rodando porque falta configurar `.env`

---

## ⚡ Solução Rápida

### 1. Configurar arquivo `.env` do backend

**Crie/edite o arquivo**: `backend/.env`

**Cole este conteúdo**:

```bash
# Neo4j (local ou cloud)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# JWT Secret (pode ser qualquer string longa)
JWT_SECRET=seu-super-secret-jwt-key-muito-seguro-32chars-minimo

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Agent Server (Python)
AGENT_SERVER_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
```

---

### 2. Criar usuário Admin

```powershell
cd backend
npm run seed:admin
```

**Credenciais**:
- **Email**: `admin@cocreateai.com.br`
- **Senha**: `1234`

**Role**: Admin (Curador Semântico)
- Acesso total ao sistema
- Transparente (pode ver tudo)
- Curador de conhecimento

---

### 3. Rodar Backend

```powershell
cd backend
npm run dev
```

**Deve aparecer**:
```
Server listening on http://localhost:4000
Neo4j connected
```

---

### 4. Testar Login

Abra `http://localhost:3000/login`

- Email: `admin@cocreateai.com.br`
- Senha: `1234`

---

## 🎯 O que é o Admin?

**Admin = Curador Semântico do Sistema**

**Características**:
- ✅ **Acesso total** a todos os dados
- ✅ **Transparente**: Vê conversas corporate e personal
- ✅ **Curador**: Gerencia conhecimento, usuários, empresas
- ✅ **Não interfere**: Observa mas não altera contexto dos usuários
- ✅ **Backstage**: Acesso a métricas, logs, health do sistema

**Diferente de usuário comum**:
- Usuário comum: Vê apenas seu escopo (corporate ou personal)
- Admin: Vê tudo, gerencia tudo, curador do ecossistema

---

## 🚨 Troubleshooting

### Erro: "Failed to fetch"

**Causa**: Backend não está rodando

**Solução**:
1. Verificar se `.env` está configurado
2. Rodar `npm run dev` no backend
3. Verificar se porta 4000 está livre

---

### Erro: "NEO4J_URI is required"

**Causa**: Arquivo `.env` não existe ou está vazio

**Solução**:
1. Criar `backend/.env` com conteúdo acima
2. Verificar que arquivo não tem extensão `.txt` (deve ser só `.env`)

---

### Erro: "Connection refused"

**Causa**: Neo4j não está rodando

**Opções**:
1. **Docker**: `docker run -p 7687:7687 -p 7474:7474 neo4j:latest`
2. **Neo4j Desktop**: Instalar e rodar local
3. **Neo4j Aura**: Usar cloud (free tier)

Se usar Neo4j Aura, atualizar `.env`:
```bash
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=sua-senha-do-aura
```

---

## 📋 Checklist de Setup

- [ ] Arquivo `backend/.env` criado com todas as variáveis
- [ ] Neo4j rodando (Docker, Desktop ou Aura)
- [ ] JWT_SECRET configurado (mínimo 32 caracteres)
- [ ] Backend rodando (`npm run dev`)
- [ ] Admin criado (`npm run seed:admin`)
- [ ] Login testado com `admin@cocreateai.com.br` / `1234`
- [ ] Frontend acessível em `http://localhost:3000`

---

**Status**: Setup completo quando todos os checkboxes estiverem marcados
