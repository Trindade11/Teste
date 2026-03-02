import { Router, Request, Response } from 'express';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import neo4j from 'neo4j-driver';

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

interface DynamicTaxonomyLabel {
  label: string;
  count: number;
  description: string;
  empty: boolean;
  undeclared: boolean;
  children: DynamicTaxonomyLabel[];
  properties: Array<{ name: string; types: string[] }>;
}

interface DynamicTaxonomyCategory {
  name: string;
  displayName: string;
  labels: DynamicTaxonomyLabel[];
}

interface TaxonomyGap {
  label: string;
  category: string;
  issue: 'empty' | 'undeclared';
  message: string;
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

/**
 * GET /ontology/taxonomy/dynamic
 * Get dynamic taxonomy based on Meta-Graph (SchemaLabel categories)
 * This endpoint builds taxonomy from actual graph structure, not hardcoded branches
 */
router.get('/taxonomy/dynamic', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // ── 1. Load SchemaLabel definitions from Meta-Graph ──
    let schemaLabels: Array<{ name: string; category: string; description: string }> = [];
    let hasMetaGraph = false;

    try {
      const schemaResult = await session.run(`
        MATCH (sl:SchemaLabel)
        RETURN sl.name AS name, sl.category AS category, sl.description AS description
        ORDER BY sl.category, sl.name
      `);
      schemaLabels = schemaResult.records.map(r => ({
        name: r.get('name'),
        category: r.get('category') || 'unknown',
        description: r.get('description') || '',
      }));
      hasMetaGraph = schemaLabels.length > 0;
    } catch {
      // Meta-Graph not bootstrapped yet
    }

    // ── 2. Get actual labels and counts from the graph ──
    const actualLabelsResult = await session.run(`
      CALL db.labels() YIELD label
      CALL { WITH label MATCH (n) WHERE label IN labels(n) RETURN count(n) AS cnt }
      RETURN label, cnt
      ORDER BY cnt DESC
    `);

    const actualLabels = actualLabelsResult.records.map(r => ({
      label: r.get('label') as string,
      count: r.get('cnt')?.toNumber?.() || (r.get('cnt') as number),
    }));

    // Filter out meta-graph labels from taxonomy
    const metaLabels = new Set(['SchemaLabel', 'SchemaRel', 'SchemaProp', 'QueryProfile', 'AccessPolicy', 'CypherTemplate', 'SchemaVersion']);
    const dataLabels = actualLabels.filter(l => !metaLabels.has(l.label));

    // 2.5 Get properties for all labels
    const propertiesResult = await session.run(`
      CALL db.schema.nodeTypeProperties() 
      YIELD nodeLabels, propertyName, propertyTypes
      RETURN nodeLabels, propertyName, propertyTypes
    `);

    const labelProperties = new Map<string, Array<{ name: string; types: string[] }>>();
    
    propertiesResult.records.forEach(r => {
      const labels = r.get('nodeLabels') as string[];
      const name = r.get('propertyName') as string;
      const types = r.get('propertyTypes') as string[];
      
      labels.forEach(label => {
        if (!labelProperties.has(label)) {
          labelProperties.set(label, []);
        }
        labelProperties.get(label)?.push({ name, types });
      });
    });

    // ── 3. Build hierarchical relationships map ──
    const hierarchicalRels = ['HAS_DEPARTMENT', 'HAS_AREA', 'PART_OF', 'BELONGS_TO_OBJECTIVE', 'HAS_CHUNK', 'HAS_TASK'];
    const hierarchyMap = new Map<string, Array<{ parent: string; child: string; relType: string }>>();

    for (const relType of hierarchicalRels) {
      try {
        const relResult = await session.run(`
          MATCH (parent)-[r:${relType}]->(child)
          RETURN DISTINCT labels(parent)[0] AS parentLabel, labels(child)[0] AS childLabel, type(r) AS relType
        `);
        
        relResult.records.forEach(r => {
          const parentLabel = r.get('parentLabel');
          const childLabel = r.get('childLabel');
          const rel = r.get('relType');
          
          if (!hierarchyMap.has(parentLabel)) {
            hierarchyMap.set(parentLabel, []);
          }
          hierarchyMap.get(parentLabel)!.push({ parent: parentLabel, child: childLabel, relType: rel });
        });
      } catch {
        // Relationship type might not exist
      }
    }

    // ── 4. Build category map ──
    const categoryMap = new Map<string, DynamicTaxonomyCategory>();
    const categoryDisplayNames: Record<string, string> = {
      organization: 'Estrutura Organizacional',
      person: 'Pessoas',
      content: 'Conhecimento & Conteúdo',
      strategy: 'Estratégia (BIG)',
      process: 'Processos & Tarefas',
      memory: 'Conversas & Memória',
      meta: 'Meta-Grafo',
      unknown: 'Não Categorizado',
    };

    // Initialize categories from Meta-Graph
    if (hasMetaGraph) {
      schemaLabels.forEach(sl => {
        if (!categoryMap.has(sl.category)) {
          categoryMap.set(sl.category, {
            name: sl.category,
            displayName: categoryDisplayNames[sl.category] || sl.category,
            labels: [],
          });
        }
      });
    }

    // ── 5. Build label nodes with hierarchy ──
    const gaps: TaxonomyGap[] = [];
    const processedLabels = new Set<string>();

    const buildLabelNode = (labelName: string, depth = 0): DynamicTaxonomyLabel | null => {
      if (depth > 3 || processedLabels.has(labelName)) return null;
      processedLabels.add(labelName);

      const actualLabel = dataLabels.find(l => l.label === labelName);
      const schemaLabel = schemaLabels.find(sl => sl.name === labelName);

      const count = actualLabel?.count || 0;
      const isEmpty = count === 0;
      const isUndeclared = !schemaLabel && !!actualLabel;

      // Track gaps
      if (isEmpty && schemaLabel) {
        gaps.push({
          label: labelName,
          category: schemaLabel.category,
          issue: 'empty',
          message: `Definido no Meta-Grafo (${schemaLabel.category}) mas sem instâncias no grafo`,
        });
      }

      if (isUndeclared) {
        gaps.push({
          label: labelName,
          category: 'unknown',
          issue: 'undeclared',
          message: `${count} instâncias no grafo mas não declarado no Meta-Grafo`,
        });
      }

      // Build children from hierarchy
      const children: DynamicTaxonomyLabel[] = [];
      const childRels = hierarchyMap.get(labelName) || [];
      
      for (const rel of childRels) {
        const childNode = buildLabelNode(rel.child, depth + 1);
        if (childNode) {
          children.push(childNode);
        }
      }

      // Get properties for this label
      const props = labelProperties.get(labelName) || [];

      return {
        label: labelName,
        count,
        description: schemaLabel?.description || getNodeDescription(labelName),
        empty: isEmpty,
        undeclared: isUndeclared,
        children,
        properties: props,
      };
    };

    // ── 6. Populate categories with root labels ──
    if (hasMetaGraph) {
      // Use Meta-Graph as source of truth
      schemaLabels.forEach(sl => {
        const category = categoryMap.get(sl.category);
        if (!category) return;

        // Only add root labels (labels that are not children of others)
        const isChild = Array.from(hierarchyMap.values()).some(rels =>
          rels.some(r => r.child === sl.name)
        );

        if (!isChild) {
          const labelNode = buildLabelNode(sl.name);
          if (labelNode) {
            category.labels.push(labelNode);
          }
        }
      });

      // Add undeclared labels to "unknown" category
      const undeclaredLabels = dataLabels.filter(l =>
        !schemaLabels.some(sl => sl.name === l.label) &&
        !processedLabels.has(l.label)
      );

      if (undeclaredLabels.length > 0) {
        if (!categoryMap.has('unknown')) {
          categoryMap.set('unknown', {
            name: 'unknown',
            displayName: 'Não Categorizado',
            labels: [],
          });
        }

        const unknownCategory = categoryMap.get('unknown')!;
        undeclaredLabels.forEach(ul => {
          const labelNode = buildLabelNode(ul.label);
          if (labelNode) {
            unknownCategory.labels.push(labelNode);
          }
        });
      }
    } else {
      // Fallback: group by heuristic if no Meta-Graph
      const heuristicCategories: Record<string, string[]> = {
        organization: ['Company', 'Department', 'Area', 'Organization'],
        person: ['User', 'Person'],
        content: ['Document', 'Chunk', 'Knowledge', 'DocSummary'],
        strategy: ['Objective', 'OKR', 'Purpose', 'StrategicObjective'],
        process: ['Process', 'Task', 'Plan', 'Action'],
        memory: ['Conversation', 'Message'],
      };

      Object.entries(heuristicCategories).forEach(([category, labels]) => {
        const categoryLabels: DynamicTaxonomyLabel[] = [];
        
        labels.forEach(labelName => {
          if (dataLabels.some(l => l.label === labelName)) {
            const labelNode = buildLabelNode(labelName);
            if (labelNode) {
              categoryLabels.push(labelNode);
            }
          }
        });

        if (categoryLabels.length > 0) {
          categoryMap.set(category, {
            name: category,
            displayName: categoryDisplayNames[category] || category,
            labels: categoryLabels,
          });
        }
      });

      // Add remaining labels to unknown
      const categorizedLabels = new Set(Object.values(heuristicCategories).flat());
      const unknownLabels = dataLabels.filter(l =>
        !categorizedLabels.has(l.label) && !processedLabels.has(l.label)
      );

      if (unknownLabels.length > 0) {
        const unknownCategory: DynamicTaxonomyLabel[] = [];
        unknownLabels.forEach(ul => {
          const labelNode = buildLabelNode(ul.label);
          if (labelNode) {
            unknownCategory.push(labelNode);
          }
        });

        categoryMap.set('unknown', {
          name: 'unknown',
          displayName: 'Não Categorizado',
          labels: unknownCategory,
        });
      }
    }

    // ── 7. Build final response ──
    const categories = Array.from(categoryMap.values())
      .filter(cat => cat.labels.length > 0)
      .sort((a, b) => {
        const order = ['organization', 'person', 'content', 'strategy', 'process', 'memory', 'unknown'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    res.json({
      success: true,
      data: {
        hasMetaGraph,
        categories,
        gaps: gaps.sort((a, b) => {
          if (a.issue !== b.issue) return a.issue === 'undeclared' ? -1 : 1;
          return a.label.localeCompare(b.label);
        }),
        totalLabels: dataLabels.length,
        totalInstances: dataLabels.reduce((sum, l) => sum + l.count, 0),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Dynamic taxonomy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dynamic taxonomy',
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

// ============================================================================
// ONTOLOGICAL HEALTH ENDPOINTS
// ============================================================================

/**
 * GET /ontology/health
 * Dashboard summary — vital signs of the graph
 */
router.get('/health', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Basic counts
    const countsResult = await session.run(`
      MATCH (n)
      WITH count(n) AS nodes
      MATCH ()-[r]->()
      WITH nodes, count(r) AS rels
      RETURN nodes, rels, 
             CASE WHEN nodes > 0 THEN toFloat(rels) / nodes ELSE 0 END AS relsPerNode,
             CASE WHEN nodes > 0 THEN (2.0 * rels) / nodes ELSE 0 END AS avgTotalDegree
    `);

    const counts = countsResult.records[0];
    const totalNodes = counts?.get('nodes')?.toNumber?.() || counts?.get('nodes') || 0;
    const totalRels = counts?.get('rels')?.toNumber?.() || counts?.get('rels') || 0;
    const relsPerNode = counts?.get('relsPerNode') || 0;
    const avgTotalDegree = counts?.get('avgTotalDegree') || 0;

    // Degree distribution (p50, p90, max)
    const degreeResult = await session.run(`
      MATCH (n)
      WITH n, COUNT { (n)--() } AS deg
      RETURN
        avg(toFloat(deg)) AS avgDegree,
        percentileCont(toFloat(deg), 0.5) AS p50,
        percentileCont(toFloat(deg), 0.9) AS p90,
        max(toFloat(deg)) AS maxDegree,
        min(toFloat(deg)) AS minDegree
    `);

    const degRec = degreeResult.records[0];
    const p50 = degRec?.get('p50') || 0;
    const p90 = degRec?.get('p90') || 0;
    const maxDegree = degRec?.get('maxDegree') || 0;
    const minDegree = degRec?.get('minDegree') || 0;
    const avgDegree = degRec?.get('avgDegree') || 0;

    // Orphan nodes (degree = 0)
    const orphanResult = await session.run(`
      MATCH (n) WHERE NOT (n)--() RETURN count(n) AS orphans
    `);
    const orphans = orphanResult.records[0]?.get('orphans')?.toNumber?.() || 0;

    // Degree histogram
    const histResult = await session.run(`
      MATCH (n)
      WITH COUNT { (n)--() } AS deg
      RETURN deg AS degree, count(*) AS count
      ORDER BY deg
    `);
    const histogram = histResult.records.map(r => ({
      degree: r.get('degree')?.toNumber?.() || r.get('degree') || 0,
      count: r.get('count')?.toNumber?.() || r.get('count') || 0,
    }));

    // Health score (0-10)
    const orphanPct = totalNodes > 0 ? (orphans / totalNodes) * 100 : 0;
    const p90p50Ratio = p50 > 0 ? p90 / p50 : 0;
    let healthScore = 10;
    // Penalize high orphan %
    if (orphanPct > 30) healthScore -= 3;
    else if (orphanPct > 10) healthScore -= 1.5;
    // Penalize extreme concentration
    if (p90p50Ratio > 10) healthScore -= 2;
    else if (p90p50Ratio > 5) healthScore -= 1;
    // Penalize low connectivity
    if (relsPerNode < 0.5) healthScore -= 2;
    else if (relsPerNode < 1) healthScore -= 1;
    // Penalize very high max degree
    if (maxDegree > avgDegree * 10) healthScore -= 1;
    healthScore = Math.max(0, Math.min(10, healthScore));

    res.json({
      success: true,
      data: {
        totalNodes,
        totalRelationships: totalRels,
        relsPerNode: Math.round(relsPerNode * 100) / 100,
        avgTotalDegree: Math.round(avgTotalDegree * 100) / 100,
        degree: {
          avg: Math.round(avgDegree * 100) / 100,
          p50,
          p90,
          max: maxDegree,
          min: minDegree,
          p90p50Ratio: Math.round(p90p50Ratio * 100) / 100,
        },
        orphans,
        orphanPercent: Math.round(orphanPct * 10) / 10,
        healthScore: Math.round(healthScore * 10) / 10,
        histogram,
      },
    });
  } catch (error) {
    logger.error('Ontology health error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ontology health',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /ontology/health/supernodes
 * Top N most connected nodes
 */
router.get('/health/supernodes', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const limit = parseInt(req.query.limit as string) || 15;

  try {
    const result = await session.run(`
      MATCH (n)
      WITH n, COUNT { (n)--() } AS deg
      WHERE deg > 0
      RETURN labels(n)[0] AS label, n.name AS name, n.id AS id, deg AS degree
      ORDER BY deg DESC
      LIMIT $limit
    `, { limit: neo4j.int(limit) });

    const supernodes = result.records.map(r => ({
      label: r.get('label') || 'Unknown',
      name: r.get('name') || r.get('id') || '(sem nome)',
      degree: r.get('degree')?.toNumber?.() || r.get('degree') || 0,
    }));

    // Get p90 threshold
    const thresholdResult = await session.run(`
      MATCH (n)
      WITH COUNT { (n)--() } AS deg
      RETURN percentileCont(toFloat(deg), 0.9) AS p90
    `);
    const p90Threshold = thresholdResult.records[0]?.get('p90') || 0;

    res.json({
      success: true,
      data: {
        supernodes: supernodes.map(s => ({
          ...s,
          isAboveP90: s.degree > p90Threshold,
        })),
        p90Threshold,
      },
    });
  } catch (error) {
    logger.error('Ontology supernodes error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch supernodes',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /ontology/health/completeness
 * Property completeness per label
 */
router.get('/health/completeness', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Get all labels and their property keys from schema
    const schemaResult = await session.run(`
      CALL db.schema.nodeTypeProperties() YIELD nodeLabels, propertyName, propertyTypes
      RETURN nodeLabels, collect(DISTINCT propertyName) AS properties
    `);

    // For each label, check actual fill rate
    const completenessData: Array<{
      label: string;
      totalNodes: number;
      properties: Array<{ name: string; filledCount: number; fillPercent: number }>;
      overallCompleteness: number;
    }> = [];

    // Get label counts
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

    for (const record of labelCountsResult.records) {
      const label = record.get('label');
      const cnt = record.get('cnt')?.toNumber?.() || record.get('cnt') || 0;
      if (cnt === 0) continue;

      // Get properties for this label
      const propsResult = await session.run(`
        CALL db.schema.nodeTypeProperties() YIELD nodeLabels, propertyName
        WHERE $label IN nodeLabels
        RETURN DISTINCT propertyName
      `, { label });

      const propertyNames = propsResult.records.map(r => r.get('propertyName')).filter(Boolean);
      if (propertyNames.length === 0) continue;

      // Check fill rate for each property
      const propStats: Array<{ name: string; filledCount: number; fillPercent: number }> = [];
      
      for (const prop of propertyNames) {
        const fillResult = await session.run(`
          MATCH (n) WHERE $label IN labels(n) AND n[$prop] IS NOT NULL
          RETURN count(n) AS filled
        `, { label, prop });
        const filled = fillResult.records[0]?.get('filled')?.toNumber?.() || 0;
        propStats.push({
          name: prop,
          filledCount: filled,
          fillPercent: cnt > 0 ? Math.round((filled / cnt) * 100) : 0,
        });
      }

      const overallCompleteness = propStats.length > 0
        ? Math.round(propStats.reduce((sum, p) => sum + p.fillPercent, 0) / propStats.length)
        : 0;

      completenessData.push({
        label,
        totalNodes: cnt,
        properties: propStats.sort((a, b) => a.fillPercent - b.fillPercent),
        overallCompleteness,
      });
    }

    res.json({
      success: true,
      data: completenessData.sort((a, b) => a.overallCompleteness - b.overallCompleteness),
    });
  } catch (error) {
    logger.error('Ontology completeness error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch completeness',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /ontology/health/temporal
 * Temporal metrics: growth, freshness, dormant relationships
 */
router.get('/health/temporal', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    // Nodes created in last 7 and 30 days
    const growthResult = await session.run(`
      MATCH (n)
      WHERE n.createdAt IS NOT NULL
        AND (NOT valueType(n.createdAt) = 'STRING' OR size(toString(n.createdAt)) > 4)
      WITH CASE
        WHEN valueType(n.createdAt) CONTAINS 'DATE' THEN n.createdAt
        WHEN valueType(n.createdAt) = 'STRING' AND size(n.createdAt) > 4 THEN datetime(n.createdAt)
        WHEN toInteger(n.createdAt) > 0 THEN datetime({ epochMillis: toInteger(n.createdAt) })
        ELSE NULL
      END AS createdAtDt
      WHERE createdAtDt IS NOT NULL
      RETURN
        count(CASE WHEN createdAtDt > datetime() - duration('P7D') THEN 1 END) AS newNodes7d,
        count(CASE WHEN createdAtDt > datetime() - duration('P30D') THEN 1 END) AS newNodes30d,
        count(createdAtDt) AS totalWithDate
    `);

    const growth = growthResult.records[0];
    const newNodes7d = growth?.get('newNodes7d')?.toNumber?.() || 0;
    const newNodes30d = growth?.get('newNodes30d')?.toNumber?.() || 0;

    // Growth by label (last 30 days)
    const growthByLabelResult = await session.run(`
      MATCH (n)
      WHERE n.createdAt IS NOT NULL
        AND (NOT valueType(n.createdAt) = 'STRING' OR size(toString(n.createdAt)) > 4)
      WITH n,
        CASE
          WHEN valueType(n.createdAt) CONTAINS 'DATE' THEN n.createdAt
          WHEN valueType(n.createdAt) = 'STRING' AND size(n.createdAt) > 4 THEN datetime(n.createdAt)
          WHEN toInteger(n.createdAt) > 0 THEN datetime({ epochMillis: toInteger(n.createdAt) })
          ELSE NULL
        END AS createdAtDt
      WHERE createdAtDt IS NOT NULL AND createdAtDt > datetime() - duration('P30D')
      RETURN labels(n)[0] AS label, count(*) AS count
      ORDER BY count DESC
      LIMIT 10
    `);

    const growthByLabel = growthByLabelResult.records.map(r => ({
      label: r.get('label') || 'Unknown',
      count: r.get('count')?.toNumber?.() || 0,
    }));

    // Oldest nodes without update
    const staleResult = await session.run(`
      MATCH (n)
      WHERE n.createdAt IS NOT NULL
        AND (NOT valueType(n.createdAt) = 'STRING' OR size(toString(n.createdAt)) > 4)
      WITH n, labels(n)[0] AS label, n.name AS name,
           CASE WHEN n.updatedAt IS NOT NULL AND (NOT valueType(n.updatedAt) = 'STRING' OR size(toString(n.updatedAt)) > 4)
                THEN n.updatedAt ELSE n.createdAt END AS lastUpdate
      WITH label, name,
        CASE
          WHEN valueType(lastUpdate) CONTAINS 'DATE' THEN lastUpdate
          WHEN valueType(lastUpdate) = 'STRING' AND size(lastUpdate) > 4 THEN datetime(lastUpdate)
          WHEN toInteger(lastUpdate) > 0 THEN datetime({ epochMillis: toInteger(lastUpdate) })
          ELSE NULL
        END AS lastUpdateDt
      WHERE lastUpdateDt IS NOT NULL
      RETURN label, name, lastUpdateDt AS lastUpdate,
             toInteger(duration.between(lastUpdateDt, datetime()).days) AS daysSinceUpdate
      ORDER BY daysSinceUpdate DESC
      LIMIT 10
    `);

    const staleNodes = staleResult.records.map(r => ({
      label: r.get('label') || 'Unknown',
      name: r.get('name') || '(sem nome)',
      daysSinceUpdate: r.get('daysSinceUpdate')?.toNumber?.() || r.get('daysSinceUpdate') || 0,
    }));

    // Average age by label
    const ageResult = await session.run(`
      MATCH (n)
      WHERE n.createdAt IS NOT NULL
        AND (NOT valueType(n.createdAt) = 'STRING' OR size(toString(n.createdAt)) > 4)
      WITH labels(n)[0] AS label,
        CASE
          WHEN valueType(n.createdAt) CONTAINS 'DATE' THEN n.createdAt
          WHEN valueType(n.createdAt) = 'STRING' AND size(n.createdAt) > 4 THEN datetime(n.createdAt)
          WHEN toInteger(n.createdAt) > 0 THEN datetime({ epochMillis: toInteger(n.createdAt) })
          ELSE NULL
        END AS createdAtDt
      WHERE createdAtDt IS NOT NULL
      WITH label, duration.between(createdAtDt, datetime()).days AS age
      RETURN label, count(*) AS total, toFloat(avg(age)) AS avgAgeDays
      ORDER BY avgAgeDays DESC
    `);

    const ageByLabel = ageResult.records.map(r => ({
      label: r.get('label') || 'Unknown',
      total: r.get('total')?.toNumber?.() || 0,
      avgAgeDays: Math.round(r.get('avgAgeDays') || 0),
    }));

    // Recent activity (last 20 relationships created)
    const recentResult = await session.run(`
      MATCH (a)-[r]->(b)
      WHERE r.createdAt IS NOT NULL OR a.createdAt IS NOT NULL
      WITH type(r) AS relType, labels(a)[0] AS fromLabel, a.name AS fromName,
           labels(b)[0] AS toLabel, b.name AS toName,
           COALESCE(r.createdAt, a.createdAt) AS date
      RETURN relType, fromLabel, fromName, toLabel, toName, date
      ORDER BY date DESC
      LIMIT 15
    `);

    const recentActivity = recentResult.records.map(r => ({
      relType: r.get('relType'),
      from: { label: r.get('fromLabel'), name: r.get('fromName') || '?' },
      to: { label: r.get('toLabel'), name: r.get('toName') || '?' },
    }));

    res.json({
      success: true,
      data: {
        growth: { newNodes7d, newNodes30d },
        growthByLabel,
        staleNodes,
        ageByLabel,
        recentActivity,
      },
    });
  } catch (error) {
    logger.error('Ontology temporal error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch temporal metrics',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// SEMANTIC ANALYSIS
// ============================================================================

interface SemanticFinding {
  category: 'label' | 'relationship' | 'property' | 'taxonomy' | 'pattern';
  severity: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  recommendation?: string;
}

/**
 * GET /ontology/semantic-analysis
 * Validates the graph semantics against the Meta-Graph (SchemaLabel, SchemaRel, SchemaProp)
 * Returns a semantic health report with score, findings, and recommendations
 */
router.get('/semantic-analysis', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const findings: SemanticFinding[] = [];

    // ── 1. Load Meta-Graph definitions ──
    let schemaLabels: Array<{ name: string; category: string; description: string }> = [];
    let schemaRels: Array<{ type: string; from_label: string; to_label: string; cardinality: string }> = [];
    let schemaProps: Array<{ owner: string; name: string; type: string; is_required: boolean; description: string }> = [];

    try {
      const slResult = await session.run(`
        MATCH (sl:SchemaLabel)
        RETURN sl.name AS name, sl.category AS category, sl.description AS description
      `);
      schemaLabels = slResult.records.map(r => ({
        name: r.get('name'),
        category: r.get('category') || 'unknown',
        description: r.get('description') || '',
      }));
    } catch { /* Meta-Graph not bootstrapped yet */ }

    try {
      const srResult = await session.run(`
        MATCH (sr:SchemaRel)
        RETURN sr.type AS type, sr.from_label AS from_label, sr.to_label AS to_label, sr.cardinality AS cardinality
      `);
      schemaRels = srResult.records.map(r => ({
        type: r.get('type'),
        from_label: r.get('from_label'),
        to_label: r.get('to_label'),
        cardinality: r.get('cardinality') || 'N:M',
      }));
    } catch { /* no SchemaRel nodes */ }

    try {
      const spResult = await session.run(`
        MATCH (sp:SchemaProp)
        RETURN sp.owner AS owner, sp.name AS name, sp.type AS type, sp.is_required AS is_required, sp.description AS description
      `);
      schemaProps = spResult.records.map(r => ({
        owner: r.get('owner'),
        name: r.get('name'),
        type: r.get('type') || 'string',
        is_required: r.get('is_required') === true,
        description: r.get('description') || '',
      }));
    } catch { /* no SchemaProp nodes */ }

    const hasMetaGraph = schemaLabels.length > 0;

    if (!hasMetaGraph) {
      findings.push({
        category: 'label',
        severity: 'error',
        title: 'Meta-Grafo não encontrado',
        detail: 'Nenhum SchemaLabel encontrado no grafo. O Meta-Grafo (Spec 050) precisa ser bootstrapped para habilitar análise semântica completa.',
        recommendation: 'Execute o script de bootstrap do Meta-Grafo para criar SchemaLabel, SchemaRel e SchemaProp.',
      });
    }

    // ── 2. Get actual labels in the graph ──
    const actualLabelsResult = await session.run(`
      CALL db.labels() YIELD label
      CALL { WITH label MATCH (n) WHERE label IN labels(n) RETURN count(n) AS cnt }
      RETURN label, cnt ORDER BY cnt DESC
    `);
    const actualLabels = actualLabelsResult.records.map(r => ({
      label: r.get('label') as string,
      count: r.get('cnt')?.toNumber?.() || (r.get('cnt') as number),
    }));

    // Filter out meta-graph labels from validation
    const metaLabels = new Set(['SchemaLabel', 'SchemaRel', 'SchemaProp', 'QueryProfile', 'AccessPolicy', 'CypherTemplate', 'SchemaVersion']);
    const dataLabels = actualLabels.filter(l => !metaLabels.has(l.label));
    const schemaLabelNames = new Set(schemaLabels.map(sl => sl.name));

    // ── 3. Label validation ──
    if (hasMetaGraph) {
      // 3a. Labels in graph but NOT in Meta-Graph
      const undeclaredLabels = dataLabels.filter(l => !schemaLabelNames.has(l.label));
      for (const ul of undeclaredLabels) {
        findings.push({
          category: 'label',
          severity: 'warning',
          title: `Label não declarado: ${ul.label}`,
          detail: `O label "${ul.label}" (${ul.count} nós) existe no grafo mas não está definido no Meta-Grafo (SchemaLabel).`,
          recommendation: `Criar SchemaLabel para "${ul.label}" ou migrar para um label canônico existente.`,
        });
      }

      // 3b. Labels in Meta-Graph but NOT in graph (empty labels)
      const emptySchemaLabels = schemaLabels.filter(sl =>
        !actualLabels.some(al => al.label === sl.name)
      );
      for (const el of emptySchemaLabels) {
        findings.push({
          category: 'label',
          severity: 'info',
          title: `Label vazio: ${el.name}`,
          detail: `O label "${el.name}" está definido no Meta-Grafo (categoria: ${el.category}) mas não tem nenhum nó no grafo.`,
          recommendation: `Normal para labels não ingeridos ainda. Priorizar ingestão se for label essencial.`,
        });
      }
    }

    // ── 4. Relationship pattern validation ──
    const actualPatternsResult = await session.run(`
      MATCH (a)-[r]->(b)
      WITH labels(a)[0] AS fromLabel, type(r) AS relType, labels(b)[0] AS toLabel, count(*) AS cnt
      RETURN fromLabel, relType, toLabel, cnt
      ORDER BY cnt DESC
    `);
    const actualPatterns = actualPatternsResult.records.map(r => ({
      from: r.get('fromLabel') as string,
      type: r.get('relType') as string,
      to: r.get('toLabel') as string,
      count: r.get('cnt')?.toNumber?.() || (r.get('cnt') as number),
    }));

    if (hasMetaGraph && schemaRels.length > 0) {
      // Check each actual pattern against SchemaRel definitions
      for (const pattern of actualPatterns) {
        if (metaLabels.has(pattern.from) || metaLabels.has(pattern.to)) continue;

        const matchingSchema = schemaRels.find(sr =>
          sr.type === pattern.type &&
          sr.from_label === pattern.from &&
          sr.to_label === pattern.to
        );

        if (!matchingSchema) {
          // Check if the relationship type exists at all
          const typeExists = schemaRels.some(sr => sr.type === pattern.type);
          const severity = typeExists ? 'warning' : 'error';

          findings.push({
            category: 'relationship',
            severity,
            title: `Padrão não declarado: (${pattern.from})-[${pattern.type}]->(${pattern.to})`,
            detail: `${pattern.count} relações "${pattern.type}" conectam ${pattern.from}→${pattern.to}, mas esse padrão não está definido no Meta-Grafo.${typeExists ? ` O tipo "${pattern.type}" existe mas para outros labels.` : ` O tipo "${pattern.type}" não existe no Meta-Grafo.`}`,
            recommendation: typeExists
              ? `Verificar se ${pattern.from}→${pattern.to} é intencional ou se deveria usar outro tipo de relação.`
              : `Criar SchemaRel para "${pattern.type}" ou migrar para um tipo canônico.`,
          });
        }
      }

      // SchemaRels with no instances
      for (const sr of schemaRels) {
        const exists = actualPatterns.some(p =>
          p.type === sr.type && p.from === sr.from_label && p.to === sr.to_label
        );
        if (!exists) {
          findings.push({
            category: 'relationship',
            severity: 'info',
            title: `Relação sem instâncias: ${sr.from_label}-[${sr.type}]->${sr.to_label}`,
            detail: `O Meta-Grafo define (${sr.from_label})-[${sr.type}]->(${sr.to_label}) mas nenhuma instância existe no grafo.`,
          });
        }
      }
    }

    // ── 5. Property completeness validation ──
    const requiredProps = schemaProps.filter(sp => sp.is_required);
    const propViolations: Array<{ label: string; prop: string; missing: number; total: number }> = [];

    for (const rp of requiredProps) {
      try {
        const result = await session.run(`
          MATCH (n:${rp.owner})
          WITH count(n) AS total,
               count(CASE WHEN n[\$propName] IS NULL OR n[\$propName] = '' THEN 1 END) AS missing
          RETURN total, missing
        `, { propName: rp.name });

        const total = result.records[0]?.get('total')?.toNumber?.() || 0;
        const missing = result.records[0]?.get('missing')?.toNumber?.() || 0;

        if (missing > 0 && total > 0) {
          propViolations.push({ label: rp.owner, prop: rp.name, missing, total });
          findings.push({
            category: 'property',
            severity: missing === total ? 'error' : 'warning',
            title: `Propriedade obrigatória faltando: ${rp.owner}.${rp.name}`,
            detail: `${missing}/${total} nós ${rp.owner} não têm a propriedade "${rp.name}" (${rp.description}).`,
            recommendation: `Enriquecer nós ${rp.owner} com a propriedade "${rp.name}" via curadoria ou ingestão.`,
          });
        }
      } catch {
        // Label might not exist yet
      }
    }

    // ── 6. Taxonomy validation ──
    // Check for cycles in PART_OF
    try {
      const cycleResult = await session.run(`
        MATCH path = (a)-[:PART_OF*2..5]->(a)
        RETURN count(path) AS cycles, labels(a)[0] AS label
        LIMIT 5
      `);
      const cycles = cycleResult.records.filter(r => (r.get('cycles')?.toNumber?.() || 0) > 0);
      if (cycles.length > 0) {
        findings.push({
          category: 'taxonomy',
          severity: 'error',
          title: 'Ciclo detectado em PART_OF',
          detail: `${cycles.length} ciclo(s) encontrado(s) na hierarquia PART_OF. Isso viola a estrutura taxonômica de árvore.`,
          recommendation: 'Revisar e remover relações PART_OF circulares.',
        });
      }
    } catch { /* PART_OF might not exist */ }

    // Check BELONGS_TO_OBJECTIVE: OKR should point to Objective, not vice versa
    try {
      const reverseResult = await session.run(`
        MATCH (a)-[:BELONGS_TO_OBJECTIVE]->(b)
        WHERE NOT 'OKR' IN labels(a) OR NOT 'Objective' IN labels(b)
        RETURN labels(a)[0] AS fromLabel, labels(b)[0] AS toLabel, count(*) AS cnt
      `);
      for (const r of reverseResult.records) {
        findings.push({
          category: 'taxonomy',
          severity: 'warning',
          title: `BELONGS_TO_OBJECTIVE invertido`,
          detail: `${r.get('cnt')} relações BELONGS_TO_OBJECTIVE conectam ${r.get('fromLabel')}→${r.get('toLabel')} (esperado: OKR→Objective).`,
          recommendation: 'Corrigir direção ou usar tipo de relação diferente.',
        });
      }
    } catch { /* OK */ }

    // Check SUPERSEDES forms linear chain (no bifurcations)
    try {
      const bifurcResult = await session.run(`
        MATCH (a)<-[:SUPERSEDES]-(b)
        WITH a, count(b) AS predecessors
        WHERE predecessors > 1
        RETURN labels(a)[0] AS label, a.name AS name, predecessors
        LIMIT 5
      `);
      for (const r of bifurcResult.records) {
        findings.push({
          category: 'taxonomy',
          severity: 'warning',
          title: `Bifurcação em SUPERSEDES`,
          detail: `${r.get('label')} "${r.get('name')}" tem ${r.get('predecessors')} predecessores via SUPERSEDES. Deveria ser cadeia linear.`,
          recommendation: 'Revisar histórico de versões para garantir cadeia única.',
        });
      }
    } catch { /* OK */ }

    // ── 7. Structural patterns ──
    // Detect super-nodes (nodes with too many relationships)
    try {
      const superNodeResult = await session.run(`
        MATCH (n)
        WITH n, labels(n)[0] AS label, n.name AS name, size((n)--()) AS degree
        WHERE degree > 50
        RETURN label, name, degree
        ORDER BY degree DESC
        LIMIT 5
      `);
      for (const r of superNodeResult.records) {
        findings.push({
          category: 'pattern',
          severity: 'warning',
          title: `Supernó detectado: ${r.get('label')} "${r.get('name')}"`,
          detail: `${r.get('degree')} conexões. Supernós podem degradar performance de queries e indicam possível necessidade de decomposição.`,
          recommendation: 'Considerar decomposição ou criação de nós intermediários.',
        });
      }
    } catch { /* OK */ }

    // ── 8. Category coverage (taxonomy by category) ──
    const categoryMap: Record<string, { declared: string[]; populated: string[]; empty: string[] }> = {};
    for (const sl of schemaLabels) {
      if (!categoryMap[sl.category]) {
        categoryMap[sl.category] = { declared: [], populated: [], empty: [] };
      }
      categoryMap[sl.category].declared.push(sl.name);
      const exists = actualLabels.some(al => al.label === sl.name && al.count > 0);
      if (exists) {
        categoryMap[sl.category].populated.push(sl.name);
      } else {
        categoryMap[sl.category].empty.push(sl.name);
      }
    }

    // ── 9. Compute semantic score ──
    let score = 100;

    // Penalties
    const errors = findings.filter(f => f.severity === 'error').length;
    const warnings = findings.filter(f => f.severity === 'warning').length;
    score -= errors * 10;
    score -= warnings * 3;

    // Bonus for completeness
    if (hasMetaGraph) {
      const labelCoverage = dataLabels.filter(l => schemaLabelNames.has(l.label)).length / Math.max(1, dataLabels.length);
      score = Math.round(score * (0.5 + labelCoverage * 0.5));
    }

    score = Math.max(0, Math.min(100, score));

    // ── 10. Build summary ──
    const summary = {
      semanticScore: score,
      metaGraphStatus: hasMetaGraph ? 'active' : 'missing',
      schemaLabelsCount: schemaLabels.length,
      schemaRelsCount: schemaRels.length,
      schemaPropsCount: schemaProps.length,
      actualLabelsCount: dataLabels.length,
      actualPatternsCount: actualPatterns.filter(p => !metaLabels.has(p.from) && !metaLabels.has(p.to)).length,
      findingsCount: { errors, warnings, info: findings.filter(f => f.severity === 'info').length },
    };

    // ── 11. Build label detail with properties ──
    const labelDetail = dataLabels.map(dl => {
      const schema = schemaLabels.find(sl => sl.name === dl.label);
      const props = schemaProps.filter(sp => sp.owner === dl.label);
      const rels = schemaRels.filter(sr => sr.from_label === dl.label || sr.to_label === dl.label);
      const actualRels = actualPatterns.filter(p => p.from === dl.label || p.to === dl.label);

      return {
        label: dl.label,
        count: dl.count,
        category: schema?.category || 'unknown',
        description: schema?.description || getNodeDescription(dl.label),
        inMetaGraph: !!schema,
        declaredProperties: props.map(p => ({
          name: p.name,
          type: p.type,
          required: p.is_required,
          description: p.description,
        })),
        declaredRelationships: rels.map(r => ({
          type: r.type,
          direction: r.from_label === dl.label ? 'outgoing' : 'incoming',
          target: r.from_label === dl.label ? r.to_label : r.from_label,
          cardinality: r.cardinality,
        })),
        actualRelationships: actualRels.map(r => ({
          type: r.type,
          direction: r.from === dl.label ? 'outgoing' : 'incoming',
          target: r.from === dl.label ? r.to : r.from,
          count: r.count,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        summary,
        findings,
        labelDetail,
        categoryMap,
        actualPatterns: actualPatterns.filter(p => !metaLabels.has(p.from) && !metaLabels.has(p.to)),
      },
    });
  } catch (error) {
    logger.error('Semantic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run semantic analysis',
    });
  } finally {
    await session.close();
  }
});

export default router;
