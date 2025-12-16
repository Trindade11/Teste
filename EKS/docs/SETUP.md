# EKS - Local Development Setup

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Python** 3.11+ ([download](https://www.python.org/))
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **Poetry** (Python package manager)
- **Git**

## Cloud Accounts (Required)

- **Neo4j Aura** (free tier) - [console.neo4j.io](https://console.neo4j.io)
- **MongoDB Atlas** (free tier) - [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **Azure OpenAI** - [portal.azure.com](https://portal.azure.com)

---

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repo-url>
cd EKS
```

### 2. Start Local Infrastructure

```bash
# Start Neo4j, MongoDB, Redis locally (optional)
docker-compose up -d

# Verify containers
docker-compose ps
```

**Note**: Use cloud services (Neo4j Aura, MongoDB Atlas) for production.

### 3. Setup Backend (Node.js)

```bash
cd backend
npm install

# Create .env
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Agent Server
AGENT_SERVER_URL=http://localhost:8000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=eks
```

Run backend:

```bash
npm run dev
```

Backend runs on <http://localhost:3001>

### 4. Setup Agents (Python)

```bash
cd ../agents

# Install Poetry (if not installed)
pip install poetry

# Install dependencies
poetry install
```

Create `agents/.env` manually (copy from `.env.example` in root):

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small

# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=eks

# Agno
AGNO_LOG_LEVEL=INFO
```

Run agents:

```bash
poetry run python src/main.py
```

Agents run on <http://localhost:8000>

### 5. Setup Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on <http://localhost:3000>

---

## Verify Setup

Open browser and check:

- **Frontend**: <http://localhost:3000>
- **Backend Health**: <http://localhost:3001/health>
- **Agents Health**: <http://localhost:8000/health>
- **Agents Docs**: <http://localhost:8000/docs>

---

## Troubleshooting

### Backend can't connect to Neo4j

- Verify `NEO4J_URI` in `.env`
- Check Neo4j Aura console if database is running
- Test connection: `npm run test:neo4j` (TODO)

### Agents can't start

- Verify Python version: `python --version` (must be 3.11+)
- Reinstall dependencies: `poetry install --no-cache`
- Check logs for missing env vars

### Frontend can't connect to backend

- Verify backend is running: `curl http://localhost:3001/health`
- Check CORS settings in `backend/src/index.ts`

---

## Next Steps

After setup is complete:

1. Read [`constitution.md`](../.specify/memory/constitution.md)
2. Review [Sprint 1 Roadmap](../specs/_ROADMAP.md)
3. Pick a spec to implement
4. Create feature branch: `git checkout -b 003-admin-login`
5. Start coding!

---

## Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm test             # Run tests
npm run lint         # Lint code

# Agents
cd agents
poetry run python src/main.py  # Start server
poetry run pytest              # Run tests
poetry run black src/          # Format code

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests

# Docker
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
```

---

## Production Deployment

See [CONTRIBUTING.md](./CONTRIBUTING.md) for CI/CD and deployment guidelines.
