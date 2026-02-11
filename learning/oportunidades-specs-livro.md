# Análise de Oportunidades: Specs EKS → Livro

**Objetivo**: Mapear conteúdo das especificações do projeto EKS que pode enriquecer o livro, organizando por prioridade e capítulo-alvo.

**Critérios de prioridade**:
- 🔴 **Alta** — Conteúdo teórico denso que preenche lacunas reais no livro atual
- 🟡 **Média** — Exemplos práticos, diagramas ou detalhes que complementam o que já existe
- 🟢 **Baixa** — Detalhes implementacionais úteis como referência, mas não essenciais

---

## 🔴 PRIORIDADE ALTA — Lacunas Teóricas e Conceitos Novos

---

### 1. Trust Score: As 8 Dimensões de Confiança
**Spec**: `043-trust-score-rag/spec-pt.md`
**Capítulo-alvo**: Capítulo 12 — Camada de Confiança

**O que falta no livro**: O livro atual apresenta o conceito de trust score de forma genérica. A spec detalha **8 dimensões calibradas** que compõem o score, transformando o conceito abstrato em um framework operacional.

**Conteúdo a integrar**:
- As 8 dimensões: Source Authority, Extraction Quality, Semantic Consistency, Corroboration, Temporal Relevance, Access Control, Human Feedback, Usage Patterns
- Fórmula de cálculo como média ponderada configurável
- Fluxo de recalibração: score inicial na ingestão → recálculo diário para chunks acessados → recálculo imediato em feedback humano
- Conceito de `trust_breakdown` como JSON transparente (explicabilidade do score)
- Loop de feedback: usuário valida/corrige → atualiza trust score (aprendizado contínuo)

**Valor didático**: Transforma "confiança" de conceito filosófico em framework mensurável. Excelente para público de negócios que precisa entender como um sistema pode "quantificar" confiabilidade.

---

### 2. As 4 Classes de Memória Cognitiva
**Spec**: `017-memory-ecosystem/spec.md`
**Capítulo-alvo**: Capítulo 15 (atual: Agentes) → **Possível reestruturação para dar mais destaque**

**O que falta no livro**: O livro menciona as 4 classes de memória de forma breve dentro do capítulo de agentes. A spec traz profundidade teórica inspirada em ciência cognitiva, com o conceito de "Memory Decay Agent" e um modelo bitemporal completo.

**Conteúdo a integrar**:
- Fundamentação cognitiva: Semântica (conceitos permanentes), Episódica (eventos no tempo), Procedural (processos e how-tos), Avaliativa (lições e insights)
- Modelo bitemporal completo: `valid_from`, `valid_to` (tempo do mundo real) vs `recorded_at`, `updated_at` (tempo do sistema)
- Memory Decay Agent: agente autônomo que monitora e gerencia o envelhecimento do conhecimento
- Conceitos de Claims, Decisions e Outcomes como nós especializados que suportam contestação (D3)
- Memory Service API: interface padronizada para consumo de memória por agentes

**Valor didático**: A analogia com memória humana é extremamente poderosa para público não-técnico. Todos entendem que esquecemos coisas, que memórias procedurais (andar de bicicleta) são diferentes de memórias episódicas (o que almocei ontem).

---

### 3. Grafo de Intenção de Negócio (GIN/BIG)
**Spec**: `040-business-intent-graph/spec-pt.md`
**Capítulo-alvo**: Capítulo 20 — EKS como Infraestrutura de Decisão

**O que falta no livro**: O livro conecta OKRs a tarefas, mas não apresenta o conceito central de "ancorar TODO o conhecimento a objetivos de negócio". O GIN é a espinha dorsal estratégica do EKS.

**Conteúdo a integrar**:
- Cadeia ontológica completa: Company → Area → Project → Objective → OKR → Metric
- Conceito de que **nenhum conhecimento existe desconectado** de um objetivo — se não serve a um propósito, por que está no sistema?
- Fluxo de onboarding organizacional que mapeia a estrutura de intenção antes de qualquer ingestão
- Integração das 4 Classes de Memória com o GIN (cada memória ancorada a contexto de negócio)
- Cadeia de proveniência PROV-O integrada ao GIN
- Novos nós ontológicos: `:Objective`, `:OKR`, `:Metric`, `:Concept`, `:TimePoint`, `:Process`, `:Insight`

