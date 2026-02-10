# Métricas Reais - EKS Ontology

> Data: 2026-02-09  
> Fonte: Neo4j Aura (produção)

## Métricas Gerais

| Métrica | Valor | Status |
|---------|-------|--------|
| **Total Nodes** | 69 | ✅ Base sólida |
| **Total Relationships** | 114 | ✅ Boa conectividade |
| **R/N (rels/nó)** | 1.65 | ✅ Densidade saudável |
| **Avg Total Degree** | 3.30 | ✅ Conectividade moderada |
| **Nós órfãos** | 0 (0.0%) | ✅ Zero ruído |

## Distribuição de Grau

| Métrica | Valor | Interpretação |
|---------|-------|---------------|
| **p50 (mediana)** | 2 | Metade dos nós tem ≤ 2 conexões |
| **p90** | 5.4 | 90% dos nós tem ≤ 5 conexões |
| **Max Degree** | 37 | Supernó detectado |
| **Min Degree** | 1 | Nenhum nó isolado |

## Top 5 Supernós (Hubs)

| Pos | Tipo | Nome | Grau | Análise |
|------|------|------|------|---------|
| 1 | User | Rodrigo Trindade | 37 | **Gargalo?** Líder central |
| 2 | Meeting | (null) | 24 | Reunião importante |
| 3 | Organization | CoCreateAI | 14 | **Esperado** (raiz) |
| 4 | User | Julio Lewkowicz | 14 | Colaborador ativo |
| 5 | Project | Projeto EKS | 11 | Projeto central |

## Análise Rápida

### ✅ Pontos Positivos
- **Zero órfãos**: Grafo bem conectado
- **Densidade moderada** (R/N = 1.65): Sem ruído excessivo
- **p90 baixo** (5.4): Distribuição equilibrada

### ⚠️ Pontos de Atenção
- **Supernó "Rodrigo Trindade"** com 37 conexões
  - Verificar se são semânticas ou gargalo
  - Considerar redistribuir responsabilidades
- **Meeting sem nome** com 24 conexões
  - Possível erro de extração
  - Revisar ingestão

### 📊 Saúde Ontológica: 8/10
Grafo saudável para fase inicial, com oportunidades de curadoria.

---

## Queries Usadas

Ver arquivo completo: `../queries/health-metrics.cypher`

### Métricas básicas
```cypher
MATCH (n) RETURN count(n) AS totalNodes;
MATCH ()-[r]->() RETURN count(r) AS totalRels;
```

### Distribuição de grau
```cypher
MATCH (n)
WITH COUNT { (n)--() } AS deg
RETURN
  avg(toFloat(deg)) AS avgDegree,
  percentileCont(toFloat(deg), 0.5) AS p50,
  percentileCont(toFloat(deg), 0.9) AS p90,
  max(toFloat(deg)) AS maxDegree,
  min(toFloat(deg)) AS minDegree;
```

### Supernós
```cypher
MATCH (n)
WITH n, COUNT { (n)--() } AS deg
RETURN labels(n)[0] AS tipo, n.name AS nome, deg AS grau
ORDER BY deg DESC
LIMIT 5;
```

---

## Próximos Passos

1. **Curadoria**: Revisar supernós
2. **Monitoramento**: Automatizar queries
3. **Dashboard**: Visualizar métricas no frontend
4. **Alertas**: Configurar thresholds (ex: supernó > 30)
