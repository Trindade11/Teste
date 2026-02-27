# Guia de Ingestão de Documentos - EKS

**Versão**: 1.0  
**Data**: 2026-02-27  
**Status**: Implementado e Funcional

---

## Visão Geral

O sistema de ingestão de documentos do EKS permite fazer upload de documentos e vinculá-los automaticamente ao **Business Intent Graph (BIG)**, criando relacionamentos semânticos com:

- **Projetos** (`Project`)
- **OKRs** (`OKR`)
- **Objetivos** (`Objective`)
- **Processos** (`Process`)
- **Departamentos** (`Department`)

---

## Arquitetura

### Fluxo de Ingestão

```
Upload → Validação → Processamento → Relacionamentos BIG → Grafo Neo4j
```

### Componentes

1. **Backend** (`documents.routes.ts`)
   - `POST /documents/ingest` - Upload e ingestão
   - `GET /documents/linkable-entities` - Lista entidades para vinculação
   - `POST /documents/suggest-relationships` - Sugestões automáticas
   - `GET /documents` - Lista documentos
   - `GET /documents/:id` - Detalhes do documento

2. **Frontend** (`DocumentUpload.tsx`)
   - Upload drag-and-drop
   - Formulário de metadados
   - Seleção de relacionamentos
   - Sugestões automáticas em tempo real
   - Validação de relacionamentos obrigatórios

3. **API Client** (`api.ts`)
   - `uploadDocument(file, metadata)`
   - `getLinkableEntities(type?)`
   - `suggestDocumentRelationships(data)`
   - `getDocuments(filters?)`

---

## Tipos de Documento

| Tipo | Descrição | Relacionamentos Obrigatórios | Classe de Memória |
|------|-----------|------------------------------|-------------------|
| `contract` | Contratos | Projeto | Procedural |
| `report` | Relatórios | Objetivo OU OKR | Evaluative |
| `meeting` | Atas de reunião | Projeto | Episodic |
| `process_doc` | Documentação de processo | Processo | Procedural |
| `strategic_plan` | Plano estratégico | Objetivo | Semantic |
| `technical_spec` | Especificação técnica | Projeto | Semantic |
| `presentation` | Apresentações | - | Episodic |
| `email` | Emails | - | Episodic |
| `note` | Notas | - | Episodic |
| `policy` | Políticas/Normas | Departamento | Semantic |
| `analysis` | Análises/Estudos | Objetivo OU OKR | Evaluative |
| `other` | Outros | - | Episodic |

---

## Níveis de Confidencialidade

| Nível | Descrição | Acesso |
|-------|-----------|--------|
| `public` | Público | Todos |
| `internal` | Interno | Colaboradores |
| `confidential` | Confidencial | Equipe do projeto + gestão |
| `restricted` | Restrito | C-level apenas |

---

## Relacionamentos BIG

### Relacionamentos Diretos

```cypher
// Documento suporta objetivo
(:Document)-[:SUPPORTS {relevance_score, assigned_by, assigned_at}]->(:Objective)

// Documento vinculado a OKR
(:Document)-[:LINKED_TO_OKR {relevance_score}]->(:OKR)

// Documento pertence a projeto
(:Document)-[:BELONGS_TO_PROJECT]->(:Project)

// Documento descreve processo
(:Document)-[:DESCRIBES_PROCESS]->(:Process)

// Documento pertence a departamento
(:Document)-[:BELONGS_TO]->(:Department)
```

### Relacionamentos Indiretos

```cypher
// Via Knowledge
(:Document)-[:HAS_CHUNK]->(:Chunk)-[:RELATES_TO]->(:Knowledge)-[:SUPPORTS]->(:Objective)

// Via Project
(:Document)-[:BELONGS_TO_PROJECT]->(:Project)-[:LINKED_TO_OKR]->(:OKR)
```

---

## Como Usar

### 1. Upload via Interface

1. Acesse a seção **Conhecimento** no menu
2. Clique em **Upload de Documento**
3. Arraste o arquivo ou clique para selecionar
4. Preencha os metadados:
   - **Título** (obrigatório)
   - **Tipo de Documento** (obrigatório)
   - **Confidencialidade** (obrigatório)
   - **Resumo** (opcional)
5. Selecione os relacionamentos:
   - **Projetos** (múltiplos)
   - **OKRs** (múltiplos)
   - **Objetivos** (múltiplos)
   - **Processo** (único)
6. Revise as sugestões automáticas
7. Clique em **Fazer Upload**

### 2. Upload via API