**Valor didático**: Este é talvez o conceito mais poderoso para público de negócios. A ideia de que o sistema **sempre** responde "por que isso importa?" conectando qualquer informação a um objetivo estratégico.

---

### 4. Context Depth Controller (CDC) — Níveis de Profundidade
**Spec**: `051-context-depth-controller/spec.md`
**Capítulo-alvo**: Capítulo 16 — Interface Cognitiva

**O que falta no livro**: O livro fala de "expansão contextual" de forma vaga. O CDC formaliza **5 níveis de profundidade** (D0-D4) que determinam quanto contexto fornecer à IA.

**Conteúdo a integrar**:
- 5 níveis: D0 (resposta direta), D1 (contexto básico), D2 (análise profunda), D3 (contestação/múltiplas perspectivas), D4 (investigação completa)
- Detecção de intenção por sinais linguísticos (como determinar automaticamente a profundidade)
- Planos de recuperação específicos por nível (quanto buscar e de onde)
- Context Pack estruturado: o "pacote" que a IA recebe antes de gerar uma resposta
- Conceito de "infraestrutura epistemológica" — o CDC como mecanismo que previne tanto sub-recuperação quanto sobre-recuperação

**Valor didático**: Analogia excelente para negócios: é como a diferença entre perguntar "qual é o preço?" (D0) e "por que perdemos aquele cliente, considerando todos os fatores?" (D4). O sistema precisa saber quanta pesquisa fazer.

---

### 5. Meta-Grafo: O Schema Que Se Conhece
**Spec**: `050-meta-graph-schema/spec.md`
**Capítulo-alvo**: Capítulo 9 — Arquitetura Conceitual

**O que falta no livro**: O livro descreve as três camadas ANSI/SPARC, mas não apresenta o conceito de que **o próprio schema pode ser representado dentro do grafo**, permitindo que agentes consultem a estrutura antes de fazer queries.

**Conteúdo a integrar**:
- Conceito de `SchemaLabel`, `SchemaRel`, `SchemaProp` como nós no grafo
- Query Profiles padronizados: `org_context`, `document_evidence`, `process_state`, `strategy_alignment`
- `CypherTemplate` como padrão reutilizável de consulta armazenado no grafo
- `AccessPolicy` como nó que controla quem pode acessar o quê (RBAC semântico)
- Implicação: agentes podem "perguntar ao grafo sobre o grafo" antes de operar

**Valor didático**: Analogia poderosa — é como se o próprio dicionário tivesse um capítulo explicando como usá-lo. O sistema é autoconsciente de sua própria estrutura.

---

### 6. Pipeline Claim → Evidence → Validation
**Spec**: `053-context-absorption-system/spec.md`
**Capítulo-alvo**: Capítulos 12 (Confiança) e 13 (Pipeline de Ingestão)

**O que falta no livro**: O pipeline de ingestão atual no livro vai direto de extração a grafo. Falta o conceito crucial de que **nada se torna fato sem validação** — toda informação entra como "Claim" (afirmação) e só vira conhecimento após evidenciação.

**Conteúdo a integrar**:
- Pipeline: Claim → Evidence → Validation (em vez de dados → grafo direto)
- Conceito de "Temporal Persona" com três camadas: Core (identidade estável), Context (papel atual), Momentary (foco do momento)
- Transformação de sinais corporativos brutos (email, Teams, calendar, documentos) em claims validadas
- Princípio: "nothing becomes a fact in the graph without proper vetting"

**Valor didático**: Extremamente relevante para negócios. A analogia é jornalística: uma informação não é publicada sem pelo menos duas fontes. O EKS aplica o mesmo rigor ao conhecimento corporativo.

---

### 7. Proveniência como Sistema Completo (PROV-O)
**Spec**: `014-provenance-system/spec.md`
**Capítulo-alvo**: Capítulo 12 — Camada de Confiança

**O que falta no livro**: A proveniência é mencionada, mas sem detalhar o fluxo completo de rastreabilidade. A spec traz um modelo onde CADA resposta gerada pela IA tem fontes rastreáveis e navegáveis.

**Conteúdo a integrar**:
- Modelo: `:Answer` → `[:USED_SOURCE]` → `:Knowledge|:Document|:Chunk` (com peso e snippet)
- `:ExternalSource` para fontes externas com `reliabilityScore`
- Fluxo completo: pergunta → recuperação → ranking → montagem de proveniência → resposta com fontes
- UI de proveniência: seção "Fontes" clicável que leva ao nó original no grafo
- Auditoria: capacidade de reconstruir, a qualquer momento, as fontes de qualquer resposta

