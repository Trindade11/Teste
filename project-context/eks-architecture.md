# EKS - Arquitetura Macro do Sistema

> **Atualizado**: 2025-01-19  
> **Status**: Consolidado após revisão de specs

---

## 🎯 Visão do Sistema

O **EKS (Enterprise Knowledge System)** é uma plataforma de inteligência organizacional que:

1. **Captura** conhecimento de múltiplas fontes (chat, documentos, reuniões, emails)
2. **Estrutura** em um grafo de conhecimento vivo (Neo4j)
3. **Classifica** por 4 classes de memória cognitiva
4. **Ancora** a objetivos de negócNio (Business Intent Graph)
5. **Recupera** com profundidade controlada (CDC D0-D4)
6. **Orquestra** agentes especializados (PLA)
7. **Gera** insights proativos (não apenas respostas)

---

## 📐 Arquitetura em 5 Camadas

```mermaid
flowchart TB
    subgraph L1["📥 CAMADA 1: INGESTÃO"]
        direction LR
        S1["💬 Chat"]
        S2["📄 Documentos"]
        S3["✉️ Emails"]
        S4["🎙️ Reuniões"]
        S5["📊 CSV/Planilhas"]
        S6["🌐 Intel Externa"]
        
        P1["001 Knowledge Pipeline"]
        P2["013 Ingestion Ecosystem"]
        
        S1 & S2 & S3 & S4 & S5 & S6 --> P1 & P2
    end

    subgraph L2["💎 CAMADA 2: FUNDAÇÃO"]
        direction TB
        
        subgraph Neo4j["🗄️ Neo4j (015)"]
            Nodes["Labels: User, Department, Document, Knowledge, Process..."]
            Rels["Rels: WORKS_AT, REPORTS_TO, SUPPORTS, HAS_CHUNK..."]
            Props["Props: confidence, coherence, recency, idx..."]
        end
        
        subgraph MetaGrafo["🏗️ Meta-Grafo (050)"]
            Schema["SchemaLabel, SchemaRel, SchemaProp"]
            QueryProfiles["Query Profiles: org_context, document_evidence, process_state, strategy_alignment"]
            RBAC["RBAC: level (strategic/tactical/operational)"]
        end
        
        subgraph Memory["🧠 Memória (017)"]
            MC1["Semântica: Conceitos, definições"]
            MC2["Episódica: Eventos, timeline"]
            MC3["Procedural: Processos, playbooks"]
            MC4["Avaliativa: Lições, insights"]
        end
        
        subgraph BIG["🎯 Business Intent Graph (040)"]
            Purpose["Purpose/Missão"]
            Objective["Objetivos Estratégicos"]
            OKR["OKRs & Métricas"]
        end
    end

    subgraph L3["🧠 CAMADA 3: COGNIÇÃO"]
        direction TB
        
        subgraph CDC["⚡ Context Depth Controller (051)"]
            D0["D0: Resposta Direta"]
            D1["D1: Continuidade Local"]
            D2["D2: Profundidade Conceitual"]
            D3["D3: Contestação"]
            D4["D4: Exploração"]
        end
        
        subgraph Retrieval["🔍 Retrieval Orchestrator (024)"]
            QP["Query Profile Selection"]
            Search["Multi-strategy Search"]
            CP["Context Pack Assembly"]
        end
        
        subgraph PLA["🤖 Personal Lead Agent (005)"]
            Intent["Intent Classification"]
            Planning["Execution Planning"]
            Dispatch["Agent Dispatch"]
            Learning["Outcome Learning"]
        end
    end

    subgraph L4["🤖 CAMADA 4: AGENTES"]
        direction LR
        
        KA["📚 Knowledge Agent"]
        TA["✅ Task Agent"]
        CA["🧹 Curator Agent (012)"]
        PA["📋 PIA Agent (046)"]
        HA["🏛️ Hierarchical Agents (045)"]
        MA["📊 Monitoring Agents (018)"]
    end

    subgraph L5["✨ CAMADA 5: EXPERIÊNCIA"]
        direction TB
        
        subgraph UI["🖥️ Interface (016)"]
            Canvas["Canvas Principal"]
            ChatUI["Chat Panel"]
            Dashboard["Dashboards"]
        end
        
        subgraph PKP["👤 Persona Knowledge Profile (022)"]
            Initial["6 Perguntas Iniciais"]
            Progressive["Background Extraction"]
            Level2["Nível 2: Tripé Ontológico"]
        end
        
        subgraph Obs["📊 Observabilidade (018)"]
            Entropy["Entropia Operacional"]
            Proactive["Agentes Proativos"]
            Metrics["Métricas de Saúde"]
        end
        
        subgraph Res["🌊 Ressonância (020)"]
            Impact["Impacto Estrutural"]
            SemNot["Notificações Semânticas"]
        end
    end

    subgraph Output["📤 SAÍDAS"]
        O1["💬 Respostas Contextualizadas"]
        O2["✅ Tarefas Geradas"]
        O3["🔔 Alertas Proativos"]
        O4["💡 Insights Estratégicos"]
        O5["📈 Relatórios"]
    end

    %% Fluxo Principal
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> Output
    
    Output -.->|"Feedback Loop"| L2

    %% Estilos
    classDef ingestion fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef foundation fill:#1a237e,stroke:#283593,color:#fff
    classDef cognition fill:#4a148c,stroke:#6a1b9a,color:#fff
    classDef agents fill:#004d40,stroke:#00695c,color:#fff
    classDef experience fill:#e65100,stroke:#ef6c00,color:#fff
    classDef output fill:#1b5e20,stroke:#2e7d32,color:#fff
    
    class L1 ingestion
    class L2,Neo4j,MetaGrafo,Memory,BIG foundation
    class L3,CDC,Retrieval,PLA cognition
    class L4,KA,TA,CA,PA,HA,MA agents
    class L5,UI,PKP,Obs,Res experience
    class Output,O1,O2,O3,O4,O5 output
```

