# Framework EKS - Visão Completa

## 1. Arquitetura Macro (4 Camadas)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e3a8a', 'primaryTextColor': '#fff', 'primaryBorderColor': '#60a5fa', 'lineColor': '#3b82f6', 'secondaryColor': '#10b981', 'tertiaryColor': '#f59e0b'}}}%%
graph TB
    subgraph UI["🎨 UI LAYER"]
        Chat["💬 Chat Interface<br/>(Real-time)"]
        Canvas["🖼️ Canvas Workspace<br/>(Persistent + Interactive)"]
        Visualizer["📊 Graph Visualizer<br/>(Navegação Macro→Micro)"]
    end
    
    subgraph Orchestration["⚙️ ORCHESTRATION LAYER"]
        LG["🔄 LangGraph Runtime<br/>(State Machine)"]
        IM["⏸️ Interrupt Manager<br/>(Human-in-Loop)"]
        CE["🧠 Context Engineer<br/>(Select + Compress)"]
    end
    
    subgraph Memory["💾 MEMORY & SEMANTIC LAYER"]
        STM["⚡ Short-Term<br/>(Checkpoints)"]
        LTM["🗄️ Long-Term<br/>(MongoDB Store)"]
        SG["🕸️ Semantic Graph<br/>(Neo4j)"]
        VS["🔍 Vector Store<br/>(Atlas Search)"]
    end
    
    subgraph Agents["🤖 AGENT ECOSYSTEM"]
        direction LR
        PIA["👷 PIA<br/>(Process Intelligence)"]
        EKB["📚 EKB Agents<br/>(Foundational + Business)"]
        ACP["❓ Clarificador<br/>(Proativo)"]
        IEP["🌐 IEP<br/>(Intel Externa)"]
    end
    
    Chat <--> Canvas
    Canvas <--> Visualizer
    
    Chat --> LG
    Canvas --> IM
    Visualizer --> CE
    
    LG --> STM
    LG --> LTM
    IM --> SG
    CE --> VS
    
    STM -.Context.-> Agents
    LTM -.Memory.-> Agents
    SG -.Semantic.-> Agents
    VS -.Retrieval.-> Agents
    
    Agents --> LG
    
    style UI fill:#1e40af,color:#fff
    style Orchestration fill:#047857,color:#fff
    style Memory fill:#b45309,color:#fff
    style Agents fill:#7c2d12,color:#fff
```

---

## 2. Semantic Graph - Ontologia Base

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4f46e5', 'secondaryColor': '#06b6d4', 'tertiaryColor': '#f59e0b', 'lineColor': '#6366f1'}}}%%
graph LR
    subgraph Identity["🏢 IDENTITY LAYER"]
        Company["CompanySnapshot<br/>📋 Narrativa<br/>📊 Métricas<br/>📅 Timeline"]
        Person["ProfileSnapshot<br/>👤 Pessoa<br/>💼 Papel<br/>🎯 Expertise"]
    end
    
    subgraph Perspectives["🔭 PERSPECTIVES"]
        PS1["PerspectiveSummary<br/>💰 Tesouraria"]
        PS2["PerspectiveSummary<br/>👥 RH"]
        PS3["PerspectiveSummary<br/>⚙️ Operações"]
        PSN["PerspectiveSummary<br/>🔹 Outras..."]
    end
    
    subgraph Knowledge["📚 KNOWLEDGE CORE"]
        Concept["Concept<br/>💡 Definição<br/>🔗 Relações"]
        Decision["Decision<br/>✅ Owner<br/>📅 Prazo"]
        Claim["Claim<br/>📌 Status<br/>🔒 Confiança"]
    end
    
    subgraph Temporal["⏱️ TEMPORAL LAYER"]
        Event["Event<br/>🔄 Mudança<br/>📍 Timestamp"]
        Version["Version<br/>📦 Estado<br/>📅 Vigência"]
        Evidence["Evidence<br/>📄 Fonte<br/>🔍 Proveniência"]
    end
    
    Company -->|has_snapshot| PS1
    Company -->|has_snapshot| PS2
    Company -->|has_snapshot| PS3
    Person -->|works_in| Company
    Person -->|contributes_to| PS1
    
    PS1 -->|highlights| Concept
    PS2 -->|highlights| Decision
    PS3 -->|highlights| Claim
    
    Concept -->|has_version| Version
    Decision -->|triggers| Event
    Claim -->|supported_by| Evidence
    
    Event -->|causes| Version
    Version -->|effective_during| Evidence
    
    style Identity fill:#4f46e5,color:#fff
    style Perspectives fill:#06b6d4,color:#fff
    style Knowledge fill:#f59e0b,color:#fff
    style Temporal fill:#10b981,color:#fff
```

