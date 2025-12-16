# 🚀 Como Rodar o Frontend (Windows PowerShell)

**Problema**: O operador `&&` não funciona no PowerShell do Windows

---

## ✅ Comandos Corretos para Windows

### Opção 1: Comandos Separados (Recomendado)

```powershell
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### Opção 2: Usar Ponto-e-vírgula (;)

```powershell
cd frontend; npm install; npm run dev
```

### Opção 3: Usar CMD

```cmd
cd frontend && npm install && npm run dev
```

---

## 📋 Passo a Passo Completo

### 1. Backend (Terminal 1)

```powershell
# Navegar para backend
cd c:\Users\Luiz Carlos\Projects\Spec-Orchestrator\EKS\backend

# Instalar dependências (primeira vez)
npm install

# Configurar .env (se não tiver)
# Copie .env.example para .env e configure:
# NEO4J_URI=neo4j://localhost:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=password
# JWT_SECRET=seu-secret-aqui

# Rodar backend
npm run dev
```

**Saída esperada**:
```
Server listening on http://localhost:4000
Neo4j connected
```

---

### 2. Frontend (Terminal 2 - Novo)

```powershell
# Navegar para frontend
cd c:\Users\Luiz Carlos\Projects\Spec-Orchestrator\EKS\frontend

# Instalar dependências (primeira vez)
npm install

# Rodar frontend
npm run dev
```

**Saída esperada**:
```
Ready on http://localhost:3000
```

---

### 3. Acessar

Abra o navegador:
- **Login**: http://localhost:3000/login
- **Admin**: http://localhost:3000/admin
- **Home**: http://localhost:3000/

---

## 🔍 Verificar Ports

Se der erro de porta ocupada:

```powershell
# Ver o que está rodando na porta 3000
netstat -ano | findstr :3000

# Ver o que está rodando na porta 4000
netstat -ano | findstr :4000

# Matar processo (se necessário)
taskkill /PID [numero_do_pid] /F
```

---

## 🎨 O Que Você Pode Visualizar AGORA

### ✅ Páginas Funcionais

1. **Login** (`/login`)
   - Form de login
   - Auth com backend
   - Redirect após login

2. **Admin Page** (`/admin`)
   - CRUD completo de usuários
   - Filtros (role, org, empresa)
   - Edição inline
   - Reset senha

3. **Home** (`/`)
   - Layout base (Sidebar + Canvas + Chat)
   - Navigation

### 🟡 Mock Data Disponível

Se quiser simular sem backend:

```typescript
// frontend/src/lib/mockApi.ts
import users from '@/../../mock-data/nodes/users.json';
import startups from '@/../../mock-data/nodes/startups.json';

export const mockApi = {
  getUsers: () => Promise.resolve({ success: true, data: users }),
  getStartups: () => Promise.resolve({ success: true, data: startups }),
  // ... mais mocks
};
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### Erro: "Port already in use"
```powershell
# Frontend (3000)
netstat -ano | findstr :3000
taskkill /PID [pid] /F

# Backend (4000)
netstat -ano | findstr :4000
taskkill /PID [pid] /F
```

### Erro: ".env not found"
```powershell
cd backend
cp .env.example .env
# Edite .env com suas configurações
```

---

## 📊 Spec-Driven Development

### Mapeando Features Visualmente

Ao testar o frontend, marque com emojis:

- ✅ **Verde**: Funciona perfeitamente
- 🟡 **Amarelo**: UI OK, backend falta
- ⚠️ **Vermelho**: Não implementado
- ⏳ **Cinza**: Planejado futuro

**Exemplo de mapeamento**:

```
Admin Page:
├─ ✅ Listagem de usuários
├─ ✅ Criar usuário
├─ ✅ Editar usuário
├─ ✅ Reset senha
├─ ✅ Filtros
└─ ✅ Busca

Chat:
├─ ✅ Interface (UI)
├─ 🟡 Enviar mensagem (falta agents backend)
├─ 🟡 Voice input (UI pronta, falta Azure Speech)
└─ 🟡 File upload (UI pronta, falta Azure Blob)

Canvas:
├─ ✅ Estrutura
├─ ⚠️ Renderização de grafo (não implementado)
└─ ⚠️ Visualização de tasks (não implementado)
```

---

## 🎯 Próximos Passos

### Após Visualizar

1. **Testar Admin Page**: Criar/editar usuários
2. **Ver Layout Base**: Sidebar + Canvas + Chat
3. **Mapear Gaps**: O que falta implementar
4. **Priorizar**: Decidir o que implementar no Sprint 1

### Sprint 1 (20 dias)

- Design System (Spec 031) - 3d
- Voice Input (Spec 027) - 2d
- File Upload (Spec 028) - 3d
- UX Professional (Spec 029) - 5d
- Corporate Mode (Spec 030) - 3d
- LLM Router (Spec 026) - 4d

---

**Status**: Comandos prontos para Windows  
**Recomendação**: Rodar em 2 terminais separados (backend + frontend)
