import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate, requireAdmin } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { llmExtractionService } from '../services/llm-extraction.service';
import neo4j from 'neo4j-driver';

const router = Router();

router.use(authenticate);

const toNumber = (value: unknown): number => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'low' in (value as any)) return (value as any).low;
  return Number(value);
};

/**
 * GET /meetings/organizations
 * Get list of partner organizations (from ExternalParticipants)
 */
router.get('/organizations', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(`
      MATCH (ep:ExternalParticipant)
      WHERE ep.organization IS NOT NULL AND ep.organization <> ''
      WITH DISTINCT ep.organization AS name
      OPTIONAL MATCH (ep2:ExternalParticipant {organization: name})
      WITH name, count(ep2) AS participantCount
      RETURN name, participantCount
      ORDER BY name
    `);

    const organizations = result.records.map((r) => ({
      name: r.get('name'),
      participantCount: toNumber(r.get('participantCount')),
    }));

    res.json({
      success: true,
      data: organizations,
      total: organizations.length,
    });
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organizations',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /meetings/ingest
 * Ingest a meeting transcript with entities into the graph
 */
router.post('/ingest', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const tx = session.beginTransaction();

  try {
    const { meetingNode, entities, relationships, curationJob } = req.body;
    const userId = (req as any).user?.userId || 'system';

    const keyTopicsRaw = Array.isArray(meetingNode?.keyTopics) ? meetingNode.keyTopics : [];
    const keyTopics = keyTopicsRaw
      .map((t: any) => (typeof t === 'string' ? t : t?.topic))
      .filter((t: any) => typeof t === 'string' && t.trim().length > 0);
    const keyTopicsJson = JSON.stringify(keyTopicsRaw);

    // Validation
    if (!meetingNode?.title) {
      res.status(400).json({ success: false, error: 'Meeting title is required' });
      return;
    }

    // 1. Create Meeting node
    const meetingResult = await tx.run(
      `CREATE (m:Meeting {
         id: randomUUID(),
         title: $title,
         date: $date,
         time: $time,
         duration: $duration,
         organizer: $organizer,
         meetingType: $meetingType,
         confidentiality: $confidentiality,
         recurrence: $recurrence,
         sourceFile: $sourceFile,
         processedAt: $processedAt,
         summary: $summary,
         keyTopics: $keyTopics,
         keyTopicsJson: $keyTopicsJson,
         createdAt: datetime(),
         createdBy: $createdBy
       })
       RETURN m`,
      {
        title: meetingNode.title,
        date: meetingNode.date || '',
        time: meetingNode.time || '',
        duration: meetingNode.duration || '',
        organizer: meetingNode.organizer || '',
        meetingType: meetingNode.meetingType || 'other',
        confidentiality: meetingNode.confidentiality || 'normal',
        recurrence: meetingNode.recurrence || 'single',
        sourceFile: meetingNode.sourceFile || '',
        processedAt: meetingNode.processedAt || new Date().toISOString(),
        summary: meetingNode.summary || '',
        keyTopics,
        keyTopicsJson,
        createdBy: userId,
      }
    );

    const meetingId = meetingResult.records[0].get('m').properties.id;
    logger.info(`Meeting created: ${meetingNode.title} (${meetingId})`);

    // 2. Link Meeting to Project if provided
    if (relationships) {
      const projectRel = relationships.find((r: any) => r.type === 'RELATED_TO_PROJECT');
      if (projectRel?.to) {
        await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           MATCH (p:Project {id: $projectId})
           MERGE (m)-[:RELATED_TO_PROJECT]->(p)`,
          { meetingId, projectId: projectRel.to }
        );
        logger.info(`Meeting linked to project: ${projectRel.to}`);
      }
    }

    // 3. Process entities and create relationships
    const createdEntities: any[] = [];
    
    for (const entity of entities || []) {
      if (entity.type === 'participant') {
        // Link to existing Person/User or ExternalParticipant
        if (entity.linkedNodeId) {
          const linkResult = await tx.run(
            `MATCH (m:Meeting {id: $meetingId})
             OPTIONAL MATCH (u:User {id: $nodeId})
             OPTIONAL MATCH (ep:ExternalParticipant {id: $nodeId})
             WITH m, COALESCE(u, ep) AS participant
             WHERE participant IS NOT NULL
             MERGE (participant)-[r:PARTICIPATED_IN]->(m)
             SET r.confidence = $confidence,
                 r.sourceRef = $sourceRef,
                 r.createdAt = datetime()
             RETURN participant`,
            {
              meetingId,
              nodeId: entity.linkedNodeId,
              confidence: entity.confidence || 1.0,
              sourceRef: entity.sourceRef || '',
            }
          );

          if (linkResult.records.length > 0) {
            createdEntities.push({
              type: 'participant',
              value: entity.value,
              linkedNodeId: entity.linkedNodeId,
              relationship: 'PARTICIPATED_IN',
            });
          }
        }
      } else if (entity.type === 'task' || entity.type === 'actionItem') {
        // Criar node Task vinculado à Meeting (consolidação: actionItem → task)
        const assigneeName = entity.assignee || entity.relatedPerson || '';
        const taskResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (t:Task {
             id: randomUUID(),
             title: $value,
             description: $description,
             status: 'pending',
             priority: $priority,
             assignee: $assignee,
             dueDate: $deadline,
             impact: $impact,
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             memoryLevel: $memoryLevel,
             completedAt: null,
             createdAt: datetime(),
             createdBy: $createdBy
           })
           CREATE (t)-[:EXTRACTED_FROM]->(m)
           RETURN t`,
          {
            meetingId,
            value: entity.value,
            description: entity.description || entity.context || '',
            priority: entity.priority || 'medium',
            assignee: assigneeName,
            deadline: entity.deadline || '',
            impact: entity.impact || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            memoryLevel: entity.memoryLevel || 'medium',
            createdBy: userId,
          }
        );
        if (taskResult.records.length > 0) {
          const taskNodeId = taskResult.records[0].get('t').properties.id;
          createdEntities.push({
            type: 'task',
            value: entity.value,
            nodeId: taskNodeId,
          });
          // Criar relacionamento ASSIGNED_TO → User (busca por nome)
          if (assigneeName) {
            await tx.run(
              `MATCH (t:Task {id: $taskId})
               MATCH (u:User) WHERE toLower(u.name) CONTAINS toLower($name)
               MERGE (t)-[:ASSIGNED_TO]->(u)`,
              { taskId: taskNodeId, name: assigneeName }
            );
          }
        }
      } else if (entity.type === 'decision') {
        // Criar node Decision vinculado à Meeting
        const personName = entity.relatedPerson || '';
        const decisionResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (d:Decision {
             id: randomUUID(),
             value: $value,
             description: $description,
             rationale: $rationale,
             impact: $impact,
             relatedPerson: $relatedPerson,
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             createdAt: datetime(),
             createdBy: $createdBy
           })
           CREATE (d)-[:EXTRACTED_FROM]->(m)
           RETURN d`,
          {
            meetingId,
            value: entity.value,
            description: entity.description || entity.context || '',
            rationale: entity.rationale || '',
            impact: entity.impact || '',
            relatedPerson: personName,
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (decisionResult.records.length > 0) {
          const decisionNodeId = decisionResult.records[0].get('d').properties.id;
          createdEntities.push({
            type: 'decision',
            value: entity.value,
            nodeId: decisionNodeId,
          });
          // Criar relacionamento DECIDED_BY → User (busca por nome)
          if (personName) {
            await tx.run(
              `MATCH (d:Decision {id: $decisionId})
               MATCH (u:User) WHERE toLower(u.name) CONTAINS toLower($name)
               MERGE (d)-[:DECIDED_BY]->(u)`,
              { decisionId: decisionNodeId, name: personName }
            );
          }
        }
      } else if (entity.type === 'risk') {
        // Criar node Risk vinculado à Meeting
        const personName = entity.relatedPerson || '';
        const riskResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (r:Risk {
             id: randomUUID(),
             value: $value,
             description: $description,
             impact: $impact,
             probability: $probability,
             priority: $priority,
             relatedPerson: $relatedPerson,
             mitigation: $mitigation,
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             createdAt: datetime(),
             createdBy: $createdBy
           })
           CREATE (r)-[:EXTRACTED_FROM]->(m)
           RETURN r`,
          {
            meetingId,
            value: entity.value,
            description: entity.description || entity.context || '',
            impact: entity.impact || '',
            probability: entity.priority || 'medium',
            priority: entity.priority || 'medium',
            relatedPerson: personName,
            mitigation: '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (riskResult.records.length > 0) {
          const riskNodeId = riskResult.records[0].get('r').properties.id;
          createdEntities.push({
            type: 'risk',
            value: entity.value,
            nodeId: riskNodeId,
          });
          // Criar relacionamento RAISED_BY → User (busca por nome)
          if (personName) {
            await tx.run(
              `MATCH (r:Risk {id: $riskId})
               MATCH (u:User) WHERE toLower(u.name) CONTAINS toLower($name)
               MERGE (r)-[:RAISED_BY]->(u)`,
              { riskId: riskNodeId, name: personName }
            );
          }
        }
      } else if (entity.type === 'insight') {
        // Criar node Insight vinculado à Meeting
        const personName = entity.relatedPerson || '';
        const insightResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (i:Insight {
             id: randomUUID(),
             value: $value,
             description: $description,
             impact: $impact,
             relatedPerson: $relatedPerson,
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             createdAt: datetime(),
             createdBy: $createdBy
           })
           CREATE (i)-[:EXTRACTED_FROM]->(m)
           RETURN i`,
          {
            meetingId,
            value: entity.value,
            description: entity.description || entity.context || '',
            impact: entity.impact || '',
            relatedPerson: personName,
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (insightResult.records.length > 0) {
          const insightNodeId = insightResult.records[0].get('i').properties.id;
          createdEntities.push({
            type: 'insight',
            value: entity.value,
            nodeId: insightNodeId,
          });
          // Criar relacionamento CONTRIBUTED_BY → User (busca por nome)
          if (personName) {
            await tx.run(
              `MATCH (i:Insight {id: $insightId})
               MATCH (u:User) WHERE toLower(u.name) CONTAINS toLower($name)
               MERGE (i)-[:CONTRIBUTED_BY]->(u)`,
              { insightId: insightNodeId, name: personName }
            );
          }
        }
      } else if (entity.type === 'mentionedEntity' && entity.linkedNodeId) {
        // Vincular entidade mencionada existente à Meeting
        await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           MATCH (e {id: $nodeId})
           MERGE (m)-[r:MENTIONS]->(e)
           SET r.confidence = $confidence,
               r.context = $context,
               r.createdAt = datetime()`,
          {
            meetingId,
            nodeId: entity.linkedNodeId,
            confidence: entity.confidence || 0.8,
            context: entity.context || '',
          }
        );
        createdEntities.push({
          type: 'mentionedEntity',
          value: entity.value,
          linkedNodeId: entity.linkedNodeId,
        });
      } else if (entity.type === 'mentionedEntity' && !entity.linkedNodeId) {
        // Criar NOVO node para entidade mencionada não vinculada
        // Mapear entityType → label do Neo4j
        const labelMap: Record<string, string> = {
          organization: 'Organization',
          tool: 'Tool',
          product: 'Product',
          client: 'Client',
          person_external: 'ExternalParticipant',
          concept: 'Concept',
        };
        const nodeLabel = labelMap[entity.entityType] || 'Organization';
        const newNodeId = randomUUID();

        await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (e:${nodeLabel} {
             id: $nodeId,
             name: $name,
             description: $description,
             confidence: $confidence,
             sourceRef: $sourceRef,
             createdAt: datetime(),
             createdBy: $userId,
             origin: 'meeting_ingestion'
           })
           MERGE (m)-[r:MENTIONS]->(e)
           SET r.confidence = $confidence,
               r.context = $context,
               r.createdAt = datetime()`,
          {
            meetingId,
            nodeId: newNodeId,
            name: entity.value,
            description: entity.description || entity.context || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || '',
            context: entity.context || '',
            userId,
          }
        );
        createdEntities.push({
          type: 'mentionedEntity',
          value: entity.value,
          entityType: entity.entityType || 'organization',
          nodeLabel,
          nodeId: newNodeId,
          created: true,
        });
        logger.info(`Created new ${nodeLabel} node: "${entity.value}" (id: ${newNodeId})`);
      }
    }

    // 4. Update Meeting with ingestion stats (provenance incorporated in Meeting node)
    await tx.run(
      `MATCH (m:Meeting {id: $meetingId})
       SET m.ingestionStatus = $status,
           m.entityCount = $entityCount,
           m.ingestedAt = datetime()`,
      {
        meetingId,
        entityCount: createdEntities.length,
        status: curationJob?.status || 'approved',
      }
    );

    await tx.commit();

    logger.info(`Meeting ingestion complete: ${meetingId}, ${createdEntities.length} entities linked`);

    res.status(201).json({
      success: true,
      data: {
        meetingId,
        title: meetingNode.title,
        entitiesLinked: createdEntities.length,
        entities: createdEntities,
      },
    });
  } catch (error) {
    await tx.rollback();
    logger.error('Error ingesting meeting:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest meeting',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /meetings
 * List meetings with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { limit = 50, projectId } = req.query;

    let query = `
      MATCH (m:Meeting)
      OPTIONAL MATCH (m)<-[:RELATED_TO_PROJECT]-(p:Project)
      OPTIONAL MATCH (participant)-[:PARTICIPATED_IN]->(m)
    `;

    const params: Record<string, any> = { limit: neo4j.int(parseInt(limit as string) || 50) };

    if (projectId) {
      query += ` WHERE p.id = $projectId `;
      params.projectId = projectId;
    }

    query += `
      WITH m, p, count(participant) AS participantCount
      RETURN m, p.name AS projectName, p.id AS projectId, participantCount
      ORDER BY m.date DESC, m.createdAt DESC
      LIMIT $limit
    `;

    const result = await session.run(query, params);

    const meetings = result.records.map((r) => {
      const m = r.get('m').properties;
      return {
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        duration: m.duration,
        organizer: m.organizer,
        meetingType: m.meetingType,
        confidentiality: m.confidentiality,
        recurrence: m.recurrence || 'single',
        sourceFile: m.sourceFile,
        projectId: r.get('projectId'),
        projectName: r.get('projectName'),
        participantCount: toNumber(r.get('participantCount')),
        createdAt: m.createdAt?.toString(),
      };
    });

    res.json({
      success: true,
      data: meetings,
      total: meetings.length,
    });
  } catch (error) {
    logger.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch meetings',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /meetings/extract
 * Extract entities from transcript using LLM
 * Injeta contexto organizacional (Users, Departments) para que o LLM
 * utilize nomes e departamentos REAIS da base de dados.
 */
router.post('/extract', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  try {
    const { transcript, meetingContext } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Transcript is required and must be a string',
      });
      return;
    }

    if (!llmExtractionService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'LLM extraction service not configured. Check Azure OpenAI credentials.',
      });
      return;
    }

    // Buscar contexto organizacional do Neo4j para injetar no prompt
    let orgContext: { users: Array<{ name: string; jobTitle?: string; department?: string }>; departments: Array<{ name: string }> } | undefined;
    try {
      const usersResult = await session.run(`
        MATCH (u:User)
        OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
        RETURN u.name AS name, u.jobTitle AS jobTitle, d.name AS department
        ORDER BY u.name
      `);
      const deptsResult = await session.run(`
        MATCH (d:Department) RETURN d.name AS name ORDER BY d.name
      `);

      orgContext = {
        users: usersResult.records.map(r => ({
          name: r.get('name'),
          jobTitle: r.get('jobTitle') || undefined,
          department: r.get('department') || undefined,
        })),
        departments: deptsResult.records.map(r => ({
          name: r.get('name'),
        })),
      };
      logger.info(`Org context loaded: ${orgContext.users.length} users, ${orgContext.departments.length} departments`);
    } catch (orgError) {
      logger.warn('Failed to load org context, proceeding without it:', orgError);
    }

    logger.info(`Starting LLM extraction for transcript (${transcript.length} chars)`);

    const result = await llmExtractionService.extractFromTranscript(transcript, meetingContext, orgContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in LLM extraction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract entities',
    });
  } finally {
    await session.close();
  }
});

// =============================================
// Validation Feed Endpoints
// =============================================

/**
 * GET /meetings/validations
 * Fetch entities pending validation (Task, Decision, Risk, Insight)
 * Supports status filter: pending (default), validated, rejected, all
 */
router.get('/validations', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  try {
    const { status } = req.query;

    // Build status filters for entities and external participants
    let entityWhereClause = '';
    let epWhereClause = '';
    if (status === 'validated') {
      entityWhereClause = 'AND e.validated = true';
      epWhereClause = 'AND ep.validated = true';
    } else if (status === 'rejected') {
      entityWhereClause = 'AND e.validated = false';
      epWhereClause = 'AND ep.validated = false';
    } else if (status === 'all') {
      entityWhereClause = '';
      epWhereClause = '';
    } else {
      // Default: pending (null)
      entityWhereClause = 'AND e.validated IS NULL';
      epWhereClause = 'AND ep.validated IS NULL';
    }

    // Query 1: Task, Decision, Risk, Insight entities
    const result = await session.run(`
      MATCH (e)-[:EXTRACTED_FROM]->(m:Meeting)
      WHERE (e:Task OR e:Decision OR e:Risk OR e:Insight)
      ${entityWhereClause}
      OPTIONAL MATCH (e)-[rel]->(u:User)
      WHERE type(rel) IN ['ASSIGNED_TO', 'DECIDED_BY', 'RAISED_BY', 'CONTRIBUTED_BY']
      WITH e, m, rel, u
      OPTIONAL MATCH (orgUser:User {name: m.organizer})
      WITH e, m, rel, u, head(collect(DISTINCT orgUser.id)) AS meetingOrganizerId
      RETURN
        labels(e)[0] AS entityType,
        e AS entity,
        m.id AS meetingId,
        m.title AS meetingTitle,
        m.organizer AS meetingOrganizer,
        m.date AS meetingDate,
        u.id AS assigneeId,
        u.name AS assigneeName,
        type(rel) AS relType,
        meetingOrganizerId
      ORDER BY m.date DESC, e.createdAt DESC
    `);

    const entityValidations = result.records.map(record => {
      const entity = record.get('entity').properties;
      const entityType = record.get('entityType').toLowerCase();
      const confidence = entity.confidence;
      return {
        id: entity.id,
        entityType,
        value: entity.value || entity.title || '',
        description: entity.description || '',
        priority: entity.priority || null,
        deadline: entity.dueDate || null,
        confidence: typeof confidence === 'number' ? confidence : toNumber(confidence) || 0,
        visibility: entity.visibility || 'corporate',
        validated: entity.validated ?? null,
        validatedAt: entity.validatedAt?.toString() || null,
        createdAt: entity.createdAt?.toString() || '',
        source: record.get('meetingTitle') || 'Reunião',
        sourceType: 'meeting' as const,
        meetingId: record.get('meetingId'),
        meetingTitle: record.get('meetingTitle') || '',
        meetingOrganizer: record.get('meetingOrganizer') || '',
        meetingOrganizerId: record.get('meetingOrganizerId') || null,
        meetingDate: record.get('meetingDate') || '',
        assigneeId: record.get('assigneeId') || null,
        assigneeName: record.get('assigneeName') || null,
        relType: record.get('relType') || null,
      };
    });

    // Query 2: ExternalParticipant entities from meetings (validated by organizer)
    const epResult = await session.run(`
      MATCH (ep:ExternalParticipant)-[r:PARTICIPATED_IN]->(m:Meeting)
      WHERE true ${epWhereClause}
      OPTIONAL MATCH (orgUser:User {name: m.organizer})
      WITH ep, m, r, head(collect(DISTINCT orgUser.id)) AS meetingOrganizerId
      RETURN
        ep AS entity,
        r.confidence AS relConfidence,
        m.id AS meetingId,
        m.title AS meetingTitle,
        m.organizer AS meetingOrganizer,
        m.date AS meetingDate,
        meetingOrganizerId
      ORDER BY m.date DESC
    `);

    const epValidations = epResult.records.map(record => {
      const entity = record.get('entity').properties;
      const relConfidence = record.get('relConfidence');
      const conf = typeof relConfidence === 'number' ? relConfidence : toNumber(relConfidence) || 0.8;
      return {
        id: entity.id,
        entityType: 'externalparticipant',
        value: entity.name || '',
        description: entity.organization ? `Organização: ${entity.organization}` : '',
        priority: null,
        deadline: null,
        confidence: conf,
        visibility: 'corporate',
        validated: entity.validated ?? null,
        validatedAt: entity.validatedAt?.toString() || null,
        createdAt: entity.createdAt?.toString() || '',
        source: record.get('meetingTitle') || 'Reunião',
        sourceType: 'meeting' as const,
        meetingId: record.get('meetingId'),
        meetingTitle: record.get('meetingTitle') || '',
        meetingOrganizer: record.get('meetingOrganizer') || '',
        meetingOrganizerId: record.get('meetingOrganizerId') || null,
        meetingDate: record.get('meetingDate') || '',
        assigneeId: null,
        assigneeName: null,
        relType: null,
      };
    });

    const validations = [...entityValidations, ...epValidations];
    res.json({ success: true, data: validations, total: validations.length });
  } catch (error) {
    logger.error('Error fetching validations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch validations' });
  } finally {
    await session.close();
  }
});

/**
 * PATCH /meetings/validations/:id
 * Update a validation item: validate, reject, edit fields, reassign
 */
router.patch('/validations/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  try {
    const { id } = req.params;
    const { validated, description, priority, deadline, assigneeId } = req.body;

    // Find the entity (includes ExternalParticipant for organizer validation)
    const findResult = await session.run(`
      MATCH (e {id: $id})
      WHERE e:Task OR e:Decision OR e:Risk OR e:Insight OR e:ExternalParticipant
      RETURN labels(e)[0] AS entityType, e
    `, { id });

    if (findResult.records.length === 0) {
      res.status(404).json({ success: false, error: 'Entity not found' });
      return;
    }

    const entityType = findResult.records[0].get('entityType');

    // Build dynamic SET clauses
    const setClauses: string[] = [];
    const params: Record<string, any> = { id };

    if (validated !== undefined) {
      setClauses.push('e.validated = $validated');
      setClauses.push('e.validatedAt = datetime()');
      params.validated = validated;
    }
    if (description !== undefined) {
      setClauses.push('e.description = $description');
      params.description = description;
    }
    if (priority !== undefined) {
      setClauses.push('e.priority = $priority');
      params.priority = priority;
    }
    if (deadline !== undefined) {
      setClauses.push('e.dueDate = $deadline');
      params.deadline = deadline;
    }

    if (setClauses.length > 0) {
      await session.run(
        `MATCH (e {id: $id}) WHERE e:Task OR e:Decision OR e:Risk OR e:Insight OR e:ExternalParticipant SET ${setClauses.join(', ')}`,
        params
      );
    }

    // Handle assignee reassignment
    if (assigneeId) {
      // Remove existing relationship to any User
      await session.run(
        `MATCH (e {id: $id})-[r]->(u:User)
         WHERE (e:Task OR e:Decision OR e:Risk OR e:Insight OR e:ExternalParticipant)
         AND type(r) IN ['ASSIGNED_TO', 'DECIDED_BY', 'RAISED_BY', 'CONTRIBUTED_BY']
         DELETE r`,
        { id }
      );

      // Create new relationship based on entity type
      if (entityType === 'Task') {
        await session.run(
          `MATCH (e:Task {id: $id}), (u:User {id: $userId}) MERGE (e)-[:ASSIGNED_TO]->(u)`,
          { id, userId: assigneeId }
        );
      } else if (entityType === 'Decision') {
        await session.run(
          `MATCH (e:Decision {id: $id}), (u:User {id: $userId}) MERGE (e)-[:DECIDED_BY]->(u)`,
          { id, userId: assigneeId }
        );
      } else if (entityType === 'Risk') {
        await session.run(
          `MATCH (e:Risk {id: $id}), (u:User {id: $userId}) MERGE (e)-[:RAISED_BY]->(u)`,
          { id, userId: assigneeId }
        );
      } else if (entityType === 'Insight') {
        await session.run(
          `MATCH (e:Insight {id: $id}), (u:User {id: $userId}) MERGE (e)-[:CONTRIBUTED_BY]->(u)`,
          { id, userId: assigneeId }
        );
      }
    }

    res.json({ success: true, data: { id, entityType, updated: true } });
  } catch (error) {
    logger.error('Error updating validation:', error);
    res.status(500).json({ success: false, error: 'Failed to update validation' });
  } finally {
    await session.close();
  }
});

/**
 * POST /meetings/validations/bulk-validate
 * Validate or reject multiple entities at once
 */
router.post('/validations/bulk-validate', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  try {
    const { ids, validated = true } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'ids array is required' });
      return;
    }

    const result = await session.run(`
      MATCH (e)
      WHERE (e:Task OR e:Decision OR e:Risk OR e:Insight OR e:ExternalParticipant)
      AND e.id IN $ids
      SET e.validated = $validated, e.validatedAt = datetime()
      RETURN count(e) AS updated
    `, { ids, validated });

    const updated = toNumber(result.records[0].get('updated'));
    res.json({ success: true, data: { updated } });
  } catch (error) {
    logger.error('Error bulk validating:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk validate' });
  } finally {
    await session.close();
  }
});

export default router;
