# Project Workplan

> Agent orchestration plan: which agents to call, in what order, and current status.

---

## Current Phase

**Active Phase**: 3 – Specification (core backend MVP + user experience)  
**Next Recommended Action**: 
1. Iniciar etapa de Planning (`/speckit-plan`) para o MVP Core (Auth/Admin 003, Onboarding & AI Profile 022, Chat & Knowledge 007/009, Memory Ecosystem 017/025, Retrieval Orchestration 024, Observability 018). 
2. A partir do plano, derivar tarefas com `/speckit-tasks` antes de iniciar implementação.

**Recent Progress** (2025-12-07):
- ✅ Especificações centrais 007–023 criadas: Chat, Task Canvas, Memory Decision, Data Filtration, Validation, Graph Curation, Ingestion, Provenance, Neo4j Model, Main UI, Memory Ecosystem, Observability, Multi-Agent Orchestration, Gamification, Notifications, Onboarding & AI Profile, Agenda & Calendar
- ✅ Sistema de auto-aperfeiçoamento completo: Memory Decay ↔ FeedbackAgent ↔ Persona versionada
- ✅ Canvas adaptativo em tempo real com base em AI Profile do usuário
- ✅ Menu adaptativo que otimiza baseado na experiência do usuário
- ✅ Agenda & Calendar System com integração a Tarefas e visualização % pessoal vs corporativo
- ✅ Specs 024 (Retrieval Orchestration) e 025 (Conversation Persistence System) criadas e integradas com Memory Ecosystem (017), Observability (018), Multi-Agent (019) e Chat/Knowledge (007/009).
- ✅ Admin Login (003) e Onboarding & AI Profile (022) refinados para onboarding por tipo de organização/papel, com fluxo chat + Canvas e recuperação de senha prevista.

---

## Agent Execution Plan

| # | Phase | Agent | Goal | Status | Notes |
|---|-------|-------|------|--------|-------|
| 0 | Setup | `/speckit-context` | Initialize project context | ✅ DONE | Completed |
| 1 | Triage | `/speckit-triage` | Clarify scope, macro view, backlogs | ✅ DONE | 9 rounds completed |
| 2 | Constitution | `/speckit-constitution` | Consolidate principles & rules | ✅ DONE | 22 principles consolidated |
| 3 | Specification | `/speckit-specify` | Create feature specs | 🔄 IN_PROGRESS | Núcleo backend/UX especificado (001, 003-006, 007-025); backlog P2/P3 ainda aberto |
| 4 | Planning | `/speckit-plan` | Technical design & structure | 🔄 IN_PROGRESS | MVP Core Plan criado (10 semanas, 5 fases) |
| 5 | Tasks | `/speckit-tasks` | Break plan into tasks | ⬜ TODO | – |
| 6 | Implementation | `/speckit-implement` | Execute tasks, create code | ⬜ TODO | – |

**Legend**: ⬜ TODO | 🔄 IN_PROGRESS | ✅ DONE | ⏭️ SKIPPED

---

## Decision Points

| ID | Decision | Description | Status | Decided At | Link |
|----|----------|-------------|--------|------------|------|
| DP1 | Project Structure | Define folder structure and module organization | ⬜ PENDING | – | `folder-structure.md` |
| DP2 | Tech Stack | Core technologies, frameworks, and constraints | ⬜ PENDING | – | `constitution.md` |

---

## Triage Rounds Log

<!-- Each triage round should be logged here to track progressive refinement -->

