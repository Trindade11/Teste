# Plano de Reorganização - Projeto EKS

**Data**: 13/12/2024  
**Objetivo**: Consolidar frontend existente (layout) + specs (funcionalidades) em estrutura clara e executável

---

## I. Situação Atual

### O Que Temos

```
EKS/
├── frontend/              ✅ Layout pronto (Next.js 14)
├── backend/               ⚙️ Estrutura inicial
├── specs/                 ✅ 25 specs detalhadas
├── plans/                 ✅ MVP plan
├── project-context/       ✅ Database schema, env-vars
├── CVCHub - Copia/        ❌ VAZIO (ignorar)
├── Spec-Orchestrator/     ❌ VAZIO (ignorar)
└── chat.txt              ✅ Conversas de contexto
```

### Problemas Identificados

1. **Diretórios vazios** confusos (CVCHub - Copia, Spec-Orchestrator)
2. **Agents não implementados** (Python não existe)
3. **Tests dispersos** (alguns em backend, sem estrutura clara)
4. **.specify/ não existe** (metodologia Spec-Driven precisa de estrutura)
5. **Specs não priorizadas** (25 specs sem roadmap claro)

---

## II. Estrutura Alvo (Reorganizada)

```
EKS/
├── _context/                    # 🆕 Contexto temporário (pode deletar)
│   ├── README.md               # ✅ Explicação desta pasta
│   ├── constitution.md         # ✅ Princípios consolidados
│   ├── ANALISE-CONSOLIDADA.md  # ✅ Gap analysis
│   ├── diagrams/               # Mermaid diagrams
│   │   ├── architecture.md
│   │   └── data-model.md
│   └── docs/
│       └── onboarding.md       # Como começar
│
├── frontend/                    # ✅ MANTER (layout já pronto)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   ├── canvas/
│   │   │   └── layout/
│   │   ├── lib/
│   │   └── store/
│   └── package.json
│
├── backend/                     # ⚙️ EXPANDIR
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── neo4j.ts
│   │   │   └── mongodb.ts      # 🆕 Long-term memory
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── contextEngineer.ts  # 🆕 Write/Compress/Isolate/Select
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── agents.routes.ts
│   │   │   ├── memory.routes.ts    # 🆕
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   ├── ChatService.ts
│   │   │   ├── AgentService.ts
│   │   │   ├── MemoryService.ts    # 🆕
│   │   │   ├── Neo4jService.ts
│   │   │   └── MongoDBService.ts   # 🆕
│   │   ├── models/
│   │   └── utils/
│   ├── tests/                   # 🆕 MOVER AQUI
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
│
├── agents/                      # 🆕 CRIAR (Python)
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── src/
│   │   ├── main.py             # FastAPI server
│   │   ├── config.py
│   │   ├── router/
│   │   │   ├── __init__.py
│   │   │   └── agent_router.py      # Spec 005
│   │   ├── factory/
│   │   │   ├── __init__.py
│   │   │   └── user_agent_factory.py # Spec 004
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── personal_agent.py
│   │   │   ├── task_agent.py
│   │   │   ├── knowledge_agent.py
│   │   │   └── feedback_agent.py
│   │   ├── teams/               # Spec 019
│   │   │   ├── __init__.py
│   │   │   └── task_team.py
│   │   └── utils/
│   │       ├── neo4j_client.py
│   │       ├── mongodb_client.py
│   │       └── openai_client.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── README.md
│
├── specs/                       # ✅ MANTER + PRIORIZAR
│   ├── _ROADMAP.md             # 🆕 Roadmap de implementação
│   ├── 001-knowledge-pipeline/
│   ├── 005-agent-router/
│   ├── 015-neo4j-graph-model/
│   ├── 017-memory-ecosystem/
│   ├── 019-multi-agent-orchestration/
│   └── ... (outras 20 specs)
│
├── plans/
│   ├── mvp-core-plan.md        # ✅ MANTER
│   └── sprint-plans/           # 🆕 Planos de sprint
│       ├── sprint-1.md
│       ├── sprint-2.md
│       └── ...
│
├── project-context/            # ✅ MANTER + ATUALIZAR
│   ├── database-schema.md
│   ├── env-vars.md
│   ├── folder-structure.md     # 🆕 Este plano
│   ├── agent-framework.md
│   └── tools-registry.md
│
├── tests/                      # 🆕 E2E tests
│   └── e2e/
│       ├── auth.spec.ts
│       ├── chat.spec.ts
│       └── canvas.spec.ts
│
├── scripts/                    # 🆕 Utility scripts
│   ├── seed-admin.ts
│   ├── migrate-neo4j.ts
│   └── check-env.ts
│
├── docs/                       # 🆕 Docs consolidados
│   ├── API.md                  # Swagger/OpenAPI
│   ├── SETUP.md                # Como rodar local
│   └── CONTRIBUTING.md
│
├── .github/                    # 🆕 CI/CD
│   └── workflows/
│       ├── backend-tests.yml
│       ├── agents-tests.yml
│       └── deploy-staging.yml
│
├── docker-compose.yml          # 🆕 Local dev
├── .env.example
├── .gitignore
├── README.md                   # 🆕 Atualizar
├── ANALISE-CONSOLIDADA.md      # ✅ MANTER
├── REORGANIZATION-PLAN.md      # Este arquivo
└── chat.txt                    # ✅ MANTER (histórico)
```

