import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { FileTextExtractorService } from '../services/file-text-extractor.service';
import { llmExtractionService } from '../services/llm-extraction.service';
import { DocumentCategoryService } from '../services/document-category.service';
import { specializedExtractionService } from '../services/specialized-extraction.service';
import neo4j from 'neo4j-driver';
import { DocumentMetadata, DocumentType, MemoryClass } from '../types/document.types';

const router = Router();

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
router.post('/preprocess', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const hints = req.body.hints ? JSON.parse(req.body.hints) : undefined;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // Extract text content from file (supports .docx via specialized parser)
    const textExtractor = new FileTextExtractorService();
    const fileContent = await textExtractor.extract(file);
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
      extraction.suggestedTags,
      hints
    );

    const suggestedRelationships = {
      projects: suggestions.filter((s) => s.entityType === 'project').length,
      okrs: suggestions.filter((s) => s.entityType === 'okr').length,
      objectives: suggestions.filter((s) => s.entityType === 'objective').length,
      departments: suggestions.filter((s) => s.entityType === 'department').length,
      people: suggestions.filter((s) => s.entityType === 'person').length,
    };

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
      suggestedRelationships,
    });
  } catch (error) {
    logger.error('Error preprocessing document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preprocess document',
    });
  }
});

router.post('/extract', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const context = req.body.context ? JSON.parse(req.body.context) : undefined;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const fileContent = await new FileTextExtractorService().extract(file);
    const docType: DocumentType = context?.type || 'other';
    const category = DocumentCategoryService.getCategory(docType);
    const config = DocumentCategoryService.getConfig(docType);

    logger.info(`Document extraction - Type: ${docType}, Category: ${category}`);

    // Knowledge Base documents: no extraction needed
    if (category === 'knowledge_base') {
      logger.info('Knowledge Base document - skipping entity extraction');
      res.json({
        success: true,
        category: 'knowledge_base',
        processingMode: 'chunking_only',
        message: 'Documento de base de conhecimento - sem extração de entidades',
        data: {
          summary: context?.title || file.originalname,
          keyTopics: [],
          entities: [],
        },
      });
      return;
    }

    // Rich Extraction: keep single entity pipeline (Task/Decision/Risk/Insight)
    // and use specialized agents only for document-type canonical metadata.
    if (category === 'rich_extraction' && config.requiresSpecialist) {
      const agentsAvailable = await specializedExtractionService.isAvailable();

      if (!llmExtractionService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'LLM extraction service not configured. Check Azure OpenAI credentials.',
        });
        return;
      }

      logger.info('Using base entity extraction pipeline for rich document types');
      const baseExtraction = await llmExtractionService.extractFromDocument(fileContent, {
        id: context?.id || 'preview',
        title: context?.title || file.originalname,
        type: docType,
      });

      let specialistMetadata: Record<string, unknown> | null = null;
      if (agentsAvailable) {
        logger.info(`Using specialized metadata agent: ${config.specialistAgent}`);
        const specialistResponse = await specializedExtractionService.extractByType(fileContent, {
          id: context?.id || 'preview',
          title: context?.title || file.originalname,
          type: docType,
          author: context?.author,
          validFrom: context?.validFrom,
          validUntil: context?.validUntil,
          effectiveAt: context?.effectiveAt,
          signedAt: context?.signedAt,
        });

        const rawSpecialistData =
          specialistResponse && typeof specialistResponse === 'object' && 'data' in specialistResponse
            ? (specialistResponse as { data?: unknown }).data
            : specialistResponse;

        if (rawSpecialistData && typeof rawSpecialistData === 'object') {
          const canonical = { ...(rawSpecialistData as Record<string, unknown>) };
          delete canonical.entities;
          delete canonical.tasks;
          delete canonical.decisions;
          delete canonical.risks;
          delete canonical.insights;
          specialistMetadata = canonical;
        }
      } else {
        logger.warn('Specialized agents not available; rich docs will use entity pipeline only');
      }

      res.json({
        success: true,
        category: 'rich_extraction',
        processingMode: agentsAvailable ? 'hybrid_metadata_plus_entities' : 'entity_pipeline_only',
        agent: agentsAvailable ? config.specialistAgent : null,
        data: {
          summary: baseExtraction.summary || '',
          keyTopics: baseExtraction.keyTopics || [],
          entities: Array.isArray(baseExtraction.entities) ? baseExtraction.entities : [],
          canonicalData: specialistMetadata,
        },
      });
      return;
    }

    // Fallback: generic LLM extraction (for generic category or when agents unavailable)
    if (!llmExtractionService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'LLM extraction service not configured. Check Azure OpenAI credentials.',
      });
      return;
    }

    logger.info('Using generic LLM extraction');
    const extraction = await llmExtractionService.extractFromDocument(fileContent, {
      id: context?.id || 'preview',
      title: context?.title || file.originalname,
      type: docType,
    });

    res.json({
      success: true,
      category,
      processingMode: 'generic_llm',
      data: extraction,
    });
  } catch (error) {
    logger.error('Error extracting entities from document (preview):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract entities',
    });
  }
});