---

## 3. Navegação: Todo → Micro

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px'}}}%%
graph TD
    Todo["🌍 TODO<br/>CompanySnapshot<br/>História + Fase + Board"]
    
    subgraph Macro["🔭 MACRO (Perspectivas)"]
        P1["💰 Tesouraria<br/>Top 10 Decisões<br/>Top 10 Gaps<br/>KPIs"]
        P2["👥 RH<br/>Top 10 Decisões<br/>Top 10 Gaps<br/>KPIs"]
        P3["⚙️ Operações<br/>Top 10 Decisões<br/>Top 10 Gaps<br/>KPIs"]
    end
    
    subgraph Meso["🗺️ MESO (Trilhas)"]
        T1["Trail: Liquidez<br/>→ Recebíveis<br/>→ DSO<br/>→ Crédito"]
        T2["Trail: Capacidade<br/>→ Turnover<br/>→ Gaps<br/>→ Retenção"]
    end
    
    subgraph Micro["🔬 MICRO (Prova)"]
        E1["📅 Event: Decisão tomada<br/>📄 Evidence: Ata reunião<br/>👤 Owner: João Silva<br/>⏱️ Valid: 2025-11-20 até..."]
        E2["📊 Version: Política v3<br/>✅ Status: Validado<br/>🔗 Source: Doc#123"]
    end
    
    Todo --> P1
    Todo --> P2
    Todo --> P3
    
    P1 --> T1
    P2 --> T2
    
    T1 --> E1
    T2 --> E2
    
    style Todo fill:#1e3a8a,color:#fff
    style Macro fill:#047857,color:#fff
    style Meso fill:#b45309,color:#fff
    style Micro fill:#7c2d12,color:#fff
```

---

## 4. Ecossistema de Agentes

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#7c3aed', 'secondaryColor': '#ec4899'}}}%%
graph TB
    subgraph Foundational["🏗️ AGENTES FOUNDACIONAIS"]
        Orchestrator["🎯 Orchestrator<br/>Coordena fluxo"]
        Curator["📚 Curator<br/>Mantém coerência"]
        Guardian["🛡️ Guardian<br/>Governança"]
        Miner["⛏️ Action Miner<br/>Extrai decisões"]
    end
    
    subgraph Business["💼 AGENTES DE NEGÓCIO"]
        Strategy["🎯 Strategy<br/>OKRs + Roadmap"]
        Revenue["💰 Revenue<br/>Deals + Pipeline"]
        VoC["🗣️ Voice of Customer<br/>Feedback + NPS"]
        Compliance["⚖️ Compliance<br/>Regulatório + Risco"]
    end
    
    subgraph Specialized["🎓 AGENTES ESPECIALIZADOS"]
        PIA["👷 PIA<br/>Process Intelligence<br/>5 sub-agents"]
        ACP["❓ ACP<br/>Clarificador Proativo<br/>Resolve dúvidas"]
        IEP["🌐 IEP<br/>Intel Externa<br/>5 gatilhos proativos"]
    end
    
    subgraph Core["⚡ CORE SYSTEM"]
        SG[("🕸️ Semantic Graph<br/>Neo4j")]
        LTM[("🗄️ Long-Term Memory<br/>MongoDB")]
    end
    
    Orchestrator --> Strategy
    Orchestrator --> Revenue
    Curator --> PIA
    Guardian --> Compliance
    Miner --> ACP
    
    Strategy --> SG
    Revenue --> SG
    VoC --> SG
    Compliance --> SG
    PIA --> SG
    ACP --> SG
    IEP --> SG
    
    Orchestrator --> LTM
    Curator --> LTM
    
    style Foundational fill:#7c3aed,color:#fff
    style Business fill:#ec4899,color:#fff
    style Specialized fill:#f59e0b,color:#fff
    style Core fill:#10b981,color:#fff
```

---

## 5. Data Flow: Ingestão → Briefing

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0891b2'}}}%%
sequenceDiagram
    participant User as 👤 Usuário
    participant Chat as 💬 Chat/Canvas
    participant LG as 🔄 LangGraph
    participant Agents as 🤖 Agents
    participant SG as 🕸️ Semantic Graph
    participant LTM as 🗄️ Long-Term Memory
    
    User->>Chat: Envia mensagem/artefato
    Chat->>LG: Processo via thread
    LG->>Agents: Orquestra extração
    
    Agents->>Agents: Extrai: Decisões, Claims, Temas
    Agents->>SG: Atualiza nodes/relations (temporal)
    Agents->>LTM: Persiste memória cross-thread
    
    SG->>Agents: Context Engineering (Select)
    LTM->>Agents: Recupera padrões históricos
    
    Agents->>LG: Gera resposta + updates
    LG->>Chat: Envia resposta
    Chat->>User: Exibe + Canvas atualizado
    
    Note over SG: Golden Rule: Sem tempo+fonte = não confiável
    Note over Agents: Diário: Briefing<br/>Semanal: Validação<br/>Mensal: Revisão
