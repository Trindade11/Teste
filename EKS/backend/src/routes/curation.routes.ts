import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

/**
 * GET /curation/queue
 * Returns items pending review for the logged-in user
 */
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  const session = neo4jConnection.getSession();
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    
    // Se admin, ver fila de todos? Por enquanto vamos priorizar a fila do usuário específico,
    // mas se for admin e passar ?all=true, traz tudo.
    const showAll = req.query.all === 'true' && (userRole === 'admin' || userRole === 'Administrador');

    let query = `
      MATCH (n)-[r:PENDING_REVIEW_BY]->(u:User)
      WHERE n:Document OR n:WebSource
    `;

    if (!showAll) {
      query = `
        MATCH (n)-[r:PENDING_REVIEW_BY]->(u:User {id: $userId})
        WHERE n:Document OR n:WebSource
      `;
    }

    query += `
      OPTIONAL MATCH (submitter:User)
      WHERE (submitter)-[:UPLOADED]->(n) OR n.createdBy = submitter.id

      OPTIONAL MATCH (n)-[:HAS_CHUNK]->(c:Chunk)
      
      OPTIONAL MATCH (n)-[linkRel:BELONGS_TO_PROJECT|LINKED_TO_OKR|SUPPORTS|BELONGS_TO|LINKED_TO]->(entity)
      
      OPTIONAL MATCH (extracted)-[:EXTRACTED_FROM]->(n)
      
      RETURN 
        n, 
        labels(n)[0] AS nodeType, 
        r.submittedAt AS submittedAt,
        u.name AS curatorName,
        submitter.name AS submitterName,
        collect(DISTINCT c) AS chunks,
        collect(DISTINCT { type: labels(entity)[0], id: coalesce(entity.id, elementId(entity)), name: coalesce(entity.title, entity.name), relationship: type(linkRel) }) AS linkedEntities,
        collect(DISTINCT { type: labels(extracted)[0], id: extracted.id, name: coalesce(extracted.title, extracted.value, extracted.name) }) AS suggestedEntities
      ORDER BY r.submittedAt DESC
    `;

    const result = await session.run(query, { userId });

    const items = result.records.map(record => {
      const node = record.get('n').properties;
      const nodeType = record.get('nodeType');
      const chunks = record.get('chunks').map((c: any) => c.properties);
      
      // Clean linked entities (remove nulls)
      const linkedEntities = record.get('linkedEntities')
        .filter((e: any) => e.id)
        .map((e: any) => ({
          id: e.id,
          type: e.type?.toLowerCase() || 'unknown',
          name: e.name || 'Unnamed',
          relationship: e.relationship?.toLowerCase() || 'linked'
        }));

      const suggestedEntities = record.get('suggestedEntities')
        .filter((e: any) => e.id)
        .map((e: any) => ({
          id: e.id,
          type: e.type?.toLowerCase() || 'unknown',
          name: e.name || 'Unnamed',
          relationship: 'extracted_from'
        }));

      return {
        id: node.id,
        documentId: node.id,
        documentTitle: node.title || node.url || 'Documento sem título',
        type: nodeType === 'WebSource' ? 'web' : (node.type || 'outro'),
        submittedBy: record.get('submitterName') || 'Sistema',
        submittedAt: record.get('submittedAt')?.toString() || node.createdAt?.toString() || new Date().toISOString(),
        chunks: chunks.map((c: any) => ({
          id: c.id,
          content: c.text,
          chunkIndex: c.sequenceIndex || 0,
          tokens: c.textLength || 0,
          hasTable: c.containsTable || false,
          confidence: 0.9 // TODO: extract from LLM if available
        })).sort((a: any, b: any) => a.chunkIndex - b.chunkIndex),
        linkedEntities,
        suggestedEntities,
        aiSummary: node.summary || 'Resumo não disponível',
        aiClassification: node.keyTopics ? node.keyTopics.join(', ') : 'Não classificado',
        confidence: 0.85,
        status: node.curationStatus || 'pending',
        issues: [] // TODO: implement automated issue detection
      };
    });

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Error fetching curation queue:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch curation queue' });
  } finally {
    await session.close();
  }
});

/**
 * POST /curation/:id/approve
 */
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const session = neo4jConnection.getSession();
  
  try {
    // 1. Atualizar status do nó principal
    await session.run(`
      MATCH (n {id: $id})
      WHERE n:Document OR n:WebSource
      SET n.curationStatus = 'approved',
          n.status = 'active',
          n.curatedAt = datetime()
      WITH n
      OPTIONAL MATCH (n)-[r:PENDING_REVIEW_BY]->()
      DELETE r
    `, { id });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error approving curation item:', error);
    res.status(500).json({ success: false, error: 'Failed to approve item' });
  } finally {
    await session.close();
  }
});

/**
 * POST /curation/:id/reject
 */
router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  const session = neo4jConnection.getSession();
  
  try {
    await session.run(`
      MATCH (n {id: $id})
      WHERE n:Document OR n:WebSource
      SET n.curationStatus = 'rejected',
          n.status = 'rejected',
          n.curatedAt = datetime(),
          n.rejectionReason = $reason
      WITH n
      OPTIONAL MATCH (n)-[r:PENDING_REVIEW_BY]->()
      DELETE r
    `, { id, reason: reason || 'Sem justificativa' });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error rejecting curation item:', error);
    res.status(500).json({ success: false, error: 'Failed to reject item' });
  } finally {
    await session.close();
  }
});

export default router;
