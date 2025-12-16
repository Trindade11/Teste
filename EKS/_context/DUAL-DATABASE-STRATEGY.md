# Dual Database Strategy

**Decisão**: EKS deve suportar **MongoDB Atlas** e **Neo4j** de forma intercambiável.

**Prioridade**: MongoDB Atlas primeiro, Neo4j como alternativa.

---

## I. Rationale

### Por que Dual Database?

1. **Flexibilidade**: Cliente pode escolher baseado em custo/expertise
2. **Migration Path**: Começar MongoDB, migrar para Neo4j depois
3. **Vendor Lock-in**: Evitar dependência única
4. **Use Cases Diferentes**:
   - MongoDB: Prototipagem rápida, menos complexidade
   - Neo4j: Queries semânticas complexas, grafos profundos

---

## II. Architectural Pattern: Repository Pattern

### Abstração de Dados

```python
# src/repositories/base.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class KnowledgeRepository(ABC):
    """Abstract base for knowledge storage"""
    
    @abstractmethod
    async def create_node(self, node_type: str, properties: Dict[str, Any]) -> str:
        """Create a knowledge node"""
        pass
    
    @abstractmethod
    async def create_relationship(self, from_id: str, to_id: str, rel_type: str, properties: Dict[str, Any]) -> str:
        """Create relationship between nodes"""
        pass
    
    @abstractmethod
    async def search_semantic(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Semantic search across knowledge"""
        pass
    
    @abstractmethod
    async def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get node by ID"""
        pass
    
    @abstractmethod
    async def traverse(self, start_id: str, relationship: str, depth: int = 2) -> List[Dict[str, Any]]:
        """Traverse graph from starting node"""
        pass
```

### MongoDB Implementation

```python
# src/repositories/mongodb_repository.py
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional

class MongoDBKnowledgeRepository(KnowledgeRepository):
    def __init__(self, connection_string: str, database: str):
        self.client = AsyncIOMotorClient(connection_string)
        self.db = self.client[database]
        self.nodes = self.db.nodes
        self.relationships = self.db.relationships
    
    async def create_node(self, node_type: str, properties: Dict[str, Any]) -> str:
        """Create node as document"""
        doc = {
            "type": node_type,
            "properties": properties,
            "created_at": datetime.utcnow()
        }
        result = await self.nodes.insert_one(doc)
        return str(result.inserted_id)
    
    async def create_relationship(self, from_id: str, to_id: str, rel_type: str, properties: Dict[str, Any]) -> str:
        """Store relationship as edge document"""
        rel = {
            "from": from_id,
            "to": to_id,
            "type": rel_type,
            "properties": properties,
            "created_at": datetime.utcnow()
        }
        result = await self.relationships.insert_one(rel)
        return str(result.inserted_id)
    
    async def search_semantic(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Vector search using MongoDB Atlas Vector Search"""
        # Get query embedding
        embedding = await get_embedding(query)
        
        # MongoDB Vector Search
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": limit * 10,
                    "limit": limit
                }
            },
            {
                "$project": {
                    "properties": 1,
                    "type": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        cursor = self.nodes.aggregate(pipeline)
        return await cursor.to_list(length=limit)
    
    async def traverse(self, start_id: str, relationship: str, depth: int = 2) -> List[Dict[str, Any]]:
        """Simulate graph traversal in MongoDB"""
        visited = set()
        queue = [(start_id, 0)]
        results = []
        
        while queue:
            node_id, current_depth = queue.pop(0)
            
            if node_id in visited or current_depth > depth:
                continue
            
            visited.add(node_id)
            
            # Get node
            node = await self.nodes.find_one({"_id": ObjectId(node_id)})
            if node:
                results.append(node)
            
            # Get relationships
            rels = await self.relationships.find({
                "from": node_id,
                "type": relationship
            }).to_list(length=100)
            
            for rel in rels:
                queue.append((rel["to"], current_depth + 1))
        
        return results
```

### Neo4j Implementation

