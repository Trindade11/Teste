# Spec 022 – Onboarding & AI Profile (Canvas Adaptativo em Tempo Real)

## Context & Purpose

O **Onboarding & AI Profile** é o sistema de avaliação inicial e contínua do nível de literacia em IA do usuário e seu "caminho" (técnico vs usuário comum), **levando em conta o tipo de organização e papel da pessoa** (CoCreate, CVC, Startup). Esse perfil é gravado no grafo, alimenta a persona do Personal Agent (019), e faz o Canvas (016) se adaptar **em tempo real em produção** para renderizar:

- **Formulários adaptativos** gerados por agentes, validados como JSON.
- **Flows personalizados** (guias, tutoriais, dashboards) de acordo com o nível de IA do usuário.
- **Visão de Persona** completa: literacia, ferramentas ativas, histórico de evolução, sugestões pendentes.

O sistema se auto-aperfeiçoa continuamente via colaboração entre:
- **Memory Decay Agent (017)**: Identifica padrões de uso de longo prazo.
- **FeedbackAgent (019)**: Propõe atualizações na persona/ferramentas.
- **Onboarding Agent**: Avalia literacia inicial e constrói o perfil base.

---

## High-Level View

```mermaid
flowchart TD
    A[Novo Usuário] -->|Acessa sistema| B[Onboarding Agent]
    B -->|Apresenta formulário adaptativo| C[Canvas: Onboarding Flow]
    C -->|Respostas do usuário| D{Avaliação de Literacia IA}
    D -->|Iniciante/Intermediário/Técnico| E[Cria :AIProfile no grafo]
    E -->|Liga a :User| F[:User]-[:HAS_AI_PROFILE]->[:AIProfile]
    F -->|Influencia| G[Personal Agent Persona]
    G -->|Canvas adapta em tempo real| H[Renderiza UI/flows personalizados]
    
    I[Memory Decay Agent] -->|Identifica padrões longo prazo| J[FeedbackAgent]
    J -->|Propõe atualização de persona| K[Nova :PersonaVersion]
    K -->|Notificação| L[User valida via Canvas]
    L -->|Aceita| M[Ativa nova versão]
    L -->|Rejeita/Adia| N[Mantém versão atual]
    
    M --> H
    N --> H
    
    style E fill:#e1f5ff
    style G fill:#ffe1f5
    style H fill:#f5ffe1
    style K fill:#fff5e1
```

---

## Process Flow: Onboarding Inicial

```mermaid
sequenceDiagram
    participant U as User (Novo)
    participant C as Canvas
    participant OA as Onboarding Agent
    participant Neo as Neo4j
    participant PA as Personal Agent

    U->>C: Acessa sistema pela 1ª vez
    C->>OA: Solicita onboarding flow
    OA->>C: Gera formulário adaptativo (JSON)
    C->>U: Renderiza perguntas sobre IA
    
    Note over U,C: Perguntas adaptativas:<br/>- Já trabalhou com IA?<br/>- Conhece prompts/LLMs?<br/>- Perfil técnico ou usuário?
    
    U->>C: Responde questionário
    C->>OA: Envia respostas
    OA->>OA: Classifica literacia (iniciante/intermediário/técnico)
    OA->>Neo: CREATE (:AIProfile {level, technicalPath, needs})
    OA->>Neo: CREATE (:User)-[:HAS_AI_PROFILE]->(:AIProfile)
    OA->>Neo: CREATE (:PersonaVersion v1) com base no perfil
    
    Neo-->>PA: Notifica criação de persona inicial
    PA->>PA: Carrega persona base
    PA->>C: Retorna configuração de Canvas personalizado
    C->>U: Renderiza dashboard inicial adaptado ao nível
```

---

## Agent Collaboration: Melhoria Contínua da Persona

