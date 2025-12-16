# Constitution - EKS (Enterprise Knowledge System)

**Project**: CVC Hub / Enterprise Knowledge System  
**Version**: 1.0.0  
**Created**: 2024-12-13

---

## I. Essência do Projeto

### Visão

O **EKS** é um framework multi-agente baseado em grafo de conhecimento semântico que transforma conhecimento disperso em inteligência acionável.

**5 Pilares**:
1. **Grafo Semântico como Primeira Camada** - Base estruturada que alimenta o RAG
2. **Chat + Canvas Interativo** - Interface para captura e visualização
3. **Agentes Especializados** - Ecossistema que aprende com uso
4. **Memória Multi-Nível** - Short/Medium/Long term com caducidade
5. **Context Engineering** - Write/Compress/Isolate/Select

### Golden Rule GR-001

> **Temporalidade + Proveniência**: Toda informação no grafo DEVE ter:
> - `valid_from` / `valid_to`, `asserted_at`
> - `source` / `evidence`
> - `confidence` / `status`
>
> **Sem tempo + fonte = não confiável = não entra no grafo**

---

## II. Tech Stack Confirmado

### Core Stack (MVP v1)

```yaml
Frontend: Next.js 14 + React 18 + Radix UI + Tailwind + Zustand
Backend: Node.js 20 + TypeScript + Express + Socket.io
Agents: Python 3.11 + FastAPI + Agno Framework
Storage: MongoDB Atlas (Priority 1) + Neo4j Aura (Intercambiável)
AI: Azure OpenAI GPT-4o + text-embedding-3-small
Document Processing: Docling (IBM Research)
Speech: Azure Speech (Speech-to-Text)
Deploy: Vercel (FE) + Railway (BE + Agents)
```

### Database Strategy

**Decision**: Dual database support via Repository Pattern

- **MongoDB Atlas** (MVP v1) - Prioridade inicial, free tier generoso
- **Neo4j Aura** (Sprint 3-4) - Intercambiável via config
- **Pattern**: Abstract `KnowledgeRepository` interface
- **Migration**: Tools para migrar MongoDB → Neo4j quando necessário

**Rationale**: Flexibilidade, vendor lock-in avoidance, time-to-market

### Stack Evaluation

**Python (FastAPI)** escolhido vs Go/Rust:
- ✅ Time-to-market: MVP em 4 semanas
- ✅ Ecosystem AI/ML: Agno, Docling, OpenAI SDK
- ✅ Azure SDK completo
- ✅ Performance suficiente (5k req/s, latência ~200ms)
- ⚠️ Reavaliar em Sprint 4 após validação MVP

---

## III. MVP v1 Scope (4 semanas)

### Must-Have Features

1. **Chat Interface** - Texto + streaming
2. **Voice Input** - Azure Speech (Speech-to-Text)
3. **File Attachments** - Upload PDF/DOCX + Docling extraction
4. **Knowledge Storage** - MongoDB Atlas vector search
5. **Context Retrieval** - Semantic search básico

### Azure Services Required

```yaml
Azure OpenAI:
  - gpt-4o (chat)
  - text-embedding-3-small (embeddings)

Azure Speech:
  - Speech-to-Text (voice input)

Azure Document Intelligence:
  - Document analysis (fallback)

Azure Blob Storage:
  - File storage
```

### Success Criteria

- ✅ Login + chat funcionando
- ✅ Voz → transcrição → resposta
- ✅ PDF upload → extração → indexação
- ✅ Deploy produção (Railway/Vercel)
- ✅ Latência <3s (chat), <5s (voz)

---

## IV. Princípios Fundamentais

### A. Grafo como Semântica Auto-Explicativa

- **Grafo ANTES do RAG** - Não é o RAG, mas a base
- **Nodes contam história** - Navegação visual sem recuperação robusta imediata
- **Tudo é Node** - Documents, Knowledge, Tasks, People, Agents
- **Zero Hardcode de Schema**

### B. Context Engineering (4 Pilares)

1. **Write** - Persistir entre tasks (MongoDB)
2. **Compress** - Sumarizar quando > 8k tokens
3. **Isolate** - Dividir entre agents
4. **Select** - graph/vector/grep/relational + re-ranking

### C. Memória Multi-Nível

- **Short** - Conversa/sessão (expire rápido)
- **Medium** - Conhecimento ativo (decay por uso)
- **Long** - Arquivo estratégico (não expira)
- **Freshness Score** - Atualidade = relevância