**Valor didático**: Para público de negócios, isto é compliance e auditabilidade. "Quando o CEO pergunta 'de onde veio essa informação?', o sistema responde com fontes rastreáveis."

---

## 🟡 PRIORIDADE MÉDIA — Enriquecimento e Exemplos Práticos

---

### 8. Personal Lead Agent (PLA) — De Router a Orquestrador Inteligente
**Spec**: `005-agent-router/spec.md` + `architecture/agent-personal-architecture.md`
**Capítulo-alvo**: Capítulo 15 — Agentes Orientados por Ontologia

**O que pode enriquecer**: O livro menciona o "Personal Lead Agent" mas não detalha a evolução de um simples roteador para um orquestrador que:
- Carrega o perfil do usuário + objetivos (do GIN)
- Planeja estratégia de execução (single agent, equipe, pesquisa)
- Consulta um "Agent Directory Graph" com metadados ricos sobre cada agente
- Aprende com feedback e resultados

**Valor**: Mostra que um agente pessoal não é um chatbot — é um orquestrador sofisticado que conhece o usuário.

---

### 9. Curadoria Ontológica: O Humano no Loop
**Spec**: `052-ontological-curator-interface/spec.md`
**Capítulo-alvo**: Capítulo 17 — Ontologia como Ativo Estratégico

**O que pode enriquecer**: A spec detalha o papel do **Curador Ontológico** como distinto de admin ou agente IA. É alguém que "navega visualmente o grafo como instrumento cognitivo" para detectar lacunas, anomalias e antipadrões.

**Conteúdo a integrar**:
- Diferença entre Admin, Curador e Agente IA
- Exploração visual do grafo como "instrumento cognitivo"
- Cenários de uso: detecção de nós desconectados, clusters suspeitos, relações redundantes
- Colaboração agente-curador: agente sugere, curador decide
- Tracking de ações de curadoria como nós no grafo (auditabilidade)

---

### 10. Ecossistema de Curadoria do Grafo (4 etapas)
**Spec**: `012-graph-curation-ecosystem/spec.md`
**Capítulo-alvo**: Capítulo 17 — Ontologia como Ativo Estratégico

**O que pode enriquecer**: O livro trata governança como RFC e comitê. A spec traz um pipeline de 4 etapas para curadoria:
1. Curador de Entrada (recebe e categoriza)
2. Validador de Qualidade (completude e relevância)
3. Organizador de Estrutura (nodes e edges)
4. Gestor de Aprovação (quando necessário)

**Conteúdo a integrar**:
- Staging Graph (pré-produção) vs Main Graph — nada vai direto para produção
- Audit Trail automático
- Políticas configuráveis por organização, projeto e tipo de dado

---

### 11. Memory Steward — O "Sistema Imunológico" do Grafo
**Spec**: `042-memory-steward/spec-pt.md`
**Capítulo-alvo**: Capítulos 17 (Governança) e 18 (Métricas)

**O que pode enriquecer**: Agente autônomo que atua como "sistema imunológico" do EKS:
- Monitora continuamente qualidade, completude e consistência
- Resolve conflitos automaticamente (quando possível)
- Valida proveniência
- Análise de cobertura
- Higienização: remoção de duplicatas, nós órfãos, relações inconsistentes
- Propostas de curadoria com Human-in-the-Loop

**Valor**: Analogia perfeita com biologia — assim como o corpo tem um sistema imunológico para proteger contra infecções, o EKS tem o Memory Steward para proteger contra conhecimento "doente".

---

### 12. Hierarchical Brainstorm — Graph-of-Thought
**Spec**: `045-hierarchical-brainstorm/spec-pt.md`
**Capítulo-alvo**: Capítulo 22 — Sistemas Multiagentes Corporativos

**O que pode enriquecer**: O livro fala de orquestração de agentes, mas não apresenta o conceito de **hierarquia de agentes** com níveis (User-Proxy, Master, Strategic, Tactical, Managerial, Operational) e brainstorm baseado em grafo.

**Conteúdo a integrar**:
- 6 níveis hierárquicos com escopos definidos
- Graph-of-thought: conversa não-linear onde agentes podem requisitar input de outros
- Master Agent como sintetizador que resolve conflitos entre níveis
- DAG (Directed Acyclic Graph) como plano de brainstorm
- Log de `ConversationGraph` e `AgentActivation` no grafo

