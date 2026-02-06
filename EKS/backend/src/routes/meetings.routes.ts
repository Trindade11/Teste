import { Router, Request, Response } from 'express';
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
    const { meetingNode, entities, relationships, ingestionItem, curationJob } = req.body;
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
         topic: $topic,
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
        topic: meetingNode.topic || '',
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
      } else if (entity.type === 'task') {
        // Criar node Task vinculado à Meeting
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
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             memoryLevel: $memoryLevel,
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
            assignee: entity.assignee || entity.relatedPerson || '',
            deadline: entity.deadline || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            memoryLevel: entity.memoryLevel || 'medium',
            createdBy: userId,
          }
        );
        if (taskResult.records.length > 0) {
          createdEntities.push({
            type: 'task',
            value: entity.value,
            nodeId: taskResult.records[0].get('t').properties.id,
          });
        }
      } else if (entity.type === 'decision') {
        // Criar node Decision vinculado à Meeting
        const decisionResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (d:Decision {
             id: randomUUID(),
             value: $value,
             description: $description,
             rationale: $rationale,
             impact: $impact,
             relatedPerson: $relatedPerson,
             relatedArea: $relatedArea,
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
            relatedPerson: entity.relatedPerson || '',
            relatedArea: entity.relatedArea || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (decisionResult.records.length > 0) {
          createdEntities.push({
            type: 'decision',
            value: entity.value,
            nodeId: decisionResult.records[0].get('d').properties.id,
          });
        }
      } else if (entity.type === 'risk') {
        // Criar node Risk vinculado à Meeting
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
             relatedArea: $relatedArea,
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
            relatedPerson: entity.relatedPerson || '',
            relatedArea: entity.relatedArea || '',
            mitigation: '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (riskResult.records.length > 0) {
          createdEntities.push({
            type: 'risk',
            value: entity.value,
            nodeId: riskResult.records[0].get('r').properties.id,
          });
        }
      } else if (entity.type === 'insight') {
        // Criar node Insight vinculado à Meeting
        const insightResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (i:Insight {
             id: randomUUID(),
             value: $value,
             description: $description,
             impact: $impact,
             relatedPerson: $relatedPerson,
             relatedArea: $relatedArea,
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
            relatedPerson: entity.relatedPerson || '',
            relatedArea: entity.relatedArea || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            createdBy: userId,
          }
        );
        if (insightResult.records.length > 0) {
          createdEntities.push({
            type: 'insight',
            value: entity.value,
            nodeId: insightResult.records[0].get('i').properties.id,
          });
        }
      } else if (entity.type === 'actionItem') {
        // Criar node ActionItem vinculado à Meeting (com campos completos de tarefa)
        const actionResult = await tx.run(
          `MATCH (m:Meeting {id: $meetingId})
           CREATE (a:ActionItem {
             id: randomUUID(),
             title: $value,
             value: $value,
             description: $description,
             assignee: $assignee,
             deadline: $deadline,
             dueDate: $deadline,
             priority: $priority,
             status: 'pending',
             relatedArea: $relatedArea,
             impact: $impact,
             confidence: $confidence,
             sourceRef: $sourceRef,
             visibility: $visibility,
             memoryLevel: $memoryLevel,
             completedAt: null,
             createdAt: datetime(),
             createdBy: $createdBy
           })
           CREATE (a)-[:EXTRACTED_FROM]->(m)
           RETURN a`,
          {
            meetingId,
            value: entity.value,
            description: entity.description || entity.context || '',
            assignee: entity.assignee || entity.relatedPerson || '',
            deadline: entity.deadline || '',
            priority: entity.priority || 'medium',
            relatedArea: entity.relatedArea || '',
            impact: entity.impact || '',
            confidence: entity.confidence || 0.8,
            sourceRef: entity.sourceRef || `meeting:${meetingId}`,
            visibility: entity.visibility || 'corporate',
            memoryLevel: entity.memoryLevel || 'medium',
            createdBy: userId,
          }
        );
        if (actionResult.records.length > 0) {
          createdEntities.push({
            type: 'actionItem',
            value: entity.value,
            nodeId: actionResult.records[0].get('a').properties.id,
          });
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

    const params: Record<string, any> = { limit: parseInt(limit as string) || 50 };

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
        topic: m.topic,
        meetingType: m.meetingType,
        confidentiality: m.confidentiality,
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
 */
router.post('/extract', requireAdmin, async (req: Request, res: Response) => {
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

    logger.info(`Starting LLM extraction for transcript (${transcript.length} chars)`);

    const result = await llmExtractionService.extractFromTranscript(transcript, meetingContext);

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
  }
});

export default router;
