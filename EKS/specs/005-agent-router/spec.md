# Feature Specification: Agent Router System

**Feature Branch**: `005-agent-router`  
**Created**: 2025-12-07  
**Status**: Draft  
**Priority**: P1 (Backend Core)  
**Source**: TRG-SPC-20251206-009 + User input

## Process Flow (Business View)

```mermaid
flowchart TD
    subgraph UserInput["📥 Entrada do Usuário"]
        Message["💬 Mensagem do Chat"]
        SelectedAgent["🤖 Agente Selecionado<br/>(manual ou auto)"]
        Context["📚 Contexto da Conversa"]
    end

    subgraph RouterLogic["🔀 Lógica de Roteamento"]
        CheckSelection["❓ Agente selecionado?"]
        UseSelected["✅ Usar Selecionado"]
        AnalyzeIntent["🧠 Analisar Intenção<br/>(LLM classifier)"]
        MatchCapability["🎯 Matchear Capacidade"]
        SelectBest["⭐ Selecionar Melhor"]
    end

    subgraph AgentPool["🤖 Pool de Agentes"]
        Router["🔀 Router Agent<br/>(padrão)"]
        Task["✅ Task Agent<br/>(gera tarefas)"]
        Custom["👤 Custom User Agents"]
        System["⚙️ System Agents<br/>(invisíveis)"]
    end

    subgraph Execution["🚀 Execução"]
        LoadAgent["📦 Carregar Agente"]
        LoadPrompt["📝 Carregar Prompt Atual"]
        LoadContext["📚 Carregar Contexto"]
        Execute["▶️ Executar Agente"]
        Response["💬 Resposta ao Usuário"]
    end

    Message --> CheckSelection
    SelectedAgent --> CheckSelection
    Context --> CheckSelection
    
    CheckSelection -->|Yes| UseSelected
    CheckSelection -->|No| AnalyzeIntent
    
    AnalyzeIntent --> MatchCapability
    MatchCapability --> SelectBest
    
    UseSelected --> LoadAgent
    SelectBest --> LoadAgent
    
    LoadAgent --> Router
    LoadAgent --> Task
    LoadAgent --> Custom
    LoadAgent --> System
    
    Router --> LoadPrompt
    Task --> LoadPrompt
    Custom --> LoadPrompt
    System --> LoadPrompt
    
    LoadPrompt --> LoadContext
    LoadContext --> Execute
    Execute --> Response

    classDef input fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef router fill:#fff3e0,stroke:#ff9800,color:#000
    classDef pool fill:#e8f5e9,stroke:#4caf50,color:#000
    classDef exec fill:#fce4ec,stroke:#e91e63,color:#000

    class Message,SelectedAgent,Context input
    class CheckSelection,UseSelected,AnalyzeIntent,MatchCapability,SelectBest router
    class Router,Task,Custom,System pool
    class LoadAgent,LoadPrompt,LoadContext,Execute,Response exec
```

### Flow Insights

**Gaps identificados**:
- Como priorizar: agente explicitamente selecionado vs agente mais capaz?
- Fallback: se nenhum agente capaz, usar Router ou retornar erro?
- Confidence score: abaixo de qual threshold pedir confirmação ao usuário?
- Multi-agent: intenção ambígua pode usar 2+ agentes sequencialmente?

**Oportunidades identificadas**:
- Auto-learning: router aprende preferências do usuário ao longo do tempo
- Sugestão proativa: "Parece que Task Agent seria melhor para isso. Quer trocar?"
- Ensemble: combinar respostas de múltiplos agentes
- A/B testing: router pode testar qual agente performa melhor
- Explainability: mostrar ao usuário POR QUE escolheu determinado agente

**Riscos identificados**:
- Latência: análise de intenção pode adicionar 1-2s
- Custo: cada roteamento usa tokens LLM
- Erro de classificação: escolher agente errado frustra usuário
- Conflito: usuário força agente ruim para tarefa

---

