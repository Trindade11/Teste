# Especificação de Feature: EKS Learning Meta-View & Portal (Interface de Autoconsciência)

**Feature Branch**: `061-eks-learning-metaview`
**Criado**: 2026-02-27
**Status**: Draft
**Prioridade**: P1 (Educational & Audit)
**Fonte**: Solicitação do Usuário (Learning Book Integration) + Capacidades de Introspecção Existentes

## Contexto & Propósito

O **EKS Learning Meta-View** não é apenas um dashboard; é um **Portal de Aprendizado** isolado que serve como "gêmeo educacional" do sistema. Ele permite que usuários externos (leitores do livro) e internos (colaboradores em onboarding) aprendam sobre Engenharia Ontológica interagindo com a estrutura viva do próprio EKS.

O propósito se expandiu para três pilares:
1.  **Learning Portal (Leitura Interativa)**: Uma interface dedicada para ler o livro "Ontology Engineering", com chat contextual para dúvidas e anotações.
2.  **Laboratório Vivo (Meta-View)**: Visualização prática dos conceitos teóricos (ex: ler sobre "Objetivos" e ver o grafo de Objetivos renderizado).
3.  **Experiência Híbrida (Phygital)**: Suporte para leitores do livro físico (papel) acessarem o conteúdo digital via QR Codes/Deep Links.

---

## Fluxo de Processo (Visão de Experiência)

```mermaid
flowchart TD
    subgraph "Mundo Físico"
        PhysicalBook[Livro em Papel]
        UserPhysical[Leitor com Livro Físico]
        UserPhysical -->|Lê e Anota| PhysicalBook
        UserPhysical -->|Escaneia QR Code| LearningPortal
    end

    subgraph "Mundo Digital"
        UserDigital[Leitor Online]
        UserDigital -->|Acessa URL| LearningPortal
    end

    subgraph "EKS Learning Portal (Interface Isolada)"
        ReaderUI[Leitor Imersivo]
        ContextChat[Chat/Tutor Ontológico]
        MetaViewLab[Laboratório de Grafos]
    end

    ReaderUI -->|Dúvida no Texto| ContextChat
    ReaderUI -->|Ver Exemplo| MetaViewLab
    ContextChat -->|Consulta Conceito| OntologyAPI
    MetaViewLab -->|Renderiza| MetaGraph

    OntologyAPI[Ontology API (Read-Only/Anonimizado)]
    OntologyAPI --> MetaGraph[Neo4j: Meta-Grafo]
    OntologyAPI --> DataGraph[Neo4j: Dados Reais]
```

### Insights do Fluxo

**Inovações**:
- **Leitura Ativa**: O usuário não apenas lê; ele pergunta ao livro. "Não entendi esse conceito de Bitemporalidade" -> O chat explica usando exemplos do próprio grafo.
- **Continuidade Físico-Digital**: O livro físico possui QR Codes em pontos chave (ex: "Escaneie para ver a ontologia de Objetivos viva") que abrem o Meta-View no celular/desktop.
- **Anotações Persistentes**: Na versão digital, o usuário faz anotações à margem que se tornam parte do seu "Grafo de Aprendizado" pessoal.

---

## Cenários de Usuário

### User Story 1 - O Leitor Híbrido
Estou lendo o livro físico no sofá. Chego no capítulo sobre "Classes de Memória". O texto é denso.
1. Vejo um QR Code na margem: "Ver distribuição de memórias em tempo real".
2. Escaneio com o celular.
3. Abre o **EKS Learning Portal** (sem login complexo, talvez token no QR) mostrando o gráfico de distribuição (Semântica vs Episódica) da organização atual.
4. Entendo o conceito visualmente e volto para o papel.

### User Story 2 - O Estudante Online (Leitura Interativa)
Estou lendo a versão web no desktop.
1. Seleciono um parágrafo sobre "Inferência Lógica".
2. Clico em "Tirar Dúvida".
3. Um painel lateral se abre (Context Chat). O agente já sabe qual parágrafo li.
4. Pergunto: "Como isso se aplica aos OKRs?".
5. O agente responde citando a regra lógica real do sistema (`OKR -> MEASURED_BY -> Metric`) e mostra um mini-grafo dessa regra.

### User Story 3 - A "Outra Instância" (Visão para Fora)
Sou um usuário externo convidado (ou aluno).
1. Acesso `learning.eks.ai` (ou rota específica).
2. Não vejo dados confidenciais da empresa, nem menus operacionais (Tasks, Agenda).
3. Vejo apenas o conteúdo do livro e a **Estrutura Ontológica** (Schema).
4. Os exemplos de dados são anonimizados (ex: "Cliente X" em vez de "Coca-Cola") ou são dados sintéticos de demonstração gerados pelo sistema.

---

## Requisitos Funcionais

### Interface Learning Portal (Frontend)

- **REQ-MV-001**: O sistema DEVE fornecer uma interface de leitura limpa (tipo Medium/Kindle), focada no texto do livro (`learning/livro.md`).
- **REQ-MV-002**: Painel lateral "Context Tools" contendo:
    - **Chat**: Para perguntas sobre o conteúdo.
    - **Notebook**: Para anotações do usuário (persistidas se logado).
    - **Graph Lens**: Visualização do conceito atual no grafo.
- **REQ-MV-003**: Suporte a Deep Links via URL (`/learning/chapter/3?focus=logic`) para uso em QR Codes.

### Segurança e Isolamento

- **REQ-MV-004**: A Learning View DEVE ser logicamente separada da Operational View.
- **REQ-MV-005**: **Firewall de Dados**: Queries vindas do Learning Portal NUNCA devem retornar propriedades sensíveis (PII, valores financeiros) a menos que o usuário tenha role `Employee`.
- **REQ-MV-006**: **Anonimização On-the-Fly**: Middleware que substitui nomes próprios e valores sensíveis por placeholders em tempo de execução para usuários externos.

### Agente Tutor (Backend)

- **REQ-MV-007**: Agente especializado em "Ontology Engineering" que tem acesso ao texto do livro E ao Meta-Grafo.
- **REQ-MV-008**: O agente deve ser capaz de gerar queries Cypher de exemplo baseadas na dúvida do usuário.

---

## Estrutura de URLs (Proposta)

- `/learning`: Home do Portal (Capa do Livro, Progresso).
- `/learning/read/{chapter_slug}`: Interface de leitura imersiva.
- `/learning/lab/{concept_id}`: Visualizador isolado do grafo (Meta-View).
- `/learning/chat`: Interface focada apenas em Q&A com o Tutor.

---

## Dependências

- **Spec 050 (Meta-Graph)**: Fonte da verdade para o "Laboratório".
- **Conteúdo**: `learning/livro.md` (deve ser parseado para estrutura navegável).
- **LLM RAG**: Precisa indexar o livro para o Chat Contextual.


---

## Plano de Implementação (Draft)

1. **Fase 1 (Backend)**: Enriquecer `/ontology/stats` com métricas de saúde e criar endpoint de mapeamento Livro-Grafo.
2. **Fase 2 (Frontend)**: Criar componente `MetaGraphVisualizer` usando biblioteca de grafos (ex: `react-force-graph` ou `cytoscape`).
3. **Fase 3 (Integração)**: Adicionar links no Markdown do livro e criar a rota `/learning/view` no frontend.
