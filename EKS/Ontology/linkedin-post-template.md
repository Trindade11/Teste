# LinkedIn Post Template - Ontology Health

## Versão 1: Comentário Resposta (curto)

Que bom ver a conversa migrando de "prompting" para **grounding** de verdade.

No meu Enterprise Knowledge System eu trato ontologia como artefato vivo: `User`, `Department`, `Organization`, `Objective/OKR`, `Project`, `Meeting` e entidades extraídas (`Task`, `Decision`, `Risk`, `Insight`) com relações como `MEMBER_OF`, `REPORTS_TO`, `BELONGS_TO`, `LINKED_TO_OKR`, `EXTRACTED_FROM`, `MENTIONS`.

E aí vem a pergunta que separa "grafo bonito" de grafo útil:
qual é o seu **totalRelationships / totalNodes (R/N)** hoje — e você mede só "monitoramento" ou também faz **refino ativo** (curadoria ontológica, limpeza de aliases, versionamento)?

---

## Versão 2: Post Original (médio)

Ontologia não é diagrama estático — é **ecossistema vivo** que respira com a organização.

No Enterprise Knowledge System (EKS) temos hoje:
- 69 nós (User, Department, Organization, Project, Meeting...)
- 114 relações (MEMBER_OF, REPORTS_TO, EXTRACTED_FROM...)
- Densidade: 1.65 relações por nó
- Zero nós órfãos

Mas o número que importa não é o total — é a **distribuição**:
- p50 = 2 (metade dos nós tem ≤ 2 conexões)
- p90 = 5.4 (90% tem ≤ 5 conexões)
- Supernó: 37 conexões (gargalo ou líder central?)

A pergunta que separa "monitoramento" de "saúde ontológica":
Você só coleta métricas ou faz **curadoria ativa**?
- Merge de aliases (AWS vs Amazon Web Services)
- Limpeza de ruído (entidades genéricas)
- Versionamento de entidades importantes
- Revisão de supernós

Grafo sem curadoria vira lixão. Grafo com curadoria vira ativo estratégico.

---

## Versão 3: Post Técnico (longo)

# Ontological Health: Beyond Node Count

Most teams celebrate "we have X nodes in our graph". That's like celebrating lines of code. The real question is: **is your graph healthy?**

## What is Ontological Health?

In our Enterprise Knowledge System (EKS), we measure health through **distribution metrics**, not just totals:

### Current State (Feb 2026)
- **69 nodes**, **114 relationships**
- **R/N ratio**: 1.65 (healthy density)
- **p50 degree**: 2 (median connectivity)
- **p90 degree**: 5.4 (90% have ≤ 5 connections)
- **Max degree**: 37 (potential supernode)
- **Orphan nodes**: 0% (no noise)

### Why Distribution Matters

**R/N = 1.65** tells us we have moderate density. But **p90 = 5.4** tells us we have balanced connectivity. And **max degree = 37** tells us we have a potential bottleneck.

This is the difference between:
- **Monitoring**: "We have 69 nodes"
- **Health**: "Our graph is balanced with one potential hub"

### The Supernode Problem

Our top connected node is "Rodrigo Trindade" with 37 connections. Is this:
- A **bottleneck** (single point of failure)?
- A **leader** (expected centrality)?
- A **modeling issue** (too many direct relationships)?

The answer requires **human curation**.

### Active Curation vs Passive Monitoring

Passive monitoring gives you dashboards. Active curation gives you:
- **Alias resolution** (AWS, Amazon Web Services, aws → merge)
- **Noise cleanup** (generic entities, orphan nodes)
- **Versioning** (entity evolution tracking)
- **Supernode review** (are hubs legitimate?)

### The Human-in-the-Loop

AI can extract entities. Humans must decide:
- Are these the same entity?
- Is this relationship semantically correct?
- Should we create a new label or use existing?

This is **ontological curation** — the human role that makes graphs useful.

## Your Turn

What's your **p90/p50 ratio**? What's your **orphan percentage**? More importantly: who on your team is responsible for **curating** your graph?

---

## Métricas para Incluir

Se quiser adicionar números ao post:

### EKS Atuais
- R/N: 1.65
- p50: 2
- p90: 5.4
- Orphans: 0%
- Top supernó: 37 conexões

### Benchmarks (estimados)
- **R/N < 1**: Grafo esparso
- **R/N 1-3**: Corporativo típico
- **R/N > 5**: Alta densidade (risco de ruído)
- **p90/p50 > 5**: Concentração excessiva
- **Orphans > 10%**: Ruído significativo

---

## Call to Action Options

1. **Engajamento**: "Qual seu R/N? Comente abaixo!"
2. **Curadoria**: "Quem faz curadoria ontológica na sua empresa?"
3. **Dashboard**: "Queremos ver seus dashboards de saúde ontológica!"
4. **Ferramenta**: "Qual ferramenta você usa para monitorar seu grafo?"
