# Environment Variables

> Documentation of all environment variables used in this project

**Last Updated**: 2025-12-06

## Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Yes | Neo4j database connection URI |
| `NEO4J_USERNAME` | Yes | Neo4j authentication username |
| `NEO4J_PASSWORD` | Yes | Neo4j authentication password |
| `NEO4J_DATABASE` | Yes | Neo4j database name |
| `AURA_INSTANCEID` | Yes | Neo4j Aura instance ID |
| `AURA_INSTANCENAME` | Yes | Neo4j Aura instance name |
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI service endpoint |
| `AZURE_OPENAI_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Yes | Azure OpenAI model deployment name |
| `AZURE_OPENAI_API_VERSION` | No | Azure OpenAI API version (default: 2025-01-01-preview) |
| `DEFAULT_PROVIDER` | No | Default LLM provider (default: azure) |
| `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME` | No | Embeddings model deployment |
| `AZURE_OPENAI_EMBEDDINGS_ENDPOINT` | No | Embeddings service endpoint |
| `AZURE_OPENAI_EMBEDDINGS_KEY` | No | Embeddings API key |
| `AZURE_OPENAI_EMBEDDINGS_DIMENSIONS` | No | Embedding vector dimensions (default: 1536) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL for frontend |

---

## Database Configuration

### Neo4j Graph Database

#### `NEO4J_URI`

- **Required**: Yes
- **Format**: `neo4j+s://xxxxx.databases.neo4j.io`
- **Example**: `neo4j+s://abc123.databases.neo4j.io`
- **Used by**: Graph database connections, Node operations
- **Notes**: Login to https://console.neo4j.io to validate the Aura Instance

#### `NEO4J_USERNAME`

- **Required**: Yes
- **Format**: String
- **Example**: `neo4j`
- **Used by**: Database authentication

#### `NEO4J_PASSWORD`

- **Required**: Yes
- **Format**: String (secure password)
- **Used by**: Database authentication
- **Notes**: Store securely, never commit to repository

#### `NEO4J_DATABASE`

- **Required**: Yes
- **Format**: String
- **Example**: `neo4j`
- **Used by**: Database connection
- **Notes**: Default database name is typically `neo4j`

#### `AURA_INSTANCEID`

- **Required**: Yes
- **Format**: Alphanumeric string
- **Used by**: Neo4j Aura instance identification
- **Obtain from**: Neo4j Aura Console

#### `AURA_INSTANCENAME`

- **Required**: Yes
- **Format**: String
- **Used by**: Instance reference and management
- **Obtain from**: Neo4j Aura Console

---

## AI/LLM Configuration

### Azure OpenAI (Primary LLM)

#### `AZURE_OPENAI_ENDPOINT`

- **Required**: Yes
- **Format**: `https://xxxxx.openai.azure.com/`
- **Used by**: LLM inference, agent operations
- **Notes**: Main endpoint for GPT models

#### `AZURE_OPENAI_KEY`

- **Required**: Yes
- **Format**: Alphanumeric key (32+ characters)
- **Used by**: Azure OpenAI authentication
- **Obtain from**: Azure Portal
- **Notes**: Rotate periodically for security

#### `AZURE_OPENAI_DEPLOYMENT_NAME`

- **Required**: Yes
- **Format**: String (deployment name in Azure)
- **Example**: `gpt-4`, `gpt-35-turbo`
- **Used by**: Model selection for chat and reasoning

#### `AZURE_OPENAI_API_VERSION`

- **Required**: No
- **Format**: `YYYY-MM-DD-preview`
- **Default**: `2025-01-01-preview`
- **Used by**: API version selection
- **Notes**: Update as newer versions become available

#### `DEFAULT_PROVIDER`

- **Required**: No
- **Format**: `azure` | `openai` | `anthropic`
- **Default**: `azure`
- **Used by**: LLM provider selection
- **Notes**: Currently set to Azure OpenAI

### Azure OpenAI Embeddings

#### `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME`

- **Required**: No (but recommended for vector operations)
- **Format**: String
- **Example**: `text-embedding-3-small`
- **Default**: `text-embedding-3-small`
- **Used by**: Document embedding, semantic search

#### `AZURE_OPENAI_EMBEDDINGS_ENDPOINT`

- **Required**: No (can use main endpoint)
- **Format**: `https://xxxxx.openai.azure.com/`
- **Used by**: Embedding generation

#### `AZURE_OPENAI_EMBEDDINGS_KEY`

- **Required**: No (can use main key)
- **Format**: Alphanumeric key
- **Used by**: Embeddings API authentication

#### `AZURE_OPENAI_EMBEDDINGS_DIMENSIONS`

- **Required**: No
- **Format**: Integer
- **Default**: `1536`
- **Used by**: Vector dimension configuration
- **Notes**: Must match the model's output dimensions

---

## Application Settings

### `NEXT_PUBLIC_API_URL`

- **Required**: Yes
- **Format**: `http://host:port` or `https://domain`
- **Example**: `http://localhost:8000`
- **Default**: `http://localhost:8000`
- **Used by**: Frontend API calls
- **Notes**: Must be prefixed with `NEXT_PUBLIC_` to be accessible in browser

---

## Environment-Specific Configuration

### Development

```env
NEO4J_URI=neo4j+s://dev-instance.databases.neo4j.io
NEXT_PUBLIC_API_URL=http://localhost:8000
DEFAULT_PROVIDER=azure
```

### Production

```env
NEO4J_URI=neo4j+s://prod-instance.databases.neo4j.io
NEXT_PUBLIC_API_URL=https://api.cvchub.com
DEFAULT_PROVIDER=azure
```

---

## Secrets Management

### Where secrets are stored

- **Development**: `.env` file (git-ignored, never commit)
- **Staging**: Azure Key Vault / Secure environment variables
- **Production**: Azure Key Vault / Secure environment variables

### Security Best Practices

1. **Never commit** `.env` files to repository
2. Use `.env.example` for documentation (without real values)
3. Rotate API keys quarterly
4. Use different credentials for dev/staging/prod
5. Limit key permissions to minimum required

### Rotation Schedule

| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|------------|
| `NEO4J_PASSWORD` | Quarterly | TBD |
| `AZURE_OPENAI_KEY` | Quarterly | TBD |
| `AZURE_OPENAI_EMBEDDINGS_KEY` | Quarterly | TBD |

---

## Sample `.env` File

```env
# Neo4j Graph Database
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_password_here
NEO4J_DATABASE=neo4j
AURA_INSTANCEID=your_instance_id_here
AURA_INSTANCENAME=your_instance_name_here

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://xxxxx.openai.azure.com/
AZURE_OPENAI_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Default LLM Provider
DEFAULT_PROVIDER=azure

# Azure OpenAI Embeddings Configuration
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME=text-embedding-3-small
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://xxxxx.openai.azure.com/
AZURE_OPENAI_EMBEDDINGS_KEY=your_embeddings_key_here
AZURE_OPENAI_EMBEDDINGS_DIMENSIONS=1536

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Validation Checklist

Before starting the application, ensure:

- [ ] All required Neo4j variables are set
- [ ] Neo4j Aura instance is active (check console.neo4j.io)
- [ ] Azure OpenAI endpoint is accessible
- [ ] Azure OpenAI API keys are valid
- [ ] Backend API is running on the specified URL
- [ ] No production secrets in development `.env`
- [ ] `.env` file is in `.gitignore`
