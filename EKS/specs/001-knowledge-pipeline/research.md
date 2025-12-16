# Research Notes: Knowledge Pipeline

## Decisions & Rationale

### Docling Integration
- **Decision**: Usar Docling como serviço externo HTTP, chamado pelo Backend API.
- **Rationale**: Mantém acoplamento fraco, permite escalar parsing de documentos separadamente e facilita atualização de versão.
- **Alternatives**:
  - Integrar Docling como biblioteca direta em Node/Python → rejeitado por limitar linguagem e empacotamento.

### Backend Framework (Node.js)
- **Decision**: Usar framework estruturado (NestJS) para o backend.
- **Rationale**: Módulos claros (API, serviços, integrações), DI, testes mais simples.
- **Alternatives**:
  - Express puro → mais simples, porém com maior risco de virar "spaghetti" em projeto de longo prazo.

### Armazenamento de Arquivos Brutos
- **Decision**: Usar Blob Storage (Azure Blob) para arquivos originais, armazenando apenas referência em Neo4j.
- **Rationale**: Neo4j não é otimizado para binários; mantemos grafo focado em metadados e conteúdo textual.
- **Alternatives**:
  - Guardar tudo em Neo4j → rejeitado por custo/performance.

### Embeddings (Azure OpenAI)
- **Decision**: Centralizar geração de embeddings no Storage Agent, sempre após persitência no grafo.
- **Rationale**: Garante consistência entre grafo e vetor; evita embutir lógica de embeddings em múltiplos lugares.
- **Alternatives**:
  - Gerar embeddings antes de gravar no grafo → risco de orphan vectors.

## Open Questions (NEEDS CLARIFICATION)

1. **Hospedagem dos serviços**
   - Orquestração de deployment (Kubernetes? App Service? outro?)
   - Estratégia de logging centralizado e observabilidade.

2. **Formato exato dos contratos entre Backend e Agno**
   - HTTP vs gRPC vs mensagens internas.
   - Autenticação entre serviços.

3. **Estratégia de retries e dead-letter** para falhas em Docling ou embeddings.

4. **Políticas de retenção e custo**
   - Limites de tamanho/quantidade de documentos por usuário.
   - Estratégias de archive para conhecimento muito antigo.
