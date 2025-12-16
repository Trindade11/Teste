# Specification: Invite-Only Authentication & Pre-Registration

**ID**: TRG-SPC-026  
**Feature**: Invite-Only Authentication & Pre-Registration  
**Version**: 1.0.0  
**Status**: Draft  
**Created**: 2024-12-14  
**Updated**: 2024-12-14

---

## 1. Overview

### 1.1 What
Sistema de autenticação **invite-only** onde usuários são **pré-registrados** por administradores via configuração (`.env` para mock, backend API para produção). Não há cadastro público - apenas login com credenciais pré-definidas.

### 1.2 Why
- **Controle corporativo**: apenas usuários autorizados acessam o sistema
- **White-label ready**: dados do tenant/empresa vêm do pré-cadastro
- **Onboarding pré-populado**: nome, email, empresa e cargo já disponíveis no primeiro acesso
- **Segurança**: elimina riscos de auto-cadastro não autorizado

### 1.3 Success Criteria
- ✅ Usuário consegue fazer login apenas com credenciais pré-registradas
- ✅ Login com credenciais não-registradas falha com mensagem clara
- ✅ Dados do usuário (nome, email, empresa, cargo) são pré-preenchidos no onboarding
- ✅ Sistema mock usa `.env` para seed inicial (exemplo: `rodrigo.trindade@alok.com.br` / `1234`)
- ✅ Interface de administração permite pré-cadastrar novos usuários (futuro)

---

## 2. User Stories

### US-1: Login com Usuário Pré-Registrado (Mock)
**Como** usuário pré-registrado  
**Quero** fazer login com meu email e senha  
**Para** acessar o sistema e iniciar meu onboarding

**Acceptance Criteria**:
- [ ] Email `rodrigo.trindade@alok.com.br` + senha `1234` permite login
- [ ] Após login, dados do usuário estão disponíveis no `authStore`
- [ ] Onboarding é pré-preenchido com: nome, email, empresa, cargo
- [ ] Token/sessão mock é armazenado no `localStorage`

### US-2: Login com Credenciais Inválidas
**Como** visitante não-autorizado  
**Quero** receber feedback claro ao tentar login  
**Para** entender que não tenho acesso

**Acceptance Criteria**:
- [ ] Login com email não-registrado retorna erro: "Usuário não encontrado"
- [ ] Login com senha incorreta retorna erro: "Senha incorreta"
- [ ] Não há opção de "Criar conta" visível na tela de login

### US-3: Seed de Usuários via Env (Mock)
**Como** desenvolvedor  
**Quero** configurar usuários mock via `.env`  
**Para** simular diferentes perfis/tenants

**Acceptance Criteria**:
- [ ] `.env.local` contém variáveis: `MOCK_USER_EMAIL`, `MOCK_USER_PASSWORD`, `MOCK_USER_NAME`, `MOCK_USER_COMPANY`, `MOCK_USER_ROLE`
- [ ] `mockApi.ts` lê essas variáveis e registra o usuário no mock
- [ ] Suporta múltiplos usuários via formato JSON (opcional): `MOCK_USERS=[{...}]`

### US-4: Pré-Cadastro via Admin (Futuro - Backend)
**Como** administrador  
**Quero** pré-cadastrar novos usuários via painel admin  
**Para** controlar acessos sem editar código

**Acceptance Criteria**:
- [ ] Painel admin tem formulário: email, nome, empresa, cargo, senha temporária
- [ ] Usuário recebe email com link de ativação (futuro)
- [ ] Backend valida unicidade de email

---

## 3. Functional Requirements

### FR-1: Mock User Seed via Environment Variables
- Sistema lê `.env.local` e registra usuários mock na inicialização
- Formato mínimo: `MOCK_USER_EMAIL`, `MOCK_USER_PASSWORD`, `MOCK_USER_NAME`, `MOCK_USER_COMPANY`, `MOCK_USER_ROLE`
- Formato avançado (opcional): `MOCK_USERS='[{"email":"...","password":"...","name":"...","company":"...","role":"..."}]'`

### FR-2: Login Endpoint (Mock)
- `POST /api/auth/login` aceita `{ email, password }`
- Valida credenciais contra lista de usuários pré-registrados
- Retorna `{ token, user: { id, name, email, company, role, organizationType } }`
- Armazena `mockUserId` em `localStorage` para manter sessão

