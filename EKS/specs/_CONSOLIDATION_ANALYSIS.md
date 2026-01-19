# Análise de Consolidação de Specs - EKS

**Data**: 2025-01-19  
**Objetivo**: Identificar redundâncias, merges necessários e specs obsoletas

---

## 📊 Resumo Executivo

| Categoria | Quantidade |
|-----------|------------|
| **Total de Specs** | 52 |
| **Specs Core (manter)** | 25 |
| **Specs para Merge** | 8 |
| **Specs Obsoletas (deletar)** | 5 |
| **Specs para Avaliar** | 14 |

---

## 🔴 SPECS OBSOLETAS (Recomendação: DELETAR)

### 1. `026-intelligent-router`
**Motivo**: Conceitos de "Context Depth Control" foram **totalmente absorvidos** pelo `051-context-depth-controller` que é mais completo (5 níveis D0-D4 vs 3 níveis).

**Ação**: DELETAR

---

### 2. `032-adaptive-retrieval`
**Motivo**: Conceitos de "Adaptive Retrieval" foram incorporados em:
- `024-retrieval-orchestration` (Query Profiles)
- `051-context-depth-controller` (decisão de profundidade)

**Ação**: DELETAR

---

### 3. `039-context-compression`
**Motivo**: "Rolling Summary" já está em `017-memory-ecosystem` como `ConversationSummary`. "Semantic Pruning" pode ser feito pelo CDC.

**Ação**: DELETAR (conceitos migrados para 017)

---

### 4. `027-onboarding-conversation-pipeline`
**Motivo**: Totalmente absorvido por `022-onboarding-ai-profile` que agora tem:
- Progressive Profiling (6 perguntas iniciais)
- PKP Curator Agent
- Background Extraction

**Ação**: DELETAR

---

### 5. `026-invite-only-auth` (número duplicado)
**Motivo**: Conflito de numeração com `026-intelligent-router`. Conceitos de auth devem ir para `003-admin-login-config`.

**Ação**: MERGE com 003 e DELETAR

---

## 🟡 SPECS PARA MERGE

### 1. `042-memory-steward` → MERGE com `012-graph-curation-ecosystem`

**Análise**: Memory Steward é um "agente de curadoria" focado em qualidade do grafo. O `012-graph-curation-ecosystem` já trata curadoria.

**Proposta**: 
- Adicionar conceito de "Steward Agent" como agente específico dentro de 012
- Ou referenciar como um dos "3 Agentes de Monitoramento" do 018

---

### 2. `043-trust-score-rag` → MERGE com `014-provenance-system`

**Análise**: Trust Score é essencialmente **proveniência + confiança**. O `014-provenance-system` já trata rastreabilidade.

**Proposta**:
- Adicionar seção "Trust Score Calculation" em 014
- Manter `confidence` como propriedade em 015 (já está)

---

### 3. `041-interaction-delegation-graph` → MERGE com `015-neo4j-graph-model`

**Análise**: IDG define relacionamentos de delegação e interação. Esses podem ser adicionados ao modelo de grafo.

**Proposta**:
- Adicionar em 015: `[:DELEGATED_TO]`, `[:HANDED_OFF_TO]`, `:Interaction` node
- Ou manter como extensão temática do 015

---

### 4. `030-corporate-mode` → AVALIAR MERGE com `009-user-memory-decision`

**Análise**: "Corporate Mode" parece ser uma extensão de "Corp vs Pessoal".

---

## 🟢 SPECS CORE (MANTER)

### Camada Foundation
| Spec | Status | Justificativa |
|------|--------|---------------|
| 003-admin-login-config | ✅ MANTER | Auth é essencial |
| 015-neo4j-graph-model | ✅ MANTER | Schema canônico |
| 017-memory-ecosystem | ✅ MANTER | Memória e 4 Classes |
| 040-business-intent-graph | ✅ MANTER | BIG é core |
| 050-meta-graph-schema | ✅ MANTER | Query Profiles |

### Camada Cognição
| Spec | Status | Justificativa |
|------|--------|---------------|
| 005-agent-router (PLA) | ✅ MANTER | Orquestrador principal |
| 019-multi-agent-orchestration | ✅ MANTER | Teams |
| 024-retrieval-orchestration | ✅ MANTER | Retrieval Ecosystem |
| 051-context-depth-controller | ✅ MANTER | CDC D0-D4 |

