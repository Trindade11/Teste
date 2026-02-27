import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import neo4j from 'neo4j-driver';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const toNumber = (value: unknown): number => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'low' in (value as any)) return (value as any).low;
  return Number(value);
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type DocumentType =
  | 'contract'
  | 'report'
  | 'meeting'
  | 'process_doc'
  | 'strategic_plan'
  | 'technical_spec'
  | 'email'
  | 'note'
  | 'policy'
  | 'analysis'
  | 'manual'
  | 'proposal'
  | 'spreadsheet'
  | 'other';

type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
type MemoryClass = 'semantic' | 'episodic' | 'procedural' | 'evaluative';

interface DocumentMetadata {
  title: string;
  type: DocumentType;
  confidentiality: ConfidentialityLevel;
  memoryClass?: MemoryClass;
  linkedProjectIds?: string[];
  linkedOkrIds?: string[];
  linkedObjectiveIds?: string[];
  linkedProcessId?: string;
  departmentId?: string;
  tags?: string[];
  summary?: string;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const REQUIRED_RELATIONSHIPS: Record<DocumentType, string[]> = {
  contract: ['project'],
  report: ['objective_or_okr'],
  meeting: ['project'],
  process_doc: ['process'],
  strategic_plan: ['objective'],
  technical_spec: ['project'],
  email: [],
  note: [],
  policy: ['department'],
  analysis: ['objective_or_okr'],
  manual: [],
  proposal: ['project'],
  spreadsheet: [],
  other: [],
};

const MEMORY_CLASS_DEFAULTS: Record<DocumentType, MemoryClass> = {
  contract: 'procedural',
  report: 'evaluative',
  meeting: 'episodic',
  process_doc: 'procedural',
  strategic_plan: 'semantic',
  technical_spec: 'semantic',
  email: 'episodic',
  note: 'episodic',
  policy: 'semantic',
  analysis: 'evaluative',
  manual: 'semantic',
  proposal: 'semantic',
  spreadsheet: 'evaluative',
  other: 'episodic',
};

function validateRequiredRelationships(
  type: DocumentType,
  metadata: DocumentMetadata
): { valid: boolean; missing: string[] } {
  const required = REQUIRED_RELATIONSHIPS[type];
  const missing: string[] = [];

  for (const req of required) {
    if (req === 'project' && (!metadata.linkedProjectIds || metadata.linkedProjectIds.length === 0)) {
      missing.push('Projeto');
    }
    if (
      req === 'objective_or_okr' &&
      (!metadata.linkedObjectiveIds || metadata.linkedObjectiveIds.length === 0) &&
      (!metadata.linkedOkrIds || metadata.linkedOkrIds.length === 0)
    ) {
      missing.push('Objetivo ou OKR');
    }
    if (req === 'process' && !metadata.linkedProcessId) {
      missing.push('Processo');
    }
    if (req === 'department' && !metadata.departmentId) {
      missing.push('Departamento');
    }
  }

  return { valid: missing.length === 0, missing };
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /documents/preprocess
 * Analyze document and extract metadata + suggest entities (no persistence)
 */
router.post('/preprocess', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // Extract text content from file
    const fileContent = file.buffer.toString('utf-8');
    const fileName = file.originalname;

    // Import services dynamically
    const { DocumentMetadataExtractor } = await import('../services/document-metadata-extractor.service');
    const { DocumentEntitySuggester } = await import('../services/document-entity-suggester.service');

    // 1. Extract metadata via LLM
    const extractor = new DocumentMetadataExtractor();
    const extraction = await extractor.extract(fileContent, fileName);

    // 2. Suggest entity relationships
    const suggester = new DocumentEntitySuggester();
    const suggestions = await suggester.suggest(
      extraction.mentionedEntities,
      extraction.suggestedTitle,
      extraction.summary,
      extraction.suggestedTags
    );

    logger.info(`Document preprocessed: ${fileName}, ${suggestions.length} entity suggestions`);

    res.json({
      success: true,
      suggestedMetadata: {
        title: extraction.suggestedTitle,
        type: extraction.suggestedType,
        tags: extraction.suggestedTags,
        summary: extraction.summary,
        canonicalData: extraction.canonicalData,
        confidence: extraction.confidence,
      },
      suggestedEntities: suggestions,
      mentionedEntities: extraction.mentionedEntities,
    });
  } catch (error) {
    logger.error('Error preprocessing document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preprocess document',
    });
  }
});

