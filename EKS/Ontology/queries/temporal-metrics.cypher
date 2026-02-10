// ============================================================
// TEMPORAL MONITORING METRICS - EKS
// ============================================================
// Queries para monitorar propriedades temporais e dinâmicas
// do grafo. Complementa health-metrics.cypher com foco
// em TEMPO e PROPRIEDADES.
// ============================================================

// ------------------------------------------------------------
// 1. CRESCIMENTO DO GRAFO (Velocidade)
// ------------------------------------------------------------

// 1.1 Nós criados nos últimos 7 dias (por label)
MATCH (n)
WHERE n.createdAt IS NOT NULL AND n.createdAt > datetime() - duration('P7D')
RETURN labels(n)[0] AS tipo, count(*) AS novos_7d
ORDER BY novos_7d DESC;

// 1.2 Nós criados nos últimos 30 dias (por label)
MATCH (n)
WHERE n.createdAt IS NOT NULL AND n.createdAt > datetime() - duration('P30D')
RETURN labels(n)[0] AS tipo, count(*) AS novos_30d
ORDER BY novos_30d DESC;

// 1.3 Relações criadas nos últimos 7 dias (por tipo)
MATCH ()-[r]->()
WHERE r.created_at IS NOT NULL AND r.created_at > datetime() - duration('P7D')
RETURN type(r) AS tipo, count(*) AS novas_7d
ORDER BY novas_7d DESC;

// 1.4 Crescimento semanal comparativo (esta semana vs anterior)
MATCH (n)
WHERE n.createdAt IS NOT NULL
WITH 
  CASE 
    WHEN n.createdAt > datetime() - duration('P7D') THEN 'esta_semana'
    WHEN n.createdAt > datetime() - duration('P14D') THEN 'semana_anterior'
    ELSE 'antes'
  END AS periodo,
  n
WITH periodo, count(n) AS total
WHERE periodo IN ['esta_semana', 'semana_anterior']
RETURN periodo, total
ORDER BY periodo;

// ------------------------------------------------------------
// 2. FRESHNESS (Atualidade)
// ------------------------------------------------------------

// 2.1 Nós mais antigos sem atualização
MATCH (n)
WHERE n.createdAt IS NOT NULL
WITH n, labels(n)[0] AS tipo, n.name AS nome, n.createdAt AS criado,
     CASE WHEN n.updatedAt IS NOT NULL THEN n.updatedAt ELSE n.createdAt END AS ultimaAtualizacao
RETURN tipo, nome, criado, ultimaAtualizacao,
       duration.between(ultimaAtualizacao, datetime()).days AS diasSemAtualizar
ORDER BY diasSemAtualizar DESC
LIMIT 20;

// 2.2 Idade média dos nós por label
MATCH (n)
WHERE n.createdAt IS NOT NULL
WITH labels(n)[0] AS tipo, duration.between(n.createdAt, datetime()).days AS idade
RETURN tipo, 
  count(*) AS total,
  toFloat(avg(idade)) AS idadeMediaDias,
  max(idade) AS maisAntigoDias,
  min(idade) AS maisRecenteDias
ORDER BY idadeMediaDias DESC;

// 2.3 Nós com freshness_decay alta (envelhecendo rápido)
MATCH (n)
WHERE n.freshness_decay_rate IS NOT NULL AND n.freshness_decay_rate > 0.5
RETURN labels(n)[0] AS tipo, n.name AS nome, 
       n.freshness_decay_rate AS taxaDecaimento,
       n.relevance_score AS relevancia
ORDER BY taxaDecaimento DESC;

// 2.4 Nós prestes a expirar
MATCH (n)
WHERE n.expires_at IS NOT NULL AND n.expires_at < datetime() + duration('P30D')
RETURN labels(n)[0] AS tipo, n.name AS nome, n.expires_at AS expiraEm,
       duration.between(datetime(), n.expires_at).days AS diasParaExpirar
ORDER BY diasParaExpirar;

// ------------------------------------------------------------
// 3. RELAÇÕES TEMPORAIS (Momento)
// ------------------------------------------------------------

// 3.1 Relações com interaction_count mais alto (mais ativas)
MATCH ()-[r]->()
WHERE r.interaction_count IS NOT NULL
RETURN type(r) AS tipo, r.interaction_count AS interacoes,
       startNode(r).name AS de, endNode(r).name AS para