---

## 🔑 Specs Core por Camada

### Camada 1: Ingestão
| Spec | Propósito |
|------|-----------|
| 001-knowledge-pipeline | Pipeline de extração de conhecimento |
| 007-chat-knowledge-capture | Captura de conhecimento do chat |
| 013-ingestion-ecosystem | Ecossistema de ingestão de documentos |

### Camada 2: Fundação
| Spec | Propósito |
|------|-----------|
| 015-neo4j-graph-model | Modelo de dados canônico |
| 017-memory-ecosystem | 4 classes de memória + bitemporal |
| 040-business-intent-graph | Ancoragem a objetivos |
| 050-meta-graph-schema | Schema-as-data + Query Profiles |

### Camada 3: Cognição
| Spec | Propósito |
|------|-----------|
| 051-context-depth-controller | Controle de profundidade D0-D4 |
| 024-retrieval-orchestration | Orquestração de recuperação |
| 005-agent-router (PLA) | Personal Lead Agent |

### Camada 4: Agentes
| Spec | Propósito |
|------|-----------|
| 012-graph-curation-ecosystem | Curadoria do grafo |
| 019-multi-agent-orchestration | Orquestração de times |
| 045-hierarchical-brainstorm | Debate multi-nível |
| 046-pia-process-intelligence | Mapeamento de processos |

### Camada HITL (Human-in-the-Loop)
| Spec | Propósito |
|------|-----------|
| **052-ontological-curator-interface** | **Epicentro HITL** - Interface para Curador Ontológico refinar a ontologia viva do negócio através de visualização interativa do grafo |

> **Crítico**: O Curador Ontológico NÃO é um Admin nem um Agente IA. É o humano especialista que conhece o negócio e atua sobre o schema semântico dinâmico. Sem esse papel, o EKS não é um sistema cognitivo organizacional - é apenas um RAG sofisticado.

### Camada 5: Experiência
| Spec | Propósito |
|------|-----------|
| 016-main-interface-layout | Layout da interface |
| 018-observability-dashboard | Observabilidade + Entropia |
| 020-gamification-user-kpis | Ressonância |
| 022-onboarding-ai-profile | PKP |

---

## 🔄 Fluxo de Dados Principal

```mermaid
sequenceDiagram
    participant User
    participant Chat as Chat UI
    participant PLA as Personal Lead Agent
    participant CDC as Context Depth Controller
    participant Retrieval
    participant Neo4j
    participant Agent as Specialized Agent
    participant Memory
    
    User->>Chat: Pergunta
    Chat->>PLA: Mensagem + Contexto
    
    PLA->>PLA: Classificar Intenção
    PLA->>CDC: Solicitar Profundidade
    
    CDC->>CDC: Detectar Sinais (D0-D4)
    CDC->>Retrieval: Retrieval Plan
    
    Retrieval->>Neo4j: Query com Profile
    Neo4j-->>Retrieval: Nodes + Rels
    Retrieval->>Memory: Get Memory Classes
    Memory-->>Retrieval: Semantic/Episodic/Procedural
    
    Retrieval-->>CDC: Context Pack
    CDC-->>PLA: Contexto Estruturado
    
    PLA->>Agent: Dispatch + Context
    Agent->>Agent: Processar
    Agent-->>PLA: Resposta
    
    PLA-->>Chat: Resposta Final
    Chat-->>User: Exibir com Proveniência
    
    Note over Neo4j,Memory: Feedback Loop: Atualizar grafo com interação
```

