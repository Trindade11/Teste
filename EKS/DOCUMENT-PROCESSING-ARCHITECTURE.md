# Arquitetura de Processamento de Documentos

> Processamento especializado por tipo de documento com 3 categorias

**Data**: 2026-03-01 | **Versão**: 1.0

---

## 🎯 Decisão Arquitetural

**Mantemos um pipeline unificado** com **estratégias especializadas** por categoria.

**Por quê?**
- ✅ Código mais manutenível
- ✅ Fácil adicionar novos tipos
- ✅ Reutilização de componentes comuns (chunking, embeddings, persistência)
- ✅ Apenas a **extração** muda por tipo

---

## 📊 Mapeamento por Tipo de Documento

### 🔍 CATEGORIA 1: RICH EXTRACTION
**Documentos estruturados de alto valor de negócio**

| Tipo | Agente Especialista | O que Extrai | Tempo | Justificativa |
|------|---------------------|--------------|-------|---------------|
| **Contrato** | `contract_extraction_agent` | Partes, Cláusulas, Valores, Prazos, Obrigações, Multas | 45s | Alto impacto legal/financeiro |
| **Proposta** | `proposal_extraction_agent` | Cliente, Projeto, Valor, Timeline, Entregas, Escopo, Premissas | 40s | Ciclo de vendas; tracking de pipeline |
| **Ata de Reunião** | `meeting_extraction_agent` | Participantes, Decisões, Tarefas, Tópicos, Próximos passos | 35s | Já implementado; padrão de referência |
| **Relatório** | `report_extraction_agent` | Métricas, Insights, Decisões, Recomendações, KPIs, Tendências | 40s | Inteligência estratégica |

**Processamento**:
```
Upload → Extrair texto → Agente Especializado (Pydantic AI) → Validação customizada → Neo4j
```

---

### 📚 CATEGORIA 2: KNOWLEDGE BASE
**Documentos de referência — comportamento similar a website**

| Tipo | Chunking | Extração | Tempo | Justificativa |
|------|----------|----------|-------|---------------|
| **Especificação Técnica** | Fixo 1500/200 | ❌ Nenhuma | 10s | Documentação técnica; consulta por similaridade |
| **Políticas e Normas** | Fixo 1500/200 | ❌ Nenhuma | 10s | Compliance; referência organizacional |
| **Manual** | Fixo 1500/200 | ❌ Nenhuma | 10s | How-to; guias operacionais |

**Processamento**:
```
Upload → Extrair texto → Chunking fixo (1500/200) → Embeddings → Neo4j (Doc + Chunks)
```

**Por que sem extração?**
- São documentos de **referência**, não de **ação**
- Valor está no **conteúdo consultável**, não em entidades extraídas
- Similar ao processamento de websites (WebSource)

---

### ⚡ CATEGORIA 3: GENERIC
**Documentos genéricos com extração leve**

| Tipo | Extração | Chunking | Tempo | Justificativa |
|------|----------|----------|-------|---------------|
| **Análise/Estudo** | Insights + Decisions (leve) | Fixo 1500/200 | 20s | Conteúdo variável; foco em achados |
| **Outro** | Insights + Decisions (leve) | Fixo 1500/200 | 20s | Fallback genérico |

**Processamento**:
```
Upload → Extrair texto → Chunking fixo → Extração genérica (insights/decisions) → Neo4j
```

---

## 🔧 Implementação Técnica

### Backend (Node.js/TypeScript)

#### 1. DocumentCategoryService
```typescript
// backend/src/services/document-category.service.ts

DocumentCategoryService.getCategory('contract')    // → 'rich_extraction'
DocumentCategoryService.getCategory('manual')      // → 'knowledge_base'
DocumentCategoryService.getCategory('analysis')    // → 'generic'

DocumentCategoryService.requiresSpecialist('contract')     // → true
DocumentCategoryService.shouldExtractEntities('manual')    // → false
DocumentCategoryService.getChunkingStrategy('report')      // → 'semantic'
```

#### 2. SpecializedExtractionService
```typescript
// backend/src/services/specialized-extraction.service.ts

specializedExtractionService.extractFromContract(content, context)
specializedExtractionService.extractFromProposal(content, context)
specializedExtractionService.extractFromMeeting(content, context)
specializedExtractionService.extractFromReport(content, context)
specializedExtractionService.extractGeneric(content, context)
```

#### 3. Endpoint /extract (Atualizado)
```typescript
POST /documents/extract

// Roteamento automático:
if (category === 'knowledge_base') {
  // Sem extração - retorna metadata apenas
} else if (category === 'rich_extraction' && agentsAvailable) {
  // Usa agente especializado Python
} else {
  // Fallback: extração genérica via LLM
}
```

---

### Agents (Python/Pydantic AI)

#### 1. Schemas Especializados
```python
# agents/document_extraction_agents.py

class ContractExtraction(BaseModel):
    parties: List[ContractParty]
    value: Optional[ContractValue]
    clauses: List[ContractClause]
    deadlines: List[ContractDeadline]
    obligations: List[ContractObligation]
    penalties: List[ContractPenalty]
    summary: str
    key_risks: List[str]
    confidence: float

class ProposalExtraction(BaseModel):
    client_name: str
    project_name: str
    total_value: Optional[float]
    deliverables: List[ProposalDeliverable]
    scope_summary: str
    assumptions: List[ProposalAssumption]
    risks: List[str]
    confidence: float

# ... similar para Meeting, Report, Generic
```