```

---

## 6. Golden Rules & Mechanisms

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#dc2626'}}}%%
mindmap
  root((EKS<br/>Framework))
    Golden Rules
      GR-001: Temporalidade + Proveniência
        valid_from / valid_to
        asserted_at
        source / evidence
        confidence / status
      Resumos = Diretrizes
        Macro ativação do todo
        Simetria entre perspectivas
      Poucas Perguntas
        Orçamento: 1 pergunta/rodada
        Surpresa inicial
    Mechanisms
      Context Engineering
        Write: Persistir
        Compress: Sumarizar
        Isolate: Dividir agents
        Select: Escolher tool
      Memory Layers
        Short-term: Thread checkpoints
        Long-term: Cross-thread MongoDB
        Semantic: Neo4j graph
        Vector: Atlas Search
    Agents Patterns
      Human-in-Loop
        Interrupts estruturados
        Canvas UI specializada
      Multi-Agent
        Hierarchical: Operational→Strategic
        Cross-Pollination: Debates
        Convergence: Síntese
    Deliverables
      Daily: Exec Brief
      Weekly: Management Pack
      Monthly: Board Intelligence
      Real-time: Alertas P1/P2/P3
```

---

## 7. Tech Stack MVP v1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#059669'}}}%%
graph LR
    subgraph Frontend["🎨 FRONTEND (Next.js 14)"]
        React["✅ React 18<br/>Components Base"]
        Layout["✅ Layout Profissional<br/>Sidebar+Canvas+Chat"]
        DS["🆕 Design System<br/>Adaptável (Spec 031)"]
        Voice["🆕 Voice Input<br/>(Spec 027)"]
        Upload["🆕 File Upload<br/>(Spec 028)"]
    end
    
    subgraph Backend["⚙️ BACKEND (Node.js + Python)"]
        NodeAPI["✅ Node.js 20<br/>Auth + Routing"]
        FastAPI["✅ Python FastAPI<br/>Agents + Azure"]
        Agno["✅ Agno Framework<br/>Agent Orchestration"]
        Docling["🆕 Docling<br/>Doc Processing"]
    end
    
    subgraph Storage["💾 STORAGE (Dual DB)"]
        MongoDB2["🆕 MongoDB Atlas<br/>(Priority 1)<br/>Vector Search"]
        Neo4j2["⏳ Neo4j Aura<br/>(Sprint 3-4)<br/>Intercambiável"]
        MockData["✅ Mock JSON<br/>11 arquivos prontos"]
    end
    
    subgraph AI["🤖 AI/ML (Azure)"]
        OpenAI["✅ Azure OpenAI<br/>gpt-4o + embeddings"]
        Speech["🆕 Azure Speech<br/>Speech-to-Text"]
        DocIntel["🆕 Azure Doc Intel<br/>Fallback extraction"]
        Router["🆕 LLM Router<br/>3 níveis potência"]
    end
    
    React --> Layout
    Layout --> DS
    DS --> Voice
    DS --> Upload
    
    React --> NodeAPI
    NodeAPI --> FastAPI
    FastAPI --> Agno
    Agno --> Docling
    
    FastAPI --> MongoDB2
    FastAPI --> MockData
    MongoDB2 -.future.-> Neo4j2
    
    Agno --> OpenAI
    Voice --> Speech
    Docling --> DocIntel
    FastAPI --> Router
    
    style Frontend fill:#059669,color:#fff
    style Backend fill:#7c3aed,color:#fff
    style Storage fill:#f59e0b,color:#fff
    style AI fill:#ec4899,color:#fff
    
    classDef ready fill:#10b981,stroke:#059669,stroke-width:3px
    classDef new fill:#f59e0b,stroke:#d97706,stroke-width:3px
    classDef future fill:#6b7280,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 5 5
    
    class React,Layout,NodeAPI,FastAPI,Agno,OpenAI,MockData ready
    class DS,Voice,Upload,Docling,MongoDB2,Speech,DocIntel,Router new
    class Neo4j2 future
