# Quickstart: Knowledge Pipeline

## Objetivo
Configurar um ambiente mínimo de desenvolvimento para testar o fluxo de ingestão de conhecimento (chat + upload de documentos) até Neo4j + embeddings.

## Pré-requisitos
- Node.js 20+
- Python 3.11+
- Neo4j Aura (instância e credenciais válidas)
- Azure OpenAI (endpoint e API key)
- Serviço Docling acessível (HTTP) ou contêiner local

## Passos Básicos

1. **Configurar variáveis de ambiente**
   - Preencher `.env` do backend com:
     - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
     - `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`
     - `BLOB_STORAGE_CONNECTION_STRING`

2. **Subir Neo4j e Docling (dev)**
   - Garantir conexão com Neo4j Aura.
   - Subir o serviço Docling (docker ou serviço remoto).

3. **Rodar Backend**
   - `cd backend`
   - `npm install`
   - `npm run dev`

4. **Rodar Agents (Agno)**
   - `cd agents/knowledge_pipeline`
   - `pip install -r requirements.txt`
   - `python orchestrator.py` (modo dev)

5. **Testar Ingestão de Documento**
   - Via frontend (upload) ou via `curl`:
   ```bash
   curl -X POST http://localhost:3000/api/knowledge/ingest \
     -F "file=@example.pdf" \
     -F "source=upload"
   ```
   - Verificar logs de Docling, agentes e escrita em Neo4j.

6. **Confirmar Persistência**
   - Responder à pergunta Corp/Pessoal no frontend.
   - Checar no Neo4j se o `KnowledgeNode` foi criado com metadados corretos.