```typescript
import { api } from '@/lib/api';

const file = new File(['conteúdo'], 'documento.pdf', { type: 'application/pdf' });

const metadata = {
  title: 'Relatório Q1 2026',
  type: 'report',
  confidentiality: 'internal',
  linkedProjectIds: ['proj-123'],
  linkedOkrIds: ['okr-456'],
  linkedObjectiveIds: ['obj-789'],
  tags: ['Q1', '2026', 'financeiro'],
  summary: 'Relatório financeiro do primeiro trimestre'
};

const response = await api.uploadDocument(file, metadata);

if (response.success) {
  console.log('Documento enviado:', response.data.documentId);
  console.log('Chunks criados:', response.data.chunkCount);
  console.log('Relacionamentos:', response.data.relationships);
}
```

### 3. Listar Entidades para Vinculação

```typescript
// Listar todos os tipos
const response = await api.getLinkableEntities();

// Listar apenas projetos
const projects = await api.getLinkableEntities('project');

// Listar apenas OKRs
const okrs = await api.getLinkableEntities('okr');
```

### 4. Obter Sugestões Automáticas

```typescript
const suggestions = await api.suggestDocumentRelationships({
  title: 'Plano de Marketing Q2',
  type: 'strategic_plan',
  summary: 'Estratégia de marketing para o segundo trimestre'
});

console.log('Projetos sugeridos:', suggestions.data.suggestedProjects);
console.log('OKRs sugeridos:', suggestions.data.suggestedOkrs);
console.log('Objetivos sugeridos:', suggestions.data.suggestedObjectives);
```

---

## Validações

### Validações Automáticas

1. **Relacionamentos Obrigatórios**
   - Contratos devem ter pelo menos 1 projeto
   - Relatórios devem ter pelo menos 1 objetivo OU 1 OKR
   - Processos devem ter 1 processo vinculado
   - Políticas devem ter 1 departamento

2. **Formato de Arquivo**
   - Tamanho máximo: 50MB
   - Formatos aceitos: PDF, DOCX, TXT, MD, XLSX

3. **Metadados**
   - Título é obrigatório
   - Tipo é obrigatório
   - Confidencialidade é obrigatória

### Mensagens de Erro

```json
{
  "success": false,
  "error": "Relacionamentos obrigatórios faltando: Projeto",
  "missing": ["Projeto"]
}
```

---

## Processamento

### Pipeline de Ingestão

1. **Upload** → Arquivo salvo temporariamente
2. **Validação** → Metadados e relacionamentos validados
3. **Criação do Nó** → `:Document` criado no Neo4j
4. **Chunking Semântico** → Documento dividido por estrutura (cláusulas, seções, parágrafos)
5. **Relacionamentos** → Vínculos BIG criados + relacionamentos entre chunks (FOLLOWS)
6. **Extração** → Entidades extraídas (futuro: LLM + enriquecimento)
7. **Finalização** → Status atualizado para `completed`

### Chunking Semântico Estrutural

**O EKS NÃO usa chunking por tokens fixos (500 tokens).** 

Ao invés disso, usa **chunking semântico baseado na estrutura do documento**:

#### Estratégias por Tipo:

| Tipo | Estratégia | Exemplo de Chunk |
|------|-----------|------------------|
| **Contrato** | Cláusulas e subcláusulas | "CLÁUSULA PRIMEIRA - DO OBJETO" completa |
| **Relatório** | Seções estruturadas | "1. Introdução", "2.1 Metodologia" |
| **Processo** | Etapas do processo | Cada etapa com suas atividades |
| **Outros** | Parágrafos semânticos | Parágrafos completos (não quebrados) |

#### Propriedades do Chunk Semântico:

```cypher
(:Chunk {
  id: UUID,
  documentId: UUID,
  text: String,
  textLength: Integer,
  
  // Estrutura Semântica
  chunkType: 'section' | 'subsection' | 'clause' | 'subclause' | 'paragraph' | 'table',
  hierarchyLevel: Integer,  // 1, 2, 3...
  sectionNumber: String,  // "1.2.3", "Cláusula 5"
  sectionTitle: String,  // "Metodologia", "Do Objeto"
  sequenceIndex: Integer,  // Ordem no documento
  
  // Futuros (Spec 063)
  summary: String,
  keyEntities: [String],
  topics: [String],
  clearanceLevel: Integer,  // 0-4 (Spec 062)
  
  createdAt: DateTime
})
```

#### Relacionamentos Entre Chunks:

```cypher
// Sequência linear
(:Chunk)-[:FOLLOWS]->(:Chunk)

// Hierarquia (futuro)
(:Chunk {hierarchyLevel: 1})-[:HAS_SUBSECTION]->(:Chunk {hierarchyLevel: 2})
```

#### Benefícios:

1. **Contexto preservado**: Chunks são unidades semânticas completas
2. **Busca precisa**: Embeddings capturam significado completo
3. **Navegação estruturada**: UI pode mostrar "Ir para Cláusula 5.2"
4. **Extração de conhecimento**: Cada chunk = unidade mapeável
5. **Segurança granular**: Clearance level por chunk (futuro)

