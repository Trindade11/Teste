# Spec 029: UX Professional – Chat, Canvas & Histórico Corporativo

**Feature**: Interface profissional moderna com chat adaptativo e histórico contextual  
**Priority**: P1 (MVP v1 - UX)  
**Sprint**: 1-2  
**Effort**: 5 dias  
**Status**: 📋 Planned  

---

## Visão Geral

Revitalização completa da UX do EKS com foco em **usabilidade corporativa**, **identidade visual profissional** e **experiência conversacional adaptativa**. Sistema deve reconhecer contexto corporativo vs pessoal e adaptar modo de conversa ao perfil do usuário.

---

## Problema

- Interface atual é funcional mas carece de polish profissional
- Não há distinção clara entre conversas corporativas e pessoais
- Histórico de conversas não contextualiza adequadamente
- Diálogo do sistema não se adapta ao modo operandi do usuário
- Falta feedback visual sobre potência/profundidade da resposta

---

## Solução

### Princípios de Design

1. **Corporate-First Design** - Interface otimizada para ambiente corporativo
2. **Adaptive Conversation** - Sistema aprende e adapta tom/formato ao usuário
3. **Context Awareness** - Visual claro de contexto (corporativo/pessoal)
4. **Progressive Disclosure** - Informação revelada gradualmente
5. **Minimal Cognitive Load** - UI limpa, foco no essencial

---

## Layout Revitalizado

### Estrutura Geral

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                       │
│ [Logo] [Workspace] [User: João] [🔔3] [⚙️]                  │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────┬───────────────┐
│          │                                  │               │
│  Sidebar │         Canvas                   │     Chat      │
│  (280px) │         (flex-1)                 │    (420px)    │
│          │                                  │   [collapse]  │
│  [Nav]   │  [Conteúdo Principal]           │               │
│  [Ctx]   │  • Plano de ação                │  [Messages]   │
│  [Fav]   │  • Grafo                        │  [Input]      │
│          │  • Dashboard                    │  [Context]    │
│          │  • Documento                    │               │
│          │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

### Sidebar (Menu Esquerdo)

**Navegação Inteligente** (adapta-se ao uso):
```
┌─────────────────────┐
│ 🏠 Home             │
│ ⭐ Favoritos        │ ← Auto-gerado baseado em uso
│ 📅 Minha Agenda     │
│                     │
│ 🚀 Startups (8)     │
│   → Startup A       │
│   → Startup B       │
│                     │
│ 📊 Projetos (5)     │
│   → Projeto X       │
│                     │
│ 💬 Conversas        │
│   📂 Corporativas   │
│   🔒 Pessoais       │
│                     │
│ 🎯 Minhas Tarefas   │
│ 📈 Dashboard        │
└─────────────────────┘
```

**Painel de Contexto** (aparece ao selecionar item):
```
┌─────────────────────┐
│ 📄 Contexto Atual   │
│                     │
│ Startup A           │
│ Status: Ativo       │
│ Fase: Series A      │
│ Owner: Maria S.     │
│                     │
│ [Ver Detalhes]      │
│ [Abrir no Canvas]   │
└─────────────────────┘
```

---

## Chat Panel (Direita)

### Header do Chat

```
┌─────────────────────────────────────────┐
│ 💬 Chat Corporativo                     │ ← Toggle visual
│ [🤖 Router Agent] [⚡ Potência: 2/3]   │
│                                         │
│ Contexto: Startup A • Reunião 15/12    │ ← Breadcrumb
└─────────────────────────────────────────┘
```

### Histórico de Conversas

**Separação Visual Clara**:

```
Conversas Corporativas 📂
┌─────────────────────────────────────┐
│ 📊 Análise Startup A                │
│ Há 2 horas • 15 mensagens           │
│ Contexto: Investimento              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Planejamento Q1 2025             │
│ Ontem • 28 mensagens                │
│ Contexto: Estratégia                │
└─────────────────────────────────────┘

Conversas Pessoais 🔒
┌─────────────────────────────────────┐
│ 💡 Ideias para Apresentação         │
│ 3 dias atrás • 8 mensagens          │
└─────────────────────────────────────┘
```

### Mensagens Adaptativas

**Exemplo: Usuário Técnico**
```
[Bot] 💻
Analisei o pipeline de deploy:

```yaml
stages:
  - build
  - test
  - deploy
```

Encontrei 3 gargalos de performance.
Quer que eu detalhe cada um?

[Sim, detalhe] [Mostrar código]
```

