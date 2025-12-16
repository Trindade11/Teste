# ✅ Refinamento de Escopo - COMPLETO

**Data**: 13/12/2024  
**Foco**: MVP v1 - Primeira entrega em produção (4 semanas)

---

## 🎯 Decisões Arquiteturais

### 1. Dual Database Strategy ✅

**Decision**: MongoDB Atlas + Neo4j intercambiável via Repository Pattern

```yaml
Priority 1: MongoDB Atlas
  - MVP v1 implementation
  - Free tier generoso (512MB)
  - Vector search nativo
  - Time-to-market rápido

Priority 2: Neo4j Aura (Sprint 3-4)
  - Intercambiável via config
  - Melhor para queries complexas (3+ hops)
  - Repository Pattern abstrai diferenças
```

**Rationale**:
- Flexibilidade de escolha
- Evita vendor lock-in
- Migration path claro
- Cliente decide baseado em necessidade

**Documentação**: [`DUAL-DATABASE-STRATEGY.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/DUAL-DATABASE-STRATEGY.md)

---

### 2. Stack Confirmation ✅

**Decision**: Python (FastAPI) vs Go/Rust → **Python vence**

| Critério | Python | Go | Rust |
|----------|--------|-----|------|
| Time-to-Market | ✅ 4 sem | ⚠️ 8 sem | ❌ 12 sem |
| AI/ML Ecosystem | ✅ Rico | ⚠️ Limitado | ❌ Imaturo |
| Azure SDK | ✅ Completo | ✅ Completo | ⚠️ Parcial |
| Performance | ⚠️ 5k req/s | ✅ 20k req/s | ✅ 30k req/s |

**Rationale**:
- MVP precisa validar rápido (4 semanas)
- Ecossistema AI/ML é crítico (Agno, Docling, OpenAI SDK)
- Performance suficiente (LLM é gargalo real, não backend)
- Reavaliar em Sprint 4

**Documentação**: [`STACK-EVALUATION.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/STACK-EVALUATION.md)

---

### 3. Tech Stack Final ✅

```yaml
Frontend:
  Framework: Next.js 14 + React 18
  UI: Radix UI + Tailwind CSS
  State: Zustand
  Deploy: Vercel

Backend:
  Runtime: Node.js 20 + TypeScript
  Framework: Express + Socket.io
  Deploy: Railway

Agents:
  Language: Python 3.11
  Framework: FastAPI + Agno
  Document Processing: Docling (IBM Research)
  Deploy: Railway

Storage:
  Primary: MongoDB Atlas (vector search)
  Future: Neo4j Aura (intercambiável)
  Cache: Redis

AI Services (Azure):
  LLM: GPT-4o
  Embeddings: text-embedding-3-small
  Speech: Speech-to-Text
  Documents: Document Intelligence (fallback)
  Storage: Blob Storage
```

---

## 📦 MVP v1 Scope (4 semanas)

### Must-Have Features

**5 Features Core**:

1. **Chat Interface** ✅
   - Texto + streaming
   - Histórico de conversa
   - Já implementado (base)

2. **Voice Input** 🆕 (Spec 027)
   - Azure Speech (Speech-to-Text)
   - Hold-to-record
   - Transcrição automática → chat
   - **Effort**: 2 dias

3. **File Attachments** 🆕 (Spec 028)
   - Upload PDF/DOCX/TXT (até 10MB)
   - Docling extraction
   - Chunking + embeddings
   - MongoDB vector indexing
   - **Effort**: 3 dias

4. **Knowledge Storage**
   - MongoDB Atlas
   - Vector search
   - Semantic retrieval

5. **Context Retrieval**
   - Query → embeddings
   - Vector search
   - Top-K chunks → LLM

### Success Criteria

```yaml
Funcional:
  - ✅ Login + auth JWT
  - ✅ Chat: enviar mensagem → receber resposta streaming
  - ✅ Voz: gravar → transcrever → resposta
  - ✅ Arquivo: upload PDF → extrair → indexar → perguntar sobre conteúdo
  - ✅ Context: sistema busca chunks relevantes em MongoDB

Técnico:
  - ✅ Deploy em produção (Railway + Vercel)
  - ✅ Latência chat: <3s
  - ✅ Latência voz: <5s
  - ✅ Processing arquivo: <30s (50 páginas)
  - ✅ Vector search funcionando
```