**Documentação completa**: `EKS/specs/063-semantic-chunking/spec.md`

---

### Propriedades do Nó Document

```cypher
(:Document {
  id: UUID,
  title: String,
  type: DocumentType,
  format: String,
  sourceFile: String,
  fileSize: Integer,
  uploadedBy: UUID,
  createdAt: DateTime,
  processedAt: DateTime,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  confidentiality: ConfidentialityLevel,
  memoryClass: MemoryClass,
  visibility: 'personal' | 'project' | 'corporate' | 'public',
  summary: String,
  keyTopics: [String],
  tags: [String],
  linkedProjectIds: [UUID],
  linkedOkrIds: [UUID],
  linkedObjectiveIds: [UUID],
  linkedProcessId: UUID,
  departmentId: UUID,
  chunkCount: Integer
})
```

---

## Queries Úteis

### Documentos de um Projeto

```cypher
MATCH (d:Document)-[:BELONGS_TO_PROJECT]->(p:Project {id: $projectId})
RETURN d
ORDER BY d.createdAt DESC
```

### Documentos que Suportam um Objetivo

```cypher
MATCH (d:Document)-[:SUPPORTS]->(obj:Objective {id: $objectiveId})
RETURN d, obj
ORDER BY d.createdAt DESC
```

### Documentos por Tipo e Confidencialidade

```cypher
MATCH (d:Document)
WHERE d.type = 'report' AND d.confidentiality = 'internal'
RETURN d
ORDER BY d.createdAt DESC
LIMIT 20
```

### Documentos com Relacionamentos Completos

```cypher
MATCH (d:Document {id: $documentId})
OPTIONAL MATCH (d)<-[:UPLOADED]-(uploader:User)
OPTIONAL MATCH (d)-[:BELONGS_TO_PROJECT]->(proj:Project)
OPTIONAL MATCH (d)-[:LINKED_TO_OKR]->(okr:OKR)
OPTIONAL MATCH (d)-[:SUPPORTS]->(obj:Objective)
OPTIONAL MATCH (d)-[:DESCRIBES_PROCESS]->(proc:Process)
OPTIONAL MATCH (d)-[:BELONGS_TO]->(dept:Department)
RETURN d, uploader, 
       collect(DISTINCT proj) AS projects,
       collect(DISTINCT okr) AS okrs,
       collect(DISTINCT obj) AS objectives,
       collect(DISTINCT proc) AS processes,
       collect(DISTINCT dept) AS departments
```

---

## Próximos Passos (Roadmap)

### Fase 2 - Processamento Avançado
- [ ] Integração com Docling para chunking inteligente
- [ ] Extração de entidades com LLM (tasks, decisions, risks, insights)
- [ ] Geração automática de embeddings para busca semântica
- [ ] Conversão de tabelas para JSON estruturado

### Fase 3 - Sugestões Inteligentes
- [ ] Agente de sugestão baseado em LLM (não apenas keywords)
- [ ] Análise de similaridade semântica para sugestões
- [ ] Aprendizado com feedback do usuário

### Fase 4 - Segurança e Compliance
- [ ] Clearance levels (0-4) conforme Spec 062
- [ ] Auditoria de acesso a documentos confidenciais
- [ ] Anonimização on-the-fly para usuários externos
- [ ] LGPD/GDPR compliance

### Fase 5 - Experiência do Usuário
- [ ] Preview de documentos no navegador
- [ ] Edição de metadados pós-upload
- [ ] Versionamento de documentos
- [ ] Histórico de alterações

---

## Troubleshooting

### Erro: "Relacionamentos obrigatórios faltando"

**Causa**: Tipo de documento requer relacionamentos específicos que não foram fornecidos.

**Solução**: Verifique a tabela de tipos de documento e adicione os relacionamentos obrigatórios.

### Erro: "Failed to upload document"

**Causa**: Arquivo muito grande ou formato não suportado.

**Solução**: 
- Verifique se o arquivo é menor que 50MB
- Verifique se o formato está na lista de aceitos

### Erro: "Authentication required"

**Causa**: Token de autenticação expirado ou inválido.

**Solução**: Faça login novamente.

### Sugestões não aparecem

**Causa**: Título muito curto (< 3 caracteres) ou nenhuma entidade similar no grafo.

**Solução**: 
- Digite um título mais descritivo
- Crie manualmente os relacionamentos

---

## Referências

- **Schema Completo**: `EKS/docs/document-ingestion-schema.md`
- **Spec 013**: Ingestion Ecosystem
- **Spec 040**: Business Intent Graph (BIG)
- **Spec 062**: Profile-Based Data Security (futuro)
- **Database Schema**: `project-context/database-schema.md`

---

**Implementado por**: Cascade AI  
**Data**: 2026-02-27  
**Versão do EKS**: 0.1.0
