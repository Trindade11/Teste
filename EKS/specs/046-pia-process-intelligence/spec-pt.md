# Especificação de Feature: PIA (Inteligência & Análise de Processos)

**Feature Branch**: `046-pia-process-intelligence`  
**Criado**: 2025-12-29  
**Status**: Draft  
**Prioridade**: P1 (Strategic)  
**Fonte**: Insights dos chats (chat005) + visão de Gêmeo Digital Organizacional

## Contexto & Propósito

**PIA (Process Intelligence & Analysis - Inteligência & Análise de Processos)** é um time de agentes IA que guia colaboradores no mapeamento de processos organizacionais do macro ao micro, criando o **"mapa vivo da empresa"**. PIA transforma conhecimento organizacional implícito em um gêmeo digital explícito e continuamente atualizado.

PIA possibilita:
- **Mapeamento Colaborativo de Processos** - Todo funcionário contribui com sua visão de como o trabalho flui
- **Descoberta Macro-para-Micro** - Começar com visão da empresa, descer para atividades individuais
- **Verificação de Coerência** - Detectar gaps, gargalos e inconsistências automaticamente
- **Extração de Regras de Negócio** - Identificar regras implícitas governando workflows
- **Monitoramento Contínuo** - Rastrear execução real vs processos documentados
- **Gamificação** - Motivar funcionários a documentar e melhorar processos

O time PIA consiste de:
1. **Agente Coletor** - Guia usuários através de workflow estruturado de mapeamento
2. **Agente Analista/Curador** - Verifica coerência, extrai regras de negócio, valida handoffs
3. **Agente Monitor** - Rastreia execução de processos, detecta desvios, sugere melhorias

---

## Fluxo de Processo (Visão de Negócio)

```mermaid
flowchart TD
    UserStarts[Colaborador Inicia Mapeamento] --> Collector[PIA Coletor:<br/>Questionário Guiado]
    
    Collector --> MacroLevel[Nível Macro:<br/>Empresa → Áreas → Processos]
    MacroLevel --> MicroLevel[Nível Micro:<br/>Processo → Atividades → Handoffs]
    
    MicroLevel --> CaptureDet[Capturar Detalhes:<br/>Inputs, Outputs, Regras, Timing]
    
    CaptureDet --> Analyst[PIA Analista:<br/>Analisar Submissão]
    
    Analyst --> CheckCoherence[Verificar Coerência]
    CheckCoherence --> ValidHandoffs{Handoffs Válidos?}
    
    ValidHandoffs -->|Gaps Encontrados| NotifyGaps[Notificar Usuário de Gaps]
    NotifyGaps --> RequestClarification[Solicitar Clarificação]
    RequestClarification --> Collector
    
    ValidHandoffs -->|Coerente| ExtractRules[Extrair Regras de Negócio]
    ExtractRules --> ConfidenceScore[Atribuir Scores de Confiança]
    
    ConfidenceScore --> StoreIDG[Armazenar no GID<br/>Grafo de Interação & Delegação]
    StoreIDG --> UpdateGamification[Atualizar Score de Gamificação]
    
    UpdateGamification --> Monitor[PIA Monitor:<br/>Monitoramento Contínuo]
    
    Monitor --> PeriodicAudit[Auditoria Periódica de Processos]
    PeriodicAudit --> DetectBottlenecks[Detectar Gargalos]
    PeriodicAudit --> DetectDeviations[Detectar Desvios]
    PeriodicAudit --> IdentifyImprovements[Identificar Oportunidades de Melhoria]
    
    DetectBottlenecks --> AlertManager[Alertar Gestor]
    DetectDeviations --> AlertManager
    IdentifyImprovements --> SuggestChanges[Sugerir Mudanças de Processo]
    
    SuggestChanges --> HumanReview[Humano Revisa Sugestões]
    HumanReview -->|Aprovar| UpdateProcess[Atualizar Definição de Processo]
    HumanReview -->|Rejeitar| LogFeedback[Registrar Feedback]
    
    UpdateProcess --> StoreIDG
    LogFeedback --> Monitor
    
    classDef user fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef collector fill:#fff3e0,stroke:#ff9800,color:#000
    classDef analyst fill:#e8f5e9,stroke:#4caf50,color:#000
    classDef monitor fill:#fce4ec,stroke:#e91e63,color:#000
    
    class UserStarts,RequestClarification,HumanReview user
    class Collector,MacroLevel,MicroLevel,CaptureDet collector
    class Analyst,CheckCoherence,ValidHandoffs,NotifyGaps,ExtractRules,ConfidenceScore,StoreIDG,UpdateGamification analyst
    class Monitor,PeriodicAudit,DetectBottlenecks,DetectDeviations,IdentifyImprovements,AlertManager,SuggestChanges,UpdateProcess,LogFeedback monitor
```