#### 2. Agentes Especializados
```python
contract_agent = Agent(
    'openai:gpt-4o',
    result_type=ContractExtraction,
    system_prompt="""You are a legal contract analysis expert...
    Extract parties, clauses, deadlines, obligations, penalties..."""
)

proposal_agent = Agent(
    'openai:gpt-4o',
    result_type=ProposalExtraction,
    system_prompt="""You are a business proposal analysis expert...
    Extract client, project, deliverables, assumptions, risks..."""
)
```

#### 3. FastAPI Endpoints
```python
# agents/document_extraction_api.py

@app.post("/extract/contract")
async def extract_contract(request: ExtractionRequest):
    result = await extract_from_document(
        content=request.content,
        doc_type='contract',
        context=request.context
    )
    return ExtractionResponse(success=True, data=result)

# Similar para: /extract/proposal, /extract/meeting, /extract/report, /extract/generic
```

---

## 📋 Exemplo de Saídas

### Contrato
```json
{
  "parties": [
    {"name": "CoCreateAI", "role": "contractor", "identifier": "12.345.678/0001-90"},
    {"name": "Move Studio", "role": "client", "identifier": "98.765.432/0001-01"}
  ],
  "value": {
    "amount": 150000,
    "currency": "BRL",
    "payment_schedule": "3 parcelas mensais"
  },
  "clauses": [
    {"clause_id": "3.1", "type": "payment", "summary": "Pagamento em 3 parcelas"},
    {"clause_id": "5.2", "type": "termination", "summary": "Rescisão com 30 dias de aviso"}
  ],
  "deadlines": [
    {"type": "delivery", "date": "2026-06-30", "description": "Entrega do MVP"}
  ],
  "key_risks": ["Atraso no pagamento pode gerar multa de 2%"]
}
```

### Proposta
```json
{
  "client_name": "Move Studio",
  "project_name": "Projeto EKS",
  "total_value": 150000,
  "deliverables": [
    {"title": "MVP Core", "description": "Sistema base", "deadline": "2026-06-30"}
  ],
  "scope_summary": "Plataforma de gestão de conhecimento empresarial",
  "assumptions": [
    {"category": "technical", "description": "Cliente fornece acesso ao Neo4j"}
  ],
  "risks": ["Dependência de APIs externas"]
}
```

### Especificação Técnica (Knowledge Base)
```json
{
  "category": "knowledge_base",
  "processingMode": "chunking_only",
  "message": "Documento de base de conhecimento - sem extração de entidades",
  "data": {
    "summary": "Especificação do Módulo de Autenticação",
    "keyTopics": [],
    "entities": []
  }
}
```
> **Resultado**: Document + Chunks (sem entidades Task/Decision/Risk/Insight)

### Análise/Estudo (Generic)
```json
{
  "summary": "Análise de mercado de IA no Brasil",
  "key_topics": ["Crescimento de IA", "Startups brasileiras", "Investimentos"],
  "insights": [
    {"summary": "Mercado cresceu 40% em 2025", "confidence": "high"}
  ],
  "decisions": [
    {"summary": "Focar em clientes corporativos", "context": "Maior ticket médio"}
  ]
}
```

---

## 🚀 Como Usar

### 1. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 2. Agents (Python)
```bash
cd agents
pip install -r requirements.txt
python document_extraction_api.py
# API rodando em http://localhost:8001
```

### 3. Teste de Extração
```bash
# Via frontend: selecionar tipo de documento → upload → extração automática
# Ou via API:
curl -X POST http://localhost:3000/api/documents/extract \
  -F "file=@contrato.pdf" \
  -F "context={\"type\":\"contract\",\"title\":\"Contrato EKS\"}"
```

---

## 📊 Comparação de Custos e Performance

| Categoria | LLM Calls | Tempo | Custo/Doc | Valor de Negócio | Neo4j Complexity |
|-----------|-----------|-------|-----------|------------------|------------------|
| **Rich Extraction** | Alto (especializado) | 30-45s | $$$ | Muito Alto | Alto (múltiplos node types) |
| **Knowledge Base** | Zero | 5-10s | $ | Médio | Baixo (Doc + Chunks) |
| **Generic** | Baixo (básico) | 15-20s | $$ | Médio | Médio (Doc + insights/decisions) |

---

## ✅ Status de Implementação

- ✅ Arquitetura documentada
- ✅ DocumentCategoryService implementado
- ✅ SpecializedExtractionService implementado
- ✅ Agentes Python completos (Contract, Proposal, Meeting, Report, Generic)
- ✅ FastAPI endpoints criados
- ✅ Backend endpoint /extract atualizado
- ⬜ Frontend: validação customizada por tipo
- ⬜ Testes end-to-end

---

## 🎯 Próximos Passos

1. **Testar agentes Python**
   ```bash
   cd agents
   python -m pytest test_document_agents.py
   ```

2. **Rodar API de agentes**
   ```bash
   python document_extraction_api.py
   ```

3. **Testar integração backend → agents**
   - Upload contrato via frontend
   - Verificar chamada ao agente especializado
   - Validar saída estruturada

4. **Criar componentes de validação customizados** (frontend)
   - `ContractValidation.tsx`
   - `ProposalValidation.tsx`
   - `MeetingValidation.tsx`
   - `ReportValidation.tsx`

---

## 📖 Documentação de Referência

- **Arquitetura completa**: `project-context/document-types-architecture.md`
- **Categorias e configs**: `backend/src/services/document-category.service.ts`
- **Agentes especializados**: `agents/document_extraction_agents.py`
- **API de extração**: `agents/document_extraction_api.py`
- **Endpoint backend**: `backend/src/routes/documents.routes.ts` (linha 212+)

---

> **Decisão final**: Pipeline unificado com especialização inteligente por tipo. Máximo valor de negócio com mínima complexidade.