### D. Poucas Perguntas

- Orçamento: 1 pergunta/rodada
- Modo: Surpresa inicial (valor ANTES de perguntar)
- Aprenda preferências

### E. Framework Atlas Semântico Temporal

- Toda informação tem tempo
- Memória versionada
- Navegação Todo→Micro (4 camadas)
- Resumos = Diretrizes

### F. Filtração Real vs Passageiro

- **Real** - Permanente
- **Passageiro** - Temporário
- Decisão do usuário: Corp vs Pessoal
- Preview antes de salvar

### G. Multi-Agent Orchestration

- Hierárquico: Operational→Strategic
- Cross-Pollination entre níveis
- Convergência estruturada
- Master Agent orquestra

---

## IV. Regras de Implementação

### A. Zero Hardcode

✅ **Permitido**: .env config, schema via modelagem, behavior via specs  
❌ **Proibido**: URLs hardcoded, credentials hardcoded, business logic hardcoded

### B. Metadados Universais

```cypher
// Obrigatórios em content nodes
{
  id, created_at, updated_at,
  source_type, source_ref, owner_id,
  visibility, confidence,
  memory_level, expires_at
}
```

### C. Tests Separados

```
tests/
  backend/ (≥70% coverage)
  agents/ (≥60% coverage)
  e2e/ (smoke tests)
```

### D. Logging Estruturado

Winston + JSON + {userId, conversationId, agentId, timestamp, latency}

---

## V. Ontologia Core

### Node Types Principais

```cypher
:Company, :Area, :Project
:User, :Person
:Document, :Chunk, :Knowledge
:Conversation, :Message, :ConversationSummary
:Plan, :Task
:Agent, :AgentTemplate, :PromptVersion, :AIProfile, :TeamConfig
:RoutingLog, :MemoryDecision, :CurationJob, :IngestionBatch
```

### Relationships Principais

```cypher
(:User)-[:WORKS_IN]->(:Company)
(:User)-[:CREATED]->(:Knowledge)
(:Document)-[:HAS_CHUNK]->(:Chunk)
(:Conversation)-[:CONTAINS]->(:Message)
(:Plan)-[:HAS_TASK]->(:Task)
(:Agent)-[:HAS_PROMPT_VERSION]->(:PromptVersion)
(:Agent)-[:HAS_TEAM]->(:TeamConfig)
```

---

## VI. Features Core (25 Specs)

### Grupo 1: Ingestão & Curadoria
001-knowledge-pipeline, 010-data-filtration, 012-graph-curation, 013-ingestion, 014-provenance

### Grupo 2: Agentes & Orquestração
004-user-agent-factory, 005-agent-router, 011-validation, 019-multi-agent

### Grupo 3: Chat & Interface
006-chat-action-menu, 007-chat-knowledge-capture, 008-task-canvas, 016-main-layout

### Grupo 4: Memória & Decisão
009-user-memory-decision, 017-memory-ecosystem, 025-conversation-persistence

### Grupo 5: Admin & Config
002-admin-node-manager, 003-admin-login, 022-onboarding-ai-profile

### Grupo 6: Retrieval & Observability
024-retrieval-orchestration, 018-observability, 020-gamification, 021-notifications, 023-calendar

### Grupo 7: Modelo
015-neo4j-graph-model

---

## VII. Success Criteria MVP

✅ Admin login + cadastro usuários  
✅ Onboarding completo  
✅ Chat end-to-end (user→agent→LLM→response)  
✅ Canvas renderiza tasks/plans  
✅ Conhecimento salvo e recuperado  
✅ Memória gerenciada (níveis + decay)  
✅ Multi-agent teams funcionando  
✅ Tests ≥70% backend, ≥60% agents  
✅ Deploy staging funcional

---

## VIII. Próximos Passos

1. **Reorganizar projeto** (ver REORGANIZATION-PLAN.md)
2. **Refinar specs críticas** (005, 017, 025)
3. **Implementar Phase 1 MVP** (backend foundation)
4. **Setup agents** (Python + Agno)
5. **Integrar frontend existente**

---

**Fontes**:
- 10 conversas ChatGPT (chat001-010.txt)
- 25 specs (specs/001-025)
- Pesquisas (Canvas, GraphRAG, Context Engineering, Memory Systems)
- MVP Plan (plans/mvp-core-plan.md)
- User input (13/12/2024)
