# Spec 033: MongoDB + Vector Search Setup

**Feature**: Persistência com MongoDB Atlas e configuração de Vector Search  
**Priority**: P0 (Blocker para Sprint 2)  
**Sprint**: 1  
**Effort**: 3 dias  
**Status**: 📋 Planned  

---

## Visão Geral

Setup completo de MongoDB Atlas como banco principal do EKS, incluindo:
- **Schema definitions** para todas as collections
- **Vector Search** configuration (embeddings)
- **Migration strategy** de mock data → MongoDB
- **Query patterns** otimizados

---

## Problema

- Specs existentes assumem MongoDB, mas não há configuração documentada
- Mock data funciona para desenvolvimento, mas precisa migração clara
- Vector Search (RAG) precisa índices configurados
- Falta schema validation e patterns de query

---

## Solução: MongoDB Atlas + Vector Search

### Arquitetura

```
Frontend → Node.js API → MongoDB Atlas
                          ├─ Collections (JSON docs)
                          └─ Vector Search Index (embeddings)
                          
Azure OpenAI → text-embedding-3-large → [768d vectors]
```

---

## Collections Schema

### 1. users

```typescript
// Collection: users
interface User {
  _id: ObjectId;
  user_id: string;           // usr_xxx (unique index)
  name: string;
  email: string;             // unique index
  role: 'admin' | 'analyst' | 'viewer';
  organization_type: 'cvc' | 'startup' | 'corporate';
  company_id?: string;       // Ref: companies
  area?: string;
  preferences: {
    theme?: string;
    language?: string;
  };
  created_at: Date;
  last_login: Date | null;
}

// Indexes
db.users.createIndex({ user_id: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ company_id: 1 });
```

### 2. companies

```typescript
// Collection: companies
interface Company {
  _id: ObjectId;
  company_id: string;        // cmp_xxx (unique)
  name: string;
  type: 'cvc' | 'corporate' | 'startup';
  description?: string;
  website?: string;
  metadata: {
    employees?: number;
    founded_year?: number;
    sector?: string;
  };
  theme_color?: string;      // Para Design System (Spec 031)
  created_at: Date;
}

db.companies.createIndex({ company_id: 1 }, { unique: true });
db.companies.createIndex({ name: 1 });
```

### 3. conversations

```typescript
// Collection: conversations
interface Conversation {
  _id: ObjectId;
  conversation_id: string;   // conv_xxx (unique)
  user_id: string;           // Ref: users.user_id
  type: 'corporate' | 'personal';
  title: string;
  summary?: string;
  context: string[];         // IDs de knowledge nodes relevantes
  messages: Message[];
  message_count: number;
  created_at: Date;
  updated_at: Date;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    latency_ms?: number;
    cost_usd?: number;
    depth_used?: number;      // Spec 032 (Adaptive Retrieval)
    confidence?: number;
  };
}

db.conversations.createIndex({ conversation_id: 1 }, { unique: true });
db.conversations.createIndex({ user_id: 1, updated_at: -1 });
db.conversations.createIndex({ type: 1 });
```

### 4. knowledge (Com Vector Search)

```typescript
// Collection: knowledge
interface KnowledgeNode {
  _id: ObjectId;
  knowledge_id: string;      // kn_xxx (unique)
  type: 'insight' | 'document' | 'analysis' | 'metric';
  title: string;
  content: string;
  summary: string;
  
  // Vector Search
  embedding: number[];       // 768d vector (text-embedding-3-large)
  
  // Metadata
  visibility: 'corporate' | 'personal';
  scope: string;             // company_id ou user_id
  provenance: {
    source: string;          // 'chat' | 'file_upload' | 'manual'
    source_id?: string;
    conversation_id?: string;
  };
  metadata: {
    tags?: string[];
    confidence?: number;
    status?: 'draft' | 'validated' | 'archived';
  };
  
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.knowledge.createIndex({ knowledge_id: 1 }, { unique: true });
db.knowledge.createIndex({ visibility: 1, scope: 1 });
db.knowledge.createIndex({ type: 1 });
db.knowledge.createIndex({ "provenance.conversation_id": 1 });

// ⭐ Vector Search Index (Atlas Search)
{
  "name": "knowledge_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "visibility"
      },
      {
        "type": "filter",
        "path": "scope"
      },
      {
        "type": "filter",
        "path": "type"
      }
    ]
  }
}
```

### 5. tasks

```typescript
// Collection: tasks
interface Task {
  _id: ObjectId;
  task_id: string;           // tsk_xxx (unique)
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'analysis' | 'followup' | 'decision' | 'meeting';
  context: string;           // 'corporate' | 'personal'
  
  assigned_to?: string;      // user_id
  related_to?: {
    startup_id?: string;
    conversation_id?: string;
    knowledge_id?: string;
  };
  
  due_date?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

db.tasks.createIndex({ task_id: 1 }, { unique: true });
db.tasks.createIndex({ assigned_to: 1, status: 1 });
db.tasks.createIndex({ due_date: 1 });
db.tasks.createIndex({ "related_to.startup_id": 1 });
```