## Agent Collaboration

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant UI as 🖥️ Chat UI
    participant R as 🔀 Router Service
    participant C as 🧠 Classifier LLM
    participant DB as 🗂️ Neo4j
    participant A as 🤖 Selected Agent
    participant L as 📝 Logger

    U->>UI: Envia mensagem
    UI->>R: POST /chat {message, userId, selectedAgentId?}
    
    alt Agente selecionado explicitamente
        R->>DB: Buscar Agent by ID
        DB-->>R: Agent config + Prompt
    else Seleção automática
        R->>DB: Buscar agentes disponíveis (Router, Task, Custom)
        DB-->>R: Lista de agentes
        R->>C: Classificar intenção
        Note over R,C: "Preciso criar um plano de ação"<br/>→ Intenção: task_generation
        C-->>R: {intent: "task_generation", confidence: 0.92}
        R->>R: Matchear intent → Task Agent
    end
    
    R->>DB: Carregar contexto da conversa
    DB-->>R: Últimas N mensagens + resumo
    
    R->>A: Executar agente com prompt + contexto
    A-->>R: Resposta gerada
    
    R->>L: Log (agentId, intent, confidence, latency)
    R-->>UI: Resposta + metadata
    UI-->>U: Exibe mensagem
```

### Routing Decision Table

| User Intent | Confidence | Agent Selecionado | Reasoning |
|-------------|-----------|-------------------|-----------|
| Conversa geral | >0.7 | **Router Agent** | Intenção ambígua ou conversacional |
| "Crie um plano" | >0.8 | **Task Agent** | Palavra-chave clara |
| "Analise este balanço" | >0.8 | **Custom: Analista Financeiro** (se existir) | Match com nome/descrição do custom agent |
| "Ajuda com Python" | >0.6 | **Router Agent** | Sem custom agent matching → fallback |
| Comando ambíguo | <0.6 | **Router Agent** + Pergunta ao User | Baixa confiança → pedir confirmação |

---

## User Scenarios & Testing

### User Story 1 - Roteamento Automático para Task Agent (Priority: P1)

Usuário digita "Preciso de um plano de ação para meu projeto". Sistema analisa intenção, identifica `task_generation`, e roteia automaticamente para Task Agent.

**Why this priority**: Core do sistema inteligente. Sem isso, usuário precisa sempre selecionar manualmente.

**Independent Test**: Enviar mensagem sem selecionar agente, verificar que Task Agent foi usado.

**Acceptance Scenarios**:

1. **Given** usuário no chat sem agente selecionado, **When** envia "Crie um plano para lançar produto", **Then** Router Service classifica como `task_generation` e usa Task Agent

2. **Given** Task Agent executado, **When** resposta é enviada, **Then** UI mostra badge "🤖 Task Agent" indicando qual agente respondeu

3. **Given** log gerado, **When** admin visualiza analytics, **Then** vê que roteamento automático teve confidence >0.8

---

### User Story 2 - Seleção Manual de Agente (Priority: P1)

Usuário abre dropdown de agentes, seleciona "Custom: Analista Financeiro", envia mensagem. Sistema usa agente selecionado independente da intenção.

**Why this priority**: Controle do usuário. Às vezes usuário sabe melhor qual agente usar.

**Independent Test**: Selecionar agente manualmente, verificar que foi usado (não teve roteamento).

**Acceptance Scenarios**:

1. **Given** usuário seleciona "Analista Financeiro" no dropdown, **When** envia "Olá", **Then** Router Service pula classificação e usa agente selecionado

2. **Given** agente customizado selecionado, **When** execução completa, **Then** selection permanece ativa para próximas mensagens (sticky selection)

3. **Given** usuário quer voltar para auto-select, **When** clica "Auto" no dropdown, **Then** seleção é limpa e router volta a classificar

---

### User Story 3 - Fallback para Router Agent (Priority: P1)

Usuário envia mensagem ambígua "Me ajuda aqui". Sistema não consegue classificar com alta confiança, usa Router Agent como padrão.

**Why this priority**: Robustez. Sistema não pode falhar se classificação for incerta.

**Independent Test**: Enviar mensagem genérica, verificar que Router Agent é usado.

**Acceptance Scenarios**:

1. **Given** mensagem "Me ajuda", **When** classifier retorna confidence <0.6, **Then** Router Service usa Router Agent (fallback)

2. **Given** Router Agent executado, **When** responde, **Then** pode sugerir ao usuário: "💡 Quer que eu gere um plano de ação? (Task Agent)"

3. **Given** baixa confiança, **When** log é gerado, **Then** marca como `fallback: true` para análise

---

### User Story 4 - Match com Custom Agent (Priority: P2)

Usuário criou custom agent "Escritor de Emails". Envia "Escreva um email para cliente". Sistema detecta match com descrição do custom agent e sugere uso.

**Why this priority**: Personalização. Custom agents são inúteis se não forem descobertos automaticamente.

**Independent Test**: Criar custom agent com descrição específica, enviar mensagem matching, verificar sugestão.

**Acceptance Scenarios**:

1. **Given** user tem custom agent "Escritor de Emails" com descrição "Ajuda a redigir emails profissionais", **When** envia "Preciso escrever um email", **Then** classifier identifica match

2. **Given** match identificado, **When** confidence >0.7, **Then** Router Service usa custom agent automaticamente

3. **Given** confidence 0.5-0.7, **When** match ambíguo, **Then** sistema pergunta "💡 Quer usar 'Escritor de Emails'? [Sim] [Não]"

---

### User Story 5 - Contexto de Conversa Influencia Roteamento (Priority: P2)

Usuário está em conversa com Task Agent. Envia mensagem ambígua "E depois?". Sistema mantém Task Agent por contexto.

**Why this priority**: Continuidade. Conversa deve ser fluida sem trocar agente a cada mensagem.

**Independent Test**: Conversa multi-turn, verificar que agente não troca desnecessariamente.

**Acceptance Scenarios**:

1. **Given** conversa ativa com Task Agent, **When** usuário envia "Continue", **Then** Router Service mantém Task Agent (context stickiness)

2. **Given** mudança clara de tópico, **When** usuário envia "Agora me ajude com outra coisa", **Then** Router reclassifica intenção

3. **Given** conversa longa (>10 mensagens), **When** resumo é gerado, **Then** contexto é comprimido mas agente atual é mantido

---

## Functional Requirements

### Routing Logic

**REQ-RTR-001**: Sistema DEVE verificar se agente foi selecionado manualmente antes de classificar  
**REQ-RTR-002**: Se agente manual, sistema DEVE usar agente selecionado sem classificação  
**REQ-RTR-003**: Se auto-select, sistema DEVE classificar intenção via LLM  
**REQ-RTR-004**: Classificação DEVE retornar: intent, confidence (0-1), reasoning  
**REQ-RTR-005**: Sistema DEVE ter fallback para Router Agent se confidence <0.6

### Intent Classification

**REQ-RTR-006**: Classifier DEVE suportar intents: `general_conversation`, `task_generation`, `knowledge_query`, `custom_match`  
**REQ-RTR-007**: Classifier DEVE considerar últimas 3 mensagens da conversa para contexto  
**REQ-RTR-008**: Classifier DEVE detectar palavras-chave específicas (ex: "plano" → task_generation)  
**REQ-RTR-009**: Classifier PODE usar embeddings para semantic matching com custom agents

### Agent Selection

**REQ-RTR-010**: Sistema DEVE carregar apenas agentes visíveis ao usuário (scope: global + user owned)  
**REQ-RTR-011**: Sistema NÃO DEVE considerar system agents (Knowledge, Curation) no roteamento visível  
**REQ-RTR-012**: Se múltiplos custom agents match, escolher por: 1) confidence, 2) usageCount, 3) recency  
**REQ-RTR-013**: Seleção manual DEVE ter sticky behavior (permanece até usuário trocar ou escolher "Auto")

### Context Loading

**REQ-RTR-014**: Sistema DEVE carregar contexto da conversa: últimas N mensagens (N=10 default)  
**REQ-RTR-015**: Se conversa >50 mensagens, sistema DEVE usar resumo comprimido  
**REQ-RTR-016**: Contexto DEVE incluir: user_id, conversation_id, selected_agent_history

### Execution

**REQ-RTR-017**: Sistema DEVE carregar prompt atual do agente selecionado (via `:CURRENT_PROMPT`)  
**REQ-RTR-018**: Sistema DEVE injetar contexto no prompt do agente  
**REQ-RTR-019**: Sistema DEVE executar agente via Agno Framework  
**REQ-RTR-020**: Sistema DEVE capturar response, latency, token usage

### Logging & Analytics

**REQ-RTR-021**: Sistema DEVE logar cada roteamento: agentId, intent, confidence, latency, success  
**REQ-RTR-022**: Log DEVE ser persistido no Neo4j como node `:RoutingLog`  
**REQ-RTR-023**: Admin DEVE poder visualizar analytics de roteamento (qual agente mais usado, taxa de fallback)

---

## Success Criteria

### Accuracy
- ✅ Classificação correta >85% dos casos (manual validation amostra)
- ✅ Fallback rate <15% (maioria das mensagens têm classificação confiante)
- ✅ User override rate <10% (usuários raramente trocam agente após auto-select)

### Performance
- ✅ Latency de classificação <500ms (não adicionar lag perceptível)
- ✅ Latency total (classification + execution) <3s para 95% dos casos
- ✅ Throughput: 100+ req/s no router service

### User Experience
- ✅ Usuários entendem qual agente está respondendo (badge visual)
- ✅ Sugestões de troca de agente são úteis (não irritantes)
- ✅ Sticky selection funciona como esperado (não troca inesperadamente)

---

## Key Entities

### Neo4j Node Structure

```cypher
// RoutingLog node (analytics)
(:RoutingLog {
  id: string,
  userId: string,
  conversationId: string,
  messageText: string, // pode ser truncado para privacy
  selectedAgentId: string,
  wasManualSelection: boolean,
  classifiedIntent: string, // "task_generation" | "general_conversation" | etc
  confidence: float, // 0.0 - 1.0
  wasFallback: boolean,
  latencyMs: integer,
  timestamp: datetime
})

