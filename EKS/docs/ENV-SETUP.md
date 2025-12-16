# Environment Variables Setup

## Backend (.env)

Create `backend/.env` with:

```env
# Server
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars_random
JWT_EXPIRES_IN=7d

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=eks

# Agent Server
AGENT_SERVER_URL=http://localhost:8000
```

## Agents (.env)

Create `agents/.env` with:

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small

# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=eks

# Agno
AGNO_LOG_LEVEL=INFO

# Server
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

## Required Cloud Services

### Neo4j Aura (Free Tier)
1. Create account at [console.neo4j.io](https://console.neo4j.io)
2. Create database instance
3. Copy connection URI, username, password

### MongoDB Atlas (Free Tier)
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Copy connection string

### Azure OpenAI
1. Create Azure account
2. Create OpenAI resource
3. Deploy models: `gpt-4o`, `text-embedding-3-small`
4. Copy endpoint and API key

## Verification

Run the environment checker:

```bash
cd scripts
npx tsx check-env.ts
```

This will validate all required variables are set.
