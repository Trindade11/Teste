# System Flows

> Fluxos visuais completos do sistema CVC Hub

**Last Updated**: 2025-12-06  
**Version**: V1

---

## 1. Fluxo Principal do Sistema

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph USUARIO["👤 USUÁRIO"]
        U1[Chat Interface]
        U2[Upload Documento]
        U3[Canvas Visualização]
    end
    
    subgraph ENTRADA["📥 ENTRADA"]
        E1[Mensagem de Chat]
        E2[Arquivo]
        E3[Formulário]
        E4[API Externa]
    end
    
    subgraph ROUTER["🔀 AGENT ROUTER"]
        AR1[Análise de Intent]
        AR2[Contexto do Usuário]
        AR3[Seleção de Agente]
    end
    
    subgraph AGENTS["🤖 AGENTES ESPECIALIZADOS"]
        AG1[User Agent<br>Customizado]
        AG2[Knowledge Agent<br>Busca/Resposta]
        AG3[Task Agent<br>Geração Tarefas]
        AG4[Curation Agent<br>Validação]
    end
    
    subgraph PROCESSING["⚙️ PROCESSAMENTO"]
        P1[Docling<br>Extração]
        P2[Classificação<br>Corp/Pessoal]
        P3[Embeddings<br>Azure OpenAI]
        P4[Estruturação<br>Nodes/Edges]
    end
    
    subgraph STORAGE["💾 ARMAZENAMENTO"]
        S1[(Neo4j<br>Grafo)]
        S2[Vector Index<br>Semântico]
    end
    
    subgraph RETRIEVAL["🔍 RECUPERAÇÃO"]
        R1[Busca Semântica]
        R2[Graph Traversal]
        R3[Proveniência]
        R4[Cache]
    end
    
    subgraph MEMORY["🧠 MEMÓRIA"]
        M1[Curto Prazo<br>Sessão]
        M2[Médio Prazo<br>Contexto]
        M3[Longo Prazo<br>Consolidado]
    end
    
    subgraph OUTPUT["📤 SAÍDA"]
        O1[Resposta Chat]
        O2[Tarefas Canvas]
        O3[Reflexões]
        O4[Sugestões]
    end
    
    USUARIO --> ENTRADA
    ENTRADA --> ROUTER
    ROUTER --> AGENTS
    AGENTS --> PROCESSING
    PROCESSING --> STORAGE
    STORAGE <--> RETRIEVAL
    RETRIEVAL <--> MEMORY
    MEMORY --> AGENTS
    AGENTS --> OUTPUT
    OUTPUT --> USUARIO
    
    style ROUTER fill:#e3f2fd,stroke:#1565c0
    style STORAGE fill:#e8f5e9,stroke:#2e7d32
    style MEMORY fill:#fff3e0,stroke:#ff9800
```

---

## 2. Fluxo de Ingestão de Dados (com Decisão do Usuário)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph INPUT["📥 Entrada"]
        I1[Upload<br>Manual]
        I2[Chat<br>Conversa]
        I3[Form<br>Onboarding]
        I4[API<br>Integração]
    end
    
    subgraph DOCLING["📄 Docling Processing"]
        D1[Parsing<br>PDF/DOCX/etc]
        D2[Extração<br>Texto/Tabelas]
        D3[Chunking<br>Segmentação]
        D4[Certificação<br>Completa]
    end
    
    subgraph FILTER["🔍 Filtração de Dados"]
        F1{Dado REAL<br>ou PASSAGEIRO?}
        F2[Real:<br>Persistente]
        F3[Passageiro:<br>Temporário]
    end
    
    subgraph DECISION["👤 DECISÃO DO USUÁRIO"]
        direction TB
        DEC1[Sistema pergunta:<br>'Guardar como...?']
        DEC2{Corporativo<br>ou Pessoal?}
        DEC3[Corporativo:<br>Visível org]
        DEC4[Pessoal:<br>Só usuário]
        DEC5[Preview do<br>que será guardado]
    end
    
    subgraph EMBED["🔢 Embeddings"]
        EM1[Azure OpenAI<br>Embedding]
    end
    
    subgraph CURATE["✅ Curadoria"]
        CU1[Validar<br>Qualidade]
        CU2[Estruturar<br>Nodes/Edges]
        CU3[Atribuir<br>Metadados]
    end
    
    subgraph STORE["💾 Armazenamento"]
        ST1[(Neo4j)]
        ST2[Vector<br>Index]
    end
    
    INPUT --> DOCLING
    DOCLING -->|"Docling PRIMEIRO"| FILTER
    F1 -->|Real| F2
    F1 -->|Passageiro| F3
    F2 --> DECISION
    F3 --> DECISION
    DECISION --> DEC1
    DEC1 --> DEC5
    DEC5 --> DEC2
    DEC2 -->|Corp| DEC3
    DEC2 -->|Pessoal| DEC4
    DEC3 --> EMBED
    DEC4 --> EMBED
    EMBED --> CURATE
    CURATE --> STORE
    
    style DECISION fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style FILTER fill:#fff3e0,stroke:#ff9800
    style DOCLING fill:#e8f5e9,stroke:#2e7d32
```

