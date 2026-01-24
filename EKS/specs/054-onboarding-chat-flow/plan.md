# Plano: Fluxo Onboarding → Chat Inaugural → Gmail Auth

**Criado**: 2026-01-21  
**Status**: Planejamento  
**Specs Relacionadas**: 022, 005, 053, 025

---

## Problema Identificado

O fluxo atual não define claramente:
1. **Quando** o chat é criado após o onboarding
2. **Qual** mensagem o PLA envia na primeira vez (vs conversas normais)
3. **Como** integrar autorização de fontes de dados (Gmail)

---

## Solução: Fluxo em 4 Fases

```mermaid
flowchart TD
    subgraph F1["1️⃣ ONBOARDING"]
        FRV[First Random Voting<br/>6 perguntas] --> Profile[Cria AIProfile +<br/>PersonaVersion]
    end
    
    subgraph F2["2️⃣ ATIVAÇÃO DO ASSISTENTE"]
        Profile --> MenuAssistente[Assistente aparece<br/>no menu]
        MenuAssistente --> ChatInaugural[Cria :Conversation<br/>type: 'inaugural']
        ChatInaugural --> WelcomeMsg[Welcome Message<br/>1x única]
    end
    
    subgraph F3["3️⃣ AUTORIZAÇÃO GMAIL"]
        WelcomeMsg --> SolicitaGmail[PLA solicita:<br/>'Conectar Gmail?']
        SolicitaGmail -->|Sim| OAuthGmail[OAuth Gmail]
        SolicitaGmail -->|Depois| SkipGmail[Banner persistente]
        OAuthGmail --> ExtraiGmail[Extração automática]
    end
    
    subgraph F4["4️⃣ USO NORMAL"]
        ExtraiGmail --> ChatNormal[Chat baseado no grafo]
        SkipGmail --> ChatNormal
    end
    
    subgraph BG["🔄 BACKGROUND"]
        WhatsApp[WhatsApp Data] -.->|Workflow externo| ChatNormal
    end

    classDef f1 fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef f2 fill:#e8f5e9,stroke:#4caf50,color:#000
    classDef f3 fill:#fff3e0,stroke:#ff9800,color:#000
    classDef f4 fill:#fce4ec,stroke:#e91e63,color:#000
    classDef bg fill:#f5f5f5,stroke:#9e9e9e,color:#666

    class FRV,Profile f1
    class MenuAssistente,ChatInaugural,WelcomeMsg f2
    class SolicitaGmail,OAuthGmail,SkipGmail,ExtraiGmail f3
    class ChatNormal f4
    class WhatsApp bg
```

---

## Distinção de Prompts do PLA

| Tipo | Trigger | Conteúdo | Frequência |
|------|---------|----------|------------|
| **Welcome Prompt** | `has_completed_onboarding=true` AND `has_received_welcome=false` | Acolhedor, explicativo, solicita Gmail | **1x por usuário** |
| **Session Start Prompt** | Nova `:Conversation` criada | Contextual, baseado em objetivos atuais (BIG) | **Toda nova conversa** |
| **Continuation Prompt** | Mensagem em conversa existente | Baseado no grafo, memória, histórico | **Toda mensagem** |

---

## Fontes de Dados

| Fonte | Autorização | Método |
|-------|-------------|--------|
| **WhatsApp** | ❌ Automático | Workflow externo |
| **Gmail** | ✅ Requer autorização | OAuth 2.0 |

---

## Modelo de Dados - Extensões

### User Node
```cypher
(:User {
  // Novos campos
  has_completed_onboarding: boolean,
  has_received_welcome: boolean,
  onboarding_completed_at: datetime,
  gmail_connected: boolean,
  gmail_token: encrypted_string,
  gmail_skipped: boolean,
  gmail_connected_at: datetime
})
```

### Conversation Node
```cypher
(:Conversation {
  // Novo campo
  type: 'regular' | 'inaugural' | 'onboarding',
  is_first_chat: boolean
})
```

### Welcome Template
```cypher
(:WelcomeTemplate {
  id: string,
  profile_level: 'iniciante' | 'intermediário' | 'técnico',
  template_text: string,
  variables: ['user_name', 'abilities', 'suggested_actions'],
  created_at: datetime
})
```

---

## Sequência Detalhada

