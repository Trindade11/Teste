# Ontology - EKS

Documentação, queries e scripts relacionados à **ontologia** do Enterprise Knowledge System.

## Estrutura

```
Ontology/
├── docs/                    # Documentação conceitual
│   ├── ontological-health.md      # Métricas de saúde (p50/p90, supernós)
│   ├── curation-guide.md          # Guia de curadoria ontológica
│   └── schema-inventory.md        # Inventário de labels e relationships
├── queries/                 # Queries Cypher
│   └── health-metrics.cypher      # Queries de saúde ontológica
├── scripts/                 # Scripts de análise
│   └── (referência ao test-neo4j.js)
└── README.md
```

## Conceitos-chave

- **Saúde Ontológica**: Qualidade, consistência e manutenibilidade do grafo
- **Supernós (Hubs)**: Nós altamente conectados que podem indicar gargalos ou riscos
- **Curadoria Ontológica**: Processo ativo de refinamento (limpeza de aliases, versionamento)
- **R/N (Relationships per Node)**: Métrica de densidade do grafo

## Métricas atuais (2026-02-09)

| Métrica | Valor |
|---------|-------|
| Total Nodes | 69 |
| Total Relationships | 114 |
| R/N (rels/nó) | 1.6522 |
| Avg Total Degree | 3.3043 |

## Referências

- **Backend routes**: `backend/src/routes/ontology.routes.ts`
- **Script de teste**: `backend/test-neo4j.js`
- **Schema doc**: `project-context/database-schema.md`