### Insights do Fluxo

**Gaps identificados**:
- Como lidar com processos que abrangem múltiplas áreas? (workflows cross-funcionais)
- Como resolver descrições de processo conflitantes de diferentes usuários? (mecanismo de consenso)
- Como balancear detalhe vs usabilidade? (muito detalhe sobrecarrega)
- Como manter mapas de processo conforme organização evolui? (gestão de mudança)

**Oportunidades identificadas**:
- Auto-gerar documentação de processo de workflows mapeados
- Detectar "processos sombra" (workflows reais vs documentados)
- Identificar campeões de processo (usuários que mapeiam com mais acurácia)
- Sugerir oportunidades de padronização de processos
- Gerar materiais de treinamento de mapas de processo
- Habilitar simulação de processos (cenários what-if)
- Criar diagramas BPMN automaticamente de dados GID

**Riscos identificados**:
- Fadiga do usuário: Mapeamento consome tempo
- Cobertura incompleta: Nem todos processos mapeados
- Acurácia: Usuários podem descrever processos idealizados vs reais
- Carga de manutenção: Manter mapas atualizados requer esforço contínuo

---

## Colaboração de Agentes

```mermaid
sequenceDiagram
    participant User as Colaborador
    participant Collector as Agente PIA Coletor
    participant Analyst as Agente PIA Analista
    participant Monitor as Agente PIA Monitor
    participant Neo4j
    participant Notification as Notificação
    participant Gamification as Gamificação
    
    User->>Collector: "Quero mapear meu processo"
    Collector->>Neo4j: Carregar perfil do usuário (cargo, área)
    Neo4j-->>Collector: Contexto do usuário
    Collector->>Collector: Gerar questionário personalizado
    Collector->>User: "Vamos começar. Qual é sua área principal?"
    User->>Collector: "Vendas"
    
    Collector->>User: "Que processos você gerencia em Vendas?"
    User->>Collector: "Qualificação de leads, Criação de proposta, Negociação de contrato"
    
    Collector->>User: "Vamos detalhar 'Qualificação de leads'. Quais são os passos?"
    User->>Collector: "1) Receber lead do marketing, 2) Pesquisar empresa, 3) Ligação inicial, 4) Pontuar lead, 5) Passar para Executivo de Conta ou descartar"
    
    Collector->>User: "De quem você recebe leads?"
    User->>Collector: "Time de marketing (Maria)"
    
    Collector->>User: "Para quem você passa leads qualificados?"
    User->>Collector: "Executivo de Conta (João)"
    
    Collector->>Analyst: Validar mapeamento
    Analyst->>Neo4j: Verificar se Maria (Marketing) existe
    Analyst->>Neo4j: Verificar se João (AE) existe
    Neo4j-->>Analyst: Ambos existem
    Analyst->>Analyst: Verificar coerência de handoff
    Analyst->>Analyst: Extrair regra de negócio: "Lead score >70 = qualificado"
    Analyst->>Neo4j: CREATE processo + atividades + handoffs
    Analyst->>Neo4j: CREATE regra de negócio com confidence 0.8
    
    Analyst->>Gamification: Conceder pontos ao usuário
    Gamification->>User: "🎉 +50 pontos! Processo mapeado com sucesso"
    
    Note over Monitor: Monitoramento contínuo inicia
    
    Monitor->>Neo4j: Query periódica: handoffs reais vs mapeados
    Neo4j-->>Monitor: Desvio detectado: João recebe leads com score <70
    Monitor->>Analyst: Analisar desvio
    Analyst->>Analyst: Possível violação de regra ou regra desatualizada
    Monitor->>Notification: Alertar gestor + usuário
    Notification->>User: "Desvio detectado no processo de Qualificação de Lead"
```

