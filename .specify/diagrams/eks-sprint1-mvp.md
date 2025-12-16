# EKS - Sprint 1: Chat + Canvas + Semantic Graph MVP

## 🎯 Objetivo do Sprint 1
**Entregar**: Chat funcional + Canvas interativo + Histórico semântico persistido em grafo Neo4j

**Duração**: 2 semanas

---

## 1. Arquitetura Sprint 1 (Simplificada)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e3a8a', 'primaryTextColor': '#fff', 'primaryBorderColor': '#60a5fa', 'lineColor': '#3b82f6'}}}%%
graph TB
    subgraph UI["🎨 UI LAYER - Sprint 1"]
        Chat["💬 Chat<br/>- Input text<br/>- Message history<br/>- Markdown rendering"]
        Canvas["🖼️ Canvas<br/>- Code editor<br/>- Markdown editor<br/>- Preview pane"]
    end
    
    subgraph Backend["⚙️ BACKEND - Sprint 1"]
        API["FastAPI<br/>- WebSocket (chat)<br/>- REST (canvas)<br/>- Auth básico"]
        LG["LangGraph<br/>- Simple chat chain<br/>- State management<br/>- Checkpoints"]
    end
    
    subgraph Storage["💾 STORAGE - Sprint 1"]
        Neo4j["Neo4j<br/>- Thread nodes<br/>- Message nodes<br/>- User nodes<br/>- Temporal props"]
        Redis["Redis<br/>- Session cache<br/>- Checkpoints"]
    end
    
    subgraph AI["🤖 AI - Sprint 1"]
        GPT["OpenAI GPT-4o<br/>- Chat completion<br/>- Simple prompts"]
    end
    
    Chat <--> Canvas
    Chat -->|WebSocket| API
    Canvas -->|REST| API
    
    API --> LG
    LG --> Neo4j
    LG --> Redis
    LG --> GPT
    
    style UI fill:#1e40af,color:#fff
    style Backend fill:#047857,color:#fff
    style Storage fill:#b45309,color:#fff
    style AI fill:#7c2d12,color:#fff
```

---

## 2. Fluxo de Dados Sprint 1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0891b2'}}}%%
sequenceDiagram
    participant User as 👤 Usuário
    participant UI as 💬 Chat UI
    participant WS as 🔌 WebSocket
    participant API as ⚙️ FastAPI
    participant LG as 🔄 LangGraph
    participant Neo4j as 🕸️ Neo4j
    participant GPT as 🤖 GPT-4o
    
    User->>UI: Digite mensagem
    UI->>WS: Send message
    WS->>API: message event
    API->>LG: invoke_chain(message)
    
    LG->>Neo4j: 1. Busca thread history
    Neo4j-->>LG: messages[]
    
    LG->>LG: 2. Build context
    LG->>GPT: 3. Chat completion
    GPT-->>LG: response
    
    LG->>Neo4j: 4. Save message + response
    Neo4j-->>LG: saved ✓
    
    LG-->>API: response + metadata
    API-->>WS: message event
    WS-->>UI: Update chat
    UI-->>User: Mostra resposta
    
    Note over Neo4j: Grafo persiste:<br/>Thread → Message (temporalidade)<br/>User → Thread
```

---

## 3. Modelo de Dados Neo4j - Sprint 1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4f46e5'}}}%%
graph LR
    User["👤 User<br/>id: uuid<br/>email: string<br/>name: string<br/>created_at: datetime"]
    
    Thread["🧵 Thread<br/>id: uuid<br/>title: string<br/>created_at: datetime<br/>updated_at: datetime"]
    
    Message["💬 Message<br/>id: uuid<br/>content: text<br/>role: enum(user/assistant)<br/>timestamp: datetime<br/>token_count: int"]
    
    Artifact["📄 Artifact<br/>id: uuid<br/>type: enum(code/markdown)<br/>content: text<br/>language?: string<br/>created_at: datetime"]
    
    User -->|CREATED| Thread
    Thread -->|CONTAINS| Message
    Message -->|NEXT| Message
    Message -->|GENERATED| Artifact
    Thread -->|HAS_ARTIFACT| Artifact
    
    style User fill:#4f46e5,color:#fff
    style Thread fill:#06b6d4,color:#fff
    style Message fill:#f59e0b,color:#fff
    style Artifact fill:#10b981,color:#fff