// =============================================
// Document Validation Endpoints
// =============================================

/**
 * GET /documents/:id/validations
 * Fetch entities pending validation extracted from a Document (Task, Decision, Risk, Insight)
 * Supports status filter: pending (default), validated, rejected, all
 */
router.get('/:id/validations', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  try {
    const { id } = req.params;
    const { status } = req.query;

    let entityWhereClause = '';
    if (status === 'validated') {
      entityWhereClause = 'AND e.validated = true';
    } else if (status === 'rejected') {
      entityWhereClause = 'AND e.validated = false';
    } else if (status === 'all') {
      entityWhereClause = '';
    } else {
      entityWhereClause = 'AND e.validated IS NULL';
    }

    const result = await session.run(
      `MATCH (e)-[:EXTRACTED_FROM]->(d:Document {id: $documentId})
       WHERE (e:Task OR e:Decision OR e:Risk OR e:Insight)
       ${entityWhereClause}
       OPTIONAL MATCH (e)-[rel]->(u:User)
       WHERE type(rel) IN ['ASSIGNED_TO', 'DECIDED_BY', 'RAISED_BY', 'CONTRIBUTED_BY']
       WITH e, d, rel, u
       OPTIONAL MATCH (orgUser:User {id: d.uploadedBy})
       WITH e, d, rel, u, head(collect(DISTINCT orgUser)) AS uploader
       RETURN
         labels(e)[0] AS entityType,
         e AS entity,
         d.id AS documentId,
         d.title AS documentTitle,
         d.createdAt AS documentCreatedAt,
         d.uploadedBy AS uploadedBy,
         uploader.id AS uploaderId,
         uploader.name AS uploaderName,
         u.id AS assigneeId,
         u.name AS assigneeName,
         type(rel) AS relType
       ORDER BY d.createdAt DESC, e.createdAt DESC`,
      { documentId: id }
    );

    const validations = result.records.map((record) => {
      const entity = record.get('entity').properties;
      const entityType = record.get('entityType').toLowerCase();
      const confidence = entity.confidence;

      const titleOrValue = entity.value || entity.title || '';
      const assigneeName = record.get('assigneeName') || entity.assignee || entity.relatedPerson || null;

      return {
        id: entity.id,
        entityType,
        value: titleOrValue,
        description: entity.description || '',
        priority: entity.priority || null,
        deadline: entity.dueDate || null,
        confidence: typeof confidence === 'number' ? confidence : toNumber(confidence) || 0,
        visibility: entity.visibility || 'corporate',
        validated: entity.validated ?? null,
        validatedAt: entity.validatedAt?.toString() || null,
        createdAt: entity.createdAt?.toString() || '',
        source: record.get('documentTitle') || 'Documento',
        sourceType: 'document' as const,
        meetingId: record.get('documentId'),
        meetingTitle: record.get('documentTitle') || '',
        meetingOrganizer: record.get('uploaderName') || '',
        meetingOrganizerId: record.get('uploaderId') || record.get('uploadedBy') || null,
        meetingDate: record.get('documentCreatedAt')?.toString() || '',
        assigneeId: record.get('assigneeId') || null,
        assigneeName,
        relType: record.get('relType') || null,
      };
    });

    res.json({ success: true, data: validations, total: validations.length });
  } catch (error) {
    logger.error('Error fetching document validations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch document validations' });
  } finally {
    await session.close();
  }
});

