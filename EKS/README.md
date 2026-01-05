# EKS - Enterprise Knowledge System

**Multi-agent framework** baseado em grafo de conhecimento semântico para transformar conhecimento disperso em inteligência acionável.

[![Status](https://img.shields.io/badge/status-MVP%20Development-yellow)]()
[![Sprint](https://img.shields.io/badge/sprint-1%20pending-blue)]()

---

## 🎯 Visão Geral

EKS é uma plataforma que combina:

- 🕸️ **Grafo Semântico** (Neo4j) como primeira camada
- 💬 **Chat + Canvas** interativo (Next.js + React)
- 🤖 **Agentes Multi-Especializados** (Python + Agno)
- 🧠 **Memória Multi-Nível** (Short/Medium/Long term)
- 🔍 **Context Engineering** (Write/Compress/Isolate/Select)

### Problema que Resolve

| ❌ Antes | ✅ Com EKS |
|---------|-----------|
| Conhecimento espalhado | Estruturado em grafo |
| Decisões perdidas | Rastreadas com owner/deadline |
| IA esquece entre conversas | Memória cross-thread |
| RAG black-box | GraphRAG híbrido explicável |
| Governança manual | Automática e proativa |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│  🎨 UI (Next.js 14)                    │
│  Sidebar | Canvas | Chat               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  ⚙️ Backend API (Node.js + Express)    │
│  REST + WebSocket                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  🤖 Agents (Python + Agno)             │
│  PLA | Router | Global/Personal | PIA  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  💾 Storage (Neo4j ONLY)               │
│  Graph DB | BIG | IDG | Vector Search  │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop (optional)
- Neo4j Aura account (EXCLUSIVE DB)
- Azure OpenAI API key

### Setup (ambientes)

```bash
# 1. Clone
git clone <repo>
cd EKS

# 2. Backend
cd backend

npm install
npm run dev    # http://localhost:3001

# 3. Agents
cd ../agents

poetry install
poetry run python src/main.py   # http://localhost:8000

# 4. Frontend
cd ../frontend

npm install
npm run dev    # http://localhost:3000
```

---

## 📁 Project Structure

```
EKS/
├── frontend/              # Next.js 14 UI
├── backend/               # Node.js API
├── agents/                # Python agents
├── specs/                 # Feature specs
├── project-context/       # Database schema, env vars (ativos)
└── docker-compose.yml

NOTA: Metodologia Spec-Driven está em ../Spec-Orchestrator/.specify/
```

---

## 📋 Development Roadmap

### Sprint 1 (2 weeks) - Foundation ⏳

- 003 Admin Login
- 005 Agent Router
- 001 Knowledge Pipeline
- 007 Chat Knowledge Capture
- 009 User Memory Decision

### Sprint 2 (2 weeks) - Memory & Persistence

- 015 Neo4j Graph Model
- 017 Memory Ecosystem
- 025 Conversation Persistence
- 008 Task Generation Canvas

### Sprint 3 (2 weeks) - Agents & Teams

- 004 User Agent Factory
- 019 Multi-Agent Orchestration
- 024 Retrieval Orchestration
- 012 Graph Curation

### Sprint 4 (2 weeks) - Polish & Advanced

- 018 Observability Dashboard
- 020 Gamification
- 021 Notifications
- 022 Onboarding AI Profile

**Full roadmap**: [specs/_ROADMAP.md](./specs/_ROADMAP.md)

---

## 🎓 Key Documents

- [**Constitution**](./_context/constitution.md) - Project principles & golden rules
- [**Reorganization Plan**](./REORGANIZATION-PLAN.md) - Structure & roadmap
- [**Setup Guide**](./docs/SETUP.md) - How to run locally
- [**Specs Roadmap**](./specs/_ROADMAP.md) - Sprint priorities
- [**MVP Plan**](./plans/mvp-core-plan.md) - Original MVP plan
- [**Analysis**](./_context/ANALISE-CONSOLIDADA.md) - Gap analysis

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Radix UI, Zustand |
| Backend | Node.js 20, TypeScript, Express, Socket.io |
| Agents | Python 3.11, Agno Framework, FastAPI |
| Database | **Neo4j Aura (EXCLUSIVE)** - Graph + Vector Search |
| AI | Azure OpenAI GPT-4o, text-embedding-3-large |
| Deploy | Vercel (FE), Railway (BE), Docker |

---

## 📊 Project Status

- ✅ Frontend layout complete
- ✅ **47 specs documented** (87% PT, 13% EN)
- ✅ Constitution v2.3.0 (Neo4j-only)
- ✅ Roadmap prioritized
- ✅ Specs 040-046 traduzidas (GIN, GID, PIA, etc.)
- ⏳ Backend in progress
- ⏳ Agents setup
- ⏳ Sprint 1 pending

---

## 🤝 Contributing

1. Read [constitution.md](./.specify/memory/constitution.md)
2. Pick a spec from [_ROADMAP.md](./specs/_ROADMAP.md)
3. Create branch: `git checkout -b XXX-feature-name`
4. Implement following spec
5. Write tests (≥70% backend, ≥60% agents)
6. Create PR

---

## 📜 License

Proprietary - CoCreateAI © 2024

---

## 📞 Support

- **Docs**: [docs/](./docs/)
- **Specs**: [specs/](./specs/)
- **Issues**: GitHub Issues
- **Contact**: dev@cocreateai.com.br

---

**Last Updated**: 2025-12-29  
**Version**: 0.2.0 (Specs Complete - Ready for Implementation)