**Exemplo: Usuário Executivo**
```
[Bot] 💼
Analisei a situação da Startup A:

✅ Receita: +35% vs Q3
⚠️  Burn rate elevado
📊 CAC/LTV ratio: 1:4 (saudável)

Recomendo reunião de acompanhamento.

[Agendar] [Ver detalhes]
```

### Input Area

```
┌───────────────────────────────────────────────┐
│ [📂] [🎤] [📎]                               │
│                                               │
│ Digite sua mensagem...                        │
│                                               │
│ [Corporativo ▼] [Potência: ●●○]      [Enviar]│
└───────────────────────────────────────────────┘
```

**Controles**:
- `📂` - Toggle Corporativo/Pessoal
- `🎤` - Voice input (Spec 027)
- `📎` - File upload (Spec 028)
- `Potência` - Profundidade da resposta (integra Spec 030)

---

## Canvas (Centro)

### Dashboard View

```
┌─────────────────────────────────────────────┐
│ Bem-vindo, João                             │
│                                             │
│ ┌─────────────┬─────────────┬────────────┐ │
│ │ 📊 Startups │ ✅ Tarefas  │ 📅 Agenda  │ │
│ │ 8 ativas    │ 12 pendentes│ 3 reuniões │ │
│ └─────────────┴─────────────┴────────────┘ │
│                                             │
│ Atividade Recente                           │
│ ┌─────────────────────────────────────────┐ │
│ │ ✅ Task: Análise financeira - 2h atrás  │ │
│ │ 💬 Conversa: Startup A - 4h atrás       │ │
│ │ 📄 Doc processado: Report Q4 - Ontem    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Plano de Ação (Task View)

```
┌─────────────────────────────────────────────┐
│ 📋 Plano de Ação: Startup A Due Diligence  │
│                                             │
│ [Lista] [Board] [Timeline]                  │
│                                             │
│ A Fazer          Em Progresso    Concluído  │
│ ┌─────────┐     ┌─────────┐     ┌────────┐ │
│ │Task 1   │     │Task 3   │     │Task 2  │ │
│ │@maria   │     │@joão    │     │✓       │ │
│ └─────────┘     └─────────┘     └────────┘ │
│                                             │
│ [+ Nova Tarefa]                             │
└─────────────────────────────────────────────┘
```

### Grafo View

```
┌─────────────────────────────────────────────┐
│ 🕸️ Mapa de Conhecimento                     │
│                                             │
│        [Startup A]                          │
│       /    |    \                           │
│   [CEO] [Produto] [Financeiro]              │
│     |      |         |                      │
│  [João] [Tech]   [Invest]                   │
│                     |                       │
│                  [Report]                   │
│                                             │
│ [🔍 Zoom] [🎨 Layout] [📥 Export]           │
└─────────────────────────────────────────────┘
```

---

## Identidade Visual

### Paleta de Cores

**Base** (Corporativa Profissional):
```css
--primary: #2563eb;        /* Blue - Ações principais */
--secondary: #7c3aed;      /* Purple - Destaque */
--accent: #06b6d4;         /* Cyan - Informação */
--success: #10b981;        /* Green - Sucesso */
--warning: #f59e0b;        /* Amber - Atenção */
--danger: #ef4444;         /* Red - Erro/Crítico */

--bg-primary: #ffffff;     /* Fundo principal */
--bg-secondary: #f8fafc;   /* Fundo secundário */
--bg-tertiary: #f1f5f9;    /* Fundo cards */

--text-primary: #0f172a;   /* Texto principal */
--text-secondary: #64748b; /* Texto secundário */
--text-muted: #94a3b8;     /* Texto desativado */

--border: #e2e8f0;         /* Bordas */
--border-strong: #cbd5e1;  /* Bordas destacadas */
```

**Modo Corporativo**:
```css
--corp-badge: #2563eb;     /* Badge azul */
--corp-bg: #eff6ff;        /* Fundo leve azul */
```

**Modo Pessoal**:
```css
--personal-badge: #7c3aed; /* Badge roxo */
--personal-bg: #faf5ff;    /* Fundo leve roxo */
```

### Tipografia

```css
--font-sans: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;    /* 12px - Labels */
--text-sm: 0.875rem;   /* 14px - Corpo */
--text-base: 1rem;     /* 16px - Padrão */
--text-lg: 1.125rem;   /* 18px - Títulos */
--text-xl: 1.25rem;    /* 20px - Cabeçalhos */
--text-2xl: 1.5rem;    /* 24px - Títulos grandes */
```

### Componentes

**Badge Corporativo/Pessoal**:
```tsx
// Corporativo
<Badge variant="corporate">
  📂 Corporativo