/**
 * POST /documents/ingest
 * Upload and ingest a document with BIG relationships
 */
router.post('/ingest', upload.single('file'), async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const tx = session.beginTransaction();

  try {
    const file = req.file;
    const userId = (req as any).user?.userId || 'system';

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // Parse metadata
    const metadata: DocumentMetadata = JSON.parse(req.body.metadata || '{}');

    // Validate required fields
    if (!metadata.title || !metadata.type) {
      res.status(400).json({ success: false, error: 'Title and type are required' });
      return;
    }

    // Validate required relationships
    const validation = validateRequiredRelationships(metadata.type, metadata);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: `Relacionamentos obrigatórios faltando: ${validation.missing.join(', ')}`,
        missing: validation.missing,
      });
      return;
    }

    // Set defaults
    const memoryClass = metadata.memoryClass || MEMORY_CLASS_DEFAULTS[metadata.type];
    const confidentiality = metadata.confidentiality || 'internal';
    const documentId = randomUUID();

    // 1. Create Document node
    await tx.run(
      `CREATE (d:Document {
        id: $id,
        title: $title,
        type: $type,
        format: $format,
        sourceFile: $sourceFile,
        fileSize: $fileSize,
        uploadedBy: $uploadedBy,
        createdAt: datetime(),
        status: 'processing',
        confidentiality: $confidentiality,
        memoryClass: $memoryClass,
        visibility: $visibility,
        summary: $summary,
        keyTopics: $keyTopics,
        tags: $tags,
        linkedProjectIds: $linkedProjectIds,
        linkedOkrIds: $linkedOkrIds,
        linkedObjectiveIds: $linkedObjectiveIds,
        linkedProcessId: $linkedProcessId,
        departmentId: $departmentId
      })
      RETURN d`,
      {
        id: documentId,
        title: metadata.title,
        type: metadata.type,
        format: file.mimetype.split('/')[1] || 'unknown',
        sourceFile: file.originalname,
        fileSize: file.size,
        uploadedBy: userId,
        confidentiality,
        memoryClass,
        visibility: 'corporate',
        summary: metadata.summary || null,
        keyTopics: metadata.tags || [],
        tags: metadata.tags || [],
        linkedProjectIds: metadata.linkedProjectIds || [],
        linkedOkrIds: metadata.linkedOkrIds || [],
        linkedObjectiveIds: metadata.linkedObjectiveIds || [],
        linkedProcessId: metadata.linkedProcessId || null,
        departmentId: metadata.departmentId || null,
      }
    );

    // 2. Create UPLOADED_BY relationship
    await tx.run(
      `MATCH (d:Document {id: $documentId})
       MATCH (u:User {id: $userId})
       MERGE (u)-[:UPLOADED]->(d)`,
      { documentId, userId }
    );

    // 3. Create BIG relationships
    const relationships = {
      projects: 0,
      okrs: 0,
      objectives: 0,
      processes: 0,
      departments: 0,
    };

    // Link to Projects
    if (metadata.linkedProjectIds && metadata.linkedProjectIds.length > 0) {
      for (const projectId of metadata.linkedProjectIds) {
        await tx.run(
          `MATCH (d:Document {id: $documentId})
           MATCH (p:Project {id: $projectId})
           MERGE (d)-[:BELONGS_TO_PROJECT]->(p)`,
          { documentId, projectId }
        );
        relationships.projects++;
      }
    }

    // Link to OKRs
    if (metadata.linkedOkrIds && metadata.linkedOkrIds.length > 0) {
      for (const okrId of metadata.linkedOkrIds) {
        await tx.run(
          `MATCH (d:Document {id: $documentId})
           MATCH (okr:OKR {id: $okrId})
           MERGE (d)-[:LINKED_TO_OKR {relevance_score: 0.8, assigned_by: 'user', assigned_at: datetime()}]->(okr)`,
          { documentId, okrId }
        );
        relationships.okrs++;
      }
    }

    // Link to Objectives
    if (metadata.linkedObjectiveIds && metadata.linkedObjectiveIds.length > 0) {
      for (const objectiveId of metadata.linkedObjectiveIds) {
        await tx.run(
          `MATCH (d:Document {id: $documentId})
           MATCH (obj:Objective {id: $objectiveId})
           MERGE (d)-[:SUPPORTS {relevance_score: 0.8, assigned_by: 'user', assigned_at: datetime()}]->(obj)`,
          { documentId, objectiveId }
        );
        relationships.objectives++;
      }
    }

    // Link to Process
    if (metadata.linkedProcessId) {
      await tx.run(
        `MATCH (d:Document {id: $documentId})
         MATCH (proc:Process {id: $processId})
         MERGE (d)-[:DESCRIBES_PROCESS]->(proc)`,
        { documentId, processId: metadata.linkedProcessId }
      );
      relationships.processes++;
    }

    // Link to Department
    if (metadata.departmentId) {
      await tx.run(
        `MATCH (d:Document {id: $documentId})
         MATCH (dept:Department {id: $departmentId})
         MERGE (d)-[:BELONGS_TO]->(dept)`,
        { documentId, departmentId: metadata.departmentId }
      );
      relationships.departments++;
    }

    // 4. Semantic Chunking (structure-based, not token-based)
    const fileContent = file.buffer.toString('utf-8');
    const { ChunkerFactory } = await import('../services/chunking/chunker-factory');
    const chunker = ChunkerFactory.create(metadata.type);
    const semanticChunks = chunker.chunk(fileContent);

    // Create chunk nodes with semantic metadata
    for (const chunk of semanticChunks) {
      const chunkId = randomUUID();
      
      await tx.run(
        `MATCH (d:Document {id: $documentId})
         CREATE (c:Chunk {
           id: $chunkId,
           documentId: $documentId,
           text: $text,
           textLength: $textLength,
           chunkType: $chunkType,
           hierarchyLevel: $hierarchyLevel,
           sectionNumber: $sectionNumber,
           sectionTitle: $sectionTitle,
           sequenceIndex: $sequenceIndex,
           createdAt: datetime()
         })
         MERGE (d)-[:HAS_CHUNK {sequenceIndex: $sequenceIndex}]->(c)`,
        {
          documentId,
          chunkId,
          text: chunk.text,
          textLength: chunk.text.length,
          chunkType: chunk.chunkType,
          hierarchyLevel: chunk.hierarchyLevel,
          sectionNumber: chunk.sectionNumber || null,
          sectionTitle: chunk.sectionTitle || null,
          sequenceIndex: chunk.sequenceIndex,
        }
      );

      // Create FOLLOWS relationship for sequential chunks
      if (chunk.sequenceIndex > 0) {
        await tx.run(
          `MATCH (d:Document {id: $documentId})
           MATCH (prev:Chunk {documentId: $documentId, sequenceIndex: $prevIndex})
           MATCH (curr:Chunk {documentId: $documentId, sequenceIndex: $currIndex})
           MERGE (prev)-[:FOLLOWS]->(curr)`,
          {
            documentId,
            prevIndex: chunk.sequenceIndex - 1,
            currIndex: chunk.sequenceIndex,
          }
        );
      }
    }

    // 5. TODO: Extract entities with LLM (tasks, decisions, risks, insights)
    // TODO: Enrich chunks with summaries, entities, topics, clearance levels
    // For now, we'll skip this and mark as completed

    // 6. Update document status
    await tx.run(
      `MATCH (d:Document {id: $documentId})
       SET d.status = 'completed',
           d.processedAt = datetime(),
           d.chunkCount = $chunkCount`,
      { documentId, chunkCount: semanticChunks.length }
    );

    await tx.commit();

    logger.info(`Document ingested: ${documentId}, ${metadata.title}`);

    res.status(201).json({
      success: true,
      documentId,
      chunkCount: semanticChunks.length,
      extractedEntities: {
        tasks: 0,
        decisions: 0,
        risks: 0,
        insights: 0,
      },
      relationships,
    });
  } catch (error) {
    await tx.rollback();
    logger.error('Error ingesting document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest document',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /documents/linkable-entities
 * Get list of entities available for linking (Projects, OKRs, Objectives, Processes)
 */
router.get('/linkable-entities', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const { type } = req.query;

  try {
    let entities: any[] = [];

    if (!type || type === 'project') {
      const projectsResult = await session.run(`
        MATCH (p:Project)
        WHERE p.status <> 'archived'
        OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
        OPTIONAL MATCH (p)-[:BELONGS_TO]->(dept:Department)
        RETURN p.id AS id, p.name AS name, 'project' AS type, p.status AS status, 
               dept.name AS department, owner.name AS owner
        ORDER BY p.name
        LIMIT 100
      `);

      entities = entities.concat(
        projectsResult.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          type: r.get('type'),
          status: r.get('status'),
          department: r.get('department'),
          owner: r.get('owner'),
        }))
      );
    }

    if (!type || type === 'okr') {
      const okrsResult = await session.run(`
        MATCH (okr:OKR)
        WHERE okr.status = 'active'
        OPTIONAL MATCH (okr)-[:BELONGS_TO_OBJECTIVE]->(obj:Objective)
        OPTIONAL MATCH (okr)-[:OWNED_BY]->(owner:User)
        RETURN okr.id AS id, okr.title AS name, 'okr' AS type, okr.status AS status,
               obj.title AS objective, owner.name AS owner
        ORDER BY okr.title
        LIMIT 100
      `);

      entities = entities.concat(
        okrsResult.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          type: r.get('type'),
          status: r.get('status'),
          objective: r.get('objective'),
          owner: r.get('owner'),
        }))
      );
    }

    if (!type || type === 'objective') {
      const objectivesResult = await session.run(`
        MATCH (obj:Objective)
        WHERE obj.status = 'active'
        OPTIONAL MATCH (obj)-[:OWNED_BY]->(owner:User)
        OPTIONAL MATCH (obj)-[:BELONGS_TO]->(dept:Department)
        RETURN obj.id AS id, obj.title AS name, 'objective' AS type, obj.status AS status,
               dept.name AS department, owner.name AS owner
        ORDER BY obj.title
        LIMIT 100
      `);

      entities = entities.concat(
        objectivesResult.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          type: r.get('type'),
          status: r.get('status'),
          department: r.get('department'),
          owner: r.get('owner'),
        }))
      );
    }

    if (!type || type === 'process') {
      const processesResult = await session.run(`
        MATCH (proc:Process)
        OPTIONAL MATCH (proc)-[:BELONGS_TO]->(dept:Department)
        RETURN proc.id AS id, proc.name AS name, 'process' AS type, proc.status AS status,
               dept.name AS department
        ORDER BY proc.name
        LIMIT 100
      `);

      entities = entities.concat(
        processesResult.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          type: r.get('type'),
          status: r.get('status'),
          department: r.get('department'),
        }))
      );
    }

    res.json({
      success: true,
      entities,
      total: entities.length,
    });
  } catch (error) {
    logger.error('Error fetching linkable entities:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch entities',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /documents/suggest-relationships
 * Suggest relationships based on document title and type
 */
router.post('/suggest-relationships', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { title, type, summary } = req.body;

    if (!title || !type) {
      res.status(400).json({ success: false, error: 'Title and type are required' });
      return;
    }

    // Simple keyword-based suggestions (can be enhanced with LLM later)
    const keywords = (title + ' ' + (summary || '')).toLowerCase();

    const suggestions = {
      suggestedProjects: [] as any[],
      suggestedOkrs: [] as any[],
      suggestedObjectives: [] as any[],
      suggestedProcesses: [] as any[],
    };

    // Suggest projects based on name similarity
    const projectsResult = await session.run(
      `MATCH (p:Project)
       WHERE p.status <> 'archived' AND toLower(p.name) CONTAINS $keyword
       RETURN p.id AS id, p.name AS name, 0.7 AS confidence
       LIMIT 5`,
      { keyword: keywords.split(' ')[0] }
    );

    suggestions.suggestedProjects = projectsResult.records.map((r) => ({
      id: r.get('id'),
      name: r.get('name'),
      confidence: r.get('confidence'),
    }));

    // Suggest OKRs based on title similarity
    const okrsResult = await session.run(
      `MATCH (okr:OKR)
       WHERE okr.status = 'active' AND toLower(okr.title) CONTAINS $keyword
       RETURN okr.id AS id, okr.title AS title, 0.6 AS confidence
       LIMIT 5`,
      { keyword: keywords.split(' ')[0] }
    );

    suggestions.suggestedOkrs = okrsResult.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      confidence: r.get('confidence'),
    }));

    // Suggest objectives
    const objectivesResult = await session.run(
      `MATCH (obj:Objective)
       WHERE obj.status = 'active' AND toLower(obj.title) CONTAINS $keyword
       RETURN obj.id AS id, obj.title AS title, 0.6 AS confidence
       LIMIT 5`,
      { keyword: keywords.split(' ')[0] }
    );

    suggestions.suggestedObjectives = objectivesResult.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      confidence: r.get('confidence'),
    }));

    res.json({
      success: true,
      ...suggestions,
    });
  } catch (error) {
    logger.error('Error suggesting relationships:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest relationships',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /documents
 * List all documents with filters
 */
router.get('/', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { type, status, limit = 50, offset = 0 } = req.query;

    let query = `MATCH (d:Document)`;
    const params: any = {};

    const conditions: string[] = [];
    if (type) {
      conditions.push('d.type = $type');
      params.type = type;
    }
    if (status) {
      conditions.push('d.status = $status');
      params.status = status;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      OPTIONAL MATCH (d)<-[:UPLOADED]-(uploader:User)
      OPTIONAL MATCH (d)-[:BELONGS_TO_PROJECT]->(proj:Project)
      OPTIONAL MATCH (d)-[:LINKED_TO_OKR]->(okr:OKR)
      OPTIONAL MATCH (d)-[:SUPPORTS]->(obj:Objective)
      RETURN d, uploader.name AS uploaderName,
             collect(DISTINCT proj.name) AS projects,
             collect(DISTINCT okr.title) AS okrs,
             collect(DISTINCT obj.title) AS objectives
      ORDER BY d.createdAt DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = toNumber(offset);
    params.limit = toNumber(limit);

    const result = await session.run(query, params);

    const documents = result.records.map((r) => {
      const doc = r.get('d').properties;
      return {
        ...doc,
        uploaderName: r.get('uploaderName'),
        projects: r.get('projects').filter((p: any) => p),
        okrs: r.get('okrs').filter((o: any) => o),
        objectives: r.get('objectives').filter((o: any) => o),
      };
    });

    res.json({
      success: true,
      documents,
      total: documents.length,
    });
  } catch (error) {
    logger.error('Error listing documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list documents',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /documents/:id
 * Get document details with all relationships
 */
router.get('/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    const result = await session.run(
      `MATCH (d:Document {id: $id})
       OPTIONAL MATCH (d)<-[:UPLOADED]-(uploader:User)
       OPTIONAL MATCH (d)-[:BELONGS_TO_PROJECT]->(proj:Project)
       OPTIONAL MATCH (d)-[:LINKED_TO_OKR]->(okr:OKR)
       OPTIONAL MATCH (d)-[:SUPPORTS]->(obj:Objective)
       OPTIONAL MATCH (d)-[:DESCRIBES_PROCESS]->(proc:Process)
       OPTIONAL MATCH (d)-[:BELONGS_TO]->(dept:Department)
       OPTIONAL MATCH (d)-[:HAS_CHUNK]->(chunk:Chunk)
       RETURN d, uploader,
              collect(DISTINCT proj) AS projects,
              collect(DISTINCT okr) AS okrs,
              collect(DISTINCT obj) AS objectives,
              collect(DISTINCT proc) AS processes,
              collect(DISTINCT dept) AS departments,
              count(DISTINCT chunk) AS chunkCount`,
      { id }
    );

    if (result.records.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const record = result.records[0];
    const doc = record.get('d').properties;
    const uploader = record.get('uploader')?.properties;

    res.json({
      success: true,
      document: {
        ...doc,
        uploader: uploader ? { id: uploader.id, name: uploader.name } : null,
        projects: record.get('projects').map((p: any) => p.properties).filter((p: any) => p),
        okrs: record.get('okrs').map((o: any) => o.properties).filter((o: any) => o),
        objectives: record.get('objectives').map((o: any) => o.properties).filter((o: any) => o),
        processes: record.get('processes').map((p: any) => p.properties).filter((p: any) => p),
        departments: record.get('departments').map((d: any) => d.properties).filter((d: any) => d),
        chunkCount: toNumber(record.get('chunkCount')),
      },
    });
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch document',
    });
  } finally {
    await session.close();
  }
});

export default router;