/**
 * POST /documents/ingest
 * Upload and ingest a document with BIG relationships
 */
router.post('/ingest', authenticate, upload.single('file'), async (req: Request, res: Response) => {
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

    const approvedEntities = Array.isArray((metadata as any)?.approvedEntities)
      ? ((metadata as any).approvedEntities as any[])
      : null;

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
        validFrom: $validFrom,
        validUntil: $validUntil,
        effectiveAt: $effectiveAt,
        signedAt: $signedAt,
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
        departmentId: $departmentId,
        canonicalDataJson: $canonicalDataJson
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
        validFrom: metadata.validFrom || null,
        validUntil: metadata.validUntil || null,
        effectiveAt: metadata.effectiveAt || null,
        signedAt: metadata.signedAt || null,
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
        canonicalDataJson: JSON.stringify(metadata.canonicalData || {}),
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
           MATCH (p)
           WHERE (p:Project OR p:project)
             AND (p.id = $projectId OR p.projectId = $projectId OR elementId(p) = $projectId)
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
    logger.info(`🔍 Starting semantic chunking for document type: ${metadata.type}`);
    const textExtractor = new FileTextExtractorService();
    const fileContent = await textExtractor.extract(file);
    logger.info(`📄 Extracted text length: ${fileContent.length} chars`);
    
    const { ChunkerFactory } = await import('../services/chunking/chunker-factory');
    const chunker = ChunkerFactory.create(metadata.type);
    logger.info(`🔨 Using chunker for type: ${metadata.type}`);
    
    const semanticChunks = await chunker.chunk(fileContent, {
      id: documentId,
      title: metadata.title,
      type: metadata.type,
      sourceFile: file.originalname,
      author: metadata.author,
      createdAt: new Date(),
      validFrom: metadata.validFrom,
      validUntil: metadata.validUntil,
      effectiveAt: metadata.effectiveAt,
      signedAt: metadata.signedAt,
    });
    if (!semanticChunks || semanticChunks.length === 0) {
      throw new Error('Chunking failed: produced 0 chunks');
    }
    logger.info(`✂️ Generated ${semanticChunks.length} semantic chunks`);
    semanticChunks.forEach((chunk, idx) => {
      logger.info(`  Chunk ${idx}: type=${chunk.chunkType}, level=${chunk.hierarchyLevel}, length=${chunk.text.length}, title="${chunk.sectionTitle}"`);
    });

    // Create chunk nodes with semantic metadata
    const firstNonEmpty = (values: Array<string | undefined | null>) =>
      values.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
    const inferredValidFrom = firstNonEmpty(semanticChunks.map((c) => c.validFrom));
    const inferredValidUntil = firstNonEmpty(semanticChunks.map((c) => c.validUntil));
    const inferredEffectiveAt = firstNonEmpty(semanticChunks.map((c) => c.effectiveAt));
    const inferredSignedAt = firstNonEmpty(semanticChunks.map((c) => c.signedAt));

    const extractedEntities = {
      tasks: 0,
      decisions: 0,
      risks: 0,
      insights: 0,
    };

    for (const chunk of semanticChunks) {
      const chunkId = randomUUID();
      const containsTable = Boolean(chunk.metadata?.containsTable);
      const tableDataJson = chunk.metadata?.tableData ? JSON.stringify(chunk.metadata.tableData) : null;
      const keyTopics = Array.isArray(chunk.metadata?.keyTopics) ? chunk.metadata.keyTopics : [];
      const estimatedImportance = typeof chunk.metadata?.estimatedImportance === 'string' ? chunk.metadata.estimatedImportance : null;
      const reasoning = typeof chunk.metadata?.reasoning === 'string' ? chunk.metadata.reasoning : null;
      
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
           createdAt: datetime(),
           containsTable: $containsTable,
           tableDataJson: $tableDataJson,
           keyTopics: $keyTopics,
           estimatedImportance: $estimatedImportance,
           reasoning: $reasoning,
           validFrom: $validFrom,
           validUntil: $validUntil,
           effectiveAt: $effectiveAt,
           signedAt: $signedAt
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
          containsTable,
          tableDataJson,
          keyTopics,
          estimatedImportance,
          reasoning,
          validFrom: chunk.validFrom || null,
          validUntil: chunk.validUntil || null,
          effectiveAt: chunk.effectiveAt || null,
          signedAt: chunk.signedAt || null,
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

    
    if (approvedEntities) {
      for (const entity of approvedEntities) {
        const type = typeof entity?.type === 'string' ? entity.type : '';
        const value = typeof entity?.value === 'string' ? entity.value : '';
        const description = typeof entity?.description === 'string' ? entity.description : (entity?.context || '');
        const confidence = typeof entity?.confidence === 'number' ? entity.confidence : 0.8;
        const sourceRef = `document:${documentId}`;

        if (!value) continue;

        if (type === 'task') {
          const taskId = randomUUID();
          const assigneeName = entity.assignee || entity.relatedPerson || '';

          await tx.run(
            `MATCH (d:Document {id: $documentId})
             CREATE (t:Task {
               id: $taskId,
               title: $value,
               description: $description,
               status: 'pending',
               priority: $priority,
               assignee: $assignee,
               dueDate: $deadline,
               impact: $impact,
               confidence: $confidence,
               sourceRef: $sourceRef,
               validated: true,
               validatedAt: datetime(),
               visibility: 'corporate',
               memoryLevel: 'medium',
               completedAt: null,
               createdAt: datetime(),
               createdBy: $createdBy
             })
             CREATE (t)-[:EXTRACTED_FROM]->(d)`,
            {
              documentId,
              taskId,
              value,
              description,
              priority: entity.priority || 'medium',
              assignee: assigneeName,
              deadline: entity.deadline || '',
              impact: entity.impact || '',
              confidence,
              sourceRef,
              createdBy: userId,
            }
          );

          if (assigneeName) {
            await tx.run(
              `MATCH (t:Task {id: $taskId})
               OPTIONAL MATCH (u:User)
               WHERE toLower(u.name) = toLower($assigneeName)
               WITH t, u
               WHERE u IS NOT NULL
               MERGE (t)-[:ASSIGNED_TO]->(u)`,
              { taskId, assigneeName }
            );
          }

          extractedEntities.tasks++;
        } else if (type === 'decision') {
          const decisionId = randomUUID();
          const relatedPersonName = entity.relatedPerson || '';

          await tx.run(
            `MATCH (doc:Document {id: $documentId})
             CREATE (d:Decision {
               id: $decisionId,
               value: $value,
               description: $description,
               rationale: $rationale,
               impact: $impact,
               relatedPerson: $relatedPerson,
               confidence: $confidence,
               sourceRef: $sourceRef,
               validated: true,
               validatedAt: datetime(),
               visibility: 'corporate',
               createdAt: datetime(),
               createdBy: $createdBy
             })
             CREATE (d)-[:EXTRACTED_FROM]->(doc)`,
            {
              documentId,
              decisionId,
              value,
              description,
              rationale: (entity as any).rationale || '',
              impact: entity.impact || '',
              relatedPerson: relatedPersonName,
              confidence,
              sourceRef,
              createdBy: userId,
            }
          );

          if (relatedPersonName) {
            await tx.run(
              `MATCH (d:Decision {id: $decisionId})
               OPTIONAL MATCH (u:User)
               WHERE toLower(u.name) = toLower($relatedPersonName)
               WITH d, u
               WHERE u IS NOT NULL
               MERGE (d)-[:DECIDED_BY]->(u)`,
              { decisionId, relatedPersonName }
            );
          }

          extractedEntities.decisions++;
        } else if (type === 'risk') {
          const riskId = randomUUID();
          const relatedPersonName = entity.relatedPerson || '';

          await tx.run(
            `MATCH (doc:Document {id: $documentId})
             CREATE (r:Risk {
               id: $riskId,
               value: $value,
               description: $description,
               impact: $impact,
               probability: $probability,
               priority: $priority,
               relatedPerson: $relatedPerson,
               mitigation: $mitigation,
               confidence: $confidence,
               sourceRef: $sourceRef,
               validated: true,
               validatedAt: datetime(),
               visibility: 'corporate',
               createdAt: datetime(),
               createdBy: $createdBy
             })
             CREATE (r)-[:EXTRACTED_FROM]->(doc)`,
            {
              documentId,
              riskId,
              value,
              description,
              impact: entity.impact || '',
              probability: (entity as any).probability || entity.priority || 'medium',
              priority: entity.priority || 'medium',
              relatedPerson: relatedPersonName,
              mitigation: (entity as any).mitigation || '',
              confidence,
              sourceRef,
              createdBy: userId,
            }
          );

          if (relatedPersonName) {
            await tx.run(
              `MATCH (r:Risk {id: $riskId})
               OPTIONAL MATCH (u:User)
               WHERE toLower(u.name) = toLower($relatedPersonName)
               WITH r, u
               WHERE u IS NOT NULL
               MERGE (r)-[:RAISED_BY]->(u)`,
              { riskId, relatedPersonName }
            );
          }

          extractedEntities.risks++;
        } else if (type === 'insight') {
          const insightId = randomUUID();
          const relatedPersonName = entity.relatedPerson || '';

          await tx.run(
            `MATCH (doc:Document {id: $documentId})
             CREATE (i:Insight {
               id: $insightId,
               value: $value,
               description: $description,
               impact: $impact,
               relatedPerson: $relatedPerson,
               confidence: $confidence,
               sourceRef: $sourceRef,
               validated: true,
               validatedAt: datetime(),
               visibility: 'corporate',
               createdAt: datetime(),
               createdBy: $createdBy
             })
             CREATE (i)-[:EXTRACTED_FROM]->(doc)`,
            {
              documentId,
              insightId,
              value,
              description,
              impact: entity.impact || '',
              relatedPerson: relatedPersonName,
              confidence,
              sourceRef,
              createdBy: userId,
            }
          );

          if (relatedPersonName) {
            await tx.run(
              `MATCH (i:Insight {id: $insightId})
               OPTIONAL MATCH (u:User)
               WHERE toLower(u.name) = toLower($relatedPersonName)
               WITH i, u
               WHERE u IS NOT NULL
               MERGE (i)-[:CONTRIBUTED_BY]->(u)`,
              { insightId, relatedPersonName }
            );
          }

          extractedEntities.insights++;
        }
      }
    } else if (llmExtractionService.isConfigured()) {
      try {
        logger.info(`🧠 Starting document semantic enrichment (${fileContent.length} chars)`);

        const enrichment = await llmExtractionService.extractFromDocument(fileContent, {
          id: documentId,
          title: metadata.title,
          type: metadata.type,
        });

        await tx.run(
          `MATCH (d:Document {id: $documentId})
           SET d.summary = coalesce(d.summary, $summary),
               d.keyTopics = CASE WHEN size(coalesce(d.keyTopics, [])) > 0 THEN d.keyTopics ELSE $keyTopics END,
               d.enrichedAt = datetime()`,
          {
            documentId,
            summary: enrichment.summary || null,
            keyTopics: enrichment.keyTopics || [],
          }
        );

        const entities = Array.isArray(enrichment.entities) ? enrichment.entities : [];
        for (const entity of entities) {
          const type = typeof entity?.type === 'string' ? entity.type : '';
          const value = typeof entity?.value === 'string' ? entity.value : '';
          const description =
            typeof entity?.description === 'string' ? entity.description : (entity?.context || '');
          const confidence = typeof entity?.confidence === 'number' ? entity.confidence : 0.8;
          const sourceRef = `document:${documentId}`;

          if (!value) continue;

          if (type === 'task') {
            const taskId = randomUUID();
            const assigneeName = entity.assignee || entity.relatedPerson || '';
            
            await tx.run(
              `MATCH (d:Document {id: $documentId})
               CREATE (t:Task {
                 id: $taskId,
                 title: $value,
                 description: $description,
                 status: 'pending',
                 priority: $priority,
                 assignee: $assignee,
                 dueDate: $deadline,
                 impact: $impact,
                 confidence: $confidence,
                 sourceRef: $sourceRef,
                 validated: null,
                 validatedAt: null,
                 visibility: 'corporate',
                 memoryLevel: 'medium',
                 completedAt: null,
                 createdAt: datetime(),
                 createdBy: $createdBy
               })
               CREATE (t)-[:EXTRACTED_FROM]->(d)`,
              {
                documentId,
                taskId,
                value,
                description,
                priority: entity.priority || 'medium',
                assignee: assigneeName,
                deadline: entity.deadline || '',
                impact: entity.impact || '',
                confidence,
                sourceRef,
                createdBy: userId,
              }
            );

            if (assigneeName) {
              await tx.run(
                `MATCH (t:Task {id: $taskId})
                 OPTIONAL MATCH (u:User)
                 WHERE toLower(u.name) = toLower($assigneeName)
                 WITH t, u
                 WHERE u IS NOT NULL
                 MERGE (t)-[:ASSIGNED_TO]->(u)`,
                { taskId, assigneeName }
              );
            }

            extractedEntities.tasks++;
          } else if (type === 'decision') {
            const decisionId = randomUUID();
            const relatedPersonName = entity.relatedPerson || '';

            await tx.run(
              `MATCH (doc:Document {id: $documentId})
               CREATE (d:Decision {
                 id: $decisionId,
                 value: $value,
                 description: $description,
                 rationale: $rationale,
                 impact: $impact,
                 relatedPerson: $relatedPerson,
                 confidence: $confidence,
                 sourceRef: $sourceRef,
                 validated: null,
                 validatedAt: null,
                 visibility: 'corporate',
                 createdAt: datetime(),
                 createdBy: $createdBy
               })
               CREATE (d)-[:EXTRACTED_FROM]->(doc)`,
              {
                documentId,
                decisionId,
                value,
                description,
                rationale: (entity as any).rationale || '',
                impact: entity.impact || '',
                relatedPerson: relatedPersonName,
                confidence,
                sourceRef,
                createdBy: userId,
              }
            );

            if (relatedPersonName) {
              await tx.run(
                `MATCH (d:Decision {id: $decisionId})
                 OPTIONAL MATCH (u:User)
                 WHERE toLower(u.name) = toLower($relatedPersonName)
                 WITH d, u
                 WHERE u IS NOT NULL
                 MERGE (d)-[:DECIDED_BY]->(u)`,
                { decisionId, relatedPersonName }
              );
            }

            extractedEntities.decisions++;
          } else if (type === 'risk') {
            const riskId = randomUUID();
            const relatedPersonName = entity.relatedPerson || '';

            await tx.run(
              `MATCH (doc:Document {id: $documentId})
               CREATE (r:Risk {
                 id: $riskId,
                 value: $value,
                 description: $description,
                 impact: $impact,
                 probability: $probability,
                 priority: $priority,
                 relatedPerson: $relatedPerson,
                 mitigation: $mitigation,
                 confidence: $confidence,
                 sourceRef: $sourceRef,
                 validated: null,
                 validatedAt: null,
                 visibility: 'corporate',
                 createdAt: datetime(),
                 createdBy: $createdBy
               })
               CREATE (r)-[:EXTRACTED_FROM]->(doc)`,
              {
                documentId,
                riskId,
                value,
                description,
                impact: entity.impact || '',
                probability: (entity as any).probability || entity.priority || 'medium',
                priority: entity.priority || 'medium',
                relatedPerson: relatedPersonName,
                mitigation: (entity as any).mitigation || '',
                confidence,
                sourceRef,
                createdBy: userId,
              }
            );

            if (relatedPersonName) {
              await tx.run(
                `MATCH (r:Risk {id: $riskId})
                 OPTIONAL MATCH (u:User)
                 WHERE toLower(u.name) = toLower($relatedPersonName)
                 WITH r, u
                 WHERE u IS NOT NULL
                 MERGE (r)-[:RAISED_BY]->(u)`,
                { riskId, relatedPersonName }
              );
            }

            extractedEntities.risks++;
          } else if (type === 'insight') {
            const insightId = randomUUID();
            const relatedPersonName = entity.relatedPerson || '';

            await tx.run(
              `MATCH (doc:Document {id: $documentId})
               CREATE (i:Insight {
                 id: $insightId,
                 value: $value,
                 description: $description,
                 impact: $impact,
                 relatedPerson: $relatedPerson,
                 confidence: $confidence,
                 sourceRef: $sourceRef,
                 validated: null,
                 validatedAt: null,
                 visibility: 'corporate',
                 createdAt: datetime(),
                 createdBy: $createdBy
               })
               CREATE (i)-[:EXTRACTED_FROM]->(doc)`,
              {
                documentId,
                insightId,
                value,
                description,
                impact: entity.impact || '',
                relatedPerson: relatedPersonName,
                confidence,
                sourceRef,
                createdBy: userId,
              }
            );

            if (relatedPersonName) {
              await tx.run(
                `MATCH (i:Insight {id: $insightId})
                 OPTIONAL MATCH (u:User)
                 WHERE toLower(u.name) = toLower($relatedPersonName)
                 WITH i, u
                 WHERE u IS NOT NULL
                 MERGE (i)-[:CONTRIBUTED_BY]->(u)`,
                { insightId, relatedPersonName }
              );
            }

            extractedEntities.insights++;
          }
        }
      } catch (enrichmentError) {
        logger.warn('Document enrichment failed, continuing without blocking ingestion:', enrichmentError);
      }
    }

    // 6. Update document status
    const hasPendingValidations = !approvedEntities &&
      (extractedEntities.tasks || 0) +
      (extractedEntities.decisions || 0) +
      (extractedEntities.risks || 0) +
      (extractedEntities.insights || 0) > 0;

    await tx.run(
      `MATCH (d:Document {id: $documentId})
       SET d.status = $status,
           d.processedAt = datetime(),
           d.chunkCount = $chunkCount,
           d.validFrom = coalesce(d.validFrom, $validFrom),
           d.validUntil = coalesce(d.validUntil, $validUntil),
           d.effectiveAt = coalesce(d.effectiveAt, $effectiveAt),
           d.signedAt = coalesce(d.signedAt, $signedAt)`,
      {
        documentId,
        status: hasPendingValidations ? 'pending_validation' : 'completed',
        chunkCount: semanticChunks.length,
        validFrom: inferredValidFrom,
        validUntil: inferredValidUntil,
        effectiveAt: inferredEffectiveAt,
        signedAt: inferredSignedAt,
      }
    );

    await tx.commit();

    logger.info(`Document ingested: ${documentId}, ${metadata.title}`);

    res.status(201).json({
      success: true,
      data: {
        documentId,
        chunkCount: semanticChunks.length,
        extractedEntities,
        relationships,
      },
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
  // CORS headers explícitos
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const session = neo4jConnection.getSession();
  const { type } = req.query;

  try {
    let entities: any[] = [];

    if (!type || type === 'project') {
      const projectsResult = await session.run(`
        MATCH (p)
        WHERE (p:Project OR p:project)
          AND (p.status IS NULL OR p.status <> 'archived')
        OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
        OPTIONAL MATCH (p)-[:BELONGS_TO]->(dept:Department)
        RETURN coalesce(p.id, p.projectId, elementId(p)) AS id,
               p.name AS name, 'project' AS type, p.status AS status, 
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
router.post('/suggest-relationships', authenticate, async (req: Request, res: Response) => {
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
      `MATCH (p)
       WHERE (p:Project OR p:project)
         AND (p.status IS NULL OR p.status <> 'archived')
         AND toLower(p.name) CONTAINS $keyword
       RETURN coalesce(p.id, p.projectId, elementId(p)) AS id, p.name AS name, 0.7 AS confidence
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
      OPTIONAL MATCH (d)-[:BELONGS_TO_PROJECT]->(proj)
      OPTIONAL MATCH (d)-[:LINKED_TO_OKR]->(okr:OKR)
      OPTIONAL MATCH (d)-[:SUPPORTS]->(obj:Objective)
      RETURN d, uploader.name AS uploaderName,
             collect(DISTINCT CASE WHEN proj:Project OR proj:project THEN proj.name ELSE null END) AS projects,
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
 * GET /documents/:elementId/reconstruct
 * Reconstruct document from chunks and compare with original
 */
router.get('/:elementId/reconstruct', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { elementId } = req.params;

    // Get document info
    const docResult = await session.run(
      `MATCH (d:Document) 
       WHERE elementId(d) = $elementId
       RETURN d.id AS docId, d.title AS title, d.sourceFile AS sourceFile, 
              d.chunkCount AS chunkCount, d.format AS format`,
      { elementId }
    );

    if (docResult.records.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const docRecord = docResult.records[0];
    const docId = docRecord.get('docId');
    const title = docRecord.get('title');
    const sourceFile = docRecord.get('sourceFile');
    const chunkCount = docRecord.get('chunkCount');

    // Get all chunks ordered by sequence
    const chunksResult = await session.run(
      `MATCH (d:Document {id: $docId})-[:HAS_CHUNK]->(c:Chunk)
       RETURN c.id AS id, c.text AS text, c.textLength AS textLength,
              c.sequenceIndex AS sequenceIndex, c.chunkType AS chunkType,
              c.hierarchyLevel AS hierarchyLevel, c.sectionTitle AS sectionTitle
       ORDER BY c.sequenceIndex`,
      { docId }
    );

    const chunks = chunksResult.records.map(r => ({
      id: r.get('id'),
      text: r.get('text'),
      textLength: r.get('textLength'),
      sequenceIndex: r.get('sequenceIndex'),
      chunkType: r.get('chunkType'),
      hierarchyLevel: r.get('hierarchyLevel'),
      sectionTitle: r.get('sectionTitle'),
    }));

    // Reconstruct document
    const reconstructed = chunks.map(c => c.text).join('\n\n');

    // Analyze chunks
    const analysis = {
      totalChunks: chunks.length,
      expectedChunks: chunkCount,
      chunkSizes: chunks.map(c => c.textLength),
      avgChunkSize: chunks.reduce((sum, c) => sum + c.textLength, 0) / chunks.length,
      minChunkSize: Math.min(...chunks.map(c => c.textLength)),
      maxChunkSize: Math.max(...chunks.map(c => c.textLength)),
      emptyChunks: chunks.filter(c => !c.text || c.text.trim().length === 0).length,
      specialCharsIssues: chunks.filter(c => 
        c.text && (c.text.includes('�') || c.text.includes('\ufffd'))
      ).length,
    };

    logger.info(`📊 Document reconstruction analysis:`, analysis);

    res.json({
      success: true,
      document: {
        id: docId,
        elementId,
        title,
        sourceFile,
        chunkCount,
      },
      chunks,
      reconstructed,
      analysis,
    });
  } catch (error) {
    logger.error('Error reconstructing document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconstruct document',
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
       OPTIONAL MATCH (d)-[:BELONGS_TO_PROJECT]->(proj)
       OPTIONAL MATCH (d)-[:LINKED_TO_OKR]->(okr:OKR)
       OPTIONAL MATCH (d)-[:SUPPORTS]->(obj:Objective)
       OPTIONAL MATCH (d)-[:DESCRIBES_PROCESS]->(proc:Process)
       OPTIONAL MATCH (d)-[:BELONGS_TO]->(dept:Department)
       OPTIONAL MATCH (d)-[:HAS_CHUNK]->(chunk:Chunk)
       RETURN d, uploader,
              collect(DISTINCT CASE WHEN proj:Project OR proj:project THEN proj ELSE null END) AS projects,
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
