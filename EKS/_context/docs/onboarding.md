# EKS - Developer Onboarding

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop
- Neo4j Aura account
- MongoDB Atlas account
- Azure OpenAI API key

### Setup Local Environment

```bash
# 1. Clone & setup
git clone <repo>
cd EKS

# 2. Start infrastructure
docker-compose up -d

# 3. Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 4. Agents
cd ../agents
poetry install
cp .env.example .env
# Edit .env
poetry run python src/main.py

# 5. Frontend
cd ../frontend
npm install
npm run dev
```

### Verify Setup

- Backend: http://localhost:3001/health
- Agents: http://localhost:8000/health
- Frontend: http://localhost:3000

## Project Structure

See `REORGANIZATION-PLAN.md` for complete folder structure.

## Development Workflow

1. Read spec in `specs/XXX-feature-name/`
2. Create feature branch: `git checkout -b XXX-feature-name`
3. Implement following spec
4. Write tests (≥70% coverage backend, ≥60% agents)
5. Run tests: `npm test` (backend), `poetry run pytest` (agents)
6. Create PR

## Key Documents

- `constitution.md` - Project principles
- `REORGANIZATION-PLAN.md` - Structure & roadmap
- `specs/_ROADMAP.md` - Sprint priorities
- `plans/mvp-core-plan.md` - MVP plan
