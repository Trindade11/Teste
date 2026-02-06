import { Router, Request, Response } from 'express';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// INTERFACES
// ============================================================================

interface NodeLabel {
  label: string;
  count: number;
  properties: string[];
  description: string;
}

interface RelationshipType {
  type: string;
  count: number;
  fromLabels: string[];
  toLabels: string[];
  description: string;
}

interface TaxonomyNode {
  id: string;
  name: string;
  type: string;
  level: number;
  children: TaxonomyNode[];
  properties: Record<string, unknown>;
}

interface ThesaurusEntry {
  id: string;
  canonicalName: string;
  aliases: string[];
  type: string;
  context: string;
}

interface IngestionSource {
  name: string;
  description: string;
  nodeTypes: string[];
  relationshipTypes: string[];
  nodeCount: number;
  lastIngestion: string | null;
}

interface OntologyStats {
  totalNodes: number;
  totalRelationships: number;
  nodeLabels: NodeLabel[];
  relationshipTypes: RelationshipType[];
  lastUpdated: string;
}

// ============================================================================
// ONTOLOGY OVERVIEW
// ============================================================================

/**
 * GET /ontology/stats
 * Get overall ontology statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Get node counts by label
    const nodeLabelsResult = await session.run(`
      CALL db.labels() YIELD label
      CALL {
        WITH label
        MATCH (n)
        WHERE label IN labels(n)
        RETURN count(n) AS count
      }
      RETURN label, count
      ORDER BY count DESC
    `);

    // Get relationship counts by type
    const relTypesResult = await session.run(`
      CALL db.relationshipTypes() YIELD relationshipType
      CALL {
        WITH relationshipType
        MATCH ()-[r]->()
        WHERE type(r) = relationshipType
        RETURN count(r) AS count
      }
      RETURN relationshipType, count
      ORDER BY count DESC
    `);

    // Get total counts
    const totalNodesResult = await session.run('MATCH (n) RETURN count(n) AS total');
    const totalRelsResult = await session.run('MATCH ()-[r]->() RETURN count(r) AS total');

    const nodeLabels: NodeLabel[] = nodeLabelsResult.records.map((r) => ({
      label: r.get('label'),
      count: r.get('count').toNumber ? r.get('count').toNumber() : r.get('count'),
      properties: [],
      description: getNodeDescription(r.get('label')),
    }));

    const relationshipTypes: RelationshipType[] = relTypesResult.records.map((r) => ({
      type: r.get('relationshipType'),
      count: r.get('count').toNumber ? r.get('count').toNumber() : r.get('count'),
      fromLabels: [],
      toLabels: [],
      description: getRelationshipDescription(r.get('relationshipType')),
    }));

    const stats: OntologyStats = {
      totalNodes: totalNodesResult.records[0]?.get('total')?.toNumber?.() || 0,
      totalRelationships: totalRelsResult.records[0]?.get('total')?.toNumber?.() || 0,
      nodeLabels,
      relationshipTypes,
      lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Ontology stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ontology stats',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /ontology/schema
 * Get the full schema (nodes with properties and relationships)
 */
