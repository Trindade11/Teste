# EKS Agents - Python Multi-Agent System

Multi-agent orchestration system built with **Pydantic AI** Framework.

## Stack

- **Python**: 3.11+
- **Framework**: Pydantic AI (type-safe agent framework)
- **API**: FastAPI + Uvicorn
- **Database**: Neo4j (graph)
- **AI**: Azure OpenAI GPT-4o (model-agnostic support)

## Setup

### 1. Install Poetry

```bash
pip install poetry
```

### 2. Install Dependencies

```bash
poetry install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Server

```bash
poetry run python src/main.py
```

Server runs on `http://localhost:8000`

## Project Structure

```
agents/
├── src/
│   ├── main.py              # FastAPI server
│   ├── config.py            # Settings
│   ├── router/              # Agent Router (spec 005)
│   ├── factory/             # User Agent Factory (spec 004)
│   ├── agents/              # Individual agents
│   ├── teams/               # Multi-agent teams (spec 019)
│   └── utils/               # Utilities
├── tests/
├── pyproject.toml
└── README.md
```

## Development

### Run Tests

```bash
poetry run pytest
```

### Run with Coverage

```bash
poetry run pytest --cov=src
```

### Linting

```bash
poetry run black src/
poetry run ruff check src/
poetry run mypy src/
```

## API Endpoints

- `GET /health` - Health check
- `POST /agents/invoke` - Invoke agent (TODO)
- `GET /agents` - List available agents (TODO)

See `/docs` for Swagger UI.

## Related

- Backend: `../backend` (Node.js API)
- Frontend: `../frontend` (Next.js UI)
- Specs: `../specs` (Feature specifications)
