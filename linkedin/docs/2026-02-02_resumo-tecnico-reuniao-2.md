# Resumo Técnico Enriquecido — Reunião 2: Ontologia Formalizada

**Data**: 2 de fevereiro de 2026  
**Participantes**: João Soares, Bruno Cesar, Sidnei, Rodrigo Trindade, Alexandre Lotti  
**Duração**: ~45 minutos  
**Fonte**: Transcrição automática da reunião

---

## 1. Tema Central

**Formalização ontológica para sistemas de IA corporativos** — distinção entre *regras de negócio* e *lógica formal*, e como estruturar conhecimento organizacional para consumo por agentes de IA.

---

## 2. Contexto da Discussão

A reunião iniciou com João Soares explicando a visão do EKS: um sistema que unifica contexto organizacional em tempo real, eliminando a necessidade de múltiplas integrações ponto-a-ponto. Bruno Cesar questionou como isso se traduz tecnicamente, o que abriu a discussão sobre grafos de conhecimento e ontologias formais.

Sidnei trouxe a perspectiva acadêmica/formal, diferenciando **lógica** (formalismo matemático) de **regras** (políticas de negócio), o que gerou um debate rico sobre os fundamentos teóricos necessários para construir sistemas de conhecimento robustos.

---

## 3. Conceitos-Chave Discutidos

### 3.1 Lógica vs. Regras (Contribuição de Sidnei)

| Conceito | Definição | Características |
|----------|-----------|-----------------|
| **Lógica** | Formalismo matemático | Axiomas, provas de teorema, inferência, validação formal |
| **Regras** | Políticas de negócio | Implementadas em código, determinísticas, sem prova formal |

**Citação-chave**:
> *"Quando você fala lógica, você tem axiomas, prova de teorema, implicações. Você está falando de regras, não de lógica."* — Sidnei

**Tipos de lógica mencionados**:
- **Lógica Descritiva** (base para OWL) — usada em ontologias
- **Lógica Temporal** — modela estados ao longo do tempo
- **Lógica Paraconsistente** — lida com contradições
- **Lógica Anotada** — extensão da paraconsistente

**Implicação técnica**: Ontologias formais usam **lógica descritiva** (OWL/DL) para permitir **inferência automática** via reasoners.

---

### 3.2 Ontologia como Instrumento (não como fim)

Sidnei enfatizou que a ontologia é um **instrumento para raciocínio**, não o objetivo final:

- **Reasoners** (raciocinadores) consomem a ontologia para inferir novos fatos
- A ontologia define **entidades**, **relacionamentos** e **axiomas**
- Axiomas incluem: contenção, disjunção, equivalência

**Citação-chave**:
> *"Não é a ontologia em si, são os raciocinadores que vão se utilizar da ontologia. A ontologia é um instrumento para que eu possa raciocinar."* — Sidnei

---

### 3.3 Questões de Competência (Methontology)

Metodologia **Methontology** citada — primeiro passo no desenvolvimento de ontologias: definir **o que a ontologia precisa responder**.

**Citação-chave**:
> *"O que a minha ontologia precisa responder? Quais são as empresas que hoje possuem alinhamento para o que eu quero fazer?"* — Sidnei

**Aplicação prática**: Se a ontologia define que "toda empresa precisa ter OKR", empresas sem OKR serão automaticamente descartadas pelo reasoner na prospecção.

---

### 3.4 Consenso e Formalização Semântica

**Exemplo da tangerina/bergamota/mexerica**:

| Região | Nome usado |
|--------|------------|
| Sul | Bergamota |
| Sudeste | Mexerica |
| Geral | Tangerina |

**Lição**: 
- Semântica varia por região/contexto
- Ontologia deve **formalizar todas as variantes** como equivalentes
- Consenso é **definido no escopo do domínio**, não universal

**Citação-chave**:
> *"A semântica é secundária. Se você não formalizou que uma tangerina pode ter todos esses nomes, aí que é o problema."* — Sidnei

---

### 3.5 Curador Ontológico (Contribuição de Rodrigo)

Papel crítico identificado: **Curador Ontológico** — humano que refina continuamente a ontologia.

**Citação-chave**:
> *"Nenhum sistema vai funcionar se só depender de IA. Tem que ter alguém capacitado em ontologia fazendo curadoria ao longo do tempo."* — Rodrigo

**Justificativa**:
- Empresa é viva, vocabulário muda
- Apelidos, siglas, jargões surgem organicamente (ex: "JS" = João Soares)
- IA é determinística, não tem "gosto" ou percepção de adequação

**Perfil sugerido**: Evolução do gerente de projetos tradicional → **Engenheiro/Arquiteto de Conhecimento**

---

### 3.6 Desenvolvimento Orientado a Ontologia (Contribuição de João)