**Regra Fundamental**: Docling processa ANTES da decisão de memória. Toda certificação acontece primeiro, depois o usuário decide.

---

## 2.1 Fluxo de Persistência de Conversa

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph CHAT["💬 Conversa"]
        CH1[Mensagem<br>do Usuário]
        CH2[Resposta<br>do Agente]
    end
    
    subgraph SESSION["📍 Memória de Sessão"]
        SE1[TODA conversa<br>é guardada]
        SE2[Histórico<br>completo]
    end
    
    subgraph PAUSE["⏸️ Pausa/Encerramento"]
        PA1[Usuário pausa<br>ou encerra]
    end
    
    subgraph DECIDE["👤 DECISÃO DE PERSISTÊNCIA"]
        DE1{Deseja salvar<br>esta conversa?}
        DE2[Salvar TUDO]
        DE3[Descartar TUDO]
        DE4[Salvar<br>PARCIALMENTE]
        DE5[Salvar apenas<br>INSIGHTS]
    end
    
    subgraph RESULT["💾 Resultado"]
        RE1[Memória<br>Longa]
        RE2[Descartado]
        RE3[Seleção<br>do Usuário]
        RE4[Insights<br>Extraídos]
    end
    
    CHAT --> SESSION
    SESSION --> PAUSE
    PAUSE --> DECIDE
    DE1 -->|Tudo| DE2
    DE1 -->|Nada| DE3
    DE1 -->|Parcial| DE4
    DE1 -->|Insights| DE5
    DE2 --> RE1
    DE3 --> RE2
    DE4 --> RE3
    DE5 --> RE4
    
    style DECIDE fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style SESSION fill:#fff3e0,stroke:#ff9800
```

**Regra**: Toda conversa é guardada em memória temporária. Usuário decide o que persiste.

---

## 3. Fluxo de Recuperação com Proveniência

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph QUERY["❓ Query do Usuário"]
        Q1[Pergunta<br>em Linguagem Natural]
    end
    
    subgraph REASONING["🧠 Raciocínio do Agente"]
        R1[PRE-QUERY<br>Entender Intent]
        R2[Definir Estratégia<br>de Busca]
        R3[Definir Profundidade<br>1-5 níveis]
    end
    
    subgraph SEARCH["🔍 Busca Multi-Estratégia"]
        S1[Busca Semântica<br>por Embeddings]
        S2[Graph Traversal<br>por Relacionamentos]
        S3[Keyword Search<br>Full-text]
    end
    
    subgraph CACHE["⚡ Cache"]
        CA1{Cache<br>Hit?}
        CA2[Retorna<br>Cache]
        CA3[Executa<br>Busca]
    end
    
    subgraph RESULTS["📋 Resultados"]
        RES1[Nodes<br>Encontrados]
        RES2[Metadados de<br>Proveniência]
        RES3[Confidence<br>Score]
    end
    
    subgraph POST["✅ Pós-Recuperação"]
        P1[POST-RETRIEVAL<br>Avaliar Relevância]
        P2[Filtrar por<br>Visibilidade]
        P3[Ordenar por<br>Relevância]
    end
    
    subgraph PROVENANCE["📜 Proveniência"]
        PR1[source_type]
        PR2[source_ref]
        PR3[created_at]
        PR4[confidence]
    end
    
    subgraph RESPONSE["💬 Resposta"]
        RESP1[PRE-RESPONSE<br>Formular Resposta]
        RESP2[Incluir<br>Citações]
        RESP3[POST-RESPONSE<br>Log & Validação]
    end
    
    QUERY --> REASONING
    REASONING --> CACHE
    CA1 -->|Sim| CA2
    CA1 -->|Não| CA3
    CA3 --> SEARCH
    SEARCH --> RESULTS
    RESULTS --> POST
    POST --> PROVENANCE
    PROVENANCE --> RESPONSE
    
    style REASONING fill:#e3f2fd,stroke:#1565c0
    style PROVENANCE fill:#fff3e0,stroke:#ff9800
```

---