---

## Cenários de Usuário & Testes

### User Story 1 - Mapeamento de Processo Guiado (Prioridade: P0)

Como colaborador, quero que PIA me guie através do mapeamento dos meus processos passo-a-passo para que eu possa contribuir sem precisar de expertise em mapeamento de processos.

**Por que esta prioridade**: Fundação para PIA. Sem mapeamento guiado, adoção falha.

**Teste Independente**: Usuário inicia mapeamento, verificar que Coletor fornece perguntas estruturadas.

**Cenários de Aceitação**:

1. **Dado** usuário inicia mapeamento de processo, **Quando** Coletor carrega perfil do usuário, **Então** gera questionário personalizado baseado no cargo do usuário (ex: rep de vendas recebe perguntas focadas em vendas)

2. **Dado** usuário responde pergunta macro "Que processos você gerencia?", **Quando** Coletor recebe resposta, **Então** faz perguntas micro para cada processo: "Quais são os passos em [processo]?"

3. **Dado** usuário descreve passos, **Quando** Coletor detecta palavras-chave de handoff ("passar para", "enviar para", "delegar"), **Então** faz perguntas clarificadoras: "Para quem especificamente você passa isso?"

4. **Dado** usuário completa mapeamento, **Quando** Coletor finaliza, **Então** mostra sumário: "Você mapeou 3 processos, 12 atividades, 5 handoffs. Revisar antes de submeter?"

---

### User Story 2 - Verificação de Coerência de Handoff (Prioridade: P0)

Como PIA Analista, quero validar que handoffs são coerentes (output do remetente corresponde ao input do receptor) para que mapas de processo sejam precisos.

**Por que esta prioridade**: Previne mapas de processo quebrados. Garante qualidade.

**Teste Independente**: Mapear processo com handoff inválido, verificar que Analista detecta gap.

**Cenários de Aceitação**:

1. **Dado** usuário mapeia "Passo lead para João (AE)", **Quando** Analista verifica, **Então** consulta Neo4j: João existe? Cargo de João aceita leads?

2. **Dado** João não tem "receber lead" em seus processos mapeados, **Quando** Analista detecta gap, **Então** marca como "handoff não confirmado" e notifica tanto usuário quanto João para confirmar

3. **Dado** João confirma handoff, **Quando** João mapeia seu processo incluindo "receber lead de [usuário]", **Então** Analista marca handoff como "validado" e aumenta confidence score para 1.0

4. **Dado** handoff permanece não confirmado por 7 dias, **Quando** Analista revisa, **Então** escalona para gestor para resolução

---

### User Story 3 - Extração de Regras de Negócio (Prioridade: P1)

Como PIA Analista, quero extrair automaticamente regras de negócio de descrições de processo para que conhecimento implícito se torne explícito.

**Por que esta prioridade**: Captura conhecimento de domínio valioso. Habilita automação.

**Teste Independente**: Usuário descreve processo com regra, verificar que Analista extrai.

**Cenários de Aceitação**:

1. **Dado** usuário declara "Se lead score >70, passar para AE; caso contrário descartar", **Quando** Analista processa, **Então** extrai regra: `IF lead.score > 70 THEN action = 'pass_to_ae' ELSE action = 'discard'` com confidence 0.9

2. **Dado** regra extraída, **Quando** Analista armazena no Neo4j, **Então** cria node (:BusinessRule) linkado ao processo com propriedades: condition, action, confidence, source_user

3. **Dado** múltiplos usuários descrevem mesmo processo, **Quando** Analista detecta regras conflitantes, **Então** marca conflito e solicita clarificação de ambos usuários