router.get('/schema', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Get node labels with properties
    const schemaResult = await session.run(`
      CALL db.schema.nodeTypeProperties() YIELD nodeLabels, propertyName, propertyTypes
      RETURN nodeLabels, collect({name: propertyName, types: propertyTypes}) AS properties
    `);

    // Get relationship schema
    const relSchemaResult = await session.run(`
      CALL db.schema.relTypeProperties() YIELD relType, propertyName, propertyTypes
      RETURN relType, collect({name: propertyName, types: propertyTypes}) AS properties
    `);

    // Get relationship patterns (from -> to)
    const patternsResult = await session.run(`
      MATCH (a)-[r]->(b)
      WITH labels(a) AS fromLabels, type(r) AS relType, labels(b) AS toLabels
      RETURN DISTINCT fromLabels, relType, toLabels
      LIMIT 100
    `);

    const nodeSchema = schemaResult.records.map((r) => ({
      labels: r.get('nodeLabels'),
      properties: r.get('properties'),
    }));

    const relationshipSchema = relSchemaResult.records.map((r) => ({
      type: r.get('relType'),
      properties: r.get('properties'),
    }));

    const patterns = patternsResult.records.map((r) => ({
      from: r.get('fromLabels'),
      relationship: r.get('relType'),
      to: r.get('toLabels'),
    }));

    res.json({
      success: true,
      data: {
        nodes: nodeSchema,
        relationships: relationshipSchema,
        patterns,
      },
    });
  } catch (error) {
    logger.error('Ontology schema error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ontology schema',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// TAXONOMY VIEW
// ============================================================================

/**
 * GET /ontology/taxonomy
 * Get hierarchical taxonomy of organizational concepts
 */
router.get('/taxonomy', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Build taxonomy from Company -> Department -> User hierarchy
    const orgResult = await session.run(`
      MATCH (c:Company)
      OPTIONAL MATCH (c)-[:HAS_DEPARTMENT|HAS_AREA]->(d:Department)
      OPTIONAL MATCH (d)<-[:MEMBER_OF]-(u:User)
      RETURN c, collect(DISTINCT d) AS departments, collect(DISTINCT u) AS users
    `);

    // Build taxonomy from Objective -> OKR hierarchy
    const strategyResult = await session.run(`
      MATCH (obj:Objective)
      OPTIONAL MATCH (obj)<-[:BELONGS_TO_OBJECTIVE]-(okr:OKR)
      RETURN obj, collect(DISTINCT okr) AS okrs
    `);

    // Build taxonomy from Project hierarchy
    const projectsResult = await session.run(`
      MATCH (p:Project)
      WHERE p.status <> 'archived'
      OPTIONAL MATCH (p)-[:LINKED_TO_OKR]->(okr:OKR)
      RETURN p, collect(DISTINCT okr) AS linkedOkrs
    `);

    // Build the taxonomy tree
    const taxonomy: TaxonomyNode[] = [];

    // Organization branch
    const orgNodes = orgResult.records.map((r) => {
      const company = r.get('c')?.properties || {};
      const departments = r.get('departments') || [];
      
      return {
        id: company.id || 'company',
        name: company.name || 'Organização',
        type: 'Company',
        level: 0,
        properties: { ...company },
        children: departments.map((d: any) => ({
          id: d.properties?.id || d.properties?.name,
          name: d.properties?.name || 'Departamento',
          type: 'Department',
          level: 1,
          properties: { ...d.properties },
          children: [],
        })),
      };
    });

    if (orgNodes.length > 0) {
      taxonomy.push({
        id: 'org-root',
        name: 'Estrutura Organizacional',
        type: 'Root',
        level: 0,
        properties: {},
        children: orgNodes,
      });
    }

    // Strategy branch
    const strategyNodes = strategyResult.records.map((r) => {
      const obj = r.get('obj')?.properties || {};
      const okrs = r.get('okrs') || [];
      
      return {
        id: obj.id,
        name: obj.title || 'Objetivo',
        type: 'Objective',
        level: 1,
        properties: { status: obj.status, targetDate: obj.targetDate },
        children: okrs.map((okr: any) => ({
          id: okr.properties?.id,
          name: okr.properties?.title || 'OKR',
          type: 'OKR',
          level: 2,
          properties: {
            targetValue: okr.properties?.targetValue,
            currentValue: okr.properties?.currentValue,
            status: okr.properties?.status,
          },
          children: [],
        })),
      };
    });

    if (strategyNodes.length > 0) {
      taxonomy.push({
        id: 'strategy-root',
        name: 'Estratégia (BIG)',
        type: 'Root',
        level: 0,
        properties: {},
        children: strategyNodes,
      });
    }

    // Projects branch
    const projectNodes = projectsResult.records.map((r) => {
      const proj = r.get('p')?.properties || {};
      const okrs = r.get('linkedOkrs') || [];
      
      return {
        id: proj.id,
        name: proj.name || 'Projeto',
        type: 'Project',
        level: 1,
        properties: {
          status: proj.status,
          phase: proj.phase,
          department: proj.department,
        },
        children: okrs.map((okr: any) => ({
          id: okr.properties?.id,
          name: `→ ${okr.properties?.title || 'OKR'}`,
          type: 'LinkedOKR',
          level: 2,
          properties: {},
          children: [],
        })),
      };
    });

    if (projectNodes.length > 0) {
      taxonomy.push({
        id: 'projects-root',
        name: 'Projetos',
        type: 'Root',
        level: 0,
        properties: {},
        children: projectNodes,
      });
    }

    res.json({ success: true, data: taxonomy });
  } catch (error) {
    logger.error('Ontology taxonomy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch taxonomy',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// THESAURUS VIEW
// ============================================================================

/**
 * GET /ontology/thesaurus
 * Get thesaurus entries (canonical names and aliases)
 */
router.get('/thesaurus', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Get Users with potential aliases (name variations)
    const usersResult = await session.run(`
      MATCH (u:User)
      RETURN u.id AS id, u.name AS canonicalName, 
             u.email AS email, u.jobTitle AS role,
             'Person' AS type
      ORDER BY u.name
    `);

    // Get Departments
    const deptResult = await session.run(`
      MATCH (d:Department)
      RETURN d.id AS id, d.name AS canonicalName,
             'Department' AS type
      ORDER BY d.name
    `);

    // Get Companies
    const companyResult = await session.run(`
      MATCH (c:Company)
      RETURN c.id AS id, c.name AS canonicalName,
             c.shortName AS alias,
             'Organization' AS type
      ORDER BY c.name
    `);

    // Get Knowledge entities with tags
    const knowledgeResult = await session.run(`
      MATCH (k:Knowledge)
      WHERE k.tags IS NOT NULL
      RETURN k.id AS id, k.title AS canonicalName,
             k.tags AS aliases, k.type AS subtype,
             'Knowledge' AS type
      LIMIT 50
    `);

    // Get Project tags as potential thesaurus entries
    const projectTagsResult = await session.run(`
      MATCH (p:Project)
      WHERE p.tags IS NOT NULL AND p.tags <> '[]'
      RETURN p.id AS id, p.name AS canonicalName,
             p.tags AS tagsJson,
             'Project' AS type
    `);

    const thesaurus: ThesaurusEntry[] = [];

    // Process users
    usersResult.records.forEach((r) => {
      const name = r.get('canonicalName');
      const email = r.get('email') || '';
      const aliases: string[] = [];
      
      // Extract first name and last name as potential aliases
      if (name) {
        const parts = name.split(' ');
        if (parts.length > 1) {
          aliases.push(parts[0]); // First name
          aliases.push(parts[parts.length - 1]); // Last name
        }
        // Email prefix as alias
        if (email && email.includes('@')) {
          aliases.push(email.split('@')[0]);
        }
      }

      thesaurus.push({
        id: r.get('id') || '',
        canonicalName: name || '',
        aliases: aliases.filter(Boolean),
        type: 'Person',
        context: r.get('role') || '',
      });
    });

    // Process departments
    deptResult.records.forEach((r) => {
      thesaurus.push({
        id: r.get('id') || r.get('canonicalName'),
        canonicalName: r.get('canonicalName') || '',
        aliases: [],
        type: 'Department',
        context: 'Área organizacional',
      });
    });

    // Process companies
    companyResult.records.forEach((r) => {
      const aliases = r.get('alias') ? [r.get('alias')] : [];
      thesaurus.push({
        id: r.get('id') || '',
        canonicalName: r.get('canonicalName') || '',
        aliases,
        type: 'Organization',
        context: 'Empresa/Organização',
      });
    });

    // Process project tags
    projectTagsResult.records.forEach((r) => {
      try {
        const tagsJson = r.get('tagsJson');
        const tags = typeof tagsJson === 'string' ? JSON.parse(tagsJson) : tagsJson;
        if (Array.isArray(tags) && tags.length > 0) {
          thesaurus.push({
            id: r.get('id') || '',
            canonicalName: r.get('canonicalName') || '',
            aliases: tags,
            type: 'Project',
            context: 'Tags do projeto',
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    res.json({ success: true, data: thesaurus });
  } catch (error) {
    logger.error('Ontology thesaurus error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch thesaurus',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// INGESTION SOURCES VIEW
// ============================================================================

/**
 * GET /ontology/ingestion-sources
 * Get summary of each ingestion source
 */
router.get('/ingestion-sources', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const sources: IngestionSource[] = [];

    // 1. Organizational Chart ingestion
    const orgCount = await session.run(`
      MATCH (u:User) RETURN count(u) AS userCount
    `);
    const deptCount = await session.run(`
      MATCH (d:Department) RETURN count(d) AS deptCount
    `);

    sources.push({
      name: 'Organograma',
      description: 'Estrutura organizacional: usuários, departamentos, hierarquias',
      nodeTypes: ['User', 'Department', 'Company'],
      relationshipTypes: ['MEMBER_OF', 'REPORTS_TO', 'WORKS_IN', 'HAS_DEPARTMENT'],
      nodeCount: (orgCount.records[0]?.get('userCount')?.toNumber?.() || 0) +
                 (deptCount.records[0]?.get('deptCount')?.toNumber?.() || 0),
      lastIngestion: null,
    });

    // 2. Strategic Objectives / OKRs ingestion
    const objCount = await session.run(`
      MATCH (o:Objective) RETURN count(o) AS count
    `);
    const okrCount = await session.run(`
      MATCH (o:OKR) RETURN count(o) AS count
    `);

    sources.push({
      name: 'Objetivos Estratégicos',
      description: 'OKRs e objetivos estratégicos vinculados ao BIG',
      nodeTypes: ['Objective', 'OKR'],
      relationshipTypes: ['MEASURED_BY', 'BELONGS_TO_OBJECTIVE', 'OWNED_BY'],
      nodeCount: (objCount.records[0]?.get('count')?.toNumber?.() || 0) +
                 (okrCount.records[0]?.get('count')?.toNumber?.() || 0),
      lastIngestion: null,
    });

    // 3. Projects ingestion
    const projCount = await session.run(`
      MATCH (p:Project) RETURN count(p) AS count
    `);

    sources.push({
      name: 'Projetos',
      description: 'Projetos organizacionais vinculados aos OKRs',
      nodeTypes: ['Project', 'Milestone'],
      relationshipTypes: ['LINKED_TO_OKR', 'OWNED_BY', 'BELONGS_TO', 'HAS_TEAM_MEMBER', 'SUPERSEDES'],
      nodeCount: projCount.records[0]?.get('count')?.toNumber?.() || 0,
      lastIngestion: null,
    });

    // 4. Meeting Transcripts ingestion
    const docCount = await session.run(`
      MATCH (d:Document) WHERE d.type = 'transcript' OR d.sourceType = 'meeting'
      RETURN count(d) AS count
    `);
    const convCount = await session.run(`
      MATCH (c:Conversation) RETURN count(c) AS count
    `);

    sources.push({
      name: 'Transcrições de Reunião',
      description: 'Transcrições de reuniões do Teams/Zoom processadas',
      nodeTypes: ['Document', 'Conversation', 'Message', 'Knowledge'],
      relationshipTypes: ['HAS_CHUNK', 'EXTRACTED_FROM', 'MENTIONS', 'CONTAINS'],
      nodeCount: (docCount.records[0]?.get('count')?.toNumber?.() || 0) +
                 (convCount.records[0]?.get('count')?.toNumber?.() || 0),
      lastIngestion: null,
    });

    // 5. Knowledge Base
    const knowledgeCount = await session.run(`
      MATCH (k:Knowledge) RETURN count(k) AS count
    `);

    sources.push({
      name: 'Base de Conhecimento',
      description: 'Conhecimento extraído e curado (4 classes de memória)',
      nodeTypes: ['Knowledge', 'Chunk'],
      relationshipTypes: ['SUPPORTS', 'RELATES_TO', 'GENERATED_FROM'],
      nodeCount: knowledgeCount.records[0]?.get('count')?.toNumber?.() || 0,
      lastIngestion: null,
    });

    res.json({ success: true, data: sources });
  } catch (error) {
    logger.error('Ontology ingestion sources error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ingestion sources',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// GRAPH VIEW (for visualization)
// ============================================================================

/**
 * GET /ontology/graph
 * Get graph data for visualization (nodes and edges)
 */
router.get('/graph', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { limit = 100, nodeTypes } = req.query;
    const nodeTypeFilter = nodeTypes ? (nodeTypes as string).split(',') : null;

    let query = `
      MATCH (n)
      ${nodeTypeFilter ? `WHERE any(label IN labels(n) WHERE label IN $nodeTypes)` : ''}
      WITH n LIMIT toInteger($limit)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
    `;

    const result = await session.run(query, {
      limit: parseInt(limit as string, 10),
      nodeTypes: nodeTypeFilter,
    });

    const nodesMap = new Map<string, any>();
    const edges: any[] = [];

    result.records.forEach((record) => {
      const n = record.get('n');
      const r = record.get('r');
      const m = record.get('m');

      if (n) {
        const nodeId = n.identity.toString();
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            labels: n.labels,
            properties: {
              ...n.properties,
              _displayName: n.properties.name || n.properties.title || n.properties.id || nodeId,
            },
          });
        }
      }

      if (m) {
        const nodeId = m.identity.toString();
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            labels: m.labels,
            properties: {
              ...m.properties,
              _displayName: m.properties.name || m.properties.title || m.properties.id || nodeId,
            },
          });
        }
      }

      if (r && n && m) {
        edges.push({
          id: r.identity.toString(),
          source: n.identity.toString(),
          target: m.identity.toString(),
          type: r.type,
          properties: r.properties,
        });
      }
    });

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodesMap.values()),
        edges,
      },
    });
  } catch (error) {
    logger.error('Ontology graph error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch graph data',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNodeDescription(label: string): string {
  const descriptions: Record<string, string> = {
    User: 'Usuários do sistema (colaboradores, gestores)',
    Department: 'Departamentos e áreas organizacionais',
    Company: 'Empresas e organizações',
    Objective: 'Objetivos estratégicos da organização',
    OKR: 'Key Results mensuráveis vinculados aos objetivos',
    Project: 'Projetos organizacionais',
    Knowledge: 'Unidades de conhecimento extraídas e curadas',
    Document: 'Documentos ingeridos (reuniões, relatórios)',
    Chunk: 'Trechos de documentos para busca semântica',
    Conversation: 'Conversas e histórico de chat',
    Message: 'Mensagens individuais',
    Task: 'Tarefas e ações geradas',
    Plan: 'Planos de ação',
    Agent: 'Agentes de IA configurados',
  };
  return descriptions[label] || `Entidade do tipo ${label}`;
}

function getRelationshipDescription(type: string): string {
  const descriptions: Record<string, string> = {
    MEMBER_OF: 'Usuário é membro de um departamento',
    REPORTS_TO: 'Usuário reporta a outro usuário (hierarquia)',
    WORKS_IN: 'Usuário trabalha em uma empresa',
    HAS_DEPARTMENT: 'Empresa possui departamento',
    MEASURED_BY: 'Objetivo é medido por OKR',
    BELONGS_TO_OBJECTIVE: 'OKR pertence a um objetivo',
    OWNED_BY: 'Entidade é de responsabilidade de um usuário',
    BELONGS_TO: 'Entidade pertence a um departamento',
    LINKED_TO_OKR: 'Projeto está vinculado a um OKR',
    HAS_TEAM_MEMBER: 'Projeto tem membro na equipe',
    SUPERSEDES: 'Nova versão substitui versão anterior',
    SUPPORTS: 'Conhecimento suporta um objetivo',
    EXTRACTED_FROM: 'Conhecimento extraído de documento',
    MENTIONS: 'Documento menciona entidade',
    HAS_CHUNK: 'Documento possui chunk',
    GENERATES: 'Entidade gera outra entidade',
  };
  return descriptions[type] || `Relacionamento do tipo ${type}`;
}

export default router;