### Camada Pipeline
| Spec | Status | Justificativa |
|------|--------|---------------|
| 001-knowledge-pipeline | ✅ MANTER | Ingestão |
| 007-chat-knowledge-capture | ✅ MANTER | Captura de chat |
| 012-graph-curation-ecosystem | ✅ MANTER | Curadoria |
| 013-ingestion-ecosystem | ✅ MANTER | Ingestão docs |
| 014-provenance-system | ✅ MANTER | Proveniência |

### Camada Experiência
| Spec | Status | Justificativa |
|------|--------|---------------|
| 016-main-interface-layout | ✅ MANTER | UI principal |
| 018-observability-dashboard | ✅ MANTER | Observabilidade |
| 020-gamification-user-kpis | ✅ MANTER | Ressonância |
| 021-notification-center | ✅ MANTER | Notificações |
| 022-onboarding-ai-profile | ✅ MANTER | PKP |

### Camada Avançada
| Spec | Status | Justificativa |
|------|--------|---------------|
| 045-hierarchical-brainstorm | ✅ MANTER | Debate multi-nível |
| 046-pia-process-intelligence | ✅ MANTER | Mapeamento processos |

---

## 🔵 SPECS PARA AVALIAR (Backlog)

Estas specs podem ser úteis mas não são core para MVP:

| Spec | Avaliação |
|------|-----------|
| 002-admin-node-manager | Útil para admin |
| 004-user-agent-factory | Factory de agentes |
| 006-chat-action-menu | UX |
| 008-task-generation-canvas | Canvas |
| 009-user-memory-decision | Corp/Pessoal |
| 010-data-filtration | Real/Passageiro |
| 011-validation-agent | Validação |
| 023-agenda-calendar-system | Agenda |
| 025-conversation-persistence-system | Persistência |
| 028-file-upload | Upload |
| 029-ux-professional | UX |
| 031-design-system | Design |
| 033-mongodb-setup | MongoDB |
| 035-export-share | Export |
| 037-voice-input | Voz |
| 038-organizational-chart | Org chart |
| 044-spec-driven-simulation | Simulação |
| 047-admin-csv-upload | CSV |
| 048-meeting-participant-detection | Reuniões |
| 049-admin-dashboard | Admin |

---

## 🗑️ AÇÕES DE LIMPEZA

### Deletar Diretórios (5 specs)
```
EKS/specs/026-intelligent-router/
EKS/specs/026-invite-only-auth/
EKS/specs/027-onboarding-conversation-pipeline/
EKS/specs/032-adaptive-retrieval/
EKS/specs/039-context-compression/
```

### Renumerar Conflitos
- `026-invite-only-auth` → mover conceitos para `003-admin-login-config`
- Resolver conflito de numeração (duas 026)

---

## 📐 DIAGRAMA MACRO DA SOLUÇÃO

