# Nota: Customização de Agentes pelo Admin

**Data**: 2025-12-29  
**Contexto**: Consolidação de Specs  
**Prioridade**: P1 (Documentação)

---

## 📝 Observação do Usuário

> "Vale ressaltar que o **time de agentes é customizável**. O usuário consegue ver o time dele no frontend. O **ADMIN faz essa configuração dos agentes** e disponibiliza o acesso."

---

## 🔍 Análise - Estado Atual

### Specs Relacionadas

| Spec | Descrição | Cobertura Atual |
|------|-----------|-----------------|
| **004-user-agent-factory** | Criação de agentes pelo usuário | ✅ Cobre criação pelo usuário |
| **002-admin-node-manager** | Gestão de nodes pelo admin | ⚠️ Foca em nodes organizacionais, não agentes |
| **003-admin-login-config** | Login e configuração admin | ⚠️ Não menciona gestão de agentes |
| **005-agent-router** (PLA) | Roteamento de agentes | ⚠️ Não menciona configuração pelo admin |
| **019-multi-agent-orchestration** | Orquestração multi-agente | ⚠️ Foca em orquestração, não configuração |

### Gap Identificado

**FALTA**: Spec ou seção clara sobre **Admin Agent Manager** - sistema onde Admin:
1. Cria/configura agentes globais
2. Define quais agentes ficam disponíveis para quais usuários/áreas
3. Gerencia permissões de acesso aos agentes
4. Monitora uso e performance dos agentes

---

## 📋 Funcionalidade Necessária

### 1. Admin Agent Manager (Interface)

**Localização**: Área administrativa (acessível apenas por Admin)

**Funcionalidades**:
- ✅ **Criar Agente Global** - Agente disponível para toda organização
- ✅ **Configurar Agente** - Nome, descrição, prompt, ferramentas (MCPs), personalidade
- ✅ **Definir Visibilidade** - Quais áreas/projetos/usuários têm acesso
- ✅ **Atribuir ao Time** - Adicionar agente ao "team" de usuários específicos
- ✅ **Monitorar Uso** - Dashboard de uso por agente (queries, tempo de resposta, satisfação)
- ✅ **Ativar/Desativar** - Controle de disponibilidade sem deletar

### 2. User Agent Team (Frontend)

**Localização**: Interface do usuário (visível no seletor de agentes)

**Funcionalidades**:
- ✅ **Ver Meu Time** - Lista de agentes disponíveis para o usuário
- ✅ **Agentes Globais** - Agentes configurados pelo Admin (ícone especial)
- ✅ **Agentes Pessoais** - Agentes criados pelo próprio usuário (spec 004)
- ✅ **Descrição do Agente** - Tooltip explicando o que cada agente faz
- ✅ **Ícone de Origem** - Visual distinguindo agente global vs pessoal

### 3. Modelo de Dados (Neo4j)

**Propriedades do Node :Agent**:

```cypher
(:Agent {
  id: UUID,
  name: String,
  description: String,
  prompt_base: String,
  personality: String,
  scope: "global" | "user",  // global = criado por admin
  created_by: UUID,  // Admin ou User
  visibility: "corporate" | "area" | "project" | "personal",
  mcp_tools: Array<String>,  // MCPs disponíveis
  is_active: Boolean,
  usage_count: Integer,
  avg_response_time: Float,
  satisfaction_score: Float  // 0-5, baseado em feedback
})
```

**Relacionamentos**:

```cypher
// Admin cria agente global
(:User {role: "admin"})-[:CREATED]->(:Agent {scope: "global"})

// Agente é atribuído a usuário/área
(:Agent {scope: "global"})-[:AVAILABLE_TO]->(:User)
(:Agent {scope: "global"})-[:AVAILABLE_TO]->(:Area)

// Usuário vê agente no seu team
(:User)-[:HAS_AGENT_IN_TEAM]->(:Agent)
```

---

## 🎯 Requisitos Funcionais Propostos

### Admin Agent Manager

- **REQ-AAM-001**: Admin DEVE poder criar agentes com `scope: "global"`
- **REQ-AAM-002**: Admin DEVE poder atribuir agente global a: usuários específicos, áreas, projetos, ou toda empresa
- **REQ-AAM-003**: Admin DEVE poder editar configuração de qualquer agente (global ou de usuário)
- **REQ-AAM-004**: Admin DEVE poder ativar/desativar agentes sem deletá-los
- **REQ-AAM-005**: Admin DEVE visualizar dashboard de uso: agente mais usado, tempo de resposta, satisfação

### User Agent Team