### 6. startups

```typescript
// Collection: startups
interface Startup {
  _id: ObjectId;
  startup_id: string;        // str_xxx (unique)
  name: string;
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c+';
  sector: string;
  description: string;
  website?: string;
  
  metrics: {
    mrr?: number;
    arr?: number;
    burn_rate?: number;
    runway_months?: number;
    valuation?: number;
  };
  
  funding: {
    total_raised?: number;
    last_round?: {
      amount: number;
      date: Date;
      investors: string[];
    };
  };
  
  team: {
    founders: string[];
    employees_count?: number;
  };
  
  managed_by: string;        // user_id (analyst)
  created_at: Date;
  updated_at: Date;
}

db.startups.createIndex({ startup_id: 1 }, { unique: true });
db.startups.createIndex({ name: 1 });
db.startups.createIndex({ managed_by: 1 });
db.startups.createIndex({ stage: 1 });
```

### 7. ai_profiles

```typescript
// Collection: ai_profiles
interface AIProfile {
  _id: ObjectId;
  user_id: string;           // Unique per user
  ai_level: 'junior' | 'mid-level' | 'senior' | 'expert';
  
  needs: {
    explain_step_by_step?: boolean;
    prefer_visuals?: boolean;
    technical_depth?: 'low' | 'medium' | 'high';
  };
  
  response_preferences: {
    length: 'concise' | 'balanced' | 'detailed';
    tone: 'formal' | 'friendly' | 'neutral';
  };
  
  persona_versions: Array<{
    version: number;
    prompt: string;
    capabilities: string[];
    created_at: Date;
  }>;
  
  updated_at: Date;
}

db.ai_profiles.createIndex({ user_id: 1 }, { unique: true });
```

---

## Vector Search Implementation

### 1. Generate Embeddings

```typescript
// src/services/embeddings.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 768
  });
  
  return response.data[0].embedding;
}

export async function embedKnowledge(knowledge: KnowledgeNode): Promise<number[]> {
  // Combinar título + conteúdo + summary para embedding
  const textToEmbed = `${knowledge.title}\n\n${knowledge.summary}\n\n${knowledge.content}`;
  return generateEmbedding(textToEmbed);
}
```

### 2. Vector Search Query

```typescript
// src/services/vectorSearch.ts
import { MongoClient } from 'mongodb';

export async function vectorSearch(
  query: string,
  filters: {
    visibility?: 'corporate' | 'personal';
    scope?: string;
    type?: string;
  },
  limit: number = 10
): Promise<KnowledgeNode[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Build pipeline
  const pipeline: any[] = [
    {
      $vectorSearch: {
        index: 'knowledge_vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: limit,
        filter: buildFilter(filters)
      }
    },
    {
      $project: {
        knowledge_id: 1,
        title: 1,
        summary: 1,
        content: 1,
        type: 1,
        visibility: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];
  
  // 3. Execute
  const db = client.db('eks');
  const results = await db.collection('knowledge')
    .aggregate(pipeline)
    .toArray();
  
  return results;
}

function buildFilter(filters: any): any {
  const conditions: any = {};
  
  if (filters.visibility) {
    conditions.visibility = { $eq: filters.visibility };
  }
  
  if (filters.scope) {
    conditions.scope = { $eq: filters.scope };
  }
  
  if (filters.type) {
    conditions.type = { $eq: filters.type };
  }
  
  return conditions;
}
```

### 3. Hybrid Search (Vector + Text)

```typescript
// Combinar vector search + full-text search
export async function hybridSearch(
  query: string,
  filters: any,
  limit: number = 10
): Promise<KnowledgeNode[]> {
  // 1. Vector search
  const vectorResults = await vectorSearch(query, filters, limit);
  
  // 2. Text search (MongoDB Atlas Search)
  const textResults = await db.collection('knowledge')
    .aggregate([
      {
        $search: {
          index: 'knowledge_text_index',
          text: {
            query: query,
            path: ['title', 'summary', 'content']
          }
        }
      },
      { $limit: limit },
      {
        $project: {
          knowledge_id: 1,
          title: 1,
          summary: 1,
          score: { $meta: 'searchScore' }
        }
      }
    ])
    .toArray();
  
  // 3. Merge results (RRF - Reciprocal Rank Fusion)
  return mergeResults(vectorResults, textResults);
}
```

---

## Migration Strategy (Mock → MongoDB)

### Phase 1: Seed Initial Data

```typescript
// scripts/seed-mongodb.ts
import { MongoClient } from 'mongodb';
import usersJson from '../mock-data/nodes/users.json';
import companiesJson from '../mock-data/nodes/companies.json';
// ... outros JSONs

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  
  const db = client.db('eks');
  
  // 1. Users
  await db.collection('users').insertMany(usersJson);
  console.log(`✅ Inserted ${usersJson.length} users`);
  
  // 2. Companies
  await db.collection('companies').insertMany(companiesJson);
  console.log(`✅ Inserted ${companiesJson.length} companies`);
  
  // 3. Knowledge (com embeddings)
  const knowledgeWithEmbeddings = await Promise.all(
    knowledgeJson.map(async (k) => ({
      ...k,
      embedding: await embedKnowledge(k)
    }))
  );
  await db.collection('knowledge').insertMany(knowledgeWithEmbeddings);
  console.log(`✅ Inserted ${knowledgeJson.length} knowledge nodes with embeddings`);
  
  // ... outras collections
  
  await client.close();
}

seedDatabase();
```

