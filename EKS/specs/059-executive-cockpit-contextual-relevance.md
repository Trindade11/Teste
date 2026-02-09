# Cockpit Executivo: Modelo de Relevância Contextual

**Data:** 2025-02-09  
**Status:** Em Desenvolvimento  
**Relacionado:** Spec 013 (Meeting Transcript Ingestion), Spec 055 (Strategic Feedback System)

---

## 1. Problema Identificado

### 1.1 Natureza das Entidades Extraídas

**Decisões, Riscos e Insights extraídos de transcrições são registros históricos, não itens de workflow.**

- **Decision extraída** = registro de "foi decidido X na reunião Y"
- **Risk extraído** = identificação de "foi levantado risco X"
- **Insight extraído** = descoberta de "foi identificado insight X"

**Características:**
- Não têm responsável/prazo por padrão (exceto Tasks)
- Não têm status de workflow (pending/approved)
- São fatos históricos com proveniência (reunião, data, pessoa)

### 1.2 O que Pode Estar "Pendente"

1. **Validação** (`validated: null`) - ainda no ValidationFeed
2. **Ação derivada** - implementação, mitigação, follow-up
   - Decision sem Tasks de implementação vinculadas
   - Risk sem Tasks de mitigação
   - Insight sem Tasks/Decisions derivadas

---

## 2. Modelo de Relevância Contextual

### 2.1 Princípio Fundamental

**Um executivo precisa ver entidades que:**
- Ele criou/tomou (para acompanhar)
- Afetam sua área/responsabilidade (hierarquia, departamento, projetos)
- Precisam de sua atenção/aprovação (escalonamento)

### 2.2 Hierarquia Organizacional no Grafo

**Relacionamentos disponíveis:**
```cypher
(:User)-[:REPORTS_TO]->(:User)           // Hierarquia de gestão
(:User)-[:MEMBER_OF]->(:Department)      // Departamento
(:User)-[:HAS_ACCESS_TO]->(:Department)  // Acesso a outras áreas
(:Project)-[:OWNED_BY]->(:User)          // Dono do projeto
(:OKR)-[:OWNED_BY]->(:User)              // Dono do OKR
(:Project)-[:BELONGS_TO]->(:Department) // Departamento do projeto
```

---

## 3. Filtros de Relevância por Tipo de Entidade

### 3.1 Decisões (Decision)

**Para um Diretor ver decisões relevantes:**

#### 3.1.1 Decisões que Ele Tomou
```cypher
MATCH (d:Decision)-[:DECIDED_BY]->(u:User {id: $userId})
WHERE d.validated = true
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Todas (para acompanhar implementação)

#### 3.1.2 Decisões de Subordinados (Hierarquia)
```cypher
MATCH (d:Decision)-[:DECIDED_BY]->(sub:User)-[:REPORTS_TO*]->(u:User {id: $userId})
WHERE d.validated = true
  AND (d.impact CONTAINS 'high' OR d.impact CONTAINS 'critical')
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Apenas decisões críticas ou de alto impacto

#### 3.1.3 Decisões que Afetam Seus Projetos/OKRs
```cypher
MATCH (d:Decision)
MATCH (p:Project)-[:OWNED_BY]->(u:User {id: $userId})
WHERE d.validated = true
  AND (
    (d)-[:AFFECTS]->(p) OR
    (d)-[:AFFECTS]->(:OKR)-[:BELONGS_TO_OBJECTIVE]->(:Objective)<-[:LINKED_TO_OKR]-(p)
  )
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Todas, priorizadas por impacto

#### 3.1.4 Decisões do Mesmo Departamento
```cypher
MATCH (d:Decision)-[:DECIDED_BY]->(decider:User)-[:MEMBER_OF]->(dept:Department)
MATCH (u:User {id: $userId})-[:MEMBER_OF]->(dept)
WHERE d.validated = true
  AND (d.impact CONTAINS 'high' OR d.impact CONTAINS 'critical')
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Apenas decisões críticas ou que afetam o departamento

#### 3.1.5 Decisões de Áreas com Acesso
```cypher
MATCH (d:Decision)-[:DECIDED_BY]->(decider:User)-[:MEMBER_OF]->(dept:Department)
MATCH (u:User {id: $userId})-[:HAS_ACCESS_TO]->(dept)
WHERE d.validated = true
  AND (d.impact CONTAINS 'critical')
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Apenas decisões críticas

#### 3.1.6 Decisões Sem Implementação
```cypher
MATCH (d:Decision {validated: true})
WHERE NOT (d)<-[:IMPLEMENTS]-(:Task)
RETURN d
ORDER BY d.createdAt DESC
```
**Mostrar:** Decisões que precisam de ação (Tasks de implementação)

---

### 3.2 Riscos (Risk)

**Para um Diretor ver riscos relevantes:**

#### 3.2.1 Riscos que Ele Levantou
```cypher
MATCH (r:Risk)-[:RAISED_BY]->(u:User {id: $userId})
WHERE r.validated = true
RETURN r
ORDER BY r.createdAt DESC
```

#### 3.2.2 Riscos de Subordinados (Críticos)
```cypher
MATCH (r:Risk)-[:RAISED_BY]->(sub:User)-[:REPORTS_TO*]->(u:User {id: $userId})
WHERE r.validated = true
  AND r.severity IN ['high', 'critical']