```mermaid
sequenceDiagram
    participant MD as Memory Decay Agent
    participant Neo as Neo4j
    participant FB as FeedbackAgent
    participant NC as Notification Center
    participant U as User
    participant C as Canvas

    Note over MD: Job periódico (diário)<br/>ou trigger sob demanda
    
    MD->>Neo: Query padrões de longo prazo
    Neo-->>MD: Ex: Usuário pede muito planilhas,<br/>docs técnicos, integrações
    
    MD->>FB: Envia padrões identificados
    FB->>FB: Analisa gap entre persona atual<br/>e necessidades observadas
    FB->>Neo: CREATE (:PersonaVersion v2 {status: 'draft'})<br/>com sugestões: novos MCPs,<br/>ajustes de literacia, novas habilidades
    FB->>NC: Dispara notificação "Sugestão de Melhoria de Persona"
    
    NC->>U: Mostra notificação no sino
    U->>C: Clica em notificação
    C->>Neo: Query persona v1 vs v2
    Neo-->>C: Retorna diff estruturado
    C->>U: Renderiza visão comparativa:<br/>Atual vs Proposta (MCPs, literacia, habilidades)
    U->>C: Aceitar / Rejeitar / Adiar
    
    alt Aceita
        C->>Neo: UPDATE :PersonaVersion v2 {status: 'active'}
        C->>Neo: UPDATE :PersonaVersion v1 {status: 'archived'}
        Neo-->>PA: Notifica mudança de persona
        PA->>PA: Recarrega persona v2
        PA->>C: Canvas se adapta em tempo real
    else Rejeita
        C->>Neo: UPDATE :PersonaVersion v2 {status: 'rejected'}
        C->>FB: Registra feedback negativo
    end
```

---

## User Scenarios

### Scenario 1 – Onboarding de Usuário Iniciante

**Given** novo usuário sem experiência em IA,  
**When** acessa o sistema,  
**Then** Onboarding Agent apresenta formulário simples (linguagem acessível) perguntando:
- "Você já usou ChatGPT ou ferramentas de IA?"
- "Você se considera técnico (programador) ou usuário comum?"
- "Quais suas principais necessidades? (tarefas, relatórios, planilhas, documentos)"

**And** com base nas respostas, cria `:AIProfile {level: 'iniciante', technicalPath: false}` e `:PersonaVersion` inicial,  
**And** Canvas renderiza dashboard simplificado com guias e tutoriais básicos.

---

### Scenario 2 – Onboarding de Usuário Técnico

**Given** novo usuário com perfil técnico,  
**When** acessa o sistema,  
**Then** Onboarding Agent apresenta formulário avançado perguntando:
- "Você trabalha com APIs/integrações?"
- "Já criou prompts ou agentes customizados?"
- "Precisa de acesso a ferramentas de desenvolvimento (MCPs)?"

**And** cria `:AIProfile {level: 'técnico', technicalPath: true}` e `:PersonaVersion` com MCPs técnicos sugeridos,  
**And** Canvas renderiza dashboard técnico com acesso direto a APIs, grafo, observabilidade.

---

### Scenario 3 – Evolução Contínua da Persona

**Given** usuário ativo há 3 meses,  
**When** Memory Decay Agent identifica que usuário sempre pede planilhas e relatórios financeiros,  
**Then** FeedbackAgent propõe:
- Adicionar habilidade "Análise Financeira" na persona.
- Sugerir MCPs de integração com Excel/Google Sheets.
- Aumentar nível de literacia de "iniciante" para "intermediário".

**And** usuário recebe notificação, visualiza diff no Canvas, aceita,  
**And** Canvas passa a renderizar widgets financeiros e atalhos para planilhas na home.

---

### Scenario 4 – Canvas Adaptativo em Tempo Real

**Given** usuário com `:AIProfile {level: 'intermediário'}`,  
**When** Personal Agent detecta pergunta técnica avançada,  
**Then** Canvas sugere upgrade de literacia ou exibe tutorial contextual inline,  
**And** FeedbackAgent registra esse evento para futura proposta de upgrade.

---

## Functional Requirements

### Onboarding Flow & Formulário Adaptativo

- **REQ-OAI-001**: Sistema DEVE apresentar formulário de onboarding na primeira vez que usuário acessa.
- **REQ-OAI-002**: Onboarding Agent DEVE gerar formulário como JSON estruturado, permitindo validação via schema (ex: JSON Schema).
- **REQ-OAI-003**: Perguntas DEVEM adaptar-se dinamicamente com base em respostas anteriores (ex: se usuário diz "técnico", próximas perguntas são mais avançadas).
- **REQ-OAI-004**: Formulário DEVE incluir perguntas sobre:
  - Experiência prévia com IA (sim/não, nível).
  - Perfil técnico vs usuário comum.
  - Necessidades principais (tarefas, documentos, análises, integrações).
  - Preferências de UI (detalhada vs simplificada).

### Onboarding por Organização & Papel