### Phase 2: Create Indexes

```typescript
// scripts/create-indexes.ts
async function createIndexes() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db('eks');
  
  // Users
  await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  
  // Knowledge
  await db.collection('knowledge').createIndex({ knowledge_id: 1 }, { unique: true });
  await db.collection('knowledge').createIndex({ visibility: 1, scope: 1 });
  
  // ... outros
  
  console.log('✅ All indexes created');
  await client.close();
}
```

### Phase 3: Vector Search Index (Manual no Atlas UI)

**Passo a passo**:
1. Acessar MongoDB Atlas → Database → Search
2. Create Search Index
3. Selecionar collection: `knowledge`
4. JSON Editor:

```json
{
  "name": "knowledge_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "visibility"
      },
      {
        "type": "filter",
        "path": "scope"
      }
    ]
  }
}
```

---

## Query Patterns

### Pattern 1: Get User Conversations

```typescript
async function getUserConversations(userId: string, limit: number = 20) {
  return db.collection('conversations')
    .find({ user_id: userId })
    .sort({ updated_at: -1 })
    .limit(limit)
    .toArray();
}
```

### Pattern 2: Search Knowledge (Corporate Scope)

```typescript
async function searchCorporateKnowledge(
  query: string,
  companyId: string,
  limit: number = 10
) {
  return vectorSearch(query, {
    visibility: 'corporate',
    scope: companyId
  }, limit);
}
```

### Pattern 3: Get Tasks by Status

```typescript
async function getTasksByStatus(
  userId: string,
  status: string[]
) {
  return db.collection('tasks')
    .find({
      assigned_to: userId,
      status: { $in: status }
    })
    .sort({ due_date: 1, priority: -1 })
    .toArray();
}
```

### Pattern 4: Aggregate Startup Metrics

```typescript
async function getPortfolioMetrics(analystId: string) {
  return db.collection('startups').aggregate([
    { $match: { managed_by: analystId } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        total_raised: { $sum: '$funding.total_raised' },
        avg_valuation: { $avg: '$metrics.valuation' }
      }
    }
  ]).toArray();
}
```

---

## Requisitos Funcionais

### RF-MDB-001: Connection Pool
- Sistema DEVE usar connection pool
- Max connections: 10 (padrão MongoDB)
- Timeout: 30s

### RF-MDB-002: Schema Validation
- DEVE validar schema no insert/update
- Usar Zod ou similar
- Reject invalid data

### RF-MDB-003: Vector Search
- DEVE suportar vector search com filters
- Embedding model: text-embedding-3-large (768d)
- Similarity: cosine

### RF-MDB-004: Backup & Recovery
- Atlas DEVE ter backup automático habilitado
- Retention: 7 dias mínimo

### RF-MDB-005: Monitoring
- DEVE monitorar latência de queries
- Alert se latência > 1s
- Dashboard de métricas (Atlas Charts)

---

## Environment Variables

```bash
# .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eks?retryWrites=true&w=majority
MONGODB_DB_NAME=eks

# Azure OpenAI (para embeddings)
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

---

## Testing Strategy

```typescript
// tests/mongodb.test.ts
describe('MongoDB Integration', () => {
  test('should connect to MongoDB', async () => {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await expect(client.connect()).resolves.not.toThrow();
    await client.close();
  });

  test('should insert and retrieve user', async () => {
    const user = { user_id: 'usr_test', name: 'Test', email: 'test@test.com' };
    await db.collection('users').insertOne(user);
    
    const found = await db.collection('users').findOne({ user_id: 'usr_test' });
    expect(found).toMatchObject(user);
  });

  test('should perform vector search', async () => {
    const results = await vectorSearch('startup metrics', {
      visibility: 'corporate'
    }, 5);
    
    expect(results).toHaveLength(5);
    expect(results[0]).toHaveProperty('score');
    expect(results[0].score).toBeGreaterThan(0.7);
  });
});
```

---

## Dependencies

| Spec | Dependency | Reason |
|------|------------|--------|
| 001 | **MUST** | Knowledge Pipeline usa MongoDB |
| 026 | **SHOULD** | LLM Router precisa persistir queries |
| 032 | **MUST** | Adaptive Retrieval usa vector search |

---

## Implementation Notes

### Phase 1: Setup (1d)
- MongoDB Atlas cluster
- Connection config
- Environment variables

### Phase 2: Schema + Indexes (1d)
- Create collections
- Define indexes
- Validation schemas

### Phase 3: Vector Search (1d)
- Configure Atlas Search index
- Implement embedding generation
- Test vector search queries

---

**Status**: 📋 Planned (Sprint 1)  
**Next**: Setup MongoDB Atlas cluster e criar .env