RETURN r
ORDER BY r.severity DESC, r.createdAt DESC
```

#### 3.2.3 Riscos que Afetam Seus Projetos/OKRs
```cypher
MATCH (r:Risk)
MATCH (p:Project)-[:OWNED_BY]->(u:User {id: $userId})
WHERE r.validated = true
  AND (
    (r)-[:AFFECTS]->(p) OR
    (r)-[:AFFECTS]->(:OKR)-[:BELONGS_TO_OBJECTIVE]->(:Objective)<-[:LINKED_TO_OKR]-(p)
  )
RETURN r
ORDER BY r.severity DESC, r.createdAt DESC
```

#### 3.2.4 Riscos do Departamento (Críticos)
```cypher
MATCH (r:Risk)-[:RAISED_BY]->(raiser:User)-[:MEMBER_OF]->(dept:Department)
MATCH (u:User {id: $userId})-[:MEMBER_OF]->(dept)
WHERE r.validated = true
  AND r.severity IN ['high', 'critical']
RETURN r
ORDER BY r.severity DESC, r.createdAt DESC
```

#### 3.2.5 Riscos Sem Mitigação
```cypher
MATCH (r:Risk {validated: true})
WHERE r.severity IN ['high', 'critical']
  AND NOT (r)<-[:MITIGATES]-(:Task)
RETURN r
ORDER BY r.severity DESC, r.createdAt DESC
```
**Mostrar:** Riscos que precisam de ação (Tasks de mitigação)

---

### 3.3 Insights (Insight)

**Para um Diretor ver insights relevantes:**

#### 3.3.1 Insights que Ele Contribuiu
```cypher
MATCH (i:Insight)-[:CONTRIBUTED_BY]->(u:User {id: $userId})
WHERE i.validated = true
RETURN i
ORDER BY i.createdAt DESC
```

#### 3.3.2 Insights de Subordinados (Alto Impacto)
```cypher
MATCH (i:Insight)-[:CONTRIBUTED_BY]->(sub:User)-[:REPORTS_TO*]->(u:User {id: $userId})
WHERE i.validated = true
  AND i.impact IN ['high']
RETURN i
ORDER BY i.createdAt DESC
```

#### 3.3.3 Insights que Podem Beneficiar Seus Projetos/OKRs
```cypher
MATCH (i:Insight)
MATCH (p:Project)-[:OWNED_BY]->(u:User {id: $userId})
WHERE i.validated = true
  AND i.impact IN ['high']
  AND (
    (i)-[:CAN_BENEFIT]->(p) OR
    (i)-[:CAN_BENEFIT]->(:OKR)-[:BELONGS_TO_OBJECTIVE]->(:Objective)<-[:LINKED_TO_OKR]-(p)
  )
RETURN i
ORDER BY i.createdAt DESC
```

#### 3.3.4 Insights Sem Ação Derivada
```cypher
MATCH (i:Insight {validated: true})
WHERE i.impact IN ['high']
  AND NOT (i)-[:GENERATES]->(:Task)
  AND NOT (i)-[:INFORMS]->(:Decision)
RETURN i
ORDER BY i.createdAt DESC
```
**Mostrar:** Oportunidades que precisam de ação

---

### 3.4 Tarefas (Task)

**Para um Diretor ver tarefas relevantes:**

#### 3.4.1 Tarefas Atribuídas a Ele
```cypher
MATCH (t:Task)-[:ASSIGNED_TO]->(u:User {id: $userId})
WHERE t.status IN ['pending', 'in_progress']
RETURN t
ORDER BY t.priority DESC, t.dueDate ASC
```

#### 3.4.2 Tarefas de Subordinados (Críticas/Atrasadas)
```cypher
MATCH (t:Task)-[:ASSIGNED_TO]->(sub:User)-[:REPORTS_TO*]->(u:User {id: $userId})
WHERE t.status IN ['pending', 'in_progress']
  AND (
    t.priority IN ['high', 'critical'] OR
    (t.dueDate IS NOT NULL AND t.dueDate < datetime())
  )
RETURN t
ORDER BY t.priority DESC, t.dueDate ASC
```

#### 3.4.3 Tarefas de Projetos que Ele É Dono
```cypher
MATCH (t:Task)
MATCH (p:Project)-[:OWNED_BY]->(u:User {id: $userId})
WHERE (t)-[:BELONGS_TO]->(p)
  AND t.status IN ['pending', 'in_progress']