4. **Dado** regra validada por múltiplos usuários, **Quando** confidence aumenta, **Então** regra se torna "golden rule" (alta confiança, múltiplas fontes)

---

### User Story 4 - Gamificação para Engajamento (Prioridade: P1)

Como usuário, quero ganhar pontos e reconhecimento por mapear processos para que eu seja motivado a contribuir.

**Por que esta prioridade**: Impulsiona adoção. Torna documentação divertida.

**Teste Independente**: Completar mapeamento, verificar que pontos são concedidos e leaderboard atualizado.

**Cenários de Aceitação**:

1. **Dado** usuário completa primeiro mapeamento de processo, **Quando** submissão validada, **Então** concede 50 pontos + badge "Primeiro Mapeador"

2. **Dado** usuário mapeia processo com alta coerência (todos handoffs validados), **Quando** Analista pontua qualidade, **Então** concede bônus de 20 pontos por acurácia

3. **Dado** processo mapeado pelo usuário é usado por 10+ colegas, **Quando** uso rastreado, **Então** concede badge "Campeão de Processo" + 100 pontos

4. **Dado** leaderboard da empresa, **Quando** usuário visualiza, **Então** vê top mapeadores, áreas mais mapeadas, percentual de cobertura por departamento

---

### User Story 5 - Monitoramento Contínuo de Processos (Prioridade: P1)

Como gestor, quero que PIA monitore execução real de processos e me alerte sobre desvios para que eu possa intervir proativamente.

**Por que esta prioridade**: Garante que processos permaneçam atuais. Detecta problemas cedo.

**Teste Independente**: Executar processo diferentemente do mapeado, verificar que Monitor detecta desvio.

**Cenários de Aceitação**:

1. **Dado** processo mapeado: "Leads com score >70 vão para AE", **Quando** Monitor detecta lead com score 65 enviado para AE, **Então** marca desvio e alerta gestor + usuário

2. **Dado** desvio detectado, **Quando** Monitor analisa padrão (acontece 10+ vezes), **Então** sugere: "Regra pode estar desatualizada. Considerar atualizar threshold para 65?"

3. **Dado** gargalo detectado (delay médio de handoff >5 dias), **Quando** Monitor identifica causa (processo de aprovação), **Então** sugere: "Agilizar aprovação: delegar para líderes de equipe?"

4. **Dado** melhoria de processo sugerida, **Quando** gestor revisa e aprova, **Então** Monitor atualiza definição de processo e notifica usuários afetados

---

## Requisitos Funcionais

### Agente PIA Coletor

- **REQ-PIA-001**: Coletor DEVE gerar questionários personalizados baseados no cargo e área do usuário
- **REQ-PIA-002**: Questionário DEVE seguir estrutura macro-para-micro: Empresa → Área → Processo → Atividade → Handoff
- **REQ-PIA-003**: Coletor DEVE detectar palavras-chave de handoff: "passar para", "enviar para", "delegar", "transferir", "encaminhar"
- **REQ-PIA-004**: Coletor DEVE fazer perguntas clarificadoras para inputs ambíguos
- **REQ-PIA-005**: Coletor DEVE fornecer exemplos e templates para processos comuns
- **REQ-PIA-006**: Coletor DEVE suportar mapeamento iterativo: salvar progresso, retomar depois

### Agente PIA Analista

- **REQ-PIA-007**: Analista DEVE validar coerência de handoff: remetente existe, receptor existe, receptor aceita tipo de input
- **REQ-PIA-008**: Analista DEVE marcar handoffs não confirmados e notificar ambas partes
- **REQ-PIA-009**: Analista DEVE extrair regras de negócio de descrições de processo usando NLP
- **REQ-PIA-010**: Regras de negócio DEVEM ser armazenadas como: condition (IF), action (THEN), confidence (0.0-1.0), source
- **REQ-PIA-011**: Analista DEVE detectar regras conflitantes e solicitar resolução humana
- **REQ-PIA-012**: Analista DEVE atribuir scores de qualidade a processos mapeados: completude, coerência, nível de detalhe
- **REQ-PIA-013**: Analista DEVE armazenar todos mapeamentos no GID (Grafo de Interação & Delegação)