## 4. Fluxo do Sistema de Memória Multinível

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph NOVA["🆕 Nova Informação"]
        N1[Chat]
        N2[Documento]
        N3[Tarefa]
    end
    
    subgraph SHORT["📍 Memória Curto Prazo"]
        direction TB
        S1[Sessão Atual]
        S2[Contexto Imediato]
        S3[TTL: Horas]
    end
    
    subgraph MEDIUM["📅 Memória Médio Prazo"]
        direction TB
        M1[Contexto Recente]
        M2[Projetos Ativos]
        M3[TTL: Dias/Semanas]
    end
    
    subgraph LONG["🏛️ Memória Longo Prazo"]
        direction TB
        L1[Conhecimento Consolidado]
        L2[Perfil Profissional]
        L3[TTL: Meses/Permanente]
    end
    
    subgraph DECAY["⏳ Memory Decay Agent"]
        D1[Monitorar<br>Relevância]
        D2[Calcular<br>Freshness]
        D3{Promover ou<br>Arquivar?}
    end
    
    subgraph ACTIONS["🔄 Ações"]
        A1[Promover<br>Curto→Médio]
        A2[Consolidar<br>Médio→Longo]
        A3[Arquivar<br>Node Inativo]
        A4[Manter<br>Sem Alteração]
    end
    
    NOVA --> SHORT
    SHORT --> DECAY
    MEDIUM --> DECAY
    
    D3 -->|Promover| A1
    D3 -->|Consolidar| A2
    D3 -->|Arquivar| A3
    D3 -->|Manter| A4
    
    A1 --> MEDIUM
    A2 --> LONG
    
    style SHORT fill:#ffcdd2,stroke:#c62828
    style MEDIUM fill:#fff3e0,stroke:#ff9800
    style LONG fill:#e8f5e9,stroke:#2e7d32
    style DECAY fill:#e3f2fd,stroke:#1565c0
```

---

## 5. Fluxo de Contexto Adaptativo do Usuário

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart LR
    subgraph USER["👤 Usuário"]
        U1[Login/Sessão]
    end
    
    subgraph CONTEXT["🎯 Coleta de Contexto"]
        C1[Quem é?<br>Role/Função]
        C2[O que faz?<br>Trabalho Atual]
        C3[O que precisa?<br>Necessidades]
        C4[Com quem?<br>Relacionamentos]
    end
    
    subgraph PROFILE["📊 Perfil Atualizado"]
        P1[current_focus]
        P2[current_needs]
        P3[current_project]
        P4[priority_relationships]
    end
    
    subgraph ADAPT["🔄 Adaptação"]
        A1[Filtrar<br>Conhecimento Relevante]
        A2[Priorizar<br>Relacionamentos Ativos]
        A3[Sugerir<br>Conteúdo Contextual]
        A4[Gerar<br>Reflexões]
    end
    
    subgraph OUTPUT["💡 Saída Personalizada"]
        O1[Resposta<br>Contextualizada]
        O2[Tarefas<br>Sugeridas]
        O3[Conexões<br>Recomendadas]
        O4[Insights<br>Proativos]
    end
    
    USER --> CONTEXT
    CONTEXT --> PROFILE
    PROFILE --> ADAPT
    ADAPT --> OUTPUT
    OUTPUT --> USER
    
    style CONTEXT fill:#e3f2fd,stroke:#1565c0
    style ADAPT fill:#fff3e0,stroke:#ff9800
```

---

## 6. Fluxo de Relacionamentos e Métricas

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph NODES["📦 Nodes"]
        N1[User A]
        N2[User B]
        N3[Project X]
        N4[Knowledge Y]
    end
    
    subgraph EDGE["🔗 Edge/Relacionamento"]
        E1[relationship_strength<br>0.8]
        E2[interaction_count<br>47]
        E3[last_interaction_at<br>2h ago]
        E4[relationship_freshness<br>0.95]
        E5[priority_score<br>0.7]
    end
    
    subgraph METRICS["📈 Métricas Calculadas"]
        M1[Top Relacionamentos<br>Ordenados por priority_score]
        M2[Relacionamentos Ativos<br>freshness > 0.5]
        M3[Relacionamentos Frios<br>freshness < 0.3]
        M4[Nodes Prioritários<br>na Hierarquia]
    end
    
    subgraph ACTIONS["🎯 Ações Baseadas"]
        A1[Sugerir Reconexão<br>rel. frios importantes]
        A2[Destacar no Canvas<br>rel. mais relevantes]
        A3[Notificar<br>novas conexões]
        A4[Gerar Insights<br>sobre rede]
    end
    
    N1 <-->|WORKS_WITH| N2
    N1 -->|WORKS_ON| N3
    N1 -->|OWNS| N4
    
    EDGE --> METRICS
    METRICS --> ACTIONS
    
    style EDGE fill:#fff3e0,stroke:#ff9800
    style METRICS fill:#e3f2fd,stroke:#1565c0