- **REQ-UAT-001**: Usuário DEVE ver lista de "Meu Time de Agentes" no seletor
- **REQ-UAT-002**: Agentes globais DEVEM ter ícone distintivo (ex: 🌐 ou 🏢)
- **REQ-UAT-003**: Agentes pessoais DEVEM ter ícone distintivo (ex: 👤)
- **REQ-UAT-004**: Usuário DEVE poder favoritar agentes (aparecem no topo)
- **REQ-UAT-005**: Usuário DEVE ver descrição do agente ao fazer hover no seletor

### Controle de Acesso

- **REQ-AAM-006**: Agente global SÓ PODE ser editado por Admin
- **REQ-AAM-007**: Agente pessoal SÓ PODE ser editado pelo criador (usuário)
- **REQ-AAM-008**: Sistema DEVE respeitar visibilidade: usuário só vê agentes atribuídos ao seu contexto
- **REQ-AAM-009**: Quando Admin desativa agente global, ele desaparece do team de todos os usuários

---

## 🎨 UI/UX Proposta

### Admin Interface - Agent Manager

```
┌─────────────────────────────────────────────────────────┐
│  Admin > Gestão de Agentes                              │
│                                                          │
│  [+ Criar Agente Global]  [📊 Dashboard de Uso]         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 🌐 Agentes Globais (criados por Admin)    │         │
│  ├────────────────────────────────────────────┤         │
│  │ ✅ Analista Financeiro                     │  [✏️ Editar] [📊 Ver Uso]  │
│  │    Descrição: Analisa dados financeiros... │         │
│  │    Atribuído: Área Financeira (12 users)  │         │
│  │    Uso: 243 queries | Satisfação: 4.5/5   │         │
│  ├────────────────────────────────────────────┤         │
│  │ ✅ Especialista Jurídico                   │  [✏️ Editar] [📊 Ver Uso]  │
│  │    Descrição: Auxilia com questões legais │         │
│  │    Atribuído: Usuários específicos (3)    │         │
│  │    Uso: 89 queries | Satisfação: 4.8/5    │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 👥 Agentes de Usuários (visão geral)      │         │
│  │ 42 agentes pessoais criados                │         │
│  │ Média de 2.1 agentes por usuário           │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### User Interface - Agent Selector

```
┌──────────────────────────────────┐
│  Meu Time de Agentes            ▼│
├──────────────────────────────────┤
│ 🌐 Analista Financeiro  [⭐]     │  <- Agente Global (favorito)
│    Analisa dados financeiros...  │
├──────────────────────────────────┤
│ 🌐 Especialista Jurídico         │  <- Agente Global
│    Auxilia com questões legais   │
├──────────────────────────────────┤
│ 👤 Meu Assistente Pessoal        │  <- Agente Pessoal
│    Ajuda com tarefas do dia...   │
├──────────────────────────────────┤
│ 🔀 Router (Padrão)               │  <- Sistema
│    Roteia automaticamente...     │
└──────────────────────────────────┘
```

---

## ✅ Ações Necessárias

### Curto Prazo (Esta Semana)

1. [ ] **Adicionar seção** "Admin Agent Manager" na spec 002 ou 003
2. [ ] **Atualizar spec 004** (User Agent Factory) com diferenciação global vs pessoal
3. [ ] **Atualizar spec 005** (Agent Router) com conceito de agent team
4. [ ] **Atualizar database-schema.md** com propriedades `scope` e `visibility` em :Agent

### Médio Prazo (Próxima Sprint)

5. [ ] **Criar wireframes** da interface Admin Agent Manager
6. [ ] **Criar wireframes** do seletor de agentes melhorado (com ícones de origem)
7. [ ] **Definir políticas** de permissões (quem pode editar o quê)
8. [ ] **Planejar migração** de agentes existentes (todos viram scope: "user" inicialmente)

### Longo Prazo (MVP v2)

9. [ ] **Implementar dashboard** de uso de agentes para Admin
10. [ ] **Implementar sistema de favoritos** para usuários
11. [ ] **Implementar recomendação** de agentes baseado em contexto do usuário
12. [ ] **Implementar clonagem** de agentes globais para personalização

---

## 📊 Métricas de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Adoção de Agentes Globais** | 70% dos usuários usam ≥1 agente global/semana | Analytics de uso |
| **Satisfação com Agentes** | Avg ≥4.0/5.0 | Feedback pós-interação |
| **Tempo de Configuração Admin** | <10 min para criar agente global | Medição de tempo |
| **Clareza de Origem** | 90% dos usuários identificam agentes globais vs pessoais | Survey de UX |

---

## 🔗 Specs a Atualizar

1. **002-admin-node-manager** ou criar nova **002-admin-agent-manager**
2. **004-user-agent-factory** - Adicionar diferenciação global vs pessoal
3. **005-agent-router** - Adicionar conceito de agent team
4. **016-main-interface-layout** - Atualizar seletor de agentes
5. **database-schema.md** - Atualizar modelo :Agent

---

**Responsável**: Spec Orchestrator  
**Próxima Revisão**: Após consolidação das specs