---

## 🧠 As 4 Classes de Memória

```mermaid
mindmap
  root((Memória EKS))
    Semântica
      Conceitos
      Definições
      Ontologia
      Fatos estáveis
    Episódica
      Eventos
      Reuniões
      Timeline
      Contexto temporal
    Procedural
      Processos
      Playbooks
      How-tos
      Fluxos
    Avaliativa
      Lições
      Insights
      Sucessos/Falhas
      Sabedoria
```

---

## 🎯 Business Intent Graph (BIG)

```mermaid
graph TD
    Company[🏢 Organization] --> Purpose[🎯 Purpose/Missão]
    
    Purpose --> Obj1[📌 Objetivo 1]
    Purpose --> Obj2[📌 Objetivo 2]
    Purpose --> Obj3[📌 Objetivo 3]
    
    Obj1 --> OKR1a[📊 OKR 1.1]
    Obj1 --> OKR1b[📊 OKR 1.2]
    Obj2 --> OKR2a[📊 OKR 2.1]
    Obj3 --> OKR3a[📊 OKR 3.1]
    
    OKR1a --> M1[📈 Metric 1]
    OKR1b --> M2[📈 Metric 2]
    
    Knowledge1[📚 Knowledge] -->|SUPPORTS| Obj1
    Knowledge2[📚 Knowledge] -->|SUPPORTS| Obj2
    Process1[⚙️ Process] -->|CONTRIBUTES_TO| Obj1
    
    style Purpose fill:#e91e63,color:#fff
    style Obj1 fill:#9c27b0,color:#fff
    style Obj2 fill:#9c27b0,color:#fff
    style Obj3 fill:#9c27b0,color:#fff
```

---

## ⚡ Context Depth Controller (CDC)

```mermaid
flowchart LR
    Query[Pergunta] --> Detect[Detectar Sinais]
    
    Detect --> D0{D0?<br/>Factual simples}
    Detect --> D1{D1?<br/>Pronomes, continuação}
    Detect --> D2{D2?<br/>Explica, por quê}
    Detect --> D3{D3?<br/>Não concordo, correção}
    Detect --> D4{D4?<br/>Novo tema}
    
    D0 --> R0[500 tokens<br/>Working Set]
    D1 --> R1[1500 tokens<br/>+ Episodic]
    D2 --> R2[3000 tokens<br/>+ Semantic]
    D3 --> R3[4000 tokens<br/>+ Claims]
    D4 --> R4[2500 tokens<br/>Reset + Anchor]
    
    R0 & R1 & R2 & R3 & R4 --> Pack[Context Pack]
```

---

## 📊 Specs Consolidadas (26 Core)

| # | Spec | Camada | Status |
|---|------|--------|--------|
| 001 | knowledge-pipeline | Ingestão | ✅ Core |
| 005 | agent-router (PLA) | Cognição | ✅ Core |
| 007 | chat-knowledge-capture | Ingestão | ✅ Core |
| 012 | graph-curation-ecosystem | Agentes | ✅ Core |
| 013 | ingestion-ecosystem | Ingestão | ✅ Core |
| 014 | provenance-system | Agentes | ✅ Core |
| 015 | neo4j-graph-model | Fundação | ✅ Core |
| 016 | main-interface-layout | Experiência | ✅ Core |
| 017 | memory-ecosystem | Fundação | ✅ Core |
| 018 | observability-dashboard | Experiência | ✅ Core |
| 019 | multi-agent-orchestration | Agentes | ✅ Core |
| 020 | gamification-user-kpis | Experiência | ✅ Core |
| 021 | notification-center | Experiência | ✅ Core |
| 022 | onboarding-ai-profile (PKP) | Experiência | ✅ Core |
| 024 | retrieval-orchestration | Cognição | ✅ Core |
| 040 | business-intent-graph | Fundação | ✅ Core |
| 045 | hierarchical-brainstorm | Agentes | ✅ Core |
| 046 | pia-process-intelligence | Agentes | ✅ Core |
| 050 | meta-graph-schema | Fundação | ✅ Core |
| 051 | context-depth-controller | Cognição | ✅ Core |
| **052** | **ontological-curator-interface** | **HITL** | ✅ **Core (P0)** |