**Valor**: Analogia empresarial natural — é como um comitê executivo onde o CEO (Master) pede input do CFO (Strategic), do gerente de operações (Operational), etc., e sintetiza tudo.

---

### 13. Retrieval Orchestrator — Como o Conhecimento é Buscado
**Spec**: `024-retrieval-orchestration/spec.md`
**Capítulo-alvo**: Capítulo 16 — Interface Cognitiva

**O que pode enriquecer**: O livro fala de "pergunta → expansão → inferência" mas sem detalhar o motor de busca. A spec traz:
- Pre-Query: entendimento de intenção antes da busca
- Estratégias nomeadas: `semantic_only`, `graph_only`, `hybrid`
- Integração com Meta-Grafo (Query Profiles) e CDC (níveis de profundidade)
- Context Bundle estruturado: `context_items`, `retrieval_summary`, `strategies_used`, `tokens_estimated`
- Limites configuráveis: `max_nodes_scanned`, `max_results`, `max_depth`

---

### 14. Onboarding e Persona Knowledge Profile (PKP)
**Spec**: `022-onboarding-ai-profile/spec.md`
**Capítulo-alvo**: Capítulo 15 — Agentes Orientados por Ontologia

**O que pode enriquecer**: O livro menciona personalização mas não detalha como o sistema constrói e evolui o perfil do usuário.

**Conteúdo a integrar**:
- 6 perguntas iniciais (<2 min de onboarding)
- Progressive Profiling: extração contínua de background (LinkedIn, interações, documentos)
- Provenance Tracking por claim (cada informação sobre o usuário tem fonte e confiança)
- Curator Agent que propõe atualizações + usuário aprova/rejeita
- Versionamento imutável (PKP v1, v2, ...) com rollback
- Level 2: Aprofundamento Estratégico — mapeamento de ontologias estratégica, processual e decisória
- Conceito de "User as Semantic Sensor" — usuários contribuem suas percepções com confiança e perspectiva

---

### 15. Interaction & Delegation Graph (GID) — Estrutura Organizacional Viva
**Spec**: `041-interaction-delegation-graph/spec-pt.md`
**Capítulo-alvo**: Capítulo 10 — Núcleo Relacional do Knowledge Graph

**O que pode enriquecer**: O livro fala de "quem faz o quê" no núcleo relacional, mas o GID vai além:
- Captura **quem fez o quê, delegou a quem, com que handoff**
- Mapa dinâmico de workflow real (vs organograma formal)
- Revela a rede organizacional real vs hierarquia oficial
- Conceito de "Process Intelligence" baseado em interações reais

---

### 16. Produto/Serviço como "Núcleo de Valor"
**Spec**: `058-product-customer-ontology/spec.md`
**Capítulo-alvo**: Capítulo 21 — Produtos e Serviços no Grafo

**O que pode enriquecer**: A spec modela produto como entidade que conecta:
- Objetivos estratégicos → Capabilities → Produtos → Contratos → Clientes → Feedback
- Queries poderosas: "Quais capabilities sustentam o produto X?" / "Qual o caminho de um objetivo estratégico até a satisfação do cliente?"
- Conceito de EKS como "sistema operacional de negócio"

---

### 17. Process Intelligence & Analysis (PIA)
**Spec**: `046-pia-process-intelligence/spec-pt.md`
**Capítulo-alvo**: Capítulo 20 — EKS como Infraestrutura de Decisão

**O que pode enriquecer**: Equipe de agentes IA (Collector, Analyst, Monitor) que:
- Guia mapeamento colaborativo de processos (macro → micro)
- Cria "mapa vivo" da empresa
- Verifica coerência entre processos declarados e executados
- Extrai regras de negócio automaticamente
- Gamificação para motivar contribuições

---

## 🟢 PRIORIDADE BAIXA — Detalhes Implementacionais e Referência

---

### 18. Spec-Driven Simulation
**Spec**: `044-spec-driven-simulation/spec-pt.md`
**Capítulo-alvo**: Capítulo 24 — Roadmap de Maturidade (ou Apêndice)

**O que pode ser mencionado**: Metodologia inovadora que inverte o fluxo tradicional de desenvolvimento:
- Em vez de Spec → Code → Build → Test
- Propõe: Simulation (Human + AI) → Auto-generate Spec → Auto-generate Tests → Auto-generate Code
- Conceito de sandbox Neo4j para experimentação
- Auto-geração de artefatos a partir de decisões de modelagem