RETURN t
ORDER BY t.priority DESC, t.dueDate ASC
```

#### 3.4.4 Tarefas Bloqueadas que Dependem Dele
```cypher
MATCH (t:Task {status: 'blocked'})
WHERE (t)-[:BLOCKED_BY]->(:Task)-[:ASSIGNED_TO]->(u:User {id: $userId})
RETURN t
ORDER BY t.priority DESC
```

---

## 4. Formato de Apresentação no Cockpit Executivo

### 4.1 Agrupamento por Contexto

**Para Decisões:**
- **"Minhas Decisões"** - Ele decidiu (todas)
- **"Decisões da Minha Área"** - Mesmo departamento (críticas)
- **"Decisões dos Meus Subordinados"** - Hierarquia (críticas)
- **"Decisões que Afetam Meus Projetos"** - Relacionamento (todas)
- **"Decisões Críticas de Outras Áreas"** - Acesso + criticidade
- **"Decisões Sem Implementação"** - Ação pendente

**Para Riscos:**
- **"Riscos que Levantei"**
- **"Riscos Críticos da Minha Área"**
- **"Riscos dos Meus Subordinados"** (críticos)
- **"Riscos que Afetam Meus Projetos"**
- **"Riscos Sem Mitigação"** (ação pendente)

**Para Insights:**
- **"Insights que Contribuí"**
- **"Insights Prioritários da Minha Área"**
- **"Insights dos Meus Subordinados"** (alto impacto)
- **"Insights que Beneficiam Meus Projetos"**
- **"Insights Sem Ação"** (oportunidade perdida)

### 4.2 Priorização

**Ordem de exibição:**
1. **Críticas primeiro** (impact/severity: high/critical)
2. **Recentes primeiro** (últimas 7 dias)
3. **Com ação pendente** (sem Tasks vinculadas)
4. **Atrasadas** (deadline vencido)

### 4.3 Informações de Proveniência

**Sempre visível:**
- Reunião de origem (`meetingTitle`, `meetingDate`)
- Pessoa relacionada (`relatedPerson`, `decidedBy`, `raisedBy`, `contributedBy`)
- Timestamp (`createdAt`)
- Confiança da extração (`confidence`)
- Referência ao trecho (`sourceRef`)

---

## 5. Métricas do Dashboard Consolidado

### 5.1 Tiles de Métricas

1. **"Aguardando Minha Validação"**
   - Total: Decision + Risk + Insight com `validated: null`
   - Filtro: organizador da reunião OU atribuído a ele

2. **"Riscos Críticos Sem Mitigação"**
   - Risk com `severity: high/critical` + `validated: true` + sem Tasks de mitigação

3. **"OKRs em Risco"**
   - OKR com `status: at_risk/behind` + vinculado a projetos dele

4. **"Projetos Bloqueados"**
   - Project com `blocked: true` + `OWNED_BY` ele

5. **"Insights Sem Ação"**
   - Insight com `impact: high` + `validated: true` + sem Tasks/Decisions derivadas

6. **"Mudanças Recentes"**
   - Delta de entidades criadas/atualizadas nas últimas 24h/7d (relevantes para ele)

---

## 6. Implementação Técnica

### 6.1 Endpoints Necessários

**GET /api/executive/dashboard**
- Retorna métricas consolidadas baseadas no usuário logado
- Aplica todos os filtros de relevância contextual

**GET /api/executive/decisions**
- Query params: `context` (mine|area|subordinates|projects|critical)
- Retorna decisões filtradas por relevância

**GET /api/executive/risks**
- Query params: `context` (mine|area|subordinates|projects|unmitigated)
- Retorna riscos filtrados por relevância

**GET /api/executive/insights**
- Query params: `context` (mine|area|subordinates|projects|unactioned)
- Retorna insights filtrados por relevância

### 6.2 Queries Cypher Otimizadas

**Considerações:**
- Usar índices em `User.id`, `Decision.validated`, `Risk.severity`
- Limitar resultados (TOP 10-20 por contexto)
- Cache de hierarquia (subordinados diretos e indiretos)
- Cache de relacionamentos (projetos/OKRs do usuário)

---

## 7. Próximos Passos

1. ✅ Documentar modelo de relevância contextual
2. ⏳ Implementar endpoints de API com queries Cypher
3. ⏳ Refinar componente "Visão Consolidada" com filtros contextuais
4. ⏳ Adicionar agrupamento por contexto nas subabas
5. ⏳ Implementar priorização e ordenação
6. ⏳ Adicionar filtros de tempo (24h, 7d, 30d)

---

## 8. Referências

- **Spec 013:** Meeting Transcript Ingestion
- **Spec 055:** Strategic Feedback System
- **Database Schema:** `EKS/project-context/database-schema.md`
- **Org Chart:** `EKS/backend/src/routes/structure.routes.ts`

