// ============================================================
// ONTOLOGICAL HEALTH METRICS - EKS
// ============================================================
// Queries para medir a saúde do grafo de conhecimento.
// Rodar no Neo4j Browser ou via endpoint customizado.
// ============================================================

// ------------------------------------------------------------
// 1. MÉTRICAS BÁSICAS
// ------------------------------------------------------------

// 1.1 Total de nós
MATCH (n) RETURN count(n) AS totalNodes;

// 1.2 Total de relacionamentos
MATCH ()-[r]->() RETURN count(r) AS totalRels;

// 1.3 R/N e Grau Médio (tudo junto)
MATCH (n) WITH count(n) AS nodes
MATCH ()-[r]->() WITH nodes, count(r) AS rels
RETURN
  nodes AS totalNodes,
  rels AS totalRelationships,
  toFloat(rels) / nodes AS relsPerNode,
  (2.0 * rels) / nodes AS avgTotalDegree;

// ------------------------------------------------------------
// 2. DISTRIBUIÇÃO DE GRAU (p50, p90)
// ------------------------------------------------------------

// 2.1 Percentis de grau (mediana, p90, máximo)
MATCH (n)
WITH size((n)--()) AS deg
RETURN
  avg(deg) AS avgDegree,
  percentileCont(deg, 0.5) AS p50_median,
  percentileCont(deg, 0.9) AS p90,
  percentileCont(deg, 0.95) AS p95,
  max(deg) AS maxDegree,
  min(deg) AS minDegree;

// 2.2 Histograma de grau (distribuição)
MATCH (n)
WITH size((n)--()) AS deg
RETURN deg AS grau, count(*) AS quantidade
ORDER BY deg;

// ------------------------------------------------------------
// 3. DETECÇÃO DE SUPERNÓS
// ------------------------------------------------------------

// 3.1 Top 10 nós mais conectados
MATCH (n)
WITH n, size((n)--()) AS deg
RETURN labels(n)[0] AS tipo, n.name AS nome, deg AS grau
ORDER BY deg DESC
LIMIT 10;

// 3.2 Nós acima do p90 (potenciais supernós problemáticos)
MATCH (n)
WITH n, size((n)--()) AS deg
WITH collect({node: n, deg: deg}) AS nodes, percentileCont(deg, 0.9) AS p90
UNWIND nodes AS item
WITH item.node AS n, item.deg AS deg, p90
WHERE deg > p90
RETURN labels(n)[0] AS tipo, n.name AS nome, deg AS grau, p90 AS threshold
ORDER BY deg DESC;

// 3.3 Crescimento de supernós (comparar com snapshot anterior)
// Necessita de snapshot histórico para comparação

// ------------------------------------------------------------
// 4. QUALIDADE DO GRAFO
// ------------------------------------------------------------

// 4.1 Nós órfãos (sem nenhuma relação)
MATCH (n)
WHERE NOT (n)--()
RETURN labels(n)[0] AS tipo, n.name AS nome, n.id AS id
LIMIT 50;

// 4.2 Contagem de órfãos por label
MATCH (n)
WHERE NOT (n)--()
RETURN labels(n)[0] AS tipo, count(*) AS orphanCount
ORDER BY orphanCount DESC;

// 4.3 Proporção de órfãos
MATCH (n) WITH count(n) AS total
MATCH (orphan) WHERE NOT (orphan)--()
WITH total, count(orphan) AS orphans
RETURN 
  total,
  orphans,
  toFloat(orphans) / total * 100 AS orphanPercentage;

// ------------------------------------------------------------
// 5. ANÁLISE POR LABEL
// ------------------------------------------------------------

// 5.1 Contagem por label
CALL db.labels() YIELD label
CALL {
  WITH label
  MATCH (n) WHERE label IN labels(n)
  RETURN count(n) AS count
}
RETURN label, count ORDER BY count DESC;

// 5.2 Grau médio por label
MATCH (n)
WITH labels(n)[0] AS label, size((n)--()) AS deg
RETURN label, 
  count(*) AS quantidade,
  avg(deg) AS grauMedio,
  max(deg) AS grauMax
ORDER BY quantidade DESC;

// ------------------------------------------------------------
// 6. ANÁLISE POR RELATIONSHIP TYPE
// ------------------------------------------------------------

// 6.1 Contagem por tipo de relacionamento
CALL db.relationshipTypes() YIELD relationshipType
CALL {
  WITH relationshipType
  MATCH ()-[r]->() WHERE type(r) = relationshipType
  RETURN count(r) AS count
}
RETURN relationshipType, count ORDER BY count DESC;

// 6.2 Relacionamentos menos usados (candidatos a revisão)
CALL db.relationshipTypes() YIELD relationshipType
CALL {
  WITH relationshipType
  MATCH ()-[r]->() WHERE type(r) = relationshipType
  RETURN count(r) AS count
}
WITH relationshipType, count
WHERE count < 5
RETURN relationshipType, count ORDER BY count;

// ------------------------------------------------------------
// 7. CANDIDATOS A CURADORIA
// ------------------------------------------------------------

// 7.1 Possíveis duplicatas (nomes similares no mesmo label)
MATCH (n)
WHERE n.name IS NOT NULL
WITH labels(n)[0] AS label, toLower(trim(n.name)) AS normalized, collect(n) AS nodes
WHERE size(nodes) > 1
RETURN label, normalized, size(nodes) AS duplicates, 
  [node IN nodes | node.name] AS names
ORDER BY duplicates DESC
LIMIT 20;

// 7.2 Entidades com nomes suspeitos (muito curtos ou longos)
MATCH (n)
WHERE n.name IS NOT NULL AND (size(n.name) < 2 OR size(n.name) > 100)
RETURN labels(n)[0] AS tipo, n.name AS nome, size(n.name) AS tamanho
LIMIT 20;

// 7.3 Usuários sem departamento
MATCH (u:User)
WHERE NOT (u)-[:MEMBER_OF]->(:Department)
RETURN u.name AS usuario, u.email AS email;

// 7.4 Projetos sem owner
MATCH (p:Project)
WHERE NOT (p)-[:OWNED_BY]->(:User)
RETURN p.name AS projeto;

// ------------------------------------------------------------
// 8. DASHBOARD SUMMARY (rodar tudo junto)
// ------------------------------------------------------------

// Query combinada para dashboard
MATCH (n) WITH count(n) AS totalNodes
MATCH ()-[r]->() WITH totalNodes, count(r) AS totalRels
MATCH (orphan) WHERE NOT (orphan)--() WITH totalNodes, totalRels, count(orphan) AS orphans
MATCH (n2) WITH totalNodes, totalRels, orphans, size((n2)--()) AS deg
WITH totalNodes, totalRels, orphans, collect(deg) AS degrees
RETURN {
  totalNodes: totalNodes,
  totalRelationships: totalRels,
  relsPerNode: toFloat(totalRels) / totalNodes,
  avgDegree: (2.0 * totalRels) / totalNodes,
  orphanNodes: orphans,
  orphanPercentage: toFloat(orphans) / totalNodes * 100,
  p50: percentileCont(degrees, 0.5),
  p90: percentileCont(degrees, 0.9),
  maxDegree: max(degrees)
} AS healthMetrics;