### Agente PIA Monitor

- **REQ-PIA-014**: Monitor DEVE executar auditorias diárias comparando execução real vs processos mapeados
- **REQ-PIA-015**: Monitor DEVE detectar desvios: violações de regra, handoffs faltando, caminhos inesperados
- **REQ-PIA-016**: Monitor DEVE detectar gargalos: delays de handoff >threshold, altas taxas de rejeição
- **REQ-PIA-017**: Monitor DEVE identificar oportunidades de melhoria: passos redundantes, candidatos a automação
- **REQ-PIA-018**: Monitor DEVE gerar alertas com severidade: crítico (bloqueia trabalho), alto (atrasos), médio (ineficiência), baixo (sugestão)
- **REQ-PIA-019**: Monitor DEVE sugerir mudanças de processo com confidence scores e estimativas de impacto

### Sistema de Gamificação

- **REQ-PIA-020**: Sistema DEVE conceder pontos por: primeiro mapeamento (50), processo completo (30), handoff validado (10), alta qualidade (bônus 20)
- **REQ-PIA-021**: Sistema DEVE rastrear badges: Primeiro Mapeador, Campeão de Processo, Contribuidor de Qualidade, Líder de Equipe
- **REQ-PIA-022**: Sistema DEVE manter leaderboards: individual, equipe, departamento
- **REQ-PIA-023**: Sistema DEVE exibir métricas de cobertura: % de processos mapeados, % de handoffs validados, % de regras extraídas
- **REQ-PIA-024**: Gamificação DEVE ser opt-in (usuários podem desabilitar se desejado)

### Armazenamento de Processos (Integração GID)

- **REQ-PIA-025**: Todo processo mapeado DEVE criar: node (:Process) com propriedades: name, description, owner, area, created_at
- **REQ-PIA-026**: Toda atividade DEVE criar: node (:Activity) linkado ao processo com propriedades: name, description, sequence_order, duration_estimate
- **REQ-PIA-027**: Todo handoff DEVE criar: (:User)-[:HANDS_OFF {what, when, how}]->(:Activity)-[:TO]->(:User)
- **REQ-PIA-028**: Toda regra de negócio DEVE criar: node (:BusinessRule) linkado à atividade com propriedades: condition, action, confidence, source_user_id
- **REQ-PIA-029**: Mapas de processo DEVEM ser versionados: rastrear mudanças ao longo do tempo com relacionamentos [:SUPERSEDES]

---

## Requisitos Não-Funcionais

### Performance

- **REQ-PIA-NFR-001**: Tempo de resposta do Coletor DEVE ser <2 segundos por pergunta
- **REQ-PIA-NFR-002**: Validação do Analista DEVE completar em <5 segundos por processo
- **REQ-PIA-NFR-003**: Auditoria diária do Monitor DEVE completar em <30 minutos para 1000 processos

### Usabilidade

- **REQ-PIA-NFR-004**: Questionário DEVE ser completável em <15 minutos para processo simples
- **REQ-PIA-NFR-005**: UI DEVE mostrar indicador de progresso: "Passo 3 de 5: Definir handoffs"
- **REQ-PIA-NFR-006**: Sistema DEVE suportar múltiplos idiomas (inicialmente: Português, Inglês)

### Acurácia

- **REQ-PIA-NFR-007**: Verificação de coerência de handoff DEVE ter >95% acurácia (validado por revisão humana)
- **REQ-PIA-NFR-008**: Extração de regra de negócio DEVE ter >80% acurácia (regras corretamente identificadas)
- **REQ-PIA-NFR-009**: Detecção de desvio DEVE ter <10% taxa de falso-positivo

---

## Critérios de Sucesso

