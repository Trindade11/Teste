import { Router, Request, Response } from 'express';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// DOMAIN CONFIGURATION
// ============================================================================

// Compute expected node counts based on actual company size from the graph.
// If employeeCount is known, derive structural expectations.
// If unknown, expected = actual (no penalization).
function computeExpectedCounts(
  companySize: number | null,
  actualCounts: Record<string, number>,
): { expected: Record<string, number>; source: 'company_data' | 'inferred' | 'actual' } {
  // If company has employeeCount property, derive from it
  if (companySize && companySize > 0) {
    return {
      source: 'company_data',
      expected: {
        User: companySize,
        Department: Math.max(2, Math.ceil(companySize / 5)),
        Company: 1,
        Objective: Math.max(3, Math.ceil(companySize / 3)),
        OKR: Math.max(4, Math.ceil(companySize / 1.5)),
        Project: Math.max(3, Math.ceil(companySize / 2)),
        Knowledge: Math.max(10, companySize * 4),
        Document: Math.max(5, companySize * 2),
        Chunk: Math.max(10, companySize * 10),
        Conversation: Math.max(5, companySize * 2),
        Message: Math.max(20, companySize * 8),
        Task: Math.max(5, companySize),
        Plan: Math.max(2, Math.ceil(companySize / 3)),
        Agent: 5,
        Process: Math.max(5, Math.ceil(companySize * 0.8)),
        BusinessRule: Math.max(3, Math.ceil(companySize / 3)),
      },
    };
  }

  // If no company size: infer from User count if available
  const userCount = actualCounts['User'];
  if (userCount && userCount > 0) {
    return computeExpectedCounts(userCount, actualCounts);
  }

  // Fallback: use actual counts (100% coverage = "we don't know what to expect")
  return {
    source: 'actual',
    expected: { ...actualCounts },
  };
}

