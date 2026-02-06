# Schema de Relacionamentos: Projetos, OKRs e Organização

Este documento define o modelo de dados e relacionamentos no Neo4j para a integração de Projetos com o Business Intent Graph (BIG).

## Diagrama de Relacionamentos

```mermaid
graph TB
    subgraph Organization["🏢 Organização"]
        Company[":Company"]
        Department[":Department"]
    end
    
    subgraph People["👤 Pessoas"]
        User[":User"]
    end
    
    subgraph Strategy["🎯 Estratégia (BIG)"]
        Objective[":Objective"]
        OKR[":OKR"]
    end
    
    subgraph Projects["📁 Projetos"]
        Project[":Project"]
        ProjectMilestone[":Milestone"]
    end
    
    subgraph Knowledge["📚 Conhecimento"]
        Knowledge[":Knowledge"]
        Document[":Document"]
        Task[":Task"]
    end
    
    %% Organization relationships
    Company -->|HAS_DEPARTMENT| Department
    User -->|MEMBER_OF| Department
    User -->|WORKS_IN| Company
    
    %% Strategy relationships
    Company -->|HAS_OBJECTIVE| Objective
    Objective -->|MEASURED_BY| OKR
    OKR -->|OWNED_BY| User
    OKR -->|BELONGS_TO| Department
    Objective -->|OWNED_BY| User
    Objective -->|BELONGS_TO| Department
    
    %% Project relationships
    Project -->|OWNED_BY| User
    Project -->|BELONGS_TO| Department
    Project -->|LINKED_TO_OKR| OKR
    Project -->|HAS_TEAM_MEMBER| User
    Project -->|HAS_MILESTONE| ProjectMilestone
    Project -->|SUPERSEDES| Project
    
    %% Knowledge relationships
    Project -->|GENERATES| Knowledge
    Project -->|HAS_DOCUMENT| Document
    Project -->|HAS_TASK| Task
    Knowledge -->|SUPPORTS| Objective
    Task -->|ASSIGNED_TO| User
    
    classDef org fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef people fill:#fff3e0,stroke:#ff9800,color:#000
    classDef strategy fill:#e8f5e9,stroke:#4caf50,color:#000
    classDef project fill:#fce4ec,stroke:#e91e63,color:#000
    classDef knowledge fill:#f3e5f5,stroke:#9c27b0,color:#000
    
    class Company,Department org
    class User people
    class Objective,OKR strategy
    class Project,ProjectMilestone project
    class Knowledge,Document,Task knowledge
```

## Nodes (Entidades)

### :Project
Representa um projeto organizacional vinculado ao BIG.

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `id` | string | UUID único |
| `name` | string | Nome do projeto |
| `description` | string | Descrição detalhada |
| `status` | enum | draft, active, paused, completed, archived |
| `phase` | enum | initiation, planning, execution, monitoring, closing |
| `priority` | enum | low, medium, high, critical |
| `ownerId` | string | ID do responsável (User) |
| `department` | string | Nome do departamento |
| `teamMembers` | JSON | Array de {userId, role, addedAt} |
| `milestones` | JSON | Array de marcos do projeto |
| `budget` | JSON | {planned, spent, currency, lastUpdated} |
| `startDate` | date | Data de início |
| `targetEndDate` | date | Data alvo de conclusão |
| `actualEndDate` | date | Data real de conclusão (opcional) |
| `visibility` | enum | corporate, personal |
| `memoryClass` | enum | semantic, episodic, procedural, evaluative |
| `tags` | JSON | Array de strings (ontologia) |
| `notes` | string | Notas do curador |
| `version` | integer | Versão do projeto (versionamento) |
| `previousVersionId` | string | ID da versão anterior (opcional) |
| `createdAt` | datetime | Timestamp de criação |
| `updatedAt` | datetime | Timestamp de atualização |
| `createdBy` | string | ID do usuário que criou |

### :Objective
Objetivos estratégicos da organização.

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `id` | string | UUID único |
| `title` | string | Título do objetivo |
| `description` | string | Descrição |
| `status` | enum | active, archived |
| `targetDate` | date | Data alvo |
| `ownerId` | string | ID do responsável |
| `department` | string | Departamento |
| `version` | integer | Versão (imutável) |
| `validFrom` | datetime | Início da validade |
| `validUntil` | datetime | Fim da validade |
| `createdAt` | datetime | Timestamp de criação |

### :OKR
Key Results vinculados aos objetivos.

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `id` | string | UUID único |
| `title` | string | Título do OKR |
| `targetValue` | number | Valor alvo |
| `currentValue` | number | Valor atual |
| `unit` | string | Unidade de medida |
| `deadline` | date | Prazo |
| `ownerId` | string | ID do responsável |
| `department` | string | Departamento |
| `status` | enum | active, completed, archived |
| `version` | integer | Versão (imutável) |
| `validFrom` | datetime | Início da validade |
| `validUntil` | datetime | Fim da validade |
| `createdAt` | datetime | Timestamp de criação |
| `supersededById` | string | ID do OKR que o substituiu (opcional) |