</Badge>

// Pessoal
<Badge variant="personal">
  🔒 Pessoal
</Badge>
```

**Message Bubble**:
```tsx
// Bot (Technical User)
<MessageBubble 
  role="assistant"
  style="technical"
>
  <CodeBlock language="python">
    def analyze_startup(data):
        return metrics
  </CodeBlock>
</MessageBubble>

// Bot (Executive User)
<MessageBubble 
  role="assistant"
  style="executive"
>
  <Summary>
    Startup A: +35% receita, burn rate OK
  </Summary>
  <Actions>
    <Button>Agendar follow-up</Button>
  </Actions>
</MessageBubble>
```

---

## Diálogo Adaptativo

### Sistema Aprende Preferências

**Após N interações, sistema identifica**:
- Usuário prefere respostas curtas ou detalhadas
- Usa mais dados visuais (gráficos) ou textuais
- Faz perguntas técnicas ou estratégicas
- Prefere ação imediata ou análise primeiro

**Gravado em** `:UserConversationProfile`:
```cypher
(:User)-[:HAS_CONVERSATION_PROFILE]->(:ConversationProfile {
  response_length_preference: 'concise' | 'detailed',
  visual_preference: 'charts' | 'text',
  question_type: 'technical' | 'strategic' | 'mixed',
  action_tendency: 'immediate' | 'analytical',
  tone_preference: 'formal' | 'casual',
  learned_from_interactions: 50,
  last_updated: timestamp
})
```

### Exemplo de Adaptação

**Primeira interação** (neutro):
```
[User] Como está a Startup A?

[Bot] A Startup A apresenta os seguintes indicadores:
• Receita: R$ 500k (↑35% vs Q3)
• Burn rate: R$ 80k/mês
• Runway: 18 meses
• CAC/LTV: 1:4

Gostaria de mais detalhes sobre algum aspecto?
```

**Após 20 interações** (aprendeu: usuário é direto e orientado a ação):
```
[User] Como está a Startup A?

[Bot] Startup A: ✅ Saudável. +35% receita, 18m runway.

Próximos passos:
1. Agendar board meeting
2. Revisar projeção Q1

[Agendar] [Ver números]
```

---

## Histórico Contextual

### Estrutura de Conversas

**MongoDB Collection**: `conversations`

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  type: "corporate" | "personal",
  context: {
    company_id: ObjectId,      // Se corporativo
    project_id: ObjectId,      // Contexto específico
    startup_id: ObjectId,      // Se relacionado a startup
    tags: ["investimento", "análise"]
  },
  title: string,               // Auto-gerado ou user-defined
  summary: string,             // Auto-gerado (últimas msgs)
  message_count: number,
  last_message_at: Date,
  created_at: Date,
  archived: boolean
}
```

**Timeline View**:
```
Hoje
├─ 📊 Análise Startup A (14:30)
└─ 💬 Planejamento Sprint (11:00)

Ontem
├─ 📝 Revisão Contrato (16:45)
└─ 🔒 [Pessoal] Ideias Apresentação (20:00)

Esta Semana
└─ 📂 Due Diligence Startup B (Seg 10:00)
```

### Busca de Conversas

```
┌─────────────────────────────────────┐
│ 🔍 Buscar conversas...              │
└─────────────────────────────────────┘

Filtros:
☑️ Corporativas  ☐ Pessoais
☐ Startup A      ☐ Projeto X
□ Última semana  □ Último mês

Resultados (8):
┌─────────────────────────────────────┐
│ 📊 Análise financeira Startup A     │
│ 5 resultados • Ontem               │
│ "...burn rate de 80k..." [Abrir]   │
└─────────────────────────────────────┘
```

---

## Requisitos Funcionais

### RF-UX-001: Toggle Corporativo/Pessoal
- Chat DEVE ter toggle visível entre modos corporativo e pessoal
- Modo DEVE ser persistido por conversa
- Visual DEVE refletir modo atual (cores, badges)

### RF-UX-002: Histórico Contextual
- Conversas DEVEM ser agrupadas por contexto (startup, projeto, área)
- Timeline DEVE mostrar agrupamento temporal (hoje, ontem, semana)
- Busca DEVE filtrar por contexto e tipo (corp/pessoal)