ORDER BY interacoes DESC
LIMIT 15;

// 3.2 Relações dormentes (última interação > 30 dias)
MATCH ()-[r]->()
WHERE r.last_interaction_at IS NOT NULL 
  AND r.last_interaction_at < datetime() - duration('P30D')
RETURN type(r) AS tipo, 
       startNode(r).name AS de, endNode(r).name AS para,
       r.last_interaction_at AS ultimaInteracao,
       duration.between(r.last_interaction_at, datetime()).days AS diasDormindo
ORDER BY diasDormindo DESC
LIMIT 20;

// 3.3 Distribuição de relationship_strength
MATCH ()-[r]->()
WHERE r.relationship_strength IS NOT NULL
WITH r.relationship_strength AS strength
RETURN 
  CASE
    WHEN strength >= 0.8 THEN 'forte (0.8-1.0)'
    WHEN strength >= 0.5 THEN 'moderada (0.5-0.8)'
    WHEN strength >= 0.2 THEN 'fraca (0.2-0.5)'
    ELSE 'muito fraca (0.0-0.2)'
  END AS faixa,
  count(*) AS quantidade
ORDER BY quantidade DESC;

// 3.4 Relações com freshness decaindo
MATCH ()-[r]->()
WHERE r.relationship_freshness IS NOT NULL
RETURN type(r) AS tipo,
  avg(r.relationship_freshness) AS freshnessMedia,
  count(*) AS total,
  count(CASE WHEN r.relationship_freshness < 0.3 THEN 1 END) AS criticas
ORDER BY freshnessMedia;

// ------------------------------------------------------------
// 4. COMPLETUDE DE PROPRIEDADES
// ------------------------------------------------------------

// 4.1 Propriedades preenchidas por label (Meeting)
MATCH (m:Meeting)
WITH m,
  CASE WHEN m.title IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN m.date IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN m.summary IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN m.meetingType IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN m.keyTopics IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN m.processedAt IS NOT NULL THEN 1 ELSE 0 END
  AS preenchidas
RETURN 'Meeting' AS label,
  count(m) AS total,
  avg(toFloat(preenchidas)) AS mediaPreenchidas,
  toFloat(avg(toFloat(preenchidas))) / 6.0 * 100 AS completudePercent;

// 4.2 Propriedades preenchidas por label (User)
MATCH (u:User)
WITH u,
  CASE WHEN u.name IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN u.email IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN u.role IS NOT NULL OR u.current_role IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN u.current_focus IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN u.expertise_areas IS NOT NULL THEN 1 ELSE 0 END
  AS preenchidas
RETURN 'User' AS label,
  count(u) AS total,
  avg(toFloat(preenchidas)) AS mediaPreenchidas,
  toFloat(avg(toFloat(preenchidas))) / 5.0 * 100 AS completudePercent;

// 4.3 Propriedades preenchidas por label (Task)
MATCH (t:Task)
WITH t,
  CASE WHEN t.title IS NOT NULL OR t.value IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN t.description IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN t.status IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN t.assignee IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN t.deadline IS NOT NULL OR t.due_date IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN t.priority IS NOT NULL THEN 1 ELSE 0 END
  AS preenchidas
RETURN 'Task' AS label,
  count(t) AS total,
  avg(toFloat(preenchidas)) AS mediaPreenchidas,
  toFloat(avg(toFloat(preenchidas))) / 6.0 * 100 AS completudePercent;

// 4.4 Propriedades preenchidas por label (Project)
MATCH (p:Project)
WITH p,
  CASE WHEN p.name IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN p.description IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN p.status IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN p.start_date IS NOT NULL OR p.startDate IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN p.end_date IS NOT NULL OR p.endDate IS NOT NULL THEN 1 ELSE 0 END
  AS preenchidas
RETURN 'Project' AS label,
  count(p) AS total,
  avg(toFloat(preenchidas)) AS mediaPreenchidas,
  toFloat(avg(toFloat(preenchidas))) / 5.0 * 100 AS completudePercent;

// ------------------------------------------------------------
// 5. CONFIDENCE (Confiança da Extração)
// ------------------------------------------------------------