| Round | Date | Focus | Outputs Updated | Gaps Remaining |
|-------|------|-------|-----------------|----------------|
| 1 | 2025-12-06 | Initial scope from voice transcription | triage_constitution.md, triage_specification.md, triage_log.json | GAP-001, GAP-002, GAP-003 |
| 2 | 2025-12-06 | Backend refinement - ecosystems, routing, auto-improvement | +3 constitution, +6 specification | GAP-001 |
| 3 | 2025-12-06 | Memory system deep-dive, refinements, observability | +5 constitution, +7 specification (4 refinements) | GAP-001 |
| 4 | 2025-12-06 | Curadoria, Proveniência, Classificação de dados | +5 specification (2 refinements) | GAP-001, GAP-004, GAP-005 |
| 5 | 2025-12-06 | Sistema adaptativo, Pipeline de conhecimento, Metadados | +4 specification (1 refinement) | GAP-001 ativo |
| 6 | 2025-12-06 | Contexto profissional, Freshness, Priority nodes | +4 specification (2 refinements) | - |
| 7 | 2025-12-07 | Decisão memória usuário, Filtração Real/Passageiro, Persistência conversa, Conhecimento área | +4 specification (1 refinement) | - |
| 8 | 2025-12-07 | Markdown Rendering, Canvas Context, Agno documentado | +2 specification | GAP-002 fechado |
| 9 | 2025-12-07 | Enriquecimento via chat.txt - Plano Interativo, Seleção no Chat, Busca Externa, Reuniões, Resumo, Avaliação, Skills | +8 specification | - |

---

## Backlog Summary

### Constitution Backlog

<!-- Items identified during triage that should become project principles/rules -->

| ID | Principle | Status |
|----|-----------|--------|
| TRG-CON-001 | ZERO HARDCODE | ✅ absorbed → A.I |
| TRG-CON-002 | NÃO POLUIR CÓDIGO | ✅ absorbed → A.II |
| TRG-CON-003 | FRAMEWORK AGNO | ✅ absorbed → A.III |
| TRG-CON-004 | GESTÃO DE PROMPTS | ✅ absorbed → A.IV |
| TRG-CON-005 | MUDANÇAS INCREMENTAIS | ✅ absorbed → A.V |
| TRG-CON-006 | GRAFOS CENTRAL | ✅ absorbed → A.VI |
| TRG-CON-007 | CONTEXT7 MCP | ✅ absorbed → A.VII |
| TRG-CON-008 | STACK DEFINIDO | ✅ absorbed → A.VIII |
| TRG-CON-009 | STAKEHOLDERS | ✅ absorbed → A.IX |
| TRG-CON-010 | AUTO-IMPROVEMENT | ✅ absorbed → A.X |
| TRG-CON-011 | FEEDBACK ESTATÍSTICO | ✅ absorbed → A.XI |
| TRG-CON-012 | SEPARAÇÃO ADMIN/USUÁRIO | ✅ absorbed → A.XII |
| TRG-CON-013 | CADUCIDADE DE NODES | ✅ absorbed → A.XIII |
| TRG-CON-014 | MEMÓRIA MULTINÍVEL | ✅ absorbed → A.XIV |
| TRG-CON-015 | VISIBILIDADE HIERÁRQUICA | ✅ absorbed → A.XV |
| TRG-CON-016 | MEMÓRIA RELACIONAL | ✅ absorbed → A.XVI |
| TRG-CON-017 | CONFLITO DE MEMÓRIA | ✅ absorbed → A.XVII |
| TRG-CON-018 | RACIOCÍNIO ESTRUTURADO DO AGENTE | ✅ absorbed → A.XVIII |
| TRG-CON-019 | LIMITE DE PROFUNDIDADE DE BUSCA | ✅ absorbed → A.XIX |

### Specification Backlog

<!-- Features/capabilities identified durante triage that need specs -->

