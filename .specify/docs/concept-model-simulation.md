# Concept Model Simulation

> Technique for validating conceptual models through practical database simulation during the specification phase.

## What it is

A technique for building and validating **concept models** (entities, relationships, properties) through practical simulation in a sandbox database, where:

- Queries are executed against a real (sandbox) database
- Synthetic/representative data is inserted
- Use cases are tested with real business questions
- Each approved validation becomes part of the project specification

## When to use

During `/speckit-specify`, when the feature requires defining a complex data structure:

- Corporate graphs
- Domain ontologies
- Dense relational schemas
- Knowledge models

## Principles

1. **Practical, not theoretical simulation** — the database exists (sandbox) and queries actually run
2. **Happens inside the IDE** — every interaction is recorded and versioned
3. **Feeds back into the specification** — each approved validation becomes project context
4. **Competency questions as the driver** — business questions guide the structure

## Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    /speckit-specify                         │
│                                                             │
│  ... define what and why ...                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Reaches: "which entities? which relationships?"    │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  CONCEPT MODEL SIMULATION                   │    │    │
│  │  │                                             │    │    │
│  │  │  1. Propose minimal structure (nodes, edges)│    │    │
│  │  │  2. Insert representative data (sandbox)    │    │    │
│  │  │  3. Run competency questions                │    │    │
│  │  │  4. Identify gaps                           │    │    │
│  │  │  5. Refine structure                        │    │    │
│  │  │  6. Record as spec once approved            │    │    │
│  │  │                                             │    │    │
│  │  │  Loop until stabilized                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  │  Output: validated Concept Model → spec.md          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ... continue specification ...                             │
└─────────────────────────────────────────────────────────────┘
```

## Simulation phases

### Phase 1 — Nodes and basic properties

- Define main entities (Company, Unit, Document, Person...)
- Define minimal properties (id, name, type, status, date)
- Insert a small representative set into the sandbox
- Record as **Schema Spec v0**

### Phase 2 — Relationships

- From the competency questions, define the necessary relationships
- Create edges in the sandbox (OWNS, ISSUED, REFERENCES...)
- Test basic traversals
- Record cardinality rules and constraints
- Update to **Schema Spec v1**

### Phase 3 — Advanced properties (driven by simulation)

- Run more complex use cases
- Identify gaps: properties that would make a difference but do not exist yet
- Add derived fields, scores, metrics
- Each resolved gap → one line in the spec

### Phase 4 — Tests and quality

- Each simulated scenario becomes a test case
- Record: input, query, expected output
- Track metrics (accuracy, completeness, relevance)
- Consolidate into a **Test Spec**

### Phase 5 — Consolidation

- Final Schema Spec (nodes, edges, properties, constraints)
- Ingestion Spec (how each document type enters)
- Query Spec (query types, examples)
- Test Spec (test cases with expectations)

## Generated artifacts

| Artifact | Content |
|----------|---------|
| `schema-spec.md` | Nodes, edges, properties, constraints |
| `ingestion-spec.md` | Ingestion pipeline by document type |
| `query-spec.md` | Query types, strategies, examples |
| `test-spec.md` | Business-aligned test cases |

These artifacts live inside the feature under `.specify/features/<feature>/` or under `project-context/` if they are global.

## Competency Questions

The core technique of the simulation. These are natural language questions that the model must be able to answer:

**Examples:**

- "Which units are at highest ESG risk in the next 12 months?"
- "Which documents reference norm X?"
- "What is the path between supplier Y and audit Z?"

For each question:

1. The AI proposes the necessary structure
2. The structure is created in the sandbox
3. The query is executed
4. If it answers well → approved → becomes spec
5. If it does not answer well → gap identified → refine and repeat

## Important distinction

| Concept Model | Formal ontology |
|---------------|-----------------|
| Cognitive map | Machine-readable specification |
| Informal, diagrams | OWL, RDF, axioms |
| Validated by simulation | Validated by reasoners |
| Output: spec for implementation | Output: formal knowledge graph |

This technique operates at the **concept model** level. The result can later become:

- Graph schema (Neo4j)
- Formal ontology (OWL/RDF)
- Relational model
- Any other implementation

## Integration with Spec Kit

| Command | Role |
|---------|------|
| `/speckit-specify` | Where the simulation happens |
| `/speckit-clarify` | Complex gaps become structured clarification questions |
| `/speckit-plan` | Validated concept model → technical plan |
| `/speckit-tasks` | Breaks down implementation |
| `/speckit-implement` | Code generated from the spec |

## Summary

> Concept Model Simulation is the application of **competency questions** via **practical simulation against a sandbox database** to validate and refine the data structure during specification, where each approved validation becomes project context.

It does not replace any step of Spec-Driven Development — it is a **technique inside `/speckit-specify`** for when the feature requires modeling entities and relationships.