```python
# src/repositories/neo4j_repository.py
from neo4j import AsyncGraphDatabase
from typing import List, Dict, Any, Optional

class Neo4jKnowledgeRepository(KnowledgeRepository):
    def __init__(self, uri: str, user: str, password: str):
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
    
    async def create_node(self, node_type: str, properties: Dict[str, Any]) -> str:
        """Create Cypher node"""
        async with self.driver.session() as session:
            result = await session.run(
                f"CREATE (n:{node_type} $props) RETURN elementId(n) as id",
                props=properties
            )
            record = await result.single()
            return record["id"]
    
    async def create_relationship(self, from_id: str, to_id: str, rel_type: str, properties: Dict[str, Any]) -> str:
        """Create Cypher relationship"""
        async with self.driver.session() as session:
            result = await session.run(
                f"""
                MATCH (a) WHERE elementId(a) = $from_id
                MATCH (b) WHERE elementId(b) = $to_id
                CREATE (a)-[r:{rel_type} $props]->(b)
                RETURN elementId(r) as id
                """,
                from_id=from_id,
                to_id=to_id,
                props=properties
            )
            record = await result.single()
            return record["id"]
    
    async def search_semantic(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Vector search using Neo4j Vector Index"""
        embedding = await get_embedding(query)
        
        async with self.driver.session() as session:
            result = await session.run(
                """
                CALL db.index.vector.queryNodes('vector_index', $limit, $embedding)
                YIELD node, score
                RETURN node, score
                """,
                limit=limit,
                embedding=embedding
            )
            
            records = await result.values()
            return [{"node": dict(r[0]), "score": r[1]} for r in records]
    
    async def traverse(self, start_id: str, relationship: str, depth: int = 2) -> List[Dict[str, Any]]:
        """Native graph traversal"""
        async with self.driver.session() as session:
            result = await session.run(
                f"""
                MATCH path = (start)-[:{relationship}*1..{depth}]->(end)
                WHERE elementId(start) = $start_id
                RETURN DISTINCT end
                """,
                start_id=start_id
            )
            
            records = await result.values()
            return [dict(r[0]) for r in records]
```

---

## III. Configuration-Based Selection

### Environment Config

```python
# src/config.py
from enum import Enum
from pydantic_settings import BaseSettings

class DatabaseType(str, Enum):
    MONGODB = "mongodb"
    NEO4J = "neo4j"

class Settings(BaseSettings):
    # Database Selection
    database_type: DatabaseType = DatabaseType.MONGODB
    
    # MongoDB
    mongodb_uri: str = ""
    mongodb_database: str = "eks"
    
    # Neo4j
    neo4j_uri: str = ""
    neo4j_user: str = ""
    neo4j_password: str = ""
    
    class Config:
        env_file = ".env"
```

### Factory Pattern

```python
# src/repositories/factory.py
from src.config import Settings, DatabaseType
from src.repositories.base import KnowledgeRepository
from src.repositories.mongodb_repository import MongoDBKnowledgeRepository
from src.repositories.neo4j_repository import Neo4jKnowledgeRepository

def create_knowledge_repository(settings: Settings) -> KnowledgeRepository:
    """Factory to create repository based on config"""
    
    if settings.database_type == DatabaseType.MONGODB:
        return MongoDBKnowledgeRepository(
            connection_string=settings.mongodb_uri,
            database=settings.mongodb_database
        )
    elif settings.database_type == DatabaseType.NEO4J:
        return Neo4jKnowledgeRepository(
            uri=settings.neo4j_uri,
            user=settings.neo4j_user,
            password=settings.neo4j_password
        )
    else:
        raise ValueError(f"Unsupported database type: {settings.database_type}")
```

### Usage in Application

```python
# src/main.py
from fastapi import FastAPI
from src.config import Settings
from src.repositories.factory import create_knowledge_repository

settings = Settings()
repository = create_knowledge_repository(settings)

@app.post("/knowledge")
async def create_knowledge(node_type: str, properties: dict):
    node_id = await repository.create_node(node_type, properties)
    return {"id": node_id}

@app.get("/search")
async def search(query: str):
    results = await repository.search_semantic(query)
    return results
```