---

## III. Ações de Reorganização (Sequência)

### Fase 1: Limpeza (1 hora)

```bash
# 1. Remover diretórios vazios
rm -rf "CVCHub - Copia"
rm -rf "Spec-Orchestrator"

# 2. Mover tests dispersos para estrutura correta
# (se houver tests em backend/, mover para backend/tests/)
```

### Fase 2: Criar Contexto Temporário (1 hora)

```bash
# 1. Criar _context/ (contexto temporário)
mkdir _context/{diagrams,docs}

# 2. Mover análises para _context/
mv ANALISE-CONSOLIDADA.md _context/

# 3. Criar diagramas consolidados
# (já criados em _context/diagrams/)

# NOTA: A metodologia Spec-Driven está em Spec-Orchestrator/.specify/
# Não duplicar aqui, EKS é um subprojeto
```

### Fase 3: Setup Agents (Python) (4 horas)

```bash
# 1. Criar estrutura agents/
mkdir -p agents/src/{router,factory,agents,teams,utils}
mkdir -p agents/tests/{unit,integration}

# 2. Inicializar Poetry
cd agents
poetry init
poetry add fastapi uvicorn agno neo4j-driver pymongo openai python-dotenv pydantic

# 3. Criar arquivos base
touch src/main.py
touch src/config.py
touch src/__init__.py

# 4. Criar README
echo "# EKS Agents - Python" > README.md
```

### Fase 4: Atualizar Backend (2 horas)

```bash
# 1. Adicionar MongoDB
cd backend
npm install mongodb

# 2. Criar services/models novos
touch src/services/MemoryService.ts
touch src/services/MongoDBService.ts
touch src/middleware/contextEngineer.ts

# 3. Atualizar .env.example
# (adicionar MongoDB URI)
```

### Fase 5: Criar Roadmap de Specs (2 horas)

```bash
# 1. Criar _ROADMAP.md em specs/
touch specs/_ROADMAP.md

# 2. Priorizar specs por sprint
# (Sprint 1: 003, 005, 001, 007, 009)
# (Sprint 2: 015, 017, 025, 008)
# (Sprint 3: 004, 019, 024, 012)
# (Sprint 4: 018, 020, 021, 022)
```

### Fase 6: Docker & CI/CD (3 horas)

```bash
# 1. Criar docker-compose.yml
touch docker-compose.yml

# 2. Criar .github/workflows/
mkdir -p .github/workflows
touch .github/workflows/backend-tests.yml
touch .github/workflows/agents-tests.yml

# 3. Atualizar .gitignore
```