## Relationships (Relacionamentos)

### Projeto → Entidades

| Relacionamento | De | Para | Propriedades | Descrição |
|----------------|-----|------|--------------|-----------|
| `OWNED_BY` | Project | User | - | Responsável pelo projeto |
| `BELONGS_TO` | Project | Department | - | Área do projeto |
| `LINKED_TO_OKR` | Project | OKR | - | Vinculação ao BIG |
| `HAS_TEAM_MEMBER` | Project | User | role, addedAt | Membros da equipe |
| `SUPERSEDES` | Project | Project | - | Versionamento (nova versão → anterior) |

### OKR → Entidades

| Relacionamento | De | Para | Propriedades | Descrição |
|----------------|-----|------|--------------|-----------|
| `BELONGS_TO_OBJECTIVE` | OKR | Objective | - | OKR pertence ao objetivo |
| `OWNED_BY` | OKR | User | - | Responsável pelo OKR |
| `BELONGS_TO` | OKR | Department | - | Área do OKR |

### Conhecimento → Estratégia

| Relacionamento | De | Para | Propriedades | Descrição |
|----------------|-----|------|--------------|-----------|
| `SUPPORTS` | Knowledge | Objective | confidence | Conhecimento suporta objetivo |
| `GENERATES` | Project | Knowledge | - | Projeto gera conhecimento |

## Regras de Versionamento

### Projetos
1. **Imutabilidade**: Projetos não são editados diretamente
2. **Nova versão**: Ao "editar", cria-se uma nova versão
3. **Arquivamento**: Versão anterior é arquivada (`status: 'archived'`)
4. **Rastreabilidade**: Relacionamento `SUPERSEDES` conecta versões
5. **Histórico**: `previousVersionId` aponta para versão anterior

### OKRs
1. **Período de validade**: Cada OKR tem `validFrom` e `validUntil`
2. **Sem edição**: OKRs são imutáveis após criação
3. **Novo OKR**: Para alterações, cria-se novo OKR e arquiva-se o anterior
4. **Substituição**: `supersededById` indica o OKR substituto

## Classes de Memória (4 Classes BIG)

| Classe | Descrição | Uso em Projetos |
|--------|-----------|-----------------|
| **Semântica** | Ontologia & Conceitos | Projetos de definição de processos, glossários |
| **Episódica** | Eventos & Timeline | Projetos com marcos temporais importantes |
| **Procedural** | Playbooks & Processos | Implementações, automações, sistemas |
| **Avaliativa** | Lições & Insights | Projetos de análise, retrospectivas |

## Queries Cypher Úteis

### Listar projetos com seus OKRs
```cypher
MATCH (p:Project)-[:LINKED_TO_OKR]->(okr:OKR)-[:BELONGS_TO_OBJECTIVE]->(obj:Objective)
WHERE p.status <> 'archived'
RETURN p.name, collect({okr: okr.title, objective: obj.title}) AS okrs
```

### Buscar conhecimento que suporta um objetivo
```cypher
MATCH (k:Knowledge)-[:SUPPORTS]->(obj:Objective {id: $objectiveId})
RETURN k
ORDER BY k.confidence DESC
```

### Histórico de versões de um projeto
```cypher
MATCH path = (current:Project {id: $projectId})-[:SUPERSEDES*]->(prev:Project)
RETURN nodes(path) AS versions
ORDER BY length(path)
```

### Projetos de um usuário (como owner ou membro)
```cypher
MATCH (u:User {id: $userId})
OPTIONAL MATCH (p1:Project)-[:OWNED_BY]->(u)
OPTIONAL MATCH (p2:Project)-[:HAS_TEAM_MEMBER]->(u)
WITH collect(DISTINCT p1) + collect(DISTINCT p2) AS projects
UNWIND projects AS p
WHERE p.status <> 'archived'
RETURN DISTINCT p
```

## Endpoints da API

### Projetos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/projects` | Listar projetos (com filtros) |
| GET | `/projects/:id` | Detalhes de um projeto |
| POST | `/projects` | Criar novo projeto |
| POST | `/projects/:id/new-version` | Criar nova versão (versionamento) |
| DELETE | `/projects/:id` | Arquivar projeto |
| GET | `/projects/:id/history` | Histórico de versões |

### OKRs
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/projects/okrs/list` | Listar OKRs disponíveis |
| GET | `/projects/objectives/list` | Listar Objetivos com OKRs |
| POST | `/projects/okrs` | Criar novo OKR |
| POST | `/projects/objectives` | Criar novo Objetivo |
| POST | `/projects/okrs/:id/archive` | Arquivar OKR |

---

*Documento gerado como parte da implementação do módulo de Injeção de Projetos do EKS.*