**Documentação**: [`MVP-V1-SCOPE.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/MVP-V1-SCOPE.md)

---

## 📝 Novas Specs Criadas

### Spec 027: Voice Input

**Priority**: P1 (MVP v1)  
**Effort**: 2 dias  
**Sprint**: 1

**Features**:
- Hold-to-record button
- Azure Speech-to-Text (pt-BR)
- Real-time transcription display
- Auto-send após transcrição
- Error handling (permission, timeout)

**Tech**:
- WebRTC (getUserMedia)
- Azure Speech SDK (JavaScript)
- Real-time streaming

**Metrics**:
- Accuracy >90% (português brasileiro)
- Latency <3s (recording → transcript)

**Spec**: [`027-voice-input/spec.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/specs/027-voice-input/spec.md)

---

### Spec 028: File Upload & Processing

**Priority**: P1 (MVP v1)  
**Effort**: 3 dias  
**Sprint**: 1

**Features**:
- Drag & drop file upload
- Azure Blob Storage
- Docling extraction (PDF/DOCX)
- Intelligent chunking (512 tokens, 50 overlap)
- Vector indexing (MongoDB Atlas)
- Chat retrieval integration

**Tech**:
- Multer (Node.js upload)
- Azure Blob Storage
- Docling (Python)
- Azure Document Intelligence (fallback)
- MongoDB vector search

**Metrics**:
- Extraction accuracy >95%
- Processing <30s (50 páginas)
- Retrieval relevance >80%