### Fase 7: Documentação (2 horas)

```bash
# 1. Criar docs/
mkdir -p docs
touch docs/API.md
touch docs/SETUP.md
touch docs/CONTRIBUTING.md

# 2. Atualizar README.md principal
```

---

## IV. Priorização de Specs (Sprint Roadmap)

### Sprint 1 (2 semanas) - Foundation

**Objetivo**: Backend + Auth + Chat básico funcionando

```yaml
Specs Prioritárias:
  - 003: Admin Login Config (BLOQUEANTE)
  - 005: Agent Router (CORE)
  - 001: Knowledge Pipeline (ENTRADA)
  - 007: Chat Knowledge Capture (UI)
  - 009: User Memory Decision (DECISÃO)

Deliverables:
  - Admin login funcional
  - Backend API respondendo
  - Chat básico frontend↔backend
  - Neo4j conectado
```

### Sprint 2 (2 semanas) - Memory & Persistence

**Objetivo**: Memória + Conversas persistidas + Canvas

```yaml
Specs Prioritárias:
  - 015: Neo4j Graph Model (SCHEMA)
  - 017: Memory Ecosystem (MEMÓRIA)
  - 025: Conversation Persistence (HISTÓRICO)
  - 008: Task Generation Canvas (CANVAS)

Deliverables:
  - MongoDB integrado
  - Memória short/medium/long
  - Conversas salvas
  - Canvas renderizando tasks
```

### Sprint 3 (2 semanas) - Agents & Teams

**Objetivo**: Multi-agent orchestration funcionando

```yaml
Specs Prioritárias:
  - 004: User Agent Factory (CUSTOMIZAÇÃO)
  - 019: Multi-Agent Orchestration (TEAMS)
  - 024: Retrieval Orchestration (BUSCA)
  - 012: Graph Curation (QUALIDADE)

Deliverables:
  - Python agents rodando
  - Agno Teams funcionando
  - Retrieval híbrido (graph+vector)
  - Curadoria automática
```

### Sprint 4 (2 semanas) - Polish & Advanced

**Objetivo**: Observability + Gamification + Onboarding

```yaml
Specs Prioritárias:
  - 018: Observability Dashboard (MÉTRICAS)
  - 020: Gamification User KPIs (ENGAGEMENT)
  - 021: Notification Center (ALERTAS)
  - 022: Onboarding AI Profile (UX)

Deliverables:
  - Dashboard admin
  - Gamification ativa
  - Notificações funcionando
  - Onboarding completo
```

### Specs Restantes (Backlog)

```yaml
Phase 5 (Futuro):
  - 002: Admin Node Manager
  - 006: Chat Action Menu
  - 010: Data Filtration
  - 011: Validation Agent
  - 013: Ingestion Ecosystem
  - 014: Provenance System
  - 016: Main Interface Layout (já implementado)
  - 023: Agenda Calendar System
```

---

## V. Checklist de Reorganização

### Estrutura

- [ ] Remover diretórios vazios (CVCHub - Copia, Spec-Orchestrator dentro de EKS)
- [x] Criar `_context/` (temporário, pode deletar)
- [x] Criar `agents/` com estrutura Python
- [ ] Criar `tests/e2e/`
- [ ] Criar `scripts/`
- [x] Criar `docs/`
- [ ] Criar `.github/workflows/`

### Arquivos Novos

- [x] `_context/README.md` - Explicação da pasta temporária
- [x] `_context/diagrams/architecture.md`
- [x] `_context/diagrams/data-model.md`
- [x] `specs/_ROADMAP.md`
- [x] `agents/pyproject.toml`
- [x] `agents/src/main.py`
- [x] `docker-compose.yml`
- [x] `docs/SETUP.md`
- [ ] `.env.example` (atualizado com MongoDB)

### Backend

- [ ] Adicionar MongoDB driver
- [ ] Criar `MemoryService.ts`
- [ ] Criar `MongoDBService.ts`
- [ ] Criar `contextEngineer.ts` middleware
- [ ] Atualizar routes para incluir `/memory`