```mermaid
flowchart TB
    subgraph Sources["📥 FONTES"]
        Chat["💬 Chat/Conversas"]
        Docs["📄 Documentos"]
        Email["✉️ Emails"]
        Meet["🎙️ Reuniões"]
        Ext["🌐 Intel Externa"]
        CSV["📊 CSV/Planilhas"]
    end

    subgraph Ingestion["🔄 INGESTÃO (001, 013)"]
        Extract["Extração<br/>(Python + LLM)"]
        Chunk["Chunking + Embedding"]
        Classify["Classificação<br/>(memory_class)"]
    end

    subgraph Core["💎 NÚCLEO DO CONHECIMENTO"]
        direction TB
        subgraph MetaGraph["🏗️ Meta-Grafo (050)"]
            Schema["SchemaLabel<br/>SchemaRel"]
            Profiles["Query Profiles"]
            RBAC["Políticas RBAC"]
        end
        
        subgraph GraphModel["📊 Grafo Neo4j (015)"]
            Org["Org & People"]
            Content["Content & Chunks"]
            Strategy["Strategy (BIG)"]
            Process["Process & Tasks"]
        end
        
        subgraph Memory["🧠 Memória (017)"]
            Semantic["Memória Semântica"]
            Episodic["Memória Episódica"]
            Procedural["Memória Procedural"]
            Evaluative["Memória Avaliativa"]
        end
        
        subgraph BIG["🎯 Business Intent Graph (040)"]
            Purpose["Purpose/Missão"]
            Objectives["Objetivos"]
            OKRs["OKRs & Métricas"]
        end
    end

    subgraph Cognition["🧠 COGNIÇÃO"]
        direction TB
        subgraph CDC["⚡ CDC (051)"]
            D0["D0: Direta"]
            D1["D1: Local"]
            D2["D2: Conceitual"]
            D3["D3: Contestação"]
            D4["D4: Exploração"]
        end
        
        subgraph Retrieval["🔍 Retrieval (024)"]
            QueryPlan["Query Plan"]
            Search["Search Exec"]
            ContextPack["Context Pack"]
        end
        
        subgraph PLA["🤖 PLA (005)"]
            Intent["Intent Analysis"]
            Plan["Execution Plan"]
            Dispatch["Agent Dispatch"]
        end
    end

    subgraph Agents["🤖 AGENTES"]
        direction TB
        KnowledgeAgent["📚 Knowledge Agent"]
        TaskAgent["✅ Task Agent"]
        CuratorAgent["🧹 Curator Agent (012)"]
        PIAAgent["📋 PIA Agent (046)"]
        HierAgent["🏛️ Hierarchical Agents (045)"]
        PersonalAgent["👤 Personal Agent"]
    end

    subgraph Experience["✨ EXPERIÊNCIA"]
        direction TB
        subgraph UI["🖥️ Interface (016)"]
            Canvas["Canvas Principal"]
            ChatUI["Chat Panel"]
            Dashboard["Dashboards"]
        end
        
        subgraph PKP["👤 Persona (022)"]
            Profile["Profile Base"]
            Level2["Nível 2 Estratégico"]
            Preferences["Preferências"]
        end
        
        subgraph Observability["📊 Observabilidade (018)"]
            Entropy["Entropia Operacional"]
            Agents3["3 Classes de Agentes"]
            Insights["Proactive Insights"]
        end
        
        subgraph Resonance["🌊 Ressonância (020)"]
            Impact["Impacto Estrutural"]
            Notifications["Notificações Semânticas"]
        end
    end

    subgraph Output["📤 SAÍDAS"]
        Answers["💬 Respostas"]
        Tasks["✅ Tarefas"]
        Alerts["🔔 Alertas"]
        Reports["📈 Relatórios"]
        ProactiveInsights["💡 Insights Proativos"]
    end

    %% Conexões
    Sources --> Ingestion
    Ingestion --> Core
    
    Core --> Cognition
    Cognition --> Agents
    
    Agents --> Experience
    Experience --> Output
    
    Output -.->|"Feedback"| Core
    
    %% Estilos
    classDef foundation fill:#1a237e,stroke:#283593,color:#fff
    classDef cognition fill:#4a148c,stroke:#6a1b9a,color:#fff
    classDef agent fill:#004d40,stroke:#00695c,color:#fff
    classDef experience fill:#e65100,stroke:#ef6c00,color:#fff
    classDef output fill:#1b5e20,stroke:#2e7d32,color:#fff
    
    class MetaGraph,GraphModel,Memory,BIG foundation
    class CDC,Retrieval,PLA cognition
    class KnowledgeAgent,TaskAgent,CuratorAgent,PIAAgent,HierAgent,PersonalAgent agent
    class UI,PKP,Observability,Resonance experience
    class Answers,Tasks,Alerts,Reports,ProactiveInsights output
```

---

## 🎯 ARQUITETURA EM CAMADAS

```mermaid
graph TB
    subgraph L1["📥 Camada 1: Ingestão"]
        001["001 Knowledge Pipeline"]
        007["007 Chat Capture"]
        013["013 Ingestion"]
        047["047 CSV Upload"]
    end
    
    subgraph L2["💎 Camada 2: Fundação"]
        015["015 Graph Model"]
        017["017 Memory"]
        040["040 BIG"]
        050["050 Meta-Grafo"]
    end
    
    subgraph L3["🧠 Camada 3: Cognição"]
        051["051 CDC"]
        024["024 Retrieval"]
        005["005 PLA Router"]
        019["019 Multi-Agent"]
    end
    
    subgraph L4["🤖 Camada 4: Agentes"]
        012["012 Curation"]
        014["014 Provenance"]
        045["045 Hierarchical"]
        046["046 PIA"]
    end
    
    subgraph L5["✨ Camada 5: Experiência"]
        016["016 UI Layout"]
        018["018 Observability"]
        020["020 Ressonância"]
        022["022 PKP"]
    end
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    
    style L2 fill:#1a237e,color:#fff
    style L3 fill:#4a148c,color:#fff
```

---

## ✅ PRÓXIMOS PASSOS

1. **DELETAR** specs obsoletas (5 diretórios)
2. **ATUALIZAR** `_ROADMAP.md` removendo specs obsoletas
3. **MERGE** conceitos restantes
4. **VALIDAR** numeração sem conflitos
5. **DOCUMENTAR** decisões no `project-context/`

---

**Autor**: AI Assistant  
**Revisão**: Pendente aprovação do usuário

