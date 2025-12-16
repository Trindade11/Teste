# Agno Framework Reference

> Documentação do Framework Agno obtida via Context7 MCP

**Last Updated**: 2025-12-07  
**Context7 Library ID**: `/websites/agno`  
**Source Reputation**: High  
**Code Snippets**: 9363

---

## Overview

Agno é um framework Python para construir sistemas multi-agentes com memória compartilhada, conhecimento e raciocínio. Permite criar agentes altamente performáticos e workflows complexos.

---

## Patterns Aprovados para CVC Hub

### 1. Team com Memória Persistente

```python
from agno.team import Team
from agno.db.postgres import PostgresDb
from agno.agent import Agent
from agno.models.openai import OpenAIChat

# Database setup (usaremos Neo4j adapter customizado)
db = PostgresDb(db_url="postgresql+psycopg://ai:ai@localhost:5532/ai")

agent = Agent(
    model=OpenAIChat(id="gpt-5-mini"),
)

team = Team(
    model=OpenAIChat(id="gpt-5-mini"),
    members=[agent],
    db=db,
    enable_user_memories=True,  # Memória por usuário
)

# Uso com user_id
team.print_response(
    "Meu nome é João",
    stream=True,
    user_id="joao@startup.com",
)
```

### 2. Team com Knowledge Base

```python
from agno.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.tools.knowledge import KnowledgeTools

# Knowledge base com busca híbrida
knowledge = Knowledge(
    vector_db=LanceDb(
        uri="tmp/lancedb",
        table_name="cvc_docs",
        search_type=SearchType.hybrid,
    ),
)

# Adicionar conteúdo
knowledge.add_content(url="https://docs.example.com")

# Tools para o agente
knowledge_tools = KnowledgeTools(
    knowledge=knowledge,
    think=True,
    search=True,
    analyze=True,
)
```

### 3. Agentic Memory (Memória Gerenciada pelo Agente)

```python
team = Team(
    model=OpenAIChat(id="gpt-5-mini"),
    members=[agent],
    db=db,
    enable_agentic_memory=True,  # Agente decide o que guardar
)
```

**Capacidades quando habilitado**:
- Acesso a `update_user_memory` tool
- Adicionar novas memórias
- Atualizar memórias existentes
- Deletar ou limpar memórias
- Memórias capturadas baseadas em mensagens do usuário

### 4. Knowledge Filters Agênticos

```python
team = Team(
    name="Team with Knowledge",
    members=[agent],
    model=OpenAIChat(id="gpt-5-mini"),
    knowledge=knowledge,
    enable_agentic_knowledge_filters=True,  # IA determina filtros
)
```

### 5. Memória Compartilhada entre Agentes

```python
# Mesmo db = memória compartilhada
agent_1 = Agent(db=db, enable_user_memories=True)
agent_2 = Agent(db=db, enable_user_memories=True)

# Agent 1 cria memória
agent_1.print_response("Meu nome é João")

# Agent 2 pode acessar
agent_2.print_response("Qual meu nome?")  # Sabe que é João
```

---

## Adaptações para CVC Hub

### Customizações Necessárias

1. **Database Adapter**: Criar adapter para Neo4j (Agno usa PostgreSQL/SQLite nativamente)
2. **Memory Storage**: Usar Neo4j como backend de memória em vez de PostgreSQL
3. **Knowledge Integration**: Integrar com nosso sistema de embeddings Azure OpenAI
4. **User Agent Factory**: Usar patterns de Team para criar agentes por usuário

### Mapeamento Agno → CVC Hub

| Agno Feature | CVC Hub Implementation |
|--------------|------------------------|
| `enable_user_memories` | Memória pessoal no Neo4j |
| `enable_agentic_memory` | Decisão de memória pelo agente |
| `Knowledge` | Knowledge base com proveniência |
| `Team` | Agent Router + especialistas |
| `db` | Neo4j adapter customizado |

---

## Referências

- **Context7 Library**: `/websites/agno`
- **Documentação**: https://docs.agno.com
- **Padrões Aprovados**: Constitution A.III