```mermaid
sequenceDiagram
    participant U as Usuário
    participant OA as Onboarding Agent
    participant PLA as Personal Lead Agent
    participant UI as Chat/Canvas
    participant Gmail as Gmail OAuth
    participant Neo as Neo4j

    Note over U,OA: FASE 1 - ONBOARDING
    U->>OA: Conclui 6 perguntas
    OA->>Neo: CREATE (:AIProfile), (:PersonaVersion)
    OA->>Neo: SET u.has_completed_onboarding = true
    
    Note over PLA,UI: FASE 2 - ATIVAÇÃO
    OA->>PLA: onboarding_completed event
    PLA->>Neo: CREATE (:Conversation {type: 'inaugural'})
    PLA->>UI: Assistente aparece no menu
    PLA->>UI: Welcome Message (1x)
    PLA->>Neo: SET u.has_received_welcome = true
    
    Note over PLA,Gmail: FASE 3 - AUTORIZAÇÃO GMAIL
    PLA->>UI: "Conectar Gmail para insights?"
    
    alt Usuário aceita
        U->>UI: Clica "Conectar Gmail"
        UI->>Gmail: OAuth flow
        Gmail-->>Neo: Token salvo
        Neo->>Neo: SET u.gmail_connected = true
        PLA->>UI: "Gmail conectado!"
    else Usuário recusa/adia
        U->>UI: "Depois"
        Neo->>Neo: SET u.gmail_skipped = true
    end
    
    Note over U,Neo: FASE 4 - USO NORMAL
    U->>PLA: Primeira mensagem
    PLA->>Neo: Query grafo + Gmail (se conectado)
    PLA->>UI: Resposta contextualizada
```

---

## Requisitos a Adicionar

### Spec 022 (Onboarding)
- REQ-OAI-034: Criar chat inaugural após onboarding
- REQ-OAI-035: Welcome Message personalizada por nível
- REQ-OAI-036: Welcome Message explica capacidades
- REQ-OAI-037: Solicitar autorização Gmail após welcome
- REQ-OAI-038: Opções [Conectar agora] [Depois]
- REQ-OAI-039: Banner persistente se usuário adia

### Spec 005 (PLA)
- REQ-PLA-032: Detectar primeira interação
- REQ-PLA-033: Carregar Welcome Prompt Template
- REQ-PLA-034: Welcome Message 1x única
- REQ-PLA-035: Session Start Prompt para novas conversas

### Spec 053 (Context Absorption)
- REQ-ABS-WhatsApp: Workflow externo, sem auth no app
- REQ-ABS-Gmail: OAuth 2.0, scopes gmail.readonly

---

## Exemplos de Welcome Message

### Para INICIANTE
```
Olá, [nome]! 👋

Prazer em te conhecer! Agora que sei um pouco mais sobre você, 
posso te ajudar de forma personalizada.

Com base no que você me contou, identifiquei que posso te ajudar com:
• Criação de relatórios
• Organização de tarefas
• Resumos de documentos

📬 **Uma coisa rápida**: posso analisar padrões do seu Gmail 
para entender melhor suas prioridades.

[🔗 Conectar Gmail]  [⏭️ Depois]

De qualquer forma, já podemos começar! Qual sua prioridade hoje?
```

### Para TÉCNICO
```
[nome], configuração inicial concluída. ✓

Perfil detectado: Técnico
Capacidades ativas: APIs, integrações, análise de dados

📬 Gmail disponível para extração de contexto.
[🔗 Conectar]  [⏭️ Depois]

Comandos disponíveis:
- `/task create` - gerar plano de ação
- `/knowledge` - consultar base de conhecimento

Pronto para executar.
```

---

## Próximos Passos

1. [x] Criar este plano
2. [ ] Atualizar spec 022 com REQ-OAI-034 a 039
3. [ ] Atualizar spec 005 com REQ-PLA-032 a 035
4. [ ] Atualizar spec 053 com REQ-ABS-Gmail
5. [ ] Revisar com stakeholder

---

## Notas

- WhatsApp vem de workflow externo, não requer menção na UI
- Gmail é a única fonte que requer autorização explícita do usuário
- O chat inaugural é criado UMA VEZ, após o primeiro onboarding
- Welcome Message é enviada ANTES do usuário digitar qualquer coisa