```

---

## 7. Fluxo de Gamificação e Engajamento

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph CONTRIB["📥 Contribuição do Usuário"]
        C1[Upload Documento]
        C2[Responde Pergunta]
        C3[Valida Conhecimento]
        C4[Cria Tarefa]
        C5[Completa Tarefa]
    end
    
    subgraph SCORES["📊 Scores"]
        S1[knowledge_contributed<br>+10 pts]
        S2[knowledge_consumed<br>+2 pts]
        S3[engagement_score<br>Calculado]
        S4[ecosystem_contribution<br>Agregado]
    end
    
    subgraph DISPLAY["🎮 Visualização"]
        D1[Dashboard<br>Pessoal]
        D2[Ranking<br>Ecossistema]
        D3[Badges<br>Conquistas]
        D4[Progress Bar<br>Objetivos]
    end
    
    subgraph FEEDBACK["🔄 Feedback Loop"]
        F1[Usuário vê<br>sua contribuição]
        F2[Sente-se parte<br>do organismo]
        F3[Motivado a<br>contribuir mais]
    end
    
    CONTRIB --> SCORES
    SCORES --> DISPLAY
    DISPLAY --> FEEDBACK
    FEEDBACK --> CONTRIB
    
    style SCORES fill:#fff3e0,stroke:#ff9800
    style FEEDBACK fill:#e8f5e9,stroke:#2e7d32
```

---

## 8. Fluxo de Agentes

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
sequenceDiagram
    participant U as Usuário
    participant R as Agent Router
    participant UA as User Agent
    participant KA as Knowledge Agent
    participant TA as Task Agent
    participant VA as Validation Agent
    participant DB as Neo4j
    participant M as Memory System
    
    U->>R: Mensagem
    R->>R: Analisar Intent
    R->>M: Buscar Contexto Usuário
    M-->>R: Contexto
    R->>R: Selecionar Agente(s)
    
    alt Query de Conhecimento
        R->>KA: Processar
        KA->>DB: Buscar
        DB-->>KA: Resultados
        KA->>M: Atualizar Memória
        KA-->>R: Resposta
    else Criação de Tarefa
        R->>TA: Processar
        TA->>DB: Criar Task
        TA->>M: Registrar
        TA-->>R: Task Criada
    else Personalizado
        R->>UA: Processar
        UA->>DB: Buscar
        UA-->>R: Resposta Custom
    end
    
    R->>VA: Validar Resposta
    VA->>VA: Comparar Escolhas
    VA-->>R: Feedback
    R-->>U: Resposta Final
```

---

## 9. Fluxo de Visibilidade Hierárquica

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart TB
    subgraph ECO["🌐 Ecossistema"]
        CVC[CVC<br>Nível 1]
        CC[CoCreateAI<br>Nível 2]
        ST1[Startup A<br>Nível 3]
        ST2[Startup B<br>Nível 3]
        TEAM1[Team Alpha<br>Nível 4]
        USER1[CEO Startup A<br>Nível 5]
    end
    
    subgraph VISIBILITY["👁️ Visibilidade"]
        V1[CVC vê TUDO]
        V2[CoCreate vê:<br>CoCreate + Startups]
        V3[Startup vê:<br>Sua Startup + Times]
        V4[User vê:<br>Seu nível + Pessoal]
    end
    
    subgraph RULE["📜 Regra"]
        R1[Usuário só vê<br>até seu nível]
        R2[Nunca vê<br>acima na hierarquia]
        R3[Dados pessoais<br>sempre privados]
    end
    
    CVC --> CC
    CC --> ST1
    CC --> ST2
    ST1 --> TEAM1
    TEAM1 --> USER1
    
    ECO --> VISIBILITY
    VISIBILITY --> RULE
    
    style CVC fill:#e3f2fd,stroke:#1565c0
    style CC fill:#e8f5e9,stroke:#2e7d32
    style ST1 fill:#fff3e0,stroke:#ff9800
    style ST2 fill:#fff3e0,stroke:#ff9800
```

---

## 10. Resumo: Pipeline End-to-End

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
flowchart LR
    A[👤 Usuário] --> B[📥 Entrada]
    B --> C[🔀 Router]
    C --> D[🤖 Agentes]
    D --> E[⚙️ Processamento]
    E --> F[✅ Curadoria]
    F --> G[(💾 Neo4j)]
    G --> H[🔍 Retrieval]
    H --> I[🧠 Memória]
    I --> J[💬 Resposta]
    J --> A
    
    style C fill:#e3f2fd,stroke:#1565c0
    style F fill:#e8f5e9,stroke:#2e7d32
    style I fill:#fff3e0,stroke:#ff9800
```

---

## Notas de Implementação

1. **Todos os fluxos usam os Metadados Universais** definidos em `database-schema.md`
2. **Proveniência é obrigatória** em todas as respostas
3. **Memória é gerenciada automaticamente** pelo Memory Decay Agent
4. **Visibilidade é aplicada em TODAS as queries**
5. **Cache deve ser invalidado** quando dados são atualizados

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V1 | 2025-12-06 | Criação inicial com 10 fluxos principais |
