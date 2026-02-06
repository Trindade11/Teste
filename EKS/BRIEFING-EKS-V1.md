# EKS - Enterprise Knowledge System
## Briefing Executivo V1

> **Data**: 2025-02-01  
> **Versão**: 1.0  
> **Status**: MVP em Desenvolvimento  
> **Proprietário**: CoCreateAI

---

## 🎯 O Que é o EKS?

O **EKS (Enterprise Knowledge System)** é uma **plataforma de inteligência organizacional** que transforma conhecimento disperso em inteligência acionável através de:

- **Grafo de Conhecimento Semântico** (Neo4j)
- **Agentes Multi-Especializados** (Python + Pydantic AI)
- **Chat + Canvas Interativo** (Next.js)
- **Memória Organizacional de 4 Níveis**

### Problema que Resolve

| ❌ Hoje nas Empresas | ✅ Com EKS |
|---------------------|-----------|
| Conhecimento espalhado em emails, docs, chats | Estruturado em grafo navegável |
| Decisões importantes se perdem | Rastreadas com owner/deadline/contexto |
| IA "esquece" entre conversas | Memória persistente cross-thread |
| Busca retorna texto sem contexto | GraphRAG híbrido com proveniência |
| Governança de conhecimento manual | Automática e proativa |

---

## 🏗️ Arquitetura em 5 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 5: EXPERIÊNCIA                                      │
│  Chat + Canvas | Dashboards | Onboarding | Gamificação      │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 4: AGENTES                                          │
│  Knowledge Agent | Task Agent | Curator | PIA | Hierarchy   │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 3: COGNIÇÃO                                         │
│  Personal Lead Agent | Context Depth Controller | Retrieval │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 2: FUNDAÇÃO                                         │
│  Neo4j Graph | 4 Classes de Memória | Business Intent Graph │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 1: INGESTÃO                                         │
│  Chat | Documentos | Emails | Reuniões | Intel Externa      │
└─────────────────────────────────────────────────────────────┘
```

---

## 💎 Diferenciais-Chave

### 1. Grafo como Verdade, Não Texto
O conhecimento é armazenado como **grafo semântico** (nós e relacionamentos), não como texto solto. Documentos são "projeções" do grafo.

### 2. Memória Cognitiva em 4 Classes
| Classe | Conteúdo | Exemplo |
|--------|----------|---------|
| **Semântica** | Conceitos, definições | "O que é NPS?" |
| **Episódica** | Eventos, timeline | "O que decidimos na reunião de Jan?" |
| **Procedural** | Processos, how-tos | "Como fazer onboarding de cliente?" |
| **Avaliativa** | Lições, insights | "Por que o projeto X falhou?" |

### 3. Personal Lead Agent (PLA)
Cada usuário tem um **agente pessoal** que:
- Classifica intenção da pergunta
- Escolhe profundidade de contexto (D0-D4)
- Despacha para agentes especializados
- Aprende com feedback

### 4. Business Intent Graph (BIG)
Todo conhecimento é **ancorado a objetivos de negócio**:
```
Missão → Objetivos → OKRs → Métricas
         ↓
   Conhecimento SUPPORTS Objetivo
```

### 5. Curador Ontológico (HITL)
Um humano especialista **refina a ontologia do negócio** visualmente:
- Valida sugestões da IA
- Cria relacionamentos
- Detecta antipadrões organizacionais

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Radix UI, Zustand |
| **Backend** | Node.js 20, TypeScript, Express, Socket.io |
| **Agentes** | Python 3.11, Pydantic AI, FastAPI |
| **Database** | **Neo4j Aura (EXCLUSIVO)** - Graph + Vector Search |
| **AI** | Azure OpenAI GPT-4o, text-embedding-3-large |
| **Deploy** | Vercel (FE), Railway (BE), Docker |

---

## 📊 Status Atual do Projeto

### ✅ Concluído
- Frontend layout completo
- **47 specs documentadas** (87% PT, 13% EN)
- Constitution v2.3.0 (Neo4j-only)
- Roadmap priorizado
- Arquitetura macro consolidada

### ⏳ Em Progresso
- Backend API
- Agents setup
- Sprint 1 (Foundation)

### 📋 Roadmap de Sprints

| Sprint | Foco | Duração |
|--------|------|---------|
| **Sprint 1** | Foundation (Login, Router, Pipeline) | 2 semanas |
| **Sprint 2** | Memory & Persistence | 2 semanas |
| **Sprint 3** | Agents & Teams | 2 semanas |
| **Sprint 4** | Polish & Advanced | 2 semanas |

---

## 🎯 Métricas de Sucesso

### MVP (3-4 meses)
- [ ] Extração de conhecimento de 10 conversas → grafo
- [ ] Ontologia básica com 20+ tipos de entidade
- [ ] 3 agentes funcionando (PLA, Knowledge, Task)
- [ ] RAG com trust scores
- [ ] Dashboard de demonstração

### Produção (9-12 meses)
- [ ] Sistema PIA completo com gamificação
- [ ] 6+ agentes especializados
- [ ] RAG com validação humana
- [ ] Monitoramento de inteligência externa (5+ fontes)
- [ ] Segurança enterprise
- [ ] 10,000+ nós em produção

---

## 📁 Estrutura do Projeto

```
EKS/
├── frontend/              # Next.js 14 UI
├── backend/               # Node.js API  
├── agents/                # Python agents
├── specs/                 # 47 Feature specs
├── project-context/       # Database schema, env vars
├── docs/                  # Documentação
└── docker-compose.yml
```

---

## 🔑 Specs Mais Importantes

| # | Spec | Propósito |
|---|------|-----------|
| **015** | neo4j-graph-model | Modelo de dados canônico |
| **017** | memory-ecosystem | 4 classes de memória |
| **005** | agent-router (PLA) | Personal Lead Agent |
| **051** | context-depth-controller | Controle de profundidade D0-D4 |
| **040** | business-intent-graph | Ancoragem a objetivos |
| **052** | ontological-curator-interface | Interface HITL |

---

## 💡 Inovações Principais

1. **Spec-Driven Graph Simulation** - O grafo emerge do uso, não do design
2. **Knowledge as Graph** - Texto é projeção, grafo é verdade
3. **Multi-Level Agents** - Hierarquia Op/Ger/Tac/Est com debates cruzados
4. **Gamified Mapping** - Colaboradores como "sensores" de conhecimento
5. **Trust-Transparent RAG** - Todo chunk tem score de confiança explícito

---

## 📞 Contato

- **Proprietário**: CoCreateAI
- **Email**: dev@cocreateai.com.br
- **Licença**: Proprietária

---

**Versão do Briefing**: V1  
**Última Atualização**: 2025-02-01