**Valor**: Pode ser mencionado como abordagem futura de desenvolvimento de EKS — "em vez de especificar tudo antes, simulamos o grafo com IA e depois geramos os artefatos".

---

### 19. Strategic Feedback System
**Spec**: `055-strategic-feedback-system/spec.md`
**Capítulo-alvo**: Capítulo 20 — EKS como Infraestrutura de Decisão

**O que pode ser mencionado**: Sistema que transforma usuários em "sensores estratégicos":
- Feedback não é reporte de erro, é sinal para evolução organizacional
- Sistema classifica feedback, detecta sinergias com objetivos estratégicos
- Rastreia gênese de iniciativas e projetos a partir de feedback inicial
- Conexão com "Strategic Macroareas"

---

### 20. TopicBlock como Unidade de Recuperação
**Spec**: `057-topic-block-retrieval/spec.md`
**Capítulo-alvo**: Capítulo 13 — Pipeline de Ingestão

**O que pode ser mencionado**: Conceito de "ontologia orientada a recuperação" — a estrutura deve ser desenhada para responder perguntas específicas.
- TopicBlock: segmento semântico com `topic_label`, `scope`, `intent_type`, `entities_mentioned`
- Princípio: "a ontologia deve ser desenhada para facilitar a recuperação, não apenas para representar o domínio"

---

### 21. Cognitive Design System (DSC)
**Spec**: `056-cognitive-design-system/spec.md`
**Capítulo-alvo**: Capítulo 16 — Interface Cognitiva

**O que pode ser mencionado**: O front-end como "superfície de exposição cognitiva" (não interface de dados):
- 4 camadas: Panorama → Contexto → Causalidade → Evidência
- Pergunta implícita: "O que é relevante agora, neste nível de atenção?"
- Diferença entre Wiki/Dashboard/Portal vs Hub de estados cognitivos
- "Cards sintéticos" (5 segundos de leitura) vs listas longas

---

### 22. Executive Cockpit & Relevância Contextual
**Spec**: `059-executive-cockpit-contextual-relevance.md`
**Capítulo-alvo**: Capítulo 20 — EKS como Infraestrutura de Decisão

**O que pode ser mencionado**: Como decisões, riscos, insights e tarefas são filtrados para executivos baseado em:
- Role, hierarquia, departamento, projetos
- Queries Cypher prontas para cenários reais de filtragem

---

### 23. Incentivo por Ressonância (vs Gamificação Clássica)
**Spec**: `020-gamification-user-kpis/spec.md`
**Capítulo-alvo**: Capítulo 23 — EKS como Memória Organizacional

**O que pode ser mencionado**: Modelo alternativo à gamificação clássica:
- Em vez de pontos e rankings → impacto estrutural visível
- Em vez de competição → colaboração orgânica
- Em vez de recompensas extrínsecas → reconhecimento semântico
- Notificações semânticas quando algo relacionado ao domínio do usuário acontece

---

### 24. Neo4j Graph Data Model Consolidado
**Spec**: `015-neo4j-graph-model/spec.md`
**Capítulo-alvo**: Apêndice D — Modelo de Schema para Início Rápido

**O que pode ser referência**: Visão macro consolidada de todos os nós e relações do grafo EKS, com diagrama Mermaid business-level. Excelente para o apêndice de referência rápida.

---

### 25. Observability Dashboard
**Spec**: `018-observability-dashboard/spec.md`
**Capítulo-alvo**: Capítulo 18 — Métricas Estruturais

**O que pode ser referência**: Métricas de saúde, performance e uso do EKS que complementam as métricas ontológicas já descritas no livro.

---

## 📊 MATRIZ DE IMPACTO