```

**Cypher Schema**:
```cypher
// User
CREATE (u:User {
  id: randomUUID(),
  email: 'user@example.com',
  name: 'João Silva',
  created_at: datetime()
})

// Thread
CREATE (t:Thread {
  id: randomUUID(),
  title: 'Nova conversa',
  created_at: datetime(),
  updated_at: datetime()
})

// Message
CREATE (m:Message {
  id: randomUUID(),
  content: 'Hello, world!',
  role: 'user',
  timestamp: datetime(),
  token_count: 42
})

// Relationships
CREATE (u)-[:CREATED]->(t)
CREATE (t)-[:CONTAINS]->(m1)
CREATE (m1)-[:NEXT]->(m2)
```

---

## 4. Tech Stack Sprint 1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#059669'}}}%%
graph TB
    subgraph Frontend["🎨 FRONTEND"]
        Next["Next.js 15<br/>(App Router)"]
        React["React 19"]
        TW["Tailwind CSS"]
        ShadCN["shadcn/ui"]
        WS["@socket.io/client"]
    end
    
    subgraph Backend["⚙️ BACKEND"]
        FastAPI["FastAPI 0.115+"]
        SocketIO["python-socketio"]
        LG["langgraph 0.2+"]
        LC["langchain 0.3+"]
    end
    
    subgraph Storage["💾 STORAGE"]
        Neo["neo4j-driver 5.x"]
        RedisLib["redis-py"]
    end
    
    subgraph AI["🤖 AI"]
        OpenAI["openai 1.x"]
    end
    
    Next --> React
    React --> TW
    React --> ShadCN
    React --> WS
    
    FastAPI --> SocketIO
    FastAPI --> LG
    LG --> LC
    
    LC --> Neo
    LC --> RedisLib
    LC --> OpenAI
    
    style Frontend fill:#059669,color:#fff
    style Backend fill:#7c3aed,color:#fff
    style Storage fill:#f59e0b,color:#fff
    style AI fill:#ec4899,color:#fff
```

---

## 5. Features Sprint 1 (Priorização)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px'}}}%%
graph TD
    P0["🔴 P0 - CRÍTICO<br/>(Deve ter)"]
    P1["🟡 P1 - IMPORTANTE<br/>(Bom ter)"]
    P2["🟢 P2 - DESEJÁVEL<br/>(Pode ter depois)"]
    
    P0 --> F1["✅ Chat básico funcional"]
    P0 --> F2["✅ Canvas code editor"]
    P0 --> F3["✅ Persistência Neo4j"]
    P0 --> F4["✅ Thread history"]
    P0 --> F5["✅ WebSocket real-time"]
    
    P1 --> F6["🔹 Canvas markdown editor"]
    P1 --> F7["🔹 Syntax highlighting"]
    P1 --> F8["🔹 Auth básico (email/senha)"]
    P1 --> F9["🔹 Export thread (JSON/MD)"]
    
    P2 --> F10["⚪ Multi-user threads"]
    P2 --> F11["⚪ Canvas preview live"]
    P2 --> F12["⚪ Rich markdown (Mermaid)"]
    P2 --> F13["⚪ Voice input"]
    
    style P0 fill:#dc2626,color:#fff
    style P1 fill:#f59e0b,color:#fff
    style P2 fill:#10b981,color:#fff