### FR-3: Pre-filled Onboarding
- `OnboardingWizard` usa `useAuthStore` para pré-preencher:
  - `fullName` ← `user.name`
  - `email` ← `user.email`
  - `company` ← `user.company`
  - `jobRole` ← `user.role`
  - `organizationType` ← `user.organizationType`
- Campos continuam editáveis, mas vêm populados

### FR-4: No Public Registration
- Tela de login **não** exibe link "Criar conta" ou "Sign up"
- Tentativa de acessar `/register` redireciona para `/login` com mensagem: "Sistema invite-only"

---

## 4. Non-Functional Requirements

### NFR-1: Security (Mock Level)
- Senha em `.env` é aceitável para mock (desenvolvimento local)
- Produção usará backend real com hashing (bcrypt) e JWT

### NFR-2: Usability
- Mensagens de erro claras: "Usuário não encontrado" vs "Senha incorreta"
- Tela de login indica "Sistema corporativo - Acesso restrito"

### NFR-3: Scalability
- Design permite migração fácil de mock → backend real
- Interface `mockApi.ts` já espelha API REST real

---

## 5. Process Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000'}}}%%
flowchart TD
    Start([👤 Usuário acessa /login]) --> CheckEnv[🔍 Sistema verifica .env]
    CheckEnv --> SeedUsers[📝 Registra usuários mock<br/>do .env na memória]
    SeedUsers --> LoginForm[📋 Exibe formulário de login<br/>SEM link 'Criar conta']
    
    LoginForm --> InputCreds[👤 Usuário insere<br/>email + senha]
    InputCreds --> ValidateAPI[🔐 POST /api/auth/login]
    
    ValidateAPI --> CheckUser{Usuário existe?}
    CheckUser -->|Não| ErrorNotFound[❌ Erro: 'Usuário não encontrado']
    CheckUser -->|Sim| CheckPass{Senha correta?}
    
    CheckPass -->|Não| ErrorWrongPass[❌ Erro: 'Senha incorreta']
    CheckPass -->|Sim| GenerateToken[🎫 Gera token mock<br/>e retorna user data]
    
    GenerateToken --> SaveSession[💾 Salva mockUserId<br/>em localStorage]
    SaveSession --> Redirect[↗️ Redireciona para /]
    
    Redirect --> CheckOnboarding{Onboarding<br/>completo?}
    CheckOnboarding -->|Não| OpenOnboarding[🚀 Abre OnboardingWizard<br/>com dados pré-preenchidos]
    CheckOnboarding -->|Sim| Dashboard[🏠 Mostra Dashboard]
    
    OpenOnboarding --> Prefill[✏️ Pré-preenche:<br/>nome, email, empresa, cargo]
    Prefill --> UserEdits[👤 Usuário completa<br/>onboarding]
    UserEdits --> Done([✅ Onboarding concluído])
    
    ErrorNotFound --> LoginForm
    ErrorWrongPass --> LoginForm
    
    classDef errorStyle fill:#fee,stroke:#c33,stroke-width:2px
    classDef successStyle fill:#efe,stroke:#3c3,stroke-width:2px
    classDef processStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    
    class ErrorNotFound,ErrorWrongPass errorStyle
    class Done,Dashboard successStyle
    class CheckEnv,SeedUsers,ValidateAPI,GenerateToken,SaveSession,Prefill processStyle
```

---

## 6. Data Model

### Mock User Object
```typescript
interface MockUser {
  id: string;               // UUID gerado
  email: string;            // Email único (chave de busca)
  password: string;         // Plaintext no mock (bcrypt em prod)
  name: string;             // Nome completo
  company: string;          // Nome da empresa/tenant
  role: string;             // Cargo (ex: "Investment Associate", "CEO")
  organizationType: string; // "Corporate VC" | "Startup" | "Enterprise"
  createdAt: string;        // ISO timestamp
}
```

### Environment Variables (Mock Seed)
```bash
# .env.local (exemplo)
MOCK_USER_EMAIL=rodrigo.trindade@alok.com.br
MOCK_USER_PASSWORD=1234
MOCK_USER_NAME=Rodrigo Trindade
MOCK_USER_COMPANY=Alok Corporation
MOCK_USER_ROLE=Corporate Innovation Lead
MOCK_USER_ORGANIZATION_TYPE=Enterprise

