# Mock Data - Simulação JSON

**Propósito**: Dados simulados para prototipação rápida **sem banco de dados**.

Permite testar toda a UI e lógica de negócio usando arquivos JSON estáticos que podem ser **reaproveitados posteriormente** ao integrar Neo4j/MongoDB.

---

## Estrutura de Pastas

```
mock-data/
├── README.md              # Este arquivo
├── nodes/                 # Nodes do grafo
│   ├── users.json
│   ├── companies.json
│   ├── startups.json
│   ├── projects.json
│   ├── knowledge.json
│   ├── tasks.json
│   └── conversations.json
├── relationships/         # Relacionamentos
│   ├── user-relationships.json
│   ├── knowledge-relationships.json
│   └── task-relationships.json
├── profiles/              # Perfis e preferências
│   ├── ai-profiles.json
│   ├── conversation-profiles.json
│   └── depth-preferences.json
└── examples/              # Exemplos completos
    ├── first-node-complete.json
    ├── conversation-flow-example.json
    └── knowledge-graph-example.json
```

---

## Como Usar

### 1. Desenvolvimento Local (Sem Banco)

```typescript
// src/lib/mockData.ts
import users from '@/mock-data/nodes/users.json';
import companies from '@/mock-data/nodes/companies.json';

export const mockApi = {
  async getUsers() {
    return { success: true, data: users };
  },
  
  async getCompanies() {
    return { success: true, data: companies };
  }
};
```

### 2. Migração para Banco Real

Quando conectar Neo4j/MongoDB, mesma estrutura JSON:

```python
# scripts/seed-from-mock.py
import json

# Load mock data
with open('mock-data/nodes/users.json') as f:
    users = json.load(f)

# Insert into Neo4j
for user in users:
    session.run("""
        CREATE (u:User $props)
    """, props=user)
```

---

## Convenções

### IDs
- Usar UUIDs fictícios mas consistentes
- Exemplo: `"user-001"`, `"startup-a-001"`
- Facilita debugging e rastreamento

### Timestamps
- Usar ISO 8601: `"2024-12-13T14:30:00Z"`
- Datas relativas: `"2 hours ago"`, `"yesterday"`

### Relacionamentos
- Sempre referenciar por ID
- Manter consistência: se User X está em Company Y, ambos devem existir

---

## Tipos de Nodes

### :User
```json
{
  "id": "user-001",
  "name": "João Silva",
  "email": "joao@cocreate.ai",
  "role": "admin",
  "organizationType": "cocreate",
  "company": "CoCreateAI",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### :Company
```json
{
  "id": "company-001",
  "name": "CoCreateAI",
  "type": "cocreate",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### :Startup
```json
{
  "id": "startup-001",
  "name": "TechCorp AI",
  "stage": "Series A",
  "sector": "IA & Automação",
  "runway_months": 18,
  "burn_rate_monthly": 80000,
  "revenue_monthly": 120000,
  "status": "active",
  "created_at": "2024-03-01T00:00:00Z"
}
```

### :Knowledge
```json
{
  "id": "knowledge-001",
  "type": "insight",
  "content": "Startup A precisa melhorar CAC em 20%",
  "visibility": "corporate",
  "scope": {
    "company_id": "company-001",
    "startup_id": "startup-001"
  },
  "created_by": "user-001",
  "created_at": "2024-12-13T14:30:00Z",
  "embedding": null
}
```

### :Task
```json
{
  "id": "task-001",
  "title": "Analisar financeiro Q4",
  "description": "Revisar DRE e projeções",
  "status": "pending",
  "priority": "high",
  "assigned_to": "user-002",
  "due_date": "2024-12-20T00:00:00Z",
  "created_at": "2024-12-13T10:00:00Z"
}
```

---

## Exemplo Completo: Primeiro Node

Ver `examples/first-node-complete.json` para estrutura detalhada.

---

## Reaproveitar na Produção

Todos os JSONs são **compatíveis** com Neo4j/MongoDB:

**Neo4j**:
```cypher
// Mesmo formato
CREATE (u:User $props)
```

**MongoDB**:
```javascript
// Adicionar apenas _id
db.users.insertOne({
  _id: ObjectId(),
  ...jsonData
})
```

---

**Status**: Pronto para uso em desenvolvimento ✅