```

**Legenda**:
- ✅ **Pronto**: Implementado ou com mock funcional
- 🆕 **Novo**: Spec criada, pronto para implementar (Sprint 1-2)
- ⏳ **Futuro**: Planejado para Sprint 3-4

---

## 8. Features Implementadas (MVP v1 Status)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#10b981'}}}%%
graph TB
    subgraph Ready["✅ PRONTO PARA VISUALIZAR"]
        AdminUI["Admin Page<br/>Gestão de usuários<br/>✅ Frontend completo"]
        ChatBase["Chat Básico<br/>Interface + histórico<br/>✅ Layout pronto"]
        MockData2["Mock Data<br/>17 entities simuladas<br/>✅ JSON prontos"]
        DesignTokens["Design Tokens<br/>Paleta + tipografia<br/>✅ Definidos (Spec 029)"]
    end
    
    subgraph InDev["🔨 EM DESENVOLVIMENTO"]
        UXProf["UX Professional<br/>Spec 029<br/>5 dias"]
        CorpMode["Corporate Mode<br/>Spec 030<br/>3 dias"]
        VoiceIn["Voice Input<br/>Spec 027<br/>2 dias"]
        FileUp["File Upload<br/>Spec 028<br/>3 dias"]
    end
    
    subgraph Planned["📋 PLANEJADO"]
        DesignSys["Design System<br/>Spec 031<br/>Identidade adaptável"]
        RouterImpl["LLM Router<br/>Spec 026<br/>3 potências"]
        MongoSetup["MongoDB Atlas<br/>Setup + Vector Index"]
        AzureSetup["Azure Services<br/>OpenAI + Speech + Blob"]
    end
    
    subgraph APIs["🔌 APIs DISPONÍVEIS"]
        AuthAPI["✅ /auth/login<br/>/auth/logout"]
        UserAPI["✅ /users/list<br/>/users/create"]
        ChatAPI["⚠️ /chat/message<br/>(precisa agents)"]
        UploadAPI["⚠️ /upload<br/>(precisa Azure Blob)"]
    end
    
    AdminUI -.usa.-> UserAPI
    ChatBase -.usa.-> ChatAPI
    
    UXProf --> DesignSys
    CorpMode --> RouterImpl
    VoiceIn --> AzureSetup
    FileUp --> MongoSetup
    
    style Ready fill:#10b981,color:#fff
    style InDev fill:#f59e0b,color:#fff
    style Planned fill:#6b7280,color:#fff
    style APIs fill:#3b82f6,color:#fff
```

**Status Atual**:
- ✅ **Frontend Base**: Layout admin funcional
- ✅ **Mock Data**: 11 arquivos JSON prontos para simulação
- 🔨 **4 Specs Novas**: UX (029), Corporate (030), Voice (027), File (028)
- ⚠️ **APIs Parciais**: Auth OK, Chat precisa agents backend
- 📋 **Próximo**: Design System (Spec 031) + implementação Sprint 1

---

## 9. Deployment & DevOps

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2563eb'}}}%%
graph TB
    subgraph Dev["💻 DEVELOPMENT"]
        Local["Local Dev<br/>Docker Compose"]
        Tests["Tests<br/>Pytest + Playwright"]
    end
    
    subgraph CI["🔄 CI/CD"]
        GHA["GitHub Actions"]
        Lint["Linting + Type Check"]
        Build["Build + Test"]
    end
    
    subgraph Staging["🧪 STAGING"]
        Vercel["Vercel<br/>(Frontend)"]
        Railway["Railway<br/>(Backend)"]
        AtlasStg["MongoDB Atlas"]
        Neo4jStg["Neo4j Aura"]
    end
    
    subgraph Production["🚀 PRODUCTION"]
        VercelProd["Vercel<br/>(Frontend)"]
        RailwayProd["Azure/Railway<br/>(Backend)"]
        AtlasProd["MongoDB Atlas"]
        Neo4jProd["Neo4j Aura"]
    end
    
    Local --> Tests
    Tests --> GHA
    GHA --> Lint
    Lint --> Build
    
    Build --> Vercel
    Build --> Railway
    Vercel --> AtlasStg
    Railway --> Neo4jStg
    
    Vercel -.Promote.-> VercelProd
    Railway -.Promote.-> RailwayProd
    AtlasStg -.Backup/Restore.-> AtlasProd
    Neo4jStg -.Backup/Restore.-> Neo4jProd
    
    style Dev fill:#2563eb,color:#fff
    style CI fill:#059669,color:#fff
    style Staging fill:#f59e0b,color:#fff
    style Production fill:#dc2626,color:#fff
```