# Opcional: múltiplos usuários (JSON array)
MOCK_USERS='[
  {"email":"rodrigo.trindade@alok.com.br","password":"1234","name":"Rodrigo Trindade","company":"Alok Corporation","role":"Corporate Innovation Lead","organizationType":"Enterprise"},
  {"email":"admin@cocreateai.com.br","password":"admin","name":"Admin User","company":"CoCreateAI","role":"System Admin","organizationType":"Enterprise"}
]'
```

---

## 7. API Contract (Mock)

### POST /api/auth/login
**Request**:
```json
{
  "email": "rodrigo.trindade@alok.com.br",
  "password": "1234"
}
```

**Response (Success - 200)**:
```json
{
  "token": "mock-jwt-token-12345",
  "user": {
    "id": "usr_001",
    "name": "Rodrigo Trindade",
    "email": "rodrigo.trindade@alok.com.br",
    "company": "Alok Corporation",
    "role": "Corporate Innovation Lead",
    "organizationType": "Enterprise"
  }
}
```

**Response (Error - 401)**:
```json
{
  "error": "Usuário não encontrado"
}
// ou
{
  "error": "Senha incorreta"
}
```

### GET /api/auth/me
**Request**: Header `Authorization: Bearer mock-jwt-token-12345`

**Response (Success - 200)**:
```json
{
  "user": {
    "id": "usr_001",
    "name": "Rodrigo Trindade",
    "email": "rodrigo.trindade@alok.com.br",
    "company": "Alok Corporation",
    "role": "Corporate Innovation Lead",
    "organizationType": "Enterprise"
  }
}
```

---

## 8. UI/UX Requirements

### Login Page
- Título: "Acesso Corporativo" (não "CVC Hub Login")
- Campos: Email, Senha
- Botão: "Entrar"
- **Sem** link "Criar conta" ou "Cadastre-se"
- Nota pequena: "Acesso restrito a usuários pré-cadastrados"

### Error Messages
- "Usuário não encontrado. Entre em contato com o administrador."
- "Senha incorreta. Tente novamente."

### Onboarding Pre-fill
- Campos pré-preenchidos aparecem com valor inicial
- Usuário pode editar se necessário
- Indicador visual: "(pré-preenchido)" ou ícone de "check" verde

---

## 9. Testing Strategy

### Unit Tests
- `mockApi.login()` valida email/senha corretamente
- `mockApi.login()` retorna erro para credenciais inválidas
- Seed de usuários via env carrega corretamente

### Integration Tests
- Login com usuário válido → redireciona para `/` → abre onboarding
- Login com usuário inválido → exibe erro e mantém em `/login`
- Onboarding pré-preenche dados do usuário logado

### E2E Tests (Playwright)
- Fluxo completo: Login → Onboarding pré-preenchido → Conclusão → Dashboard

---

## 10. Dependencies

- **Frontend**: `useAuthStore` (Zustand), `mockApi.ts`
- **Backend (futuro)**: Node.js API, bcrypt, JWT
- **Environment**: `.env.local` para configuração de usuários mock

---

## 11. Migration Path (Mock → Production)

1. **Phase 1 (Atual)**: Mock com `.env` seed
2. **Phase 2**: Backend Node.js + MongoDB/Neo4j para armazenar usuários
3. **Phase 3**: Admin panel para pré-cadastro via UI
4. **Phase 4**: Email de convite + ativação de conta
5. **Phase 5**: SSO/SAML para enterprise (futuro distante)

---

## 12. Open Questions

- [ ] **[Q1]**: Suportar múltiplos tenants no mock? (Ex: diferentes empresas na mesma instância)
  - **Resposta provisória**: Não. Cada instância = 1 tenant. Multi-tenancy é para v2.
  
- [ ] **[Q2]**: Senha temporária obrigatória no primeiro login?
  - **Resposta provisória**: Não no mock. Implementar quando backend real estiver pronto.

---

## 13. Related Artifacts

- **Constitution**: Princípio VI (Simplicity & YAGNI) - mock primeiro, complexidade depois
- **Spec 022**: Onboarding & AI Profile (pré-preenchimento de dados)
- **Spec 003**: Admin Login & Auth (backend real)
- **Plan**: TBD (após aprovação desta spec)

---

> **Status**: 🟡 Draft - Aguardando validação  
> **Next Step**: Validar com usuário → `/speckit-plan` → Implementação