### RF-UX-003: Adaptação de Diálogo
- Sistema DEVE aprender preferências após N interações (N=20)
- Perfil conversacional DEVE ser gravado em `:UserConversationProfile`
- Respostas DEVEM adaptar: tom, comprimento, formato, ações

### RF-UX-004: Sidebar Inteligente
- Itens mais acessados DEVEM aparecer em "Favoritos"
- Seção "Recentes" DEVE auto-organizar (últimos 5 acessos)
- Usuário DEVE poder fixar/desfixar itens

### RF-UX-005: Canvas Responsivo
- Canvas DEVE adaptar layout baseado em conteúdo (plano, grafo, doc)
- Transições DEVEM ser suaves (animations)
- Estado DEVE ser persistido (última view, zoom, posição)

### RF-UX-006: Identidade Visual Consistente
- TODA a UI DEVE usar paleta de cores definida
- Componentes DEVEM seguir design system
- Modo escuro DEVE ser suportado (future)

---

## User Scenarios

### Scenario 1: Usuário inicia conversa corporativa

```
1. João clica em "Nova Conversa"
2. Sistema pergunta: "Corporativa ou Pessoal?"
3. João seleciona "Corporativa"
4. Sistema: "Qual o contexto? (Startup, Projeto, Geral)"
5. João: "Startup A"
6. Chat header mostra: "💬 Chat Corporativo • Startup A"
7. Badge azul aparece em todas mensagens
8. Conversa é gravada com context.startup_id
```

### Scenario 2: Sistema adapta tom após aprendizado

```
Interação 1 (neutro):
[User] Status do projeto X?
[Bot] Projeto X está em fase de implementação.
      Sprint atual: 60% completo.
      Próxima review: 20/12.
      
      Gostaria de ver detalhes das tasks?

Interação 25 (aprendeu: usuário quer ação):
[User] Status do projeto X?
[Bot] Projeto X: 60% (no prazo). Review 20/12.
      
      [Ver tasks] [Marcar reunião]
```

### Scenario 3: Histórico contextual ajuda recuperação

```
1. João procura "aquela conversa sobre investimento na Startup A"
2. Busca: "investimento Startup A"
3. Sistema retorna 3 conversas:
   - "Análise financeira Startup A" (Ontem)
   - "Due diligence Startup A" (Semana passada)
   - "Round Series A - discussão" (2 semanas)
4. João abre "Análise financeira"
5. Canvas carrega contexto: Startup A
6. Chat restaura histórico completo
```

---

## Métricas de Sucesso

- ✅ 90%+ usuários classificam UX como "profissional"
- ✅ Tempo para encontrar conversa antiga: <10s
- ✅ Taxa de uso do toggle corporativo/pessoal: >70%
- ✅ Accuracy da adaptação de diálogo: >80% após 20 interações
- ✅ Sidebar "Favoritos" auto-gerado tem 85%+ accuracy

---

## Dependencies

| Spec | Dependency | Reason |
|------|------------|--------|
| 016 | **MUST** | Main Interface Layout (base) |
| 022 | **SHOULD** | Onboarding AI Profile (adaptação) |
| 027 | **MUST** | Voice Input (integração UI) |
| 028 | **MUST** | File Upload (integração UI) |
| 030 | **MUST** | Corporate Mode + Potência (UX complement) |

---

## Implementation Notes

### Phase 1: Layout Revitalizado (2d)
- Implementar nova estrutura Sidebar + Canvas + Chat
- Aplicar paleta de cores e tipografia
- Componentes base (Badge, MessageBubble, Button)

### Phase 2: Histórico Contextual (1d)
- MongoDB schema para conversations
- Timeline view com agrupamento
- Busca e filtros

### Phase 3: Toggle Corporativo (1d)
- UI toggle + persistência
- Visual badges e cores
- Context propagation

### Phase 4: Adaptação de Diálogo (1d)
- `:UserConversationProfile` no Neo4j
- Learning algorithm (track patterns)
- Response formatting adaptativo

---

## Testing Strategy

```typescript
describe('UX Professional', () => {
  it('should toggle corporate/personal mode', () => {
    // Test toggle UI
    // Verify badge changes
    // Check context persistence
  });
  
  it('should adapt dialogue after N interactions', () => {
    // Simulate 20 interactions
    // Verify profile creation
    // Check response formatting changes
  });
  
  it('should show contextual history', () => {
    // Create conversations with context
    // Verify grouping
    // Test search filters
  });
});
```

---

**Status**: 📋 Planned (Sprint 1-2)  
**Next**: Implementar após MVP básico funcional (Specs 003, 007, 027, 028)