- **REQ-OAI-027**: Onboarding Agent DEVE receber, do node `:User` (criado/cadastrado pelo admin global em 003), ao menos: `organizationType` (`"cocreate" | "cvc" | "startup"`), `company` e `role` (ex.: gestor CVC, founder startup, analista CoCreate).
- **REQ-OAI-028**: Com base em `organizationType` e `role`, Onboarding Agent DEVE selecionar um **template de formulário** apropriado (ex.: fluxo CoCreate interno, fluxo CVC, fluxo Startup), carregado a partir de configuração no grafo ou arquivo JSON (Zero Hardcode).
- **REQ-OAI-029**: Fluxo de onboarding para CoCreate PODE enfatizar responsabilidades de curadoria/gestão de conhecimento, enquanto fluxos CVC/Startup PODEM enfatizar objetivos de negócio (investimento, crescimento, produto, etc.), mantendo estrutura técnica comum (AIProfile + PersonaVersion).

### Experiência Integrada Chat + Canvas

- **REQ-OAI-030**: Onboarding inicial DEVE ser orquestrado pelo chat: Onboarding Agent envia mensagens explicando cada etapa, enquanto o **formulário estruturado é renderizado no Canvas** como conteúdo central.
- **REQ-OAI-031**: Cada etapa do formulário DEVE ter, no Canvas, controles claros de ação (ex.: botões "Salvar e continuar" e opcionalmente "Concluir depois"), e a progressão para a próxima etapa SÓ DEVE ocorrer após ação explícita do usuário.
- **REQ-OAI-032**: Ao salvar uma etapa, sistema DEVE:
  - Persistir respostas em nodes `:OnboardingResponse` ligados ao `:User` e ao `:AIProfile`.  
  - Registrar também o vínculo com uma `:Conversation` de onboarding (ver 007), garantindo que o histórico de chat reflita o que foi respondido.  
  - Enviar mensagem de confirmação no chat e atualizar Canvas para próxima etapa (se houver).
- **REQ-OAI-033**: Usuário DEVE poder retomar onboarding incompleto em sessão futura; Canvas e chat DEVEM refletir etapa atual e etapas já concluídas.

### Gravação de AI Profile & Persona Inicial no Grafo

- **REQ-OAI-005**: Onboarding Agent DEVE criar nó `:AIProfile` ligado ao `:User` via relação `[:HAS_AI_PROFILE]`.
- **REQ-OAI-006**: `:AIProfile` DEVE conter:
  - `level`: `'iniciante'`, `'intermediário'`, `'técnico'`, `'especialista'`.
  - `technicalPath`: booleano indicando se é perfil técnico.
  - `needs`: array de necessidades principais (ex: `['planilhas', 'relatórios', 'integrações']`).
  - `created_at`, `updated_at`.
- **REQ-OAI-007**: Onboarding Agent DEVE criar `:PersonaVersion` inicial (v1) com:
  - `version`: `'v1'`.
  - `status`: `'active'`.
  - `prompt`: texto base do prompt do Personal Agent.
  - `mcps_suggested`: lista de MCPs sugeridos com base no perfil.
  - `abilities`: lista de habilidades iniciais.
  - `preferences`: preferências de interação (linguagem simples vs técnica).

### Canvas Adaptativo em Tempo Real

- **REQ-OAI-008**: Canvas DEVE consultar `:AIProfile` e `:PersonaVersion` ativa do usuário a cada renderização.
- **REQ-OAI-009**: Canvas DEVE adaptar:
  - **Layout**: Dashboard simplificado para iniciantes, avançado para técnicos.
  - **Widgets**: Exibir ou ocultar widgets com base em `needs` (ex: widget de planilhas só se `needs` inclui `'planilhas'`).
  - **Linguagem**: Tooltips e mensagens simples para iniciantes, técnicas para avançados.
  - **Atalhos**: Menu lateral com atalhos personalizados (ex: "Minhas Planilhas", "Integrações API").
- **REQ-OAI-010**: Mudanças em `:PersonaVersion` (quando usuário aceita proposta) DEVEM refletir no Canvas **imediatamente** (em produção), sem necessidade de logout/login.

### Colaboração Memory Decay ↔ Feedback

- **REQ-OAI-011**: Memory Decay Agent (017) DEVE rodar job periódico (ex: diário) para identificar padrões de uso de longo prazo.
- **REQ-OAI-012**: Quando padrões relevantes são identificados (ex: usuário sempre pede tipo específico de conteúdo), Memory Decay DEVE notificar FeedbackAgent (019).
- **REQ-OAI-013**: FeedbackAgent DEVE analisar gap entre `:PersonaVersion` ativa e padrões observados.
- **REQ-OAI-014**: Se gap significativo, FeedbackAgent DEVE criar nova `:PersonaVersion` com `status: 'draft'`, incluindo:
  - Sugestões de novos MCPs/ferramentas.
  - Ajustes em `abilities` (ex: adicionar "Análise Financeira").
  - Proposta de upgrade de `level` (ex: iniciante → intermediário).