### Frontend

- [ ] Validar que componentes existentes funcionam
- [ ] Adicionar interrupt handling no Canvas
- [ ] Integrar com novos endpoints `/memory`

### Agents

- [ ] Setup Poetry project
- [ ] Implementar FastAPI server
- [ ] Criar AgentRouter (spec 005)
- [ ] Criar UserAgentFactory (spec 004)
- [ ] Integrar com Neo4j e MongoDB

### Documentação

- [ ] Atualizar README.md principal
- [ ] Criar API.md (Swagger)
- [ ] Criar SETUP.md (como rodar)
- [ ] Criar CONTRIBUTING.md
- [ ] Atualizar specs com status

---

## VI. Timeline Estimado

| Fase | Duração | Responsável | Status |
|------|---------|-------------|--------|
| **Reorganização** | 1-2 dias | Dev | 🔄 Em andamento |
| **Sprint 1** | 2 semanas | Dev | ⏳ Aguardando |
| **Sprint 2** | 2 semanas | Dev | ⏳ Aguardando |
| **Sprint 3** | 2 semanas | Dev | ⏳ Aguardando |
| **Sprint 4** | 2 semanas | Dev | ⏳ Aguardando |
| **TOTAL MVP** | ~2 meses | - | - |

---

## VII. Próximos Passos Imediatos

### Hoje (13/12/2024)

1. ✅ Criar `constitution.md`
2. ✅ Criar `REORGANIZATION-PLAN.md` (este arquivo)
3. ⏳ Executar Fase 1 (Limpeza)
4. ⏳ Executar Fase 2 (Estrutura Spec-Driven)

### Amanhã (14/12/2024)

1. Executar Fase 3 (Setup Agents Python)
2. Executar Fase 4 (Atualizar Backend)
3. Criar `specs/_ROADMAP.md`
4. Iniciar Sprint 1

### Esta Semana

1. Completar reorganização estrutural
2. Setup completo de desenvolvimento local
3. Primeira iteração de specs 003 + 005
4. Backend respondendo em `localhost:3001`

---

## VIII. Comandos Úteis

### Setup Completo Local

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env
# (editar .env com suas credenciais)
npm run dev

# 2. Agents
cd agents
poetry install
cp .env.example .env
# (editar .env)
poetry run python src/main.py

# 3. Frontend
cd frontend
npm install
npm run dev

# 4. Neo4j + MongoDB + Redis via Docker
docker-compose up -d
```

### Verificar Status

```bash
# Backend health
curl http://localhost:3001/health

# Agents health
curl http://localhost:8000/health

# Frontend
open http://localhost:3000
```

---

## IX. Decisões de Design Confirmadas

### Layout

✅ **Aproveitado do frontend/ existente**:
- Sidebar colapsável (esquerda)
- Canvas central (área útil)
- Chat colapsável (direita)
- Mobile responsive (MobileNav)

### Funcionalidades

✅ **Consolidadas das 25 specs**:
- Knowledge pipeline (001)
- Agent routing (005)
- Multi-agent teams (019)
- Memory ecosystem (017)
- Graph model (015)

### Melhores Práticas

✅ **Integradas das pesquisas**:
- Canvas Pattern (Vercel/LangGraph)
- Context Engineering (4 pilares)
- Memory architecture (MongoDB + Neo4j)
- GraphRAG hybrid

---

## X. Critérios de Sucesso

### Reorganização Completa Quando:

- ✅ Estrutura de pastas clara e consistente
- ✅ Diretórios vazios removidos
- ✅ `.specify/` criado com constitution.md
- ✅ `agents/` criado com estrutura Python
- ✅ `specs/_ROADMAP.md` criado
- ✅ `docker-compose.yml` funcionando
- ✅ Documentação atualizada (README, SETUP)
- ✅ `.env.example` completo
- ✅ CI/CD básico configurado

---

**Última atualização**: 13/12/2024  
**Status**: 🔄 Em execução