// Agent capability (metadata no Agent node)
(:Agent {
  ...existing fields...,
  capabilities: string[], // ["task_generation", "knowledge_query"]
  keywords: string[], // ["plano", "tarefa", "ação"]
  semanticDescription: string // para embedding matching
})

// Relationships
(:User)-[:TRIGGERED_ROUTING]->(:RoutingLog)
(:RoutingLog)-[:USED_AGENT]->(:Agent)
(:RoutingLog)-[:IN_CONVERSATION]->(:Conversation)
```

---

## Technical Constraints

### Frontend
- Dropdown de agentes deve mostrar badge "🤖 Auto" quando auto-select ativo
- Response deve incluir metadata `{agentUsed: {id, name, icon}}`
- UI pode mostrar tooltip "Por que este agente?" com reasoning

### Backend
- Classifier pode usar Azure OpenAI gpt-4o-mini (barato e rápido)
- Classifier prompt deve ser versionado no Neo4j (como agent prompts)
- Router Service deve ter rate limiting para evitar abuso

### Agno Framework
- Usar `Router` class do Agno com `selector` function customizada
- Selector recebe: `(message, agents, context) => selected_agent`
- Agents dinâmicos carregados do Neo4j em runtime

---

## Classifier Prompt Template

```
You are an intent classifier for an AI agent routing system.

