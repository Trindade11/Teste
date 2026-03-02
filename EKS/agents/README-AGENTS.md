# EKS Agents - Pydantic AI Implementation

Agentes inteligentes usando Pydantic AI para o sistema EKS.

## Agentes Disponíveis

### 1. **PLA Agent** (`pla_agent.py`)
- Classifica intenção do usuário
- Detecta profundidade de contexto (CDC D0-D4)
- Roteia para agentes especializados

### 2. **Knowledge Agent** (`knowledge_agent.py`)
- Busca no grafo de conhecimento
- Responde perguntas com citações
- Busca semântica e por grafo

### 3. **Document Agent** (`document_agent.py`)
- Gera contratos profissionais
- Cria propostas comerciais
- Produz relatórios estruturados

## Setup

### 1. Instalar dependências
```bash
cd agents
pip install -r requirements-agents.txt
```

### 2. Configurar variáveis de ambiente
```bash
# .env
OPENAI_API_KEY=your-openai-key
NEO4J_URI=neo4j+s://your-db.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

### 3. Rodar API
```bash
python agent_api.py
```

API estará disponível em: `http://localhost:8001`

## Endpoints

### PLA
- `POST /agents/pla/classify` - Classificar intenção
- `POST /agents/cdc/detect` - Detectar nível CDC

### Knowledge
- `POST /agents/knowledge/query` - Buscar conhecimento

### Document
- `POST /agents/document/generate` - Gerar documento

## Teste

```python
# Testar PLA
python pla_agent.py

# Testar Knowledge
python knowledge_agent.py

# Testar Document
python document_agent.py
```

## Integração com Backend

O backend Node.js chama os agentes via HTTP:

```typescript
// AgentRouter.ts
const response = await axios.post('http://localhost:8001/agents/knowledge/query', {
  query: "Quais são os projetos?",
  user_id: "user-123"
});
```

## CDC Levels

- **D0**: Resposta direta (500 tokens)
- **D1**: Continuidade (1500 tokens)
- **D2**: Profundidade conceitual (3000 tokens)
- **D3**: Contestação (4000 tokens)
- **D4**: Mudança de tema (2500 tokens)

## Document Types

- **contract**: Contratos legais
- **proposal**: Propostas comerciais
- **report**: Relatórios com métricas
- **analysis**: Análises técnicas
- **manual**: Manuais de procedimento
- **other**: Genérico

## Próximos Passos

1. Implementar Task Agent
2. Integrar com Neo4j para retrieval real
3. Adicionar vector search
4. Implementar team composition
5. Cache de resultados