| # | Oportunidade | Prioridade | Capítulo(s) | Impacto Didático |
|---|-------------|-----------|-------------|------------------|
| 1 | Trust Score 8 Dimensões | 🔴 Alta | 12 | ⭐⭐⭐⭐⭐ |
| 2 | 4 Classes de Memória | 🔴 Alta | 15 (reestruturar) | ⭐⭐⭐⭐⭐ |
| 3 | Grafo de Intenção (GIN) | 🔴 Alta | 20 | ⭐⭐⭐⭐⭐ |
| 4 | Context Depth Controller | 🔴 Alta | 16 | ⭐⭐⭐⭐⭐ |
| 5 | Meta-Grafo | 🔴 Alta | 9 | ⭐⭐⭐⭐ |
| 6 | Claim → Evidence → Validation | 🔴 Alta | 12, 13 | ⭐⭐⭐⭐⭐ |
| 7 | Proveniência PROV-O | 🔴 Alta | 12 | ⭐⭐⭐⭐ |
| 8 | Personal Lead Agent | 🟡 Média | 15 | ⭐⭐⭐⭐ |
| 9 | Curadoria Ontológica | 🟡 Média | 17 | ⭐⭐⭐⭐ |
| 10 | Ecossistema de Curadoria | 🟡 Média | 17 | ⭐⭐⭐ |
| 11 | Memory Steward | 🟡 Média | 17, 18 | ⭐⭐⭐⭐ |
| 12 | Hierarchical Brainstorm | 🟡 Média | 22 | ⭐⭐⭐⭐ |
| 13 | Retrieval Orchestrator | 🟡 Média | 16 | ⭐⭐⭐ |
| 14 | PKP / Onboarding | 🟡 Média | 15 | ⭐⭐⭐ |
| 15 | Interaction & Delegation | 🟡 Média | 10 | ⭐⭐⭐ |
| 16 | Produto como Núcleo de Valor | 🟡 Média | 21 | ⭐⭐⭐ |
| 17 | Process Intelligence (PIA) | 🟡 Média | 20 | ⭐⭐⭐ |
| 18 | Spec-Driven Simulation | 🟢 Baixa | 24 / Apêndice | ⭐⭐ |
| 19 | Strategic Feedback System | 🟢 Baixa | 20 | ⭐⭐ |
| 20 | TopicBlock Retrieval | 🟢 Baixa | 13 | ⭐⭐ |
| 21 | Cognitive Design System | 🟢 Baixa | 16 | ⭐⭐⭐ |
| 22 | Executive Cockpit | 🟢 Baixa | 20 | ⭐⭐ |
| 23 | Ressonância vs Gamificação | 🟢 Baixa | 23 | ⭐⭐ |
| 24 | Neo4j Model Consolidado | 🟢 Baixa | Apêndice D | ⭐⭐ |
| 25 | Observability Dashboard | 🟢 Baixa | 18 | ⭐⭐ |

---

## 🎯 RECOMENDAÇÃO DE SEQUÊNCIA DE INTEGRAÇÃO

### Fase 1 — Enriquecimento Conceitual (Prioridade Alta)
Integrar as 7 oportunidades de prioridade alta, que preenchem lacunas teóricas reais:
1. **#6** Claim → Evidence → Validation (Cap. 12 + 13) — muda a forma como o pipeline é apresentado
2. **#1** Trust Score 8 Dimensões (Cap. 12) — aprofunda o capítulo de confiança
3. **#7** Proveniência PROV-O (Cap. 12) — completa a camada de confiança
4. **#3** GIN (Cap. 20) — transforma o capítulo de decisão
5. **#2** 4 Classes de Memória (Cap. 15) — pode justificar criar uma seção dedicada
6. **#4** CDC (Cap. 16) — aprofunda a interface cognitiva
7. **#5** Meta-Grafo (Cap. 9) — enriquece a arquitetura

### Fase 2 — Exemplos e Detalhamento (Prioridade Média)
Integrar exemplos práticos e conceitos complementares das 10 oportunidades médias.

### Fase 3 — Referências e Menções (Prioridade Baixa)
Mencionar brevemente ou incluir em apêndices as 8 oportunidades de baixa prioridade.

---

## 📝 NOTAS IMPORTANTES

1. **Não alterar estrutura do livro neste momento** — as integrações devem enriquecer capítulos existentes, não criar novos (exceto se houver uma razão muito forte, como as 4 Classes de Memória).

2. **Manter tom acessível** — todo conteúdo das specs é técnico. A integração deve manter analogias, contexto de negócio e explicações em linguagem plana.

3. **Priorizar conceitos, não implementação** — as specs têm muito detalhe de implementação (endpoints, JSON schemas, etc.) que NÃO deve ir para o livro. O livro deve explicar o "porquê" e o "o quê", não o "como implementar".

4. **Usar diagramas Mermaid das specs** — várias specs já têm diagramas Mermaid excelentes que podem ser adaptados para o livro (simplificando quando necessário).

5. **Evitar dependência de specs instáveis** — algumas specs estão marcadas como "Draft" e podem mudar. Focar nos conceitos que são estáveis independentemente da implementação final.

