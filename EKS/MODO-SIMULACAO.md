# 🎨 Modo Simulação - Foco em UX/Estética

**Objetivo**: Validar interface, usabilidade e estética SEM depender de backend

---

## ✅ O Que Já Está Configurado

**Mock API criada**: `frontend/src/lib/mockApi.ts`
- Simula latência real (800ms login, 500ms queries)
- 3 usuários mockados (admin + 2 usuários)
- Respostas realistas

**API configurada para usar mock**: `frontend/src/lib/api.ts`
- Modo simulação **SEMPRE ATIVO**
- Não precisa de backend rodando
- Funciona offline

---

## 🎯 Como Usar

### 1. Rodar apenas o frontend

```powershell
cd "c:\Users\Luiz Carlos\Projects\Spec-Orchestrator\EKS\frontend"
npm run dev
```

**Pronto!** Acesse: `http://localhost:3000`

---

### 2. Fazer Login (Simulado)

**Credenciais mockadas**:

| Email | Senha | Role | Tipo |
|-------|-------|------|------|
| `admin@cocreateai.com.br` | `1234` | Admin | CoCreate |
| `ana.silva@cvc.com.br` | `senha123` | User | CVC |
| `founder@techcorp.ai` | `senha123` | User | Startup |

**Login como Admin** (recomendado):
- Email: `admin@cocreateai.com.br`
- Senha: `1234`

**Comportamento simulado**:
- 800ms de latência (realista)
- Token JWT mockado
- Salva no localStorage
- Redireciona para dashboard

---

### 3. Explorar Interface

**Páginas disponíveis**:
- `/login` - ✅ 100% funcional (mock)
- `/admin` - ✅ CRUD usuários (mock)
- `/` - Layout base (Chat + Canvas)

**Features simuladas**:
- Login/Logout
- Listar usuários
- Criar usuário
- Editar usuário
- Deletar usuário
- Profile do usuário logado

---

## 🎨 Foco em Estética/UX

**O que validar**:
- ✅ Layout responsivo
- ✅ Cores e tipografia
- ✅ Espaçamento e padding
- ✅ Animações e transições
- ✅ Estados de loading (spinners)
- ✅ Feedback visual (toasts, alerts)
- ✅ Navegação intuitiva
- ✅ Formulários amigáveis

**O que NÃO validar agora**:
- ❌ Integração com backend real
- ❌ Autenticação real
- ❌ Queries no Neo4j
- ❌ LLM responses
- ❌ Performance de API

---

## 📋 Dados Mockados Disponíveis

### Usuários (3)
```json
{
  "userId": "usr_admin_001",
  "email": "admin@cocreateai.com.br",
  "name": "Admin CoCreate",
  "role": "admin",
  "company": "CoCreateAI"
}
```

### Empresas (2)
- CoCreateAI (cocreate)
- CVC Example (cvc)

### Startups (2)
- TechCorp AI (Series A, AI/ML)
- FinTech Solutions (Seed, Fintech)

---

## 🔄 Quando Trocar para API Real

**Atualmente**: `USE_MOCK = true` (linha 11 de `api.ts`)

**Para desativar mock**:
```typescript
// frontend/src/lib/api.ts
const USE_MOCK = false; // Ou: process.env.NEXT_PUBLIC_USE_MOCK === 'true'
```

**Ou via `.env`**:
```bash
# frontend/.env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎯 Workflow Recomendado

### Fase 1: UX/Estética (AGORA)
1. ✅ Rodar apenas frontend
2. ✅ Login com mock
3. ✅ Validar layout, cores, usabilidade
4. ✅ Iterar no design
5. ✅ Testar fluxos de usuário

### Fase 2: Integração (DEPOIS)
1. Configurar backend (Neo4j + .env)
2. Rodar backend + frontend
3. Desativar mock (`USE_MOCK = false`)
4. Validar integração real
5. Testar performance

---

## ✅ Vantagens do Modo Simulação

**Desenvolvimento mais rápido**:
- Sem dependência de infra
- Sem configurar banco de dados
- Sem esperar backend rodar

**Feedback imediato**:
- Hot reload funciona
- Mudanças visuais instantâneas
- Iterar rapidamente

**Foco no que importa**:
- Layout e design
- Usabilidade
- Fluxo de navegação
- Componentes visuais

---

## 🚀 Status Atual

**✅ Configurado e Funcionando**:
- Mock API completa
- Login simulado (senha: 1234)
- Admin page funcional
- Latência realista
- 3 usuários mockados

**🎨 Pronto para validar**:
- Estética geral
- Responsividade
- Cores e tipografia
- Componentes UI
- Fluxos de usuário

**⏳ Para depois**:
- Integração com backend real
- Neo4j + MongoDB
- LLM responses reais
- Performance otimizada

---

**Resumo**: Frontend roda sozinho, login funciona com `1234`, foco total em UX/estética! 🎨
