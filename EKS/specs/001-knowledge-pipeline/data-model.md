# Data Model: Knowledge Pipeline

## Core Entities (refinando `database-schema.md` para esta feature)

### KnowledgeNode
- `id`: UUID
- `content`: string (texto principal ou resumo)
- `source_type`: enum (`chat`, `document`, `form`, `api`)
- `source_ref`: string (ID do arquivo, mensagem, formulário, etc.)
- `owner_id`: string (usuário que originou o conhecimento)
- `visibility`: enum (`personal`, `corporate`)
- `confidence`: float (0-1)
- `memory_level`: enum (`short`, `medium`, `long`)
- `freshness_score`: float (0-1)
- `expires_at`: datetime (pode ser null)
- `created_at`: datetime
- `updated_at`: datetime
- `version`: int
- `embedding_ref`: string (referência ao vetor armazenado)

### ProcessingJob
- `id`: UUID
- `status`: enum (`pending`, `processing`, `completed`, `failed`)
- `file_ref`: string (referência no Blob Storage)
- `error`: string|null
- `started_at`: datetime
- `completed_at`: datetime|null
- `user_id`: string

### UserPreference
- `id`: UUID
- `user_id`: string
- `default_visibility`: enum (`personal`, `corporate`)
- `remember_choices`: boolean
- `auto_classify`: boolean

### Relationships (grafo)
- `(:User)-[:OWNS]->(:KnowledgeNode)`
- `(:KnowledgeNode)-[:DERIVED_FROM]->(:Document)`
- `(:KnowledgeNode)-[:RELATED_TO]->(:KnowledgeNode)`
- `(:KnowledgeNode)-[:ABOUT]->(:Topic)`

## Invariants & Validation Rules

- `visibility` **sempre** definido no momento da persistência (nunca null).
- `owner_id` obrigatório para todo `KnowledgeNode`.
- `confidence` padrão 1.0 para documentos processados com sucesso por Docling.
- `expires_at` definido automaticamente com base em `memory_level`.