// 5.1 Confiança média por label
MATCH (n)
WHERE n.confidence IS NOT NULL
WITH labels(n)[0] AS tipo, n.confidence AS conf
RETURN tipo,
  count(*) AS total,
  avg(conf) AS confiancaMedia,
  min(conf) AS confiancaMinima,
  count(CASE WHEN conf < 0.5 THEN 1 END) AS baixaConfianca
ORDER BY confiancaMedia;

// 5.2 Nós com confiança baixa (candidatos a curadoria)
MATCH (n)
WHERE n.confidence IS NOT NULL AND n.confidence < 0.5
RETURN labels(n)[0] AS tipo, n.name AS nome, n.value AS valor,
       n.confidence AS confianca
ORDER BY confianca
LIMIT 20;

// 5.3 Confiança média global
MATCH (n)
WHERE n.confidence IS NOT NULL
RETURN avg(n.confidence) AS confiancaGlobal,
       count(*) AS totalComConfianca,
       count(CASE WHEN n.confidence < 0.5 THEN 1 END) AS abaixoDe50pct;

// ------------------------------------------------------------
// 6. VALIDAÇÃO HUMANA (Curadoria)
// ------------------------------------------------------------

// 6.1 Nós nunca validados por humano
MATCH (n)
WHERE n.last_validated_at IS NULL AND n.confidence IS NOT NULL
RETURN labels(n)[0] AS tipo, count(*) AS semValidacao
ORDER BY semValidacao DESC;

// 6.2 Nós validados há mais de 60 dias
MATCH (n)
WHERE n.last_validated_at IS NOT NULL
  AND n.last_validated_at < datetime() - duration('P60D')
RETURN labels(n)[0] AS tipo, n.name AS nome,
       n.last_validated_at AS validadoEm,
       duration.between(n.last_validated_at, datetime()).days AS diasSemValidar
ORDER BY diasSemValidar DESC
LIMIT 20;

// ------------------------------------------------------------
// 7. TIMELINE DE ENTIDADE
// ------------------------------------------------------------

// 7.1 Timeline completa de um nó (substituir pelo nome desejado)
MATCH (n {name: 'Rodrigo Trindade'})-[r]-(m)
RETURN type(r) AS relacao, 
       labels(m)[0] AS tipoConectado, 
       m.name AS nomeConectado,
       COALESCE(r.created_at, r.createdAt, m.createdAt, m.date) AS data,
       r.relationship_strength AS forca
ORDER BY data;

// 7.2 Relações mais recentes de qualquer nó
MATCH (n)-[r]-(m)
WHERE r.created_at IS NOT NULL OR r.createdAt IS NOT NULL
WITH n, r, m, COALESCE(r.created_at, r.createdAt) AS data
RETURN labels(n)[0] AS tipoOrigem, n.name AS origem,
       type(r) AS relacao,
       labels(m)[0] AS tipoDestino, m.name AS destino,
       data
ORDER BY data DESC
LIMIT 20;

// ------------------------------------------------------------
// 8. DASHBOARD TEMPORAL SUMMARY
// ------------------------------------------------------------

// Query combinada para dashboard temporal
MATCH (n)
WITH count(n) AS totalNodes,
     count(CASE WHEN n.createdAt > datetime() - duration('P7D') THEN 1 END) AS novos7d,
     count(CASE WHEN n.createdAt > datetime() - duration('P30D') THEN 1 END) AS novos30d,
     avg(CASE WHEN n.confidence IS NOT NULL THEN n.confidence END) AS confiancaMedia
MATCH ()-[r]->()
WITH totalNodes, novos7d, novos30d, confiancaMedia, count(r) AS totalRels,
     count(CASE WHEN r.relationship_freshness IS NOT NULL AND r.relationship_freshness < 0.3 THEN 1 END) AS relsCriticas,
     avg(CASE WHEN r.relationship_freshness IS NOT NULL THEN r.relationship_freshness END) AS freshnessMedia
RETURN {
  totalNodes: totalNodes,
  novosNos7d: novos7d,
  novosNos30d: novos30d,
  totalRelationships: totalRels,
  confiancaMedia: confiancaMedia,
  freshnessMedia: freshnessMedia,
  relacoesCriticas: relsCriticas
} AS temporalMetrics;