---

## IV. Feature Comparison

| Feature | MongoDB Atlas | Neo4j Aura | Notes |
|---------|---------------|------------|-------|
| **Vector Search** | ✅ Native | ✅ Native | Ambos suportam |
| **Graph Traversal** | ⚠️ Simulated | ✅ Native | Neo4j mais eficiente |
| **Ease of Setup** | ✅ Simples | ⚠️ Médio | MongoDB mais fácil |
| **Cost (Free Tier)** | ✅ 512MB | ⚠️ Limited | MongoDB mais generoso |
| **Query Language** | MongoDB Query | Cypher | Cypher mais expressivo para grafos |
| **Scalability** | ✅ Horizontal | ✅ Vertical | Ambos escaláveis |
| **Multi-tenancy** | ✅ Database-level | ✅ Property-level | Ambos suportam |

---

## V. Migration Strategy

### Phase 1: MongoDB First (Sprint 1-2)
- Implementar `MongoDBKnowledgeRepository`
- Todas features usando Repository Pattern
- Validar MVP

### Phase 2: Neo4j Support (Sprint 3-4)
- Implementar `Neo4jKnowledgeRepository`
- Testes de paridade
- Documentar trade-offs

### Phase 3: Migration Tools (Future)
```python
# src/tools/migrate.py
async def migrate_mongodb_to_neo4j(mongo_repo, neo4j_repo):
    """Migrate data from MongoDB to Neo4j"""
    # Get all nodes from MongoDB
    cursor = mongo_repo.nodes.find({})
    
    async for doc in cursor:
        # Create equivalent node in Neo4j
        await neo4j_repo.create_node(
            node_type=doc["type"],
            properties=doc["properties"]
        )
    
    # Migrate relationships...
```

---

## VI. Trade-offs

### Use MongoDB Atlas When:
- ✅ Prototipagem rápida
- ✅ Time familiar com MongoDB
- ✅ Budget limitado (free tier generoso)
- ✅ Queries simples (1-2 hops)

### Use Neo4j When:
- ✅ Queries complexas (3+ hops)
- ✅ Análise de grafos profunda
- ✅ Padrões de relacionamento complexos
- ✅ Performance crítica em traversals

---

## VII. Testing Strategy

```python
# tests/test_repositories.py
import pytest
from src.repositories.mongodb_repository import MongoDBKnowledgeRepository
from src.repositories.neo4j_repository import Neo4jKnowledgeRepository

@pytest.fixture(params=["mongodb", "neo4j"])
def repository(request):
    """Parametrized fixture to test both repos"""
    if request.param == "mongodb":
        return MongoDBKnowledgeRepository(...)
    else:
        return Neo4jKnowledgeRepository(...)

async def test_create_node(repository):
    """Test works with both repos"""
    node_id = await repository.create_node("Person", {"name": "Alice"})
    assert node_id is not None

async def test_semantic_search(repository):
    """Test works with both repos"""
    results = await repository.search_semantic("startups in AI")
    assert len(results) > 0
```

---

## VIII. Documentation

### For Users

```markdown
# Escolhendo seu Database

## MongoDB Atlas (Recomendado para começar)

1. Crie conta grátis em mongodb.com/atlas
2. Crie cluster
3. Configure .env:
   ```
   DATABASE_TYPE=mongodb
   MONGODB_URI=mongodb+srv://...
   ```

## Neo4j Aura (Para grafos complexos)

1. Crie conta em console.neo4j.io
2. Crie instância
3. Configure .env:
   ```
   DATABASE_TYPE=neo4j
   NEO4J_URI=neo4j+s://...
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=...
   ```
```

---

**Status**: 📋 Planned (Sprint 2-3)  
**Priority**: P1 (Foundational)
