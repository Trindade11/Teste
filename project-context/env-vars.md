# Environment Variables - EKS Project

> Configuration variables for the EKS Enterprise Knowledge System

**Created**: 2024-12-13  
**Last Updated**: 2024-12-13

---

## 📋 Environment Variables

### Database Configuration

```bash
# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<to-be-set>
NEO4J_DATABASE=eks

# Connection pool settings
NEO4J_MAX_CONNECTION_LIFETIME=3600
NEO4J_MAX_CONNECTION_POOL_SIZE=50
NEO4J_CONNECTION_ACQUISITION_TIMEOUT=60
```

### LLM Configuration

```bash
# Primary LLM Provider (OpenAI, Azure, Anthropic, etc.)
LLM_PROVIDER=openai
LLM_API_KEY=<to-be-set>
LLM_MODEL=gpt-4-turbo-preview
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4096

# Embeddings
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSION=3072
```

### Application Configuration

```bash
# Application
APP_ENV=development
APP_DEBUG=true
APP_PORT=8000
APP_HOST=0.0.0.0

# Security
JWT_SECRET=<to-be-generated>
JWT_EXPIRATION=86400
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Session
SESSION_SECRET=<to-be-generated>
SESSION_TIMEOUT=3600
```

### Knowledge Extraction

```bash
# Extraction Pipeline
EXTRACTION_BATCH_SIZE=100
EXTRACTION_MAX_WORKERS=4
EXTRACTION_CHUNK_SIZE=1000

# NLP Processing
NLP_FRAMEWORK=spacy
NLP_MODEL=en_core_web_lg
NLP_BATCH_SIZE=50
```

### Agent Configuration

```bash
# Multi-Agent System
AGENT_TIMEOUT=300
AGENT_MAX_RETRIES=3
AGENT_BACKOFF_FACTOR=2

# PIA (Process Intelligence Agents)
PIA_ANALYSIS_INTERVAL=3600
PIA_CONFIDENCE_THRESHOLD=0.75
```

### External Intelligence

```bash
# External monitoring
IEP_SCAN_INTERVAL=3600
IEP_MAX_SOURCES=20
IEP_RATE_LIMIT=100

# Alert system
ALERT_QUEUE_SIZE=1000
ALERT_RETRY_ATTEMPTS=3
```

### Logging & Monitoring

```bash
# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE_PATH=./logs/eks.log
LOG_MAX_SIZE=100MB
LOG_RETENTION_DAYS=30

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics
```

---

## 🔒 Security Notes

- All secrets should be stored in a secure vault (e.g., Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
- Never commit `.env` files to version control
- Use different values for development, staging, and production
- Rotate secrets regularly (quarterly minimum)

---

## 📝 Setup Instructions

1. Copy `.env.example` to `.env`
2. Generate secure secrets: `python scripts/generate_secrets.py`
3. Configure Neo4j connection string
4. Set LLM API keys
5. Verify configuration: `python scripts/verify_config.py`

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-13 | Initial environment variables definition |