// Resonance type mappings (Spec 020)
const RESONANCE_MAP: Record<string, { type: string; message: string }> = {
  'Department:missing_relation': {
    type: 'area_citation',
    message: 'Quando preenchido, todos os membros do departamento receberão um sinal de conexão',
  },
  'Project:missing_relation': {
    type: 'area_citation',
    message: 'Definir ownership ativa ressonância para as equipes envolvidas',
  },
  'Project:stale_data': {
    type: 'flow_refinement',
    message: 'A atualização dispara sinal para todos os envolvidos no projeto',
  },
  'Knowledge:missing_relation': {
    type: 'concept_propagation',
    message: 'Conectar knowledge a objetivos melhora o BIG Anchoring e revela impacto',
  },
  'Knowledge:no_validation': {
    type: 'knowledge_validated',
    message: 'Validar knowledge pode gerar ressonância para quem criou o conteúdo original',
  },
  'Process:low_coverage': {
    type: 'concept_propagation',
    message: 'Mapear processos pode revelar conexões entre áreas',
  },
  'Document:low_coverage': {
    type: 'feedback_strategic_impact',
    message: 'Documentos reprocessados geram knowledge que pode impactar estratégia',
  },
  'Company:missing_relation': {
    type: 'pattern_reuse',
    message: 'Visão e missão são referência para toda a organização',
  },
  'User:missing_relation': {
    type: 'knowledge_validated',
    message: 'Competências mapeadas enriquecem o perfil e melhoram recomendações',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function toNum(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toNumber === 'function') return val.toNumber();
  return Number(val) || 0;
}

function toRound(val: any, decimals = 2): number {
  const n = toNum(val);
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function getResonance(targetLabel: string, category: string) {
  const key = `${targetLabel}:${category}`;
  return RESONANCE_MAP[key] || null;
}

// ============================================================================
// SYNTHESIS TEXT GENERATION
// ============================================================================

function generateSynthesisText(data: {
  maturityStage: number;
  totalNodes: number;
  totalRels: number;
  rPerN: number;
  overallCompleteness: number;
  temporalCoverage: number;
  updatedAtCoverage: number;
  orphanPercent: number;
  governanceScore: number;
  bigAnchoring: number;
  gapCount: number;
  highGapCount: number;
  barelyKnownCount: number;
  companyName: string;
}): string {
  const lines: string[] = [];

  // Headline
  lines.push(`O grafo de ${data.companyName} tem ${data.totalNodes} nós e ${data.totalRels} relações (R/N: ${data.rPerN}).`);

  // Maturity context
  if (data.maturityStage < 1.5) {
    lines.push(`Maturidade ${data.maturityStage.toFixed(1)}/5.0 — estágio inicial. O schema está definido mas a base de dados precisa crescer.`);
  } else if (data.maturityStage < 3) {
    lines.push(`Maturidade ${data.maturityStage.toFixed(1)}/5.0 — dados base ingeridos, foco agora em enriquecer propriedades e reduzir gaps.`);
  } else {
    lines.push(`Maturidade ${data.maturityStage.toFixed(1)}/5.0 — grafo em amadurecimento, priorizar curadoria e ancoragem BIG.`);
  }

  // Top concern
  if (data.overallCompleteness < 60) {
    lines.push(`⚠ Completude de propriedades está em ${data.overallCompleteness}% — muitos nós têm campos vazios. Priorize enriquecer propriedades dos labels mais usados.`);
  }
  if (data.orphanPercent > 15) {
    lines.push(`⚠ ${data.orphanPercent.toFixed(0)}% dos nós estão órfãos (sem conexão). Esses dados existem mas não contribuem para o conhecimento organizacional.`);
  }
  if (data.bigAnchoring < 30) {
    lines.push(`⚠ Apenas ${data.bigAnchoring}% do Knowledge está ancorado a Objectives (BIG). O conhecimento não está ligado à estratégia.`);
  }
  if (data.updatedAtCoverage < 20) {
    lines.push(`⚠ Apenas ${data.updatedAtCoverage}% dos nós têm updatedAt — o grafo não está sendo atualizado ativamente.`);
  }

  // Gaps
  if (data.highGapCount > 0) {
    lines.push(`🔍 ${data.highGapCount} gap(s) de alta prioridade detectado(s). Veja a aba "Dúvidas" para ações concretas.`);
  }
  if (data.barelyKnownCount > 0) {
    lines.push(`🔴 ${data.barelyKnownCount} label(s) com cobertura <30% — áreas críticas que o sistema quase não conhece.`);
  }

  // Positive
  if (data.rPerN >= 2) {
    lines.push(`✓ Boa conectividade (R/N ${data.rPerN}) — os nós estão bem integrados.`);
  }
  if (data.temporalCoverage >= 80) {
    lines.push(`✓ ${data.temporalCoverage}% dos nós têm timestamp de criação — boa rastreabilidade temporal.`);
  }

  return lines.join(' ');
}

// ============================================================================
// MATURITY COMPUTATION
// ============================================================================

interface MaturityInput {
  totalLabels: number;
  totalNodes: number;
  totalRelationships: number;
  rPerN: number;
  overallCompleteness: number;
  temporalCoverage: number;
  updatedAtCoverage: number;
  orphanPercent: number;
  governanceScore: number;
  bigAnchoring: number;
}

function computeMaturityStage(input: MaturityInput) {
  const stageDefs = [
    {
      id: 0,
      name: 'Schema Definido',
      description: 'Labels e relationships nomeados, Meta-Grafo criado',
      criteria: [
        `${input.totalLabels} labels definidos`,
        'Tipos de relacionamento mapeados',
        'Propriedades documentadas por label',
      ],
      check: () => input.totalLabels >= 5,
      progress: () => Math.min(100, (input.totalLabels / 5) * 100),
    },
    {
      id: 1,
      name: 'Dados Base Ingeridos',
      description: 'Nós populados via ingestão (chat, docs, CSV, reuniões)',
      criteria: [
        `Pelo menos 50 nós no grafo (atual: ${input.totalNodes})`,
        `R/N ≥ 1.5 (atual: ${input.rPerN})`,
        `Completude ≥ 50% (atual: ${input.overallCompleteness}%)`,
      ],
      check: () => input.totalNodes >= 50 && input.rPerN >= 1.5 && input.overallCompleteness >= 50,
      progress: () => {
        const nodeProg = Math.min(33, (input.totalNodes / 50) * 33);
        const rnProg = Math.min(33, (input.rPerN / 1.5) * 33);
        const compProg = Math.min(34, (input.overallCompleteness / 50) * 34);
        return Math.min(100, Math.round(nodeProg + rnProg + compProg));
      },
    },
    {
      id: 2,
      name: 'Propriedades Enriquecidas',
      description: 'Propriedades preenchidas >80%, R/N forte, órfãos baixos',
      criteria: [
        `Completude >80% (atual: ${input.overallCompleteness}%)`,
        `R/N ≥ 2.0 (atual: ${input.rPerN})`,
        `Órfãos <10% (atual: ${toRound(input.orphanPercent)}%)`,
      ],
      check: () => input.overallCompleteness >= 80 && input.rPerN >= 2.0 && input.orphanPercent < 10,
      progress: () => {
        const compProg = Math.min(40, (input.overallCompleteness / 80) * 40);
        const rnProg = Math.min(30, (input.rPerN / 2.0) * 30);
        const orphanProg = input.orphanPercent < 10 ? 30 : Math.max(0, 30 - (input.orphanPercent - 10) * 2);
        return Math.min(100, Math.round(compProg + rnProg + orphanProg));
      },
    },
    {
      id: 3,
      name: 'Temporalidade Ativa',
      description: 'createdAt/updatedAt populados, nodes sendo atualizados ativamente',
      criteria: [
        `createdAt em >80% dos nós (atual: ${input.temporalCoverage}%)`,
        `updatedAt em >50% dos nós (atual: ${input.updatedAtCoverage}%)`,
        `Governança ≥ 60 (atual: ${input.governanceScore})`,
      ],
      check: () => input.temporalCoverage >= 80 && input.updatedAtCoverage >= 50 && input.governanceScore >= 60,
      progress: () => {
        const crProg = Math.min(40, (input.temporalCoverage / 80) * 40);
        const upProg = Math.min(35, (input.updatedAtCoverage / 50) * 35);
        const govProg = Math.min(25, (input.governanceScore / 60) * 25);
        return Math.min(100, Math.round(crProg + upProg + govProg));
      },
    },
    {
      id: 4,
      name: 'Curadoria Validada',
      description: 'Curador ontológico revisou e validou o grafo',
      criteria: [
        'Supernós identificados e documentados',
        `Nós órfãos <5% (atual: ${toRound(input.orphanPercent)}%)`,
        `Governança score >70 (atual: ${input.governanceScore})`,
        'Decisões logadas no grafo',
      ],
      check: () => input.orphanPercent < 5 && input.governanceScore >= 70,
      progress: () => {
        const orphanProg = input.orphanPercent < 5 ? 50 : Math.max(0, 50 - input.orphanPercent);
        const govProg = Math.min(50, (input.governanceScore / 70) * 50);
        return Math.min(100, orphanProg + govProg);
      },
    },
    {
      id: 5,
      name: 'Consciência Plena',
      description: 'BIG ancorado, 4 classes de memória, auto-monitoramento',
      criteria: [
        `BIG Anchoring >80% (atual: ${input.bigAnchoring}%)`,
        '4 classes de memória classificadas',
        'Tour se atualiza automaticamente',
        'Alertas proativos funcionando',
      ],
      check: () => input.bigAnchoring >= 80,
      progress: () => Math.min(100, (input.bigAnchoring / 80) * 100),
    },
  ];

  // Strictly sequential: stage N can only be achieved if N-1 is also achieved
  let blocked = false;
  let totalStage = 0;
  const stages = stageDefs.map((s) => {
    if (blocked) {
      return { id: s.id, name: s.name, description: s.description, criteria: s.criteria, status: 'pending' as const, progress: Math.round(s.progress()) };
    }

    const achieved = s.check();
    const progress = Math.round(s.progress());

    if (achieved) {
      totalStage = s.id + 1; // completed this stage
      return { id: s.id, name: s.name, description: s.description, criteria: s.criteria, status: 'achieved' as const, progress: 100 };
    }

    // Not achieved: this stage is in_progress, all subsequent are pending
    blocked = true;
    totalStage = s.id + (progress / 100);
    return { id: s.id, name: s.name, description: s.description, criteria: s.criteria, status: 'in_progress' as const, progress };
  });

  // Cap at 5.0 (there are 6 stages 0-5, but scale is 0-5)
  const cappedStage = Math.min(5, toRound(totalStage * (5 / 6), 1));

  return { stage: cappedStage, stages };
}

// ============================================================================
// GAP DETECTION
// ============================================================================

interface GapResult {
  question: string;
  reason: string;
  category: string;
  severity: string;
  targetLabel: string;
  targetNode?: string;
  resonanceType?: string;
  resonanceMessage?: string;
}

async function detectGaps(session: any): Promise<GapResult[]> {
  const gaps: GapResult[] = [];

  // Helper to add gap with resonance
  const addGap = (gap: Omit<GapResult, 'resonanceType' | 'resonanceMessage'>) => {
    const resonance = getResonance(gap.targetLabel, gap.category);
    gaps.push({
      ...gap,
      resonanceType: resonance?.type,
      resonanceMessage: resonance?.message,
    });
  };

  // Gap 1: Projects without owner
  try {
    const result = await session.run(`
      MATCH (p:Project)
      WHERE NOT (p)-[:OWNED_BY]->()
      RETURN p.name AS name
    `);
    const names = result.records.map((r: any) => r.get('name')).filter(Boolean);
    if (names.length > 0) {
      addGap({
        question: names.length === 1
          ? `O projeto '${names[0]}' pertence a quem?`
          : `Os ${names.length} projetos sem owner pertencem a quem?`,
        reason: `Projetos sem OWNED_BY: ${names.join(', ')}`,
        category: 'missing_relation',
        severity: 'medium',
        targetLabel: 'Project',
      });
    }
  } catch (e) { logger.warn('Gap: project owner failed', e); }

  // Gap 2: Stale nodes (>30 days without update)
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE n.updatedAt IS NOT NULL
        AND (NOT valueType(n.updatedAt) = 'STRING' OR (valueType(n.updatedAt) = 'STRING' AND n.updatedAt <> ''))
      WITH n, labels(n)[0] AS label, n.name AS name,
           CASE
             WHEN valueType(n.updatedAt) CONTAINS 'DATE' THEN n.updatedAt
             WHEN valueType(n.updatedAt) = 'STRING' AND size(n.updatedAt) > 4 THEN datetime(n.updatedAt)
             WHEN toInteger(n.updatedAt) > 0 THEN datetime({ epochMillis: toInteger(n.updatedAt) })
             ELSE NULL
           END AS updatedDt
      WHERE updatedDt IS NOT NULL AND updatedDt < datetime() - duration('P30D')
      WITH label, name, toInteger(duration.between(updatedDt, datetime()).days) AS days
      RETURN label, name, days
      ORDER BY days DESC
      LIMIT 5
    `);
    result.records.forEach((r: any) => {
      const name = r.get('name');
      const label = r.get('label');
      const days = toNum(r.get('days'));
      if (name && label && days > 30) {
        addGap({
          question: `O ${label} '${name}' ainda está atualizado?`,
          reason: `Última atualização há ${days} dias.`,
          category: 'stale_data',
          severity: days > 60 ? 'high' : 'medium',
          targetLabel: label,
          targetNode: name,
        });
      }
    });
  } catch (e) { logger.warn('Gap: stale nodes failed', e); }

  // Gap 3: Knowledge without SUPPORTS → Objective (BIG)
  try {
    const result = await session.run(`
      MATCH (k:Knowledge)
      WHERE NOT (k)-[:SUPPORTS]->(:Objective)
      RETURN count(k) AS count
    `);
    const count = toNum(result.records[0]?.get('count'));
    if (count > 0) {
      addGap({
        question: `${count} Knowledge nodes não estão ligados a objetivos estratégicos. Quais são os vínculos?`,
        reason: `${count} Knowledge sem SUPPORTS → Objective (BIG não ancorado)`,
        category: 'missing_relation',
        severity: count > 20 ? 'high' : 'medium',
        targetLabel: 'Knowledge',
      });
    }
  } catch (e) { logger.warn('Gap: BIG anchoring failed', e); }

  // Gap 4: Knowledge without validation
  try {
    const result = await session.run(`
      MATCH (k:Knowledge)
      WHERE k.validated IS NULL OR k.validated = false
      RETURN count(k) AS count
    `);
    const count = toNum(result.records[0]?.get('count'));
    if (count > 0) {
      addGap({
        question: `Os ${count} Knowledge nodes foram revisados por alguém?`,
        reason: `${count} Knowledge nodes sem validação humana`,
        category: 'no_validation',
        severity: 'high',
        targetLabel: 'Knowledge',
      });
    }
  } catch (e) { logger.warn('Gap: validation failed', e); }

  // Gap 5: Low process coverage
  try {
    const result = await session.run(`
      OPTIONAL MATCH (p:Process)
      RETURN count(p) AS count
    `);
    const count = toNum(result.records[0]?.get('count'));
    if (count < 10) {
      addGap({
        question: count === 0
          ? 'Existem processos operacionais documentados na organização?'
          : `Apenas ${count} processos mapeados. Que outros processos existem?`,
        reason: `${count} Process nodes (esperado: ~20). Usar PIA para mapear.`,
        category: 'low_coverage',
        severity: count < 5 ? 'high' : 'medium',
        targetLabel: 'Process',
      });
    }
  } catch (e) { logger.warn('Gap: process coverage failed', e); }

  // Gap 6: Company missing vision/mission
  try {
    const result = await session.run(`
      MATCH (c:Company)
      WHERE c.vision IS NULL OR c.mission IS NULL
      RETURN c.name AS name
    `);
    result.records.forEach((r: any) => {
      const name = r.get('name');
      if (name) {
        addGap({
          question: 'Qual é a visão e missão formal da empresa?',
          reason: `Company '${name}' com propriedades vision/mission vazias`,
          category: 'missing_relation',
          severity: 'low',
          targetLabel: 'Company',
          targetNode: name,
        });
      }
    });
  } catch (e) { logger.warn('Gap: company vision failed', e); }

  // Gap 7: Documents not linked to Knowledge
  try {
    const result = await session.run(`
      MATCH (d:Document)
      WHERE NOT (d)<-[:EXTRACTED_FROM]-(:Knowledge)
      RETURN count(d) AS count
    `);
    const count = toNum(result.records[0]?.get('count'));
    if (count > 0) {
      addGap({
        question: `${count} documento(s) não geraram Knowledge. Devem ser reprocessados?`,
        reason: `Documents sem EXTRACTED_FROM ← Knowledge`,
        category: 'low_coverage',
        severity: count > 10 ? 'high' : 'low',
        targetLabel: 'Document',
      });
    }
  } catch (e) { logger.warn('Gap: doc-knowledge link failed', e); }

  // Gap 8: Users without department membership
  try {
    const result = await session.run(`
      MATCH (u:User)
      WHERE NOT (u)-[:MEMBER_OF]->(:Department)
      RETURN count(u) AS count
    `);
    const count = toNum(result.records[0]?.get('count'));
    if (count > 0) {
      addGap({
        question: `${count} usuário(s) não estão vinculados a nenhum departamento. Qual é a alocação?`,
        reason: `Users sem MEMBER_OF → Department`,
        category: 'missing_relation',
        severity: count > 5 ? 'high' : 'medium',
        targetLabel: 'User',
      });
    }
  } catch (e) { logger.warn('Gap: user department failed', e); }

  return gaps;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /ontology/tour/snapshot
 * Compute full ontological tour snapshot from current graph state
 */
router.get('/snapshot', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // ── 1. Global counts ──
    const countsResult = await session.run(`
      MATCH (n)
      WITH count(n) AS nodes
      MATCH ()-[r]->()
      WITH nodes, count(r) AS rels
      RETURN nodes, rels,
             CASE WHEN nodes > 0 THEN toFloat(rels) / nodes ELSE 0 END AS rPerN
    `);
    const c = countsResult.records[0];
    const totalNodes = toNum(c?.get('nodes'));
    const totalRels = toNum(c?.get('rels'));
    const rPerN = toRound(c?.get('rPerN'));

    // ── 2. Label counts ──
    const labelCountsResult = await session.run(`
      CALL db.labels() YIELD label
      CALL {
        WITH label
        MATCH (n) WHERE label IN labels(n)
        RETURN count(n) AS cnt
      }
      RETURN label, cnt
      ORDER BY cnt DESC
    `);
    const labelCounts: Record<string, number> = {};
    labelCountsResult.records.forEach((r: any) => {
      labelCounts[r.get('label')] = toNum(r.get('cnt'));
    });
    const totalLabels = Object.keys(labelCounts).length;

    // ── 3. Avg connections per label ──
    const connResult = await session.run(`
      MATCH (n)
      WITH labels(n)[0] AS label, COUNT { (n)--() } AS deg
      RETURN label, avg(toFloat(deg)) AS avgConn
    `);
    const avgConnByLabel: Record<string, number> = {};
    connResult.records.forEach((r: any) => {
      avgConnByLabel[r.get('label')] = toRound(r.get('avgConn'));
    });

    // ── 4. Freshness per label ──
    const freshResult = await session.run(`
      MATCH (n)
      WHERE n.createdAt IS NOT NULL OR n.updatedAt IS NOT NULL
      WITH labels(n)[0] AS label, COALESCE(n.updatedAt, n.createdAt) AS t
      WHERE t IS NOT NULL AND (NOT valueType(t) = 'STRING' OR (valueType(t) = 'STRING' AND size(toString(t)) > 4))
      WITH label,
           CASE
             WHEN valueType(t) CONTAINS 'DATE' THEN toFloat(duration.between(t, datetime()).days)
             WHEN valueType(t) = 'STRING' AND size(t) > 4 THEN toFloat(duration.between(datetime(t), datetime()).days)
             WHEN toInteger(t) > 0 THEN toFloat(timestamp() - toInteger(t)) / 86400000.0
             ELSE NULL
           END AS daysSince
      WHERE daysSince IS NOT NULL
      RETURN label, avg(daysSince) AS avgFreshness
    `);
    const freshnessByLabel: Record<string, number> = {};
    freshResult.records.forEach((r: any) => {
      freshnessByLabel[r.get('label')] = Math.round(toNum(r.get('avgFreshness')));
    });

    // ── 5. Property completeness per label ──
    // Schema-declared properties per label
    const schemaResult = await session.run(`
      CALL db.schema.nodeTypeProperties() YIELD nodeLabels, propertyName
      UNWIND nodeLabels AS label
      WITH label, count(DISTINCT propertyName) AS expectedProps
      RETURN label, expectedProps
    `);
    const expectedPropsByLabel: Record<string, number> = {};
    schemaResult.records.forEach((r: any) => {
      expectedPropsByLabel[r.get('label')] = toNum(r.get('expectedProps'));
    });

    // Actual avg property count per node
    const actualResult = await session.run(`
      MATCH (n)
      WITH labels(n)[0] AS label, toFloat(size(keys(n))) AS propCount
      RETURN label, avg(propCount) AS avgProps
    `);
    const actualPropsByLabel: Record<string, number> = {};
    actualResult.records.forEach((r: any) => {
      actualPropsByLabel[r.get('label')] = toRound(r.get('avgProps'));
    });

    const completenessByLabel: Record<string, number> = {};
    let totalCompleteness = 0;
    let completenessCount = 0;
    for (const label of Object.keys(labelCounts)) {
      const expected = expectedPropsByLabel[label] || 1;
      const actual = actualPropsByLabel[label] || 0;
      const pct = Math.min(100, Math.round((actual / expected) * 100));
      completenessByLabel[label] = pct;
      totalCompleteness += pct;
      completenessCount++;
    }
    const overallCompleteness = completenessCount > 0
      ? Math.round(totalCompleteness / completenessCount)
      : 0;

    // ── 6. BIG Anchoring ──
    let bigAnchoring = 0;
    try {
      const bigResult = await session.run(`
        MATCH (k:Knowledge)
        WITH count(k) AS total
        OPTIONAL MATCH (k2:Knowledge)-[:SUPPORTS]->(:Objective)
        WITH total, count(DISTINCT k2) AS anchored
        RETURN CASE WHEN total > 0 THEN toFloat(anchored) / total * 100 ELSE 0 END AS pct
      `);
      bigAnchoring = Math.round(toNum(bigResult.records[0]?.get('pct')));
    } catch (e) { logger.warn('BIG anchoring query failed', e); }

    // ── 7. Temporal coverage ──
    let temporalCoverage = 0;
    try {
      const tempResult = await session.run(`
        MATCH (n)
        WITH count(n) AS total,
             count(CASE WHEN n.createdAt IS NOT NULL THEN 1 END) AS withCreated
        RETURN CASE WHEN total > 0 THEN toFloat(withCreated) / total * 100 ELSE 0 END AS pct
      `);
      temporalCoverage = Math.round(toNum(tempResult.records[0]?.get('pct')));
    } catch (e) { logger.warn('Temporal coverage query failed', e); }

    // ── 7b. updatedAt coverage ──
    let updatedAtCoverage = 0;
    try {
      const upResult = await session.run(`
        MATCH (n)
        WITH count(n) AS total,
             count(CASE WHEN n.updatedAt IS NOT NULL THEN 1 END) AS withUpdated
        RETURN CASE WHEN total > 0 THEN toFloat(withUpdated) / total * 100 ELSE 0 END AS pct
      `);
      updatedAtCoverage = Math.round(toNum(upResult.records[0]?.get('pct')));
    } catch (e) { logger.warn('updatedAt coverage query failed', e); }

    // ── 8. Orphan count ──
    let orphanCount = 0;
    try {
      const orphanResult = await session.run(`
        MATCH (n) WHERE NOT (n)--() RETURN count(n) AS orphans
      `);
      orphanCount = toNum(orphanResult.records[0]?.get('orphans'));
    } catch (e) { logger.warn('Orphan query failed', e); }
    const orphanPercent = totalNodes > 0 ? toRound((orphanCount / totalNodes) * 100) : 0;

    // ── 9. Company name + size ──
    let companyName = 'Organização';
    let companySize: number | null = null;
    try {
      const compResult = await session.run(`
        MATCH (c:Company)
        RETURN c.name AS name, c.employeeCount AS empCount, c.size AS size
        LIMIT 1
      `);
      const rec = compResult.records[0];
      companyName = rec?.get('name') || 'Organização';
      companySize = toNum(rec?.get('empCount')) || toNum(rec?.get('size')) || null;
    } catch (e) { logger.warn('Company name/size query failed', e); }

    // Compute expected counts dynamically from company size
    const { expected: expectedCounts, source: expectedCountSource } =
      computeExpectedCounts(companySize, labelCounts);

    // ── 10. Governance score (heuristic) ──
    const governanceScore = Math.round(
      Math.max(0, Math.min(100,
        (overallCompleteness * 0.3) +
        (Math.max(0, 100 - orphanPercent * 5) * 0.3) +
        (Math.min(100, rPerN * 50) * 0.2) +
        (temporalCoverage * 0.2)
      ))
    );

    // ── 11. Maturity ──
    const maturity = computeMaturityStage({
      totalLabels,
      totalNodes,
      totalRelationships: totalRels,
      rPerN,
      overallCompleteness,
      temporalCoverage,
      updatedAtCoverage,
      orphanPercent,
      governanceScore,
      bigAnchoring,
    });

    // ── 12. Label coverage array ──
    const labelCoverage = Object.entries(labelCounts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        nodeCount: count,
        expectedCount: expectedCounts[label] || count,
        coveragePercent: Math.min(100, Math.round(
          (count / (expectedCounts[label] || count)) * 100
        )),
        propertyCompleteness: completenessByLabel[label] || 0,
        avgConnections: avgConnByLabel[label] || 0,
        freshnessDays: freshnessByLabel[label] || 0,
        bigAnchoring: label === 'Knowledge' ? bigAnchoring
          : (label === 'Objective' || label === 'OKR') ? 100
          : 0,
        validatedPercent: 0,
        trend: 'stable' as const,
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount);

    // ── 13. Knowledge zones ──
    const wellKnown = labelCoverage
      .filter((lc) => lc.coveragePercent >= 70)
      .map((lc) => `${lc.label}: ${lc.nodeCount} nós, ${lc.coveragePercent}% do esperado`);

    const partiallyKnown = labelCoverage
      .filter((lc) => lc.coveragePercent >= 30 && lc.coveragePercent < 70)
      .map((lc) => `${lc.label}: ${lc.nodeCount}/${lc.expectedCount} nós (${lc.coveragePercent}%)`);

    const barelyKnown = labelCoverage
      .filter((lc) => lc.coveragePercent < 30)
      .map((lc) => `${lc.label}: apenas ${lc.nodeCount} nós (esperado ${lc.expectedCount})`);

    // ── 14. Gap detection ──
    const rawGaps = await detectGaps(session);
    const suggestedQuestions = rawGaps.map((g, i) => ({
      id: `q${i + 1}`,
      ...g,
    }));

    // ── 15. Key numbers ──
    const keyNumbers = [
      { label: 'Nós totais', value: String(totalNodes), trend: 'stable' as const },
      { label: 'Relações totais', value: String(totalRels), trend: 'stable' as const },
      { label: 'R/N', value: String(rPerN), trend: 'stable' as const },
      { label: 'Completude props', value: `${overallCompleteness}%`, trend: 'stable' as const },
      { label: 'Governance Score', value: `${governanceScore}/100`, trend: 'stable' as const },
      { label: 'BIG Anchoring', value: `${bigAnchoring}%`, trend: 'stable' as const },
    ];

    // ── Assemble snapshot ──
    const snapshot = {
      version: `V${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
      createdAt: new Date().toISOString(),
      maturityStage: maturity.stage,
      totalNodes,
      totalRelationships: totalRels,
      totalLabels,
      rPerN,
      propertyCompleteness: overallCompleteness,
      governanceScore,
      temporalCoverage,
      bigAnchoring,
      companyName,
      companySize,
      expectedCountSource,
      updatedAtCoverage,
      synthesisText: generateSynthesisText({
        maturityStage: maturity.stage,
        totalNodes,
        totalRels,
        rPerN,
        overallCompleteness,
        temporalCoverage,
        updatedAtCoverage,
        orphanPercent,
        governanceScore,
        bigAnchoring,
        gapCount: suggestedQuestions.length,
        highGapCount: suggestedQuestions.filter((q: any) => q.severity === 'high').length,
        barelyKnownCount: barelyKnown.length,
        companyName,
      }),
      stages: maturity.stages,
      labelCoverage,
      suggestedQuestions,
      keyNumbers,
      wellKnown,
      partiallyKnown,
      barelyKnown,
    };

    res.json({ success: true, data: snapshot });
  } catch (error) {
    logger.error('Tour snapshot error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compute tour snapshot',
    });
  } finally {
    await session.close();
  }
});

export default router;