---

## 🔗 Dependências Entre Specs

```mermaid
graph TD
    050[050 Meta-Grafo] --> 015[015 Graph Model]
    050 --> 051[051 CDC]
    050 --> 052[052 Curator Interface]
    
    015 --> 017[017 Memory]
    015 --> 040[040 BIG]
    
    017 --> 051
    040 --> 051
    
    051 --> 024[024 Retrieval]
    024 --> 005[005 PLA]
    
    005 --> 019[019 Multi-Agent]
    005 --> 012[012 Curation]
    
    042[042 Memory Steward] --> 052
    012 --> 052
    
    019 --> 018[018 Observability]
    012 --> 018
    052 --> 018
    
    018 --> 020[020 Ressonância]
    
    015 --> 022[022 PKP]
    022 --> 005
    
    style 050 fill:#1a237e,color:#fff
    style 015 fill:#1a237e,color:#fff
    style 017 fill:#1a237e,color:#fff
    style 040 fill:#1a237e,color:#fff
    style 051 fill:#4a148c,color:#fff
    style 024 fill:#4a148c,color:#fff
    style 005 fill:#4a148c,color:#fff
    style 052 fill:#c62828,color:#fff
```

---

## 🧑‍🔬 O Curador Ontológico (HITL Core)

> "O EKS só se autoaperfeiçoa de forma sustentável quando o aprendizado estatístico é subordinado a uma ontologia de negócio curada visualmente por humanos que entendem a organização."

```mermaid
flowchart LR
    subgraph AI["🤖 IA (Auto-aperfeiçoamento)"]
        Steward[Memory Steward]
        Suggestions[Sugestões]
    end
    
    subgraph HITL["🧑‍🔬 HITL (Curador Ontológico)"]
        Visual[Visualização Grafo]
        Refine[Refinamento Schema]
        Validate[Validação Humana]
    end
    
    subgraph Business["🏢 Negócio"]
        Ontology[Ontologia Viva]
        Quality[Qualidade Conhecimento]
    end
    
    Steward --> Suggestions
    Suggestions --> Visual
    Visual --> Validate
    Validate -->|Aprovar/Rejeitar| Steward
    Validate --> Refine
    Refine --> Ontology
    Ontology --> Quality
    
    style HITL fill:#c62828,color:#fff
    style Validate fill:#ff5722,color:#fff
```

### O que o Curador Faz
- **Explora** o grafo visualmente para identificar padrões/anomalias
- **Valida** sugestões do Memory Steward (aprovar/rejeitar/modificar)
- **Cria** relacionamentos entre entidades
- **Refina** o schema (novos labels, propriedades, regras)
- **Detecta** antipadrões organizacionais (centralizadores, ciclos, órfãos)
- **Ensina** a IA através de feedback (reinforcement learning)

---

**Última Atualização**: 2025-01-19

---

## 📚 Fontes Canônicas

> Este é o **documento mestre** de arquitetura. Outros arquivos na pasta `project-context/` estão deprecados.

| Aspecto | Fonte Canônica |
|---------|----------------|
| **Arquitetura Geral** | Este arquivo (`eks-architecture.md`) |
| **Modelo de Dados** | `EKS/specs/015-neo4j-graph-model/spec.md` |
| **Meta-Grafo** | `EKS/specs/050-meta-graph-schema/spec.md` |
| **Memória** | `EKS/specs/017-memory-ecosystem/spec.md` |
| **CDC** | `EKS/specs/051-context-depth-controller/spec.md` |
| **HITL / Curador Ontológico** | `EKS/specs/052-ontological-curator-interface/spec.md` |
| **Agentes** | `EKS/specs/019-multi-agent-orchestration/spec.md` |
| **Roadmap** | `EKS/specs/_ROADMAP.md` |
| **Env Vars** | `project-context/env-vars.md` (operacional) |
| **Tools** | `project-context/tools-registry.md` (operacional) |

### Arquivos Deprecados

- ~~`project-overview.md`~~ → Use este arquivo
- ~~`agent-framework.md`~~ → Use spec 019
- ~~`database-schema.md`~~ → Use spec 015 + 050
- ~~`project-workplan.md`~~ → Use `_ROADMAP.md`