- **REQ-OAI-015**: FeedbackAgent DEVE disparar notificação via Notification Center (021) para usuário revisar proposta.

### Visão de Persona no Canvas

- **REQ-OAI-016**: Canvas DEVE ter tela dedicada "Meu Perfil de IA / Minha Persona" acessível via menu principal.
- **REQ-OAI-017**: Essa tela DEVE exibir:
  - **Literacia Atual**: Nível de IA (iniciante, intermediário, técnico, especialista) com descrição.
  - **Caminho Técnico**: Indicador visual se é usuário comum ou técnico.
  - **Necessidades Mapeadas**: Lista de necessidades principais.
  - **Ferramentas Ativas**: MCPs e integrações atualmente configurados.
  - **Histórico de Evolução**: Timeline de versões de persona (v1, v2, v3...) com datas e mudanças.
  - **Sugestões Pendentes**: Cards de propostas do FeedbackAgent aguardando validação (diff atual vs proposta, com botões Aceitar/Rejeitar/Adiar).
- **REQ-OAI-018**: Usuário DEVE poder reverter para versão anterior de persona via interface (com confirmação).

### Validação de Formulário como JSON

- **REQ-OAI-019**: Onboarding Agent DEVE validar formulário gerado contra JSON Schema antes de enviar ao Canvas.
- **REQ-OAI-020**: Se validação falhar, agente DEVE regenerar formulário até obter JSON válido (max 3 tentativas).
- **REQ-OAI-021**: Canvas DEVE validar JSON recebido antes de renderizar; se inválido, exibir formulário padrão de fallback.

### Fluxo Sob Demanda

- **REQ-OAI-022**: Além do job periódico, FeedbackAgent DEVE poder ser acionado **sob demanda** quando:
  - Usuário solicita explicitamente reavaliação de perfil (botão "Reavaliar Meu Perfil").
  - Personal Agent detecta comportamento muito divergente da persona atual (trigger automático).
- **REQ-OAI-023**: Trigger sob demanda DEVE seguir mesmo fluxo de análise + proposta + notificação + validação.

### Integração com Retrieval Orchestrator

- **REQ-OAI-024**: Retrieval Orchestrator (024) DEVE considerar `:AIProfile` e `:PersonaVersion` ativa ao escolher estratégia de busca para intents de **orientação/coaching** (ex.: priorizar conteúdos alinhados a `needs` e `abilities`).
- **REQ-OAI-025**: Logs de retrieval (`:RetrievalJob` com intents, tipos de conteúdo acessados e sucesso percebido) DEVEM ser usados como insumo adicional pelo FeedbackAgent ao propor novas `:PersonaVersion` (além dos padrões detectados pelo Memory Decay Agent).
- **REQ-OAI-026**: Canvas PODE exibir, na visão de Persona, exemplos de como o perfil atual influencia a recuperação de conhecimento (ex.: "priorizando conteúdos sobre planilhas e relatórios").

---

## Success Criteria

- ✅ Novos usuários completam onboarding em < 2 minutos com formulário adaptativo.
- ✅ 90% dos usuários têm `:AIProfile` e `:PersonaVersion` ativa após onboarding.
- ✅ Canvas adapta layout/widgets em tempo real baseado em mudanças de persona (sem reload).
- ✅ FeedbackAgent propõe melhorias de persona mensalmente (job periódico) com taxa de aceitação > 60%.
- ✅ Usuários conseguem visualizar histórico completo de evolução de persona e reverter se necessário.
- ✅ Formulários gerados são 100% JSON válido (validação via schema).

---

## Key Entities (Neo4j)

### :AIProfile

```cypher
(:AIProfile {
  id: uuid,
  level: 'iniciante' | 'intermediário' | 'técnico' | 'especialista',
  technicalPath: boolean,
  needs: ['planilhas', 'relatórios', 'integrações', ...],
  created_at: timestamp,
  updated_at: timestamp
})
```

**Relationships**:
- `(:User)-[:HAS_AI_PROFILE]->(:AIProfile)` (1:1)
- `(:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)` (aponta para versão ativa)

---

### :PersonaVersion