1. **Cobertura**: 70% dos processos organizacionais mapeados em 6 meses
2. **Engajamento**: 60% dos funcionários participam ativamente no mapeamento
3. **Qualidade**: 85% dos processos mapeados têm handoffs validados
4. **Regras de Negócio**: 500+ regras de negócio extraídas e validadas
5. **Monitoramento**: 90% dos desvios críticos detectados em 24 horas
6. **Melhoria**: 30% redução em gargalos de processo após 6 meses
7. **Satisfação do Usuário**: 80% dos usuários acham PIA útil (survey)

---

## Entidades-Chave

### Tipos de Node Neo4j (Novos)

- **:Process** - Processo organizacional
- **:Activity** - Passo dentro de um processo
- **:BusinessRule** - Regra de negócio extraída
- **:ProcessMapping** - Registro de sessão de mapeamento
- **:GamificationScore** - Dados de gamificação do usuário

### Relacionamentos Neo4j (Novos)

- **[:HAS_ACTIVITY]** - Process → Activity
- **[:HANDS_OFF]** - User → Activity (com metadados de handoff)
- **[:TO]** - Activity → User (receptor de handoff)
- **[:GOVERNED_BY]** - Activity → BusinessRule
- **[:MAPPED_BY]** - Process → User (quem mapeou)
- **[:SUPERSEDES]** - Process → Process (versionamento)

### Propriedades

**Propriedades de :Process**:
- `id`: UUID
- `name`: string
- `description`: text
- `owner_id`: UUID (dono do processo)
- `area`: string
- `status`: `draft` | `validated` | `active` | `deprecated`
- `quality_score`: float (0.0-1.0)
- `created_at`: DateTime
- `updated_at`: DateTime

**Propriedades de :Activity**:
- `id`: UUID
- `name`: string
- `description`: text
- `sequence_order`: integer
- `duration_estimate`: integer (minutos)
- `inputs`: array de strings
- `outputs`: array de strings
- `tools_used`: array de strings

**Propriedades de :BusinessRule**:
- `id`: UUID
- `condition`: string (cláusula IF)
- `action`: string (cláusula THEN)
- `confidence`: float (0.0-1.0)
- `source_user_id`: UUID
- `validated_by`: array de UUIDs
- `status`: `draft` | `validated` | `golden`

**Propriedades de relacionamento [:HANDS_OFF]**:
- `what`: string (o que é repassado)
- `when`: string (timing/gatilho)
- `how`: string (método: email, sistema, reunião)
- `status`: `pending` | `validated` | `broken`
- `average_duration`: integer (minutos)

---

## Dependências

- **Spec 041** (Interaction & Delegation Graph) - PIA armazena dados no GID
- **Spec 040** (Business Intent Graph) - Processos linkam a objetivos
- **Spec 019** (Multi-Agent Orchestration) - Time PIA é sistema multi-agente
- **Agno Framework** - Implementação de agentes

---

## Premissas

1. Funcionários estão dispostos a gastar tempo mapeando processos (gamificação ajuda)
2. Gestores suportam iniciativas de mapeamento de processo (buy-in top-down)
3. Descrições de processo são razoavelmente precisas (não idealizadas)
4. Validação de handoff é viável (usuários respondem a solicitações de confirmação)
5. Monitoramento contínuo é aceitável (não visto como vigilância)

---

## Fora do Escopo

- Geração de diagrama BPMN (feature futura)
- Simulação de processo (cenários what-if) (futuro)
- Integração com ferramentas de gestão de projeto (futuro)
- Otimização automática de processo (capacidade IA futura)
- Benchmarking de processo entre empresas (futuro)

---

## Notas

- PIA cria o "gêmeo organizacional" (organizational digital twin) - mapa vivo de como a empresa funciona
- "Mapa vivo da empresa" enfatiza atualizações contínuas, não documentação estática
- Gamificação é crítica para adoção - tornar documentação divertida
- Extração de regras de negócio captura conhecimento implícito que de outra forma seria perdido
- PIA Monitor habilita gestão proativa, não combate a incêndio reativo
- Isso é inspirado por process mining mas com input humano colaborativo, não apenas análise de logs