| ID | Feature | Priority | Status | Spec File |
|----|---------|----------|--------|-----------|
| TRG-SPC-001 | Chat & Knowledge Capture | P1 (MVP) | ✅ completed | `specs/007-chat-knowledge-capture/spec.md` |
| TRG-SPC-002 | Task Generation & Canvas | P1 (MVP) | ✅ completed | `specs/008-task-generation-canvas/spec.md` |
| TRG-SPC-007 | Main Interface Layout | P1 | ✅ completed | `specs/016-main-interface-layout/spec.md` |
| TRG-SPC-008 | User Agent Factory | P1 (Backend) | ✅ completed | `specs/004-user-agent-factory/spec.md` |
| TRG-SPC-009 | Agent Router System | P1 (Backend) | ✅ completed | `specs/005-agent-router/spec.md` |
| TRG-SPC-010 | Validation Agent | P1 (Backend) | ✅ completed | `specs/011-validation-agent/spec.md` |
| TRG-SPC-NEW-001 | Admin Login & Config System | P1 (Backend) | ✅ completed | `specs/003-admin-login-config/spec.md` |
| TRG-SPC-NEW-002 | Chat Action Menu System | P1 (MVP) | ✅ completed | `specs/006-chat-action-menu/spec.md` |
| TRG-SPC-003 | Document Ingestion Pipeline | P2 | ⬜ pending |
| TRG-SPC-004 | Multi-Agent Orchestration | P2 | ✅ completed | `specs/019-multi-agent-orchestration/spec.md` |
| TRG-SPC-005 | Graph Data Model (Neo4j) | P2 | ✅ completed | `specs/015-neo4j-graph-model/spec.md` |
| TRG-SPC-011 | Ingestion Ecosystem | P2 | ✅ completed | `specs/013-ingestion-ecosystem/spec.md` |
| TRG-SPC-012 | Retrieval Ecosystem | P2 | ✅ completed | `specs/024-retrieval-orchestration/spec.md` |
| TRG-SPC-013 | Memory Ecosystem | P2 | ✅ completed | `specs/017-memory-ecosystem/spec.md` |
| TRG-SPC-014 | Memory Decay Agent | P2 | ✅ completed | `specs/017-memory-ecosystem/spec.md` |
| TRG-SPC-015 | Proactive Questions System | P2 | ⬜ pending |
| TRG-SPC-016 | Observability Dashboard | P2 | ✅ completed | `specs/018-observability-dashboard/spec.md` |
| TRG-SPC-021 | Graph Curation Ecosystem | P1 (Core) | ✅ completed | `specs/012-graph-curation-ecosystem/spec.md` |
| TRG-SPC-022 | Retrieval Provenance System | P1 (Core) | ✅ completed | `specs/014-provenance-system/spec.md` |
| TRG-SPC-023 | Document Classification System | P2 | ⬜ pending |
| TRG-SPC-026 | Adaptive Knowledge System | P1 (Core) | ⬜ pending |
| TRG-SPC-028 | Knowledge Pipeline | P1 (Core) | ✅ specified |
| TRG-SPC-029 | Neo4j Metadata Model | P1 (Core) | ⬜ pending |
| TRG-SPC-031 | Relationship Freshness System | P1 (Core) | ⬜ pending |
| TRG-SPC-032 | Priority Nodes System | P1 | ⬜ pending |
| TRG-SPC-034 | User Memory Decision System | P1 (Core) | ✅ completed | `specs/009-user-memory-decision/spec.md` |
| TRG-SPC-035 | Data Filtration (Real vs Transient) | P1 (Core) | ✅ completed | `specs/010-data-filtration/spec.md` |
| TRG-SPC-036 | Conversation Persistence System | P1 (Core) | ✅ completed | `specs/025-conversation-persistence-system/spec.md` |
| TRG-SPC-037 | Active Area Knowledge System | P1 (Core) | ⬜ pending |
| TRG-SPC-038 | Markdown Rendering System | P1 (Core) | ⬜ pending |
| TRG-SPC-039 | Canvas Context System | P1 (Core) | ⬜ pending |
| TRG-SPC-040 | Interactive Action Plan Canvas | P1 (MVP) | ⬜ pending |
| TRG-SPC-041 | Chat Context Selector | P1 (MVP) | ⬜ pending |
| TRG-SPC-042 | External Knowledge Search | P1 (Core) | ⬜ pending |
| TRG-SPC-043 | Meeting Document Processor | P2 | ⬜ pending |
| TRG-SPC-044 | Table to JSON Converter | P2 | ⬜ pending |
| TRG-SPC-045 | Conversation Summary System | P1 (Core) | ✅ covered | `specs/017-memory-ecosystem/spec.md` + `specs/025-conversation-persistence-system/spec.md` |
| TRG-SPC-046 | Agent Selection Evaluator | P1 (Backend) | ⬜ pending |
| TRG-SPC-047 | User Skills Mapper | P1 (Core) | ⬜ pending |
| TRG-SPC-006 | User Onboarding Flow | P3 | ✅ completed | `specs/022-onboarding-ai-profile/spec.md` |