```

---

## 6. Estrutura de Pastas Sprint 1

```
Spec-Orchestrator/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── chat/
│   │   │   └── [threadId]/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── ThreadSidebar.tsx
│   │   ├── canvas/
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   └── PreviewPane.tsx
│   │   └── ui/                 # shadcn components
│   ├── lib/
│   │   ├── socket.ts           # WebSocket client
│   │   └── api.ts              # REST client
│   └── package.json
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── chat.py     # WebSocket endpoints
│   │   │   │   ├── threads.py  # REST endpoints
│   │   │   │   └── auth.py     # Auth endpoints
│   │   │   └── deps.py         # Dependencies
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── neo4j.py        # Neo4j connection
│   │   │   └── redis.py        # Redis connection
│   │   ├── agents/
│   │   │   └── chat_agent.py   # LangGraph chain
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docker-compose.yml           # Neo4j + Redis local
├── .env.example
└── README.md
```

---

## 7. Milestones Sprint 1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '12px'}}}%%
gantt
    title Sprint 1 - 2 Semanas
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    
    section Setup
    Setup projeto frontend           :done, s1, 2025-01-01, 1d
    Setup projeto backend            :done, s2, 2025-01-01, 1d
    Docker Neo4j + Redis            :done, s3, 2025-01-02, 1d
    
    section Backend
    FastAPI + WebSocket             :active, b1, 2025-01-02, 2d
    LangGraph chat chain            :active, b2, 2025-01-03, 2d
    Neo4j persistence               :b3, 2025-01-05, 2d
    Thread management               :b4, 2025-01-07, 2d
    
    section Frontend
    Next.js + UI setup              :active, f1, 2025-01-02, 2d
    Chat component                  :f2, 2025-01-04, 2d
    Canvas component                :f3, 2025-01-06, 2d
    WebSocket integration           :f4, 2025-01-08, 2d
    
    section Testing
    Integration tests               :t1, 2025-01-09, 2d
    E2E tests (Playwright)          :t2, 2025-01-10, 2d
    
    section Deploy
    Deploy staging                  :d1, 2025-01-12, 1d
    Review + ajustes                :d2, 2025-01-13, 1d
```

---

## 8. Definition of Done (Sprint 1)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#10b981'}}}%%
mindmap
  root((Sprint 1<br/>DoD))
    Funcional
      Chat envia/recebe mensagens
      Canvas edita code/markdown
      History carrega threads
      WebSocket real-time funciona
      Neo4j persiste tudo
    Qualidade
      Cobertura testes ≥ 80%
      TypeScript sem erros
      Pylint score ≥ 8.5
      E2E smoke test passa
    Deploy
      Staging rodando
      .env.example atualizado
      README com setup
      Docker compose funciona
    Docs
      API documented (FastAPI auto)
      Component props documented
      Architecture diagram (este!)
```

---

## 9. Riscos & Mitigações Sprint 1

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| WebSocket latency | Média | Alto | Redis para checkpoints rápidos |
| Neo4j query performance | Baixa | Médio | Índices compostos desde início |
| Canvas state sync | Alta | Médio | Debounce + optimistic updates |
| OpenAI rate limits | Média | Alto | Exponential backoff + fallback |
| Auth complexity | Baixa | Baixo | Usar NextAuth.js simples |

---

## 10. Próximos Passos (Pós-Sprint 1)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#6366f1'}}}%%
graph LR
    Sprint1["✅ Sprint 1<br/>Chat + Canvas<br/>+ Graph"]
    
    Sprint2["🔜 Sprint 2<br/>Semantic Layer<br/>+ Perspectives"]
    
    Sprint3["🔜 Sprint 3<br/>Agentes PIA<br/>+ Extração"]
    
    Sprint4["🔜 Sprint 4<br/>Multi-Agent<br/>+ Briefings"]
    
    Sprint1 --> Sprint2
    Sprint2 --> Sprint3
    Sprint3 --> Sprint4
    
    Sprint2 -.-> S2F1["CompanySnapshot"]
    Sprint2 -.-> S2F2["ProfileSnapshot"]
    Sprint2 -.-> S2F3["PerspectiveSummary"]
    
    Sprint3 -.-> S3F1["Decision extraction"]
    Sprint3 -.-> S3F2["Claim detection"]
    Sprint3 -.-> S3F3["Golden Rules"]
    
    Sprint4 -.-> S4F1["Hierarchical agents"]
    Sprint4 -.-> S4F2["Daily briefings"]
    Sprint4 -.-> S4F3["Alertas P1/P2"]
    
    style Sprint1 fill:#10b981,color:#fff
    style Sprint2 fill:#6366f1,color:#fff
    style Sprint3 fill:#6366f1,color:#fff
    style Sprint4 fill:#6366f1,color:#fff
```