Mudança de paradigma proposta:

| Paradigma Tradicional | Paradigma Ontológico |
|-----------------------|----------------------|
| Foco na camada de dados | Foco na ontologia |
| Integrações ponto-a-ponto | Contexto unificado em tempo real |
| Múltiplas APIs | Grafo semântico consolidado |
| Redundância de dados | Sincronização ontológica |

**Citação-chave**:
> *"O ponto focal nunca mais vai ser a camada de dados, vai ser a ontologia."* — João

---

## 4. Arquitetura Técnica Discutida

### 4.1 Stack Implícita

| Componente | Tecnologia/Conceito |
|------------|---------------------|
| Banco de Grafo | Neo4j |
| Linguagem de Query | Ontology Query Language / Cypher |
| Reasoners | Pellet, HermiT, FaCT++ |
| Formalização | OWL/DL (Web Ontology Language / Description Logic) |
| Validação | OCL (Object Constraint Language) |
| Modelo Relacional | Teoria de Conjuntos (fundamento matemático) |

### 4.2 Fluxo de Dados Conceitual

```
┌─────────────────┐
│   Data Sources  │  (ERP, CRM, Docs, Transcrições)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Ingestão     │  (Normalização, Extração de Entidades)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Grafo Semântico │  (Neo4j - Entidades + Relações)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Ontology Service │  (Indexação, Sincronização)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Reasoners     │  (Inferência Automática)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Agentes IA    │  (Consumo do Contexto)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Insights     │  (Estratégia, Risco, Decisão)
└─────────────────┘
```

### 4.3 Sincronização Ontológica

João descreveu um modelo onde:
1. **Modelo relacional** mantém os dados operacionais
2. **Ontology Query Language** indexa e sincroniza com o grafo
3. **Serviço de ontologia** lida com objetos e relações
4. Usuário interage pela **camada semântica**, não diretamente com dados

---

## 5. EKS — Enterprise Knowledge System

### 5.1 Visão Geral

O EKS não é um "RAG de luxo" para responder perguntas. É um sistema de **inteligência organizacional** que:

1. Ingere conhecimento (principalmente transcrições de reunião)
2. Processa em background (não apenas sob demanda)
3. Identifica impactos em OKRs, riscos, oportunidades
4. Alimenta dashboards estratégicos para o board

### 5.2 Premissas do Sistema

| Premissa | Justificativa |
|----------|---------------|
| **Transcrição de reunião** como documento primário | "Tudo sai dali" — decisões, contexto, compromissos |
| **OKR obrigatório** | Empresas sem OKR não estão preparadas para o sistema |
| **Curador ontológico** mandatório | Sistema não funciona só com IA |
| **Processamento em background** | Insights gerados continuamente, não apenas na interação |

### 5.3 Pipeline de Gestão de Projetos

Campos obrigatórios por projeto no EKS:

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome do Projeto | String | ✓ |
| Responsável | Entidade (Pessoa) | ✓ |
| Departamento | Entidade (Área) | ✓ |
| Status | Enum | ✓ |
| Fase | Enum | ✓ |
| Prioridade | Enum | ✓ |
| Data de Início | Date | ✓ |
| Data Alvo | Date | ✓ |
| Classe de Memória | Enum | ✓ |
| Validade | Date | ✓ |
| **Vínculo com OKR** | Relação | ✓ |

**Citação-chave**:
> *"Projeto sem link com objetivo estratégico é o pecado das empresas."* — Rodrigo

### 5.4 Objetivo Final

O EKS deve:
- Pegar o que foi dito numa reunião
- Entender o impacto no contexto da empresa
- Gerar insight (estratégia, risco, prioridade, decisão)
- Disponibilizar para o board executivo

---

## 6. Engenharia de Conhecimento

### 6.1 Papéis Identificados

| Papel | Responsabilidade | Perfil |
|-------|------------------|--------|
| **Arquiteto de Conhecimento** | Define estrutura ontológica, entidades, relacionamentos | Visão macro, design |
| **Engenheiro de Conhecimento** | Implementa, valida, mantém a ontologia | Técnico, hands-on |
| **Curador Ontológico** | Refina continuamente, resolve ambiguidades semânticas | Domínio + técnico |

### 6.2 Metodologias Citadas

| Metodologia | Aplicação |
|-------------|-----------|
| **Methontology** | Desenvolvimento de ontologias (questões de competência primeiro) |
| **CRISP-DM** | Data mining (fase Business como base) |
| **Engenharia de Software** | Levantamento de requisitos, análise |

---

## 7. Insights Técnicos Adicionais

### 7.1 Thesaurus como Propriedade de Node

Rodrigo mencionou uso de **thesaurus** para resolver aliases:

```
Node: João Soares
├── alias: "JS"
├── alias: "João"
└── alias: "Soares"
```

O modelo deve inferir entidades a partir de apelidos/siglas em transcrições.

### 7.2 Embedding Semântico em Chunks

Bruno sugeriu **embutir lógica e regras nos chunks** para RAG:

> *"Você pode embutir lógicas e regras dentro do próprio chunk. Isso é uma coisa que eu fiz muito interessante."* — Bruno

**Aplicação**: Ao criar chunks para retrieval, incluir metadados semânticos que orientem o LLM.

### 7.3 Retroalimentação Ontológica

Sistema deve ser **auto-atualizável**:

> *"Conforme entra informação nova, a ontologia já sabe como ela se relaciona, até onde pode ir. Ela não precisa ficar testando, gastando token à toa."* — João

### 7.4 Validação Formal

Sidnei explicou a cadeia de validação:

1. **Modelo Relacional** ← Teoria de Conjuntos (prova matemática)
2. **Banco de Dados** ← Chave estrangeira, integridade referencial
3. **Ontologia** ← Lógica Descritiva (axiomas, inferência)
4. **Queries** ← OCL (Object Constraint Language)

---

## 8. Termos Técnicos — Glossário

| Termo | Definição |
|-------|-----------|
| **Lógica Descritiva** | Família de linguagens formais para representação de conhecimento, base do OWL |
| **Lógica Paraconsistente** | Lógica que tolera contradições sem trivialização |
| **Lógica Temporal** | Lógica que modela proposições ao longo do tempo |
| **Rede de Petri** | Modelo matemático para sistemas distribuídos (máquinas de estado finito) |
| **CRISP-DM** | Cross-Industry Standard Process for Data Mining |
| **Methontology** | Metodologia para desenvolvimento de ontologias |
| **OCL** | Object Constraint Language — linguagem para especificar restrições em modelos UML |
| **Reasoner** | Motor de inferência que processa ontologias (Pellet, HermiT, FaCT++) |
| **OWL** | Web Ontology Language — linguagem padrão W3C para ontologias |
| **Axioma** | Proposição assumida como verdadeira, base para inferências |
| **Thesaurus** | Vocabulário controlado com relações de equivalência e hierarquia |

---

## 9. Citações Relevantes

### Sobre Lógica vs. Regras
> *"Quando você fala lógica, você tem axiomas, prova de teorema, implicações. Você está falando de regras, não de lógica."* — Sidnei

### Sobre Formalização
> *"Ontologia, para escalar, precisa de formalização. Senão vira só vocabulário."* — Sidnei

### Sobre Curadoria
> *"Nenhum sistema vai funcionar se só depender de IA. Tem que ter alguém capacitado em ontologia fazendo curadoria."* — Rodrigo

### Sobre o Papel da Ontologia
> *"O ponto focal nunca mais vai ser a camada de dados, vai ser a ontologia."* — João

### Sobre o Objetivo do EKS
> *"Um EKS não é para responder pergunta. Isso é o básico. O objetivo é pegar o que foi dito numa reunião, entender o impacto no contexto da empresa, gerar insight."* — Rodrigo

### Sobre Consenso
> *"Consenso é definido no escopo do domínio. Não existe consenso universal."* — Sidnei

---

## 10. Próximos Passos Acordados

1. **Reuniões quinzenais** — fora do horário comercial (noite)
2. **Pauta estruturada** — 2-3 tópicos por reunião, tempo dividido
3. **Dever de casa** — Usar transcrição para construir base de conhecimento ontológica
4. **Próxima apresentação** — Alexandre Lotti apresentará seu projeto

---

## 11. Conclusão

A reunião consolidou a distinção crítica entre **regras de negócio** (implementáveis em código) e **lógica formal** (axiomática, provável matematicamente). 

### Princípios para o EKS:

1. **Ontologia como ponto focal** — não dados
2. **Reasoners para inferência** — não apenas busca
3. **Curador ontológico humano** — no loop permanente
4. **Processamento em background** — não apenas sob demanda
5. **Vínculo projeto-OKR** — rastreabilidade estratégica obrigatória
6. **Formalização** — sem ela, ontologia vira vocabulário

### Equação do EKS:

```
Transcrições + Ontologia Formal + Reasoners + Curadoria Humana = Inteligência Organizacional
```

---

## 12. Referências Implícitas

- **Methontology** — Gómez-Pérez et al.
- **CRISP-DM** — IBM/NCR/SPSS
- **OWL/DL** — W3C Web Ontology Language
- **Neo4j** — Banco de dados de grafo
- **Pellet/HermiT** — Reasoners para OWL

---

*Documento gerado a partir da transcrição da reunião de 02/02/2026.*
