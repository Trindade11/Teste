# Saúde Ontológica - Conceitos e Métricas

## O que é Saúde Ontológica?

É a **qualidade estrutural** do seu grafo de conhecimento. Um grafo "saudável" é:
- **Conectado**: Nós relevantes estão ligados de forma significativa
- **Equilibrado**: Sem concentração excessiva (supernós problemáticos)
- **Consistente**: Labels e relationships seguem padrões claros
- **Manutenível**: Fácil de evoluir e curar

---

## Métricas Fundamentais

### 1. R/N (Relationships per Node)
```
R/N = totalRelationships / totalNodes
```

**O que indica:**
- **R/N < 1**: Grafo esparso (muitos nós isolados ou pouco conectados)
- **R/N = 1-3**: Densidade típica para grafos corporativos
- **R/N > 5**: Alta densidade (pode indicar modelagem rica ou ruído)

**Seu EKS hoje**: `R/N = 1.65` → Densidade saudável para fase inicial.

### 2. Grau Médio Total (Avg Total Degree)
```
Avg Degree = 2 * totalRelationships / totalNodes
```

Considera entrada + saída (grafo dirigido). Seu valor: `3.30`

---

## Percentis: p50 e p90

### O que são?

Quando você calcula o **grau** de cada nó (quantas relações ele tem), você obtém uma distribuição estatística.

- **p50 (Percentil 50 = Mediana)**: Metade dos nós tem grau ≤ esse valor
- **p90 (Percentil 90)**: 90% dos nós tem grau ≤ esse valor

### Por que importa?

| Cenário | p50 | p90 | Interpretação |
|---------|-----|-----|---------------|
| Equilibrado | 2 | 6 | Maioria tem poucas conexões, alguns hubs moderados |
| Concentrado | 1 | 15 | Poucos supernós dominam a estrutura |
| Esparso | 1 | 2 | Grafo pouco conectado |

### Query Cypher para calcular
```cypher
MATCH (n)
WITH size((n)--()) AS deg
RETURN
  avg(deg) AS avgDegree,
  percentileCont(deg, 0.5) AS p50,
  percentileCont(deg, 0.9) AS p90,
  max(deg) AS maxDegree;
```

---

## Supernós (Hubs)

### Definição
Nós com **grau significativamente acima da média** (tipicamente > p90 ou > 2x avg).

### Como identificar
```cypher
// Nós com grau acima do p90
MATCH (n)
WITH n, size((n)--()) AS deg
WITH percentileCont(deg, 0.9) AS p90_threshold
MATCH (n)
WITH n, size((n)--()) AS deg, p90_threshold
WHERE deg > p90_threshold
RETURN labels(n) AS tipo, n.name AS nome, deg AS grau
ORDER BY deg DESC;
```

### Quando um supernó é problema?

| Sinal | Risco | Ação |
|-------|-------|------|
| `User` com grau > 50 | Gargalo de atribuição | Verificar se todas as relações são semânticas |
| `Organization` única conectando tudo | Modelagem plana | Considerar hierarquia (Departments) |
| Muitos `MENTIONS` para um nó | Ruído de extração | Curadoria: validar aliases |
| Nó genérico (ex: "Sistema") | Entidade vaga | Refinar ou remover |

### Quando um supernó é bom?

- **`Organization`** sendo raiz da estrutura → esperado
- **`User` líder** com muitos `REPORTS_TO` → estrutura hierárquica legítima
- **`Project` grande** com muitos `HAS_TEAM_MEMBER` → projeto real

---

## Sinais de Modelagem vs Curadoria

### Sinal de Modelagem
Quando a **estrutura do schema** precisa evoluir:
- Labels faltando (ex: tudo é `Concept` genérico)
- Relationships ambíguas (ex: `RELATED_TO` demais)
- Hierarquias planas (sem níveis intermediários)

**Ação**: Refinar ontologia (criar novos labels/relationships)

### Sinal de Curadoria
Quando os **dados** precisam ser limpos:
- Duplicatas (mesmo conceito com nomes diferentes)
- Aliases (ex: "AWS", "Amazon Web Services", "aws")
- Entidades órfãs (nós sem relações)
- Erros de extração (entidades incorretas)

**Ação**: Curadoria de dados (merge, delete, rename)

---

## Dashboard de Saúde (métricas recomendadas)

| Métrica | Query | Frequência | Alerta se |
|---------|-------|------------|-----------|
| Total Nodes | `MATCH (n) RETURN count(n)` | Diário | Queda > 10% |
| Total Rels | `MATCH ()-[r]->() RETURN count(r)` | Diário | Queda > 10% |
| R/N | (calculado) | Semanal | < 1 ou > 10 |
| p90/p50 ratio | (calculado) | Semanal | > 5 (concentração) |
| Nós órfãos | `MATCH (n) WHERE NOT (n)--() RETURN count(n)` | Semanal | > 10% do total |
| Top 5 supernós | (query acima) | Semanal | Crescimento > 20% |

---

## Evolução: Monitoramento → Refino Ativo

### Nível 1: Monitoramento
- Coletar métricas periodicamente
- Dashboards com totais e tendências
- Alertas básicos

### Nível 2: Observabilidade
- Rastrear origem de cada nó/relação
- Log de mudanças (quem criou, quando)
- Comparar snapshots

### Nível 3: Refino Ativo (Curadoria Ontológica)
- **Humano no loop**: Curador revisa sugestões da IA
- **Limpeza de aliases**: Merge de entidades duplicadas
- **Versionamento**: Histórico de mudanças em entidades importantes
- **Validação semântica**: Relações fazem sentido?

---

## Referências

- Script de métricas: `../scripts/` ou `backend/test-neo4j.js`
- Queries Cypher: `../queries/health-metrics.cypher`
- Guia de curadoria: `./curation-guide.md`