```cypher
(:PersonaVersion {
  id: uuid,
  version: 'v1' | 'v2' | 'v3' | ...,
  status: 'active' | 'draft' | 'archived' | 'rejected',
  prompt: text,  // Base do prompt do Personal Agent
  mcps_suggested: ['excel_mcp', 'sheets_mcp', ...],
  abilities: ['Análise Financeira', 'Relatórios', ...],
  preferences: {
    language: 'simple' | 'technical',
    ui_complexity: 'basic' | 'advanced'
  },
  created_at: timestamp,
  created_by: 'onboarding_agent' | 'feedback_agent'
})
```

**Relationships**:
- `(:AIProfile)-[:HAS_VERSION]->(:PersonaVersion)` (histórico completo)
- `(:PersonaVersion)-[:PREVIOUS_VERSION]->(:PersonaVersion)` (encadeamento de versões)
- `(:User)-[:ACTIVE_PERSONA]->(:PersonaVersion {status: 'active'})` (atalho para versão atual)

---

### :OnboardingResponse

```cypher
(:OnboardingResponse {
  id: uuid,
  user_id: uuid,
  question_id: string,
  answer: text | number | boolean,
  created_at: timestamp
})
```

**Relationships**:
- `(:User)-[:ANSWERED]->(:OnboardingResponse)`
- `(:OnboardingResponse)-[:LED_TO]->(:AIProfile)` (rastreabilidade)

---

## Technical Constraints

- **Canvas em Tempo Real**: Frontend deve usar WebSocket ou polling para detectar mudanças em `:PersonaVersion` ativa e re-renderizar sem reload.
- **JSON Schema Validation**: Usar biblioteca de validação (ex: Ajv) tanto no backend (Onboarding Agent) quanto no frontend (Canvas).
- **Versionamento de Persona**: Manter histórico completo (nunca deletar `:PersonaVersion`), permitir rollback via flag `status: 'archived'` → `'active'`.
- **Trigger Periódico**: Job de Memory Decay + Feedback deve rodar em horário de baixo uso (ex: 2am) para não impactar performance.
- **Zero Hardcode**: Todas as perguntas de onboarding devem vir de configuração no grafo ou arquivo JSON, não hardcoded no código.

---

## Assumptions

- Usuário aceita compartilhar informações sobre experiência com IA durante onboarding.
- Literacia em IA pode ser inferida de respostas a 5-8 perguntas objetivas.
- Canvas tem capacidade de re-renderização parcial (não precisa recarregar página inteira).
- Neo4j suporta queries eficientes para diff de `:PersonaVersion` (v1 vs v2).

---

## Open Questions

- [ ] Qual frequência ideal para job periódico de reavaliação de persona? (diário, semanal, mensal)
- [ ] Como lidar com usuários que rejeitam repetidamente sugestões de melhoria? (reduzir frequência de propostas?)
- [ ] Devemos permitir usuário editar manualmente `:AIProfile` ou só via validação de propostas do FeedbackAgent?
- [ ] Como versionar também os **MCPs** (não só prompt)? Criar nó `:MCPVersion`?
- [ ] Canvas deve ter modo "preview" de nova persona antes de aceitar? (usuário testa por X minutos antes de decidir)

---

## Related Specs

- **016 – Main Interface Layout**: Canvas como área principal de renderização adaptativa.
- **017 – Memory Ecosystem**: Memory Decay Agent identifica padrões de longo prazo.
- **019 – Multi-Agent Orchestration**: FeedbackAgent propõe melhorias, Personal Agent usa persona.
- **020 – Gamification & User KPIs**: Dashboard pode integrar métricas de evolução de literacia.
- **021 – Notification Center**: Notificações de propostas de melhoria de persona.
- **009 – User Memory Decision**: Decisão corporativa vs pessoal pode influenciar onboarding (ex: admin de CVC tem perfil técnico por padrão).

---

## Notes

- **Canvas Adaptativo em Produção**: Implementar com arquitetura de feature flags + config dinâmica no grafo. Canvas consulta `:PersonaVersion` ativa a cada renderização crítica (ex: load de dashboard, mudança de página).
- **Self-Improving System**: Este spec é a base do "sistema de auto-aperfeiçoamento" mencionado nas user rules — a IA (via FeedbackAgent + Memory Decay) **aprende sobre o usuário continuamente** e propõe melhorias que, uma vez aceitas, tornam o sistema mais sagaz.
- **Grafos como Base**: Toda a flexibilidade vem do grafo: histórico de versões, padrões de uso, decisões de usuário. Sem hardcode, tudo configurável e rastreável.