Given a user message, classify the intent into one of:
- general_conversation: Generic chat, questions, greetings
- task_generation: User wants to create tasks, plans, action items
- knowledge_query: User asks about specific knowledge/documents
- custom_match: Message matches description of a custom agent

Available agents:
{agents_json}

User message: "{message}"
Conversation context (last 3 messages):
{context}

Return JSON:
{
  "intent": "task_generation",
  "confidence": 0.85,
  "matchingAgentId": "agent_123" (if custom_match),
  "reasoning": "User explicitly asked for a plan"
}
```

---

## Assumptions

1. **Default Agent**: Router Agent é o padrão quando auto-select
2. **Classifier Cost**: ~$0.0001 por classificação (aceitável)
3. **Context Window**: Últimas 10 mensagens suficientes (não precisa histórico completo)
4. **Agent Capabilities**: Definidas manualmente por admin (não aprendidas automaticamente)
5. **Multi-agent**: MVP não suporta usar 2+ agentes simultaneamente (sequencial sim)

---

## Open Questions

1. **Learning**: Router deve aprender preferências do usuário? (ex: sempre prefere Task Agent)
2. **Confidence UI**: Mostrar confidence score ao usuário ou só admin?
3. **Override Feedback**: Usuário trocar agente gera feedback negativo para classifier?
4. **Context Compression**: Qual algoritmo para resumir conversas longas?
5. **Agent Ranking**: Múltiplos agentes com confidence similar → como desempatar?

---

## Related Specs

- **004-user-agent-factory**: Custom agents devem ser incluídos no pool de roteamento
- **003-admin-login-config**: Admin pode ver analytics de roteamento
- **001-knowledge-pipeline**: System agents (Knowledge, Curation) NÃO aparecem no roteamento

---

## References

- Agno Framework: `Router` class, `selector` function pattern
- Constitution: A.IV (Gestão de Prompts por Usuário)
- Azure OpenAI: GPT-4o-mini for classification