---

## Project Start Checklist

Use this checklist to ensure proper project initialization:

- [x] **Step 0**: Run `/speckit-context` to create project context structure
- [x] **Step 1**: Run `/speckit-triage` (first round) to capture initial scope
- [ ] **Step 2**: Continue `/speckit-triage` (N rounds) until macro view is stable
- [ ] **Step 3**: Decision Point DP1 – Define project structure
- [x] **Step 4**: Run `/speckit-constitution` to consolidate principles
- [x] **Step 5**: Run `/speckit-specify` for priority features
- [x] **Step 6**: Run `/speckit-plan` for technical design
- [ ] **Step 7**: Run `/speckit-tasks` to break into actionable items
- [ ] **Step 8**: Run `/speckit-implement` to execute

---

## Quick Links

- [Project Overview](./project-overview.md)
- [Folder Structure](./folder-structure.md)
- [Constitution](../Spec-Orchestrator/.specify/memory/constitution.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V1 | 2025-12-06 | Initial workplan created |
| V2 | 2025-12-06 | Triage Round 1 completed - 9 constitution, 7 specification entries |
| V3 | 2025-12-06 | Triage Round 2 - Backend focus (+3 constitution, +6 specification) |
| V4 | 2025-12-06 | Constitution v2.0.0 - 12 principles absorbed |
| V5 | 2025-12-06 | Triage Round 3 - Memory system, refinements (+5 con, +7 spec) |
| V6 | 2025-12-06 | Constitution v2.1.0 - 19 principles (absorbed +7 memory system) |
| V7 | 2025-12-06 | Triage Round 4 - Curadoria, Proveniência (+5 spec) |
| V8 | 2025-12-06 | Triage Round 5 - Sistema adaptativo, Pipeline (+4 spec) |
| V9 | 2025-12-06 | Triage Round 6 + Fluxos Visuais + DB Schema expandido |
| V10 | 2025-12-07 | Triage Round 7 - Decisão memória usuário, Filtração dados (+4 spec) |
| V11 | 2025-12-07 | Refinamento geral - Constitution v2.2.0, Gaps fechados |
| V12 | 2025-12-07 | Round 8 + Agno reference doc + GAP-002 fechado |
| V13 | 2025-12-07 | Round 9 - Enriquecimento via chat.txt (+8 spec) |
| V14 | 2025-12-07 | Especificação massiva: 16 specs criadas (007-022) - Chat, Task Canvas, Memory Decision, Data Filtration, Validation, Graph Curation, Ingestion, Provenance, Neo4j Model, Main UI, Memory Ecosystem, Observability, Multi-Agent Orchestration, Gamification, Notifications, Onboarding & AI Profile. Sistema de auto-aperfeiçoamento completo (Memory Decay ↔ FeedbackAgent ↔ Persona versionada). Canvas adaptativo em tempo real. |
| V15 | 2025-12-07 | Spec 023 (Agenda & Calendar System) criada + Melhorias UX: Menu adaptativo (016), Histórico expansível no chat (007), Botão de tipo de conhecimento visível (007). Spec 017 atualizada: Sistema de compressão Fibonacci para histórico de chat (resumos progressivos em camadas 5, 8, 13, 21, 34, 55...) mantendo visão ampla sem explodir contexto da LLM. |
| V16 | 2025-12-07 | Specs 024 (Retrieval Orchestration) e 025 (Conversation Persistence System) criadas e alinhadas com Memory Ecosystem (017), Chat/Knowledge (007/009) e Observability (018). |
| V17 | 2025-12-07 | Ajustes macro: simplificação da sumarização em 017 (modelo enxuto com resumos agregados), refinamento de onboarding/admin (003, 022) e costura 017+018+019 em ciclo de feedback. |
| V18 | 2025-12-07 | MVP Core Plan criado: arquitetura completa (frontend+backend+agents), 5 fases de implementação (10 semanas), integração do frontend Next.js existente com backend Node.js/TypeScript e agents Python/Agno, Neo4j como database central. |