**Spec**: [`028-file-upload/spec.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/specs/028-file-upload/spec.md)

---

## 🗓️ Timeline Atualizado

### Sprint 1 (Semanas 1-2)

| Dia | Task | Effort | Owner |
|-----|------|--------|-------|
| 1-2 | Spec 003: Admin Login + Auth | 2d | Backend |
| 3-4 | Spec 007: Chat básico + streaming | 2d | Backend + Frontend |
| 5-6 | **Spec 027: Voice Input** | 2d | Frontend + Azure |
| 7-9 | **Spec 028: File Upload** | 3d | Full-stack |
| 10 | Integration tests + fixes | 1d | All |

**Total**: 10 dias úteis (2 semanas)

### Sprint 2 (Semanas 3-4)

| Dia | Task | Effort | Owner |
|-----|------|--------|-------|
| 11-13 | Spec 001: Knowledge Pipeline | 3d | Agents |
| 14-15 | Spec 009: User Memory | 2d | Agents + Backend |
| 16-18 | Spec 005: Agent Router básico | 3d | Agents |
| 19 | Deploy setup (Railway + Vercel) | 1d | DevOps |
| 20 | E2E tests + production validation | 1d | QA |

**Total**: 10 dias úteis (2 semanas)

**MVP v1 completo**: 4 semanas

---

## 📊 Azure Services Required

### Configuração Completa

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small

# Azure Speech
AZURE_SPEECH_KEY=xxx
AZURE_SPEECH_REGION=eastus

# Azure Document Intelligence (fallback)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://xxx.cognitiveservices.azure.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=xxx

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_STORAGE_CONTAINER=eks-uploads

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=eks

# Backend
JWT_SECRET=xxx
PORT=3001
AGENT_SERVER_URL=https://agents.railway.app
```

### Azure Portal Setup Checklist

- [ ] Create OpenAI resource + deploy gpt-4o, text-embedding-3-small
- [ ] Create Speech Service + get key
- [ ] Create Document Intelligence (optional, fallback)
- [ ] Create Storage Account + container `eks-uploads`
- [ ] Configure CORS on all services
- [ ] Set budget alerts ($50/month threshold)

---

## 🎨 Architecture Diagram

```
┌──────────────────────────────────────────────┐
│         Frontend (Next.js)                   │
│  - Chat UI (text + streaming)                │
│  - Voice recording (WebRTC)                  │
│  - File upload (drag & drop)                 │
│  Deploy: Vercel                              │
└──────────────┬───────────────────────────────┘
               │ REST API
               │
┌──────────────▼───────────────────────────────┐
│      Backend API (Node.js + TypeScript)      │
│  - Auth (JWT)                                │
│  - File upload → Azure Blob                  │
│  - Proxy to agents                           │
│  Deploy: Railway                             │
└──────────────┬───────────────────────────────┘
               │ HTTP
               │
┌──────────────▼───────────────────────────────┐
│      Agents (Python FastAPI)                 │
│  - Azure OpenAI (chat, embeddings)           │
│  - Docling (document extraction)             │
│  - MongoDB Atlas (vector search)             │
│  - Agno (agent orchestration)                │
│  Deploy: Railway                             │
└──────────────┬───────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼─────┐  ┌───▼──────────────┐
│ MongoDB     │  │ Azure Services   │
│ Atlas       │  │ - OpenAI         │
│ - Users     │  │ - Speech         │
│ - Messages  │  │ - Blob Storage   │
│ - Files     │  │ - Doc Intel      │
│ - Knowledge │  │                  │
│   (vectors) │  │                  │
└─────────────┘  └──────────────────┘
```

---

## 📈 Métricas de Sucesso

### Adoption Metrics

- ✅ 50%+ usuários experimentam voz nas primeiras 10 mensagens
- ✅ 70%+ usuários anexam pelo menos 1 arquivo na primeira sessão
- ✅ 80%+ queries usam context retrieval com sucesso

### Technical Metrics

| Métrica | Target | Monitorar |
|---------|--------|-----------|
| Chat latency (p50) | <1.5s | CloudWatch/Railway logs |
| Chat latency (p99) | <3s | CloudWatch/Railway logs |
| Voice latency | <5s | Azure Speech metrics |
| File processing | <30s (50 pgs) | Backend logs |
| Vector search recall | >80% | Manual evaluation |
| Uptime | >99% | Railway dashboard |
| Cost/user/month | <$5 | Azure cost analysis |

### Quality Metrics

- Chat response quality: >4.0/5 (user feedback)
- Voice transcription accuracy: >90%
- Document extraction accuracy: >95%

---

## 🚫 Out of Scope (Pós-MVP)

Features **não** incluídas no MVP v1:

❌ Canvas interface  
❌ Multi-agent orchestration complexa  
❌ Neo4j (apenas MongoDB v1)  
❌ Memory decay  
❌ Prompt management avançado  
❌ Admin dashboard  
❌ Observability dashboard  
❌ Text-to-Speech (bot voice response)  
❌ Multi-language (apenas pt-BR)  
❌ User onboarding AI profile  
❌ Retrieval orchestration (Spec 024)  
❌ Intelligent Router (Spec 026)  

**Reavaliar em**: Sprint 3 (após validação MVP)

---

## 📚 Documentação Criada

| Documento | Propósito | Status |
|-----------|-----------|--------|
| [`DUAL-DATABASE-STRATEGY.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/DUAL-DATABASE-STRATEGY.md) | MongoDB + Neo4j intercambiável | ✅ |
| [`STACK-EVALUATION.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/STACK-EVALUATION.md) | Python vs Go vs Rust | ✅ |
| [`MVP-V1-SCOPE.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/MVP-V1-SCOPE.md) | Features, timeline, success criteria | ✅ |
| [`API-DESIGN.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/API-DESIGN.md) | Context Depth + LLM Router (Spec 026) | ✅ |
| [`constitution.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/_context/constitution.md) | Atualizado com stack + MVP scope | ✅ |
| [`027-voice-input/spec.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/specs/027-voice-input/spec.md) | Spec completa Voice Input | ✅ |
| [`028-file-upload/spec.md`](file:///c:/Users/Luiz%20Carlos/Projects/Spec-Orchestrator/EKS/specs/028-file-upload/spec.md) | Spec completa File Upload | ✅ |

---

## ✅ Status Final

**Refinamento de escopo: COMPLETO**

### Deliverables

- ✅ 3 documentos arquiteturais (Database, Stack, MVP)
- ✅ 2 specs novas (Voice Input, File Upload)
- ✅ Constitution atualizada
- ✅ Timeline definido (4 semanas)
- ✅ Azure services mapeados
- ✅ Success criteria claros

### Ready to Start

**Sprint 1 pode iniciar AGORA** com:
1. Setup Azure services (1 dia)
2. Spec 003: Admin Login (2 dias)
3. Spec 007: Chat básico (2 dias)
4. Spec 027: Voice Input (2 dias)
5. Spec 028: File Upload (3 dias)

**Total Sprint 1**: 10 dias úteis (2 semanas)

---

## 🔄 Próximas Rodadas de Refinamento

Após MVP v1 (Sprint 3+):

1. **Performance**: Avaliar migração LLM Router para Go
2. **Neo4j**: Implementar Repository + migration tools
3. **Advanced Features**: Canvas, multi-agent, Spec 026
4. **Scale**: Otimizações, caching, CDN

---

**Última atualização**: 13/12/2024 17:45  
**Responsável**: Cascade AI + Luiz Carlos  
**Status**: ✅ Pronto para desenvolvimento
