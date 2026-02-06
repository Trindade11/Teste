import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import neo4j from 'neo4j-driver';

const router = Router();

router.use(authenticate);

// Types
type PartnerType = 'strategic' | 'operational' | 'tactical';
type ParticipantStatus = 'active' | 'inactive';

interface ExternalParticipant {
  id: string;
  name: string;
  email?: string;
  organization: string;
  partnerType: PartnerType;
  role?: string;
  notes?: string;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface CreateExternalParticipantPayload {
  name: string;
  email?: string;
  organization: string;
  partnerType: PartnerType;
  role?: string;
  notes?: string;
}

interface UpdateExternalParticipantPayload {
  name?: string;
  email?: string;
  organization?: string;
  partnerType?: PartnerType;
  role?: string;
  notes?: string;
  status?: ParticipantStatus;
}

const toNumber = (value: unknown): number => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'low' in (value as any)) return (value as any).low;
  return Number(value);
};

/**
 * GET /external-participants
 * List all external participants with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { status, partnerType, organization, search } = req.query;

    let whereClause = '';
    const params: Record<string, any> = {};

    const conditions: string[] = [];

    if (status && status !== 'all') {
      conditions.push('ep.status = $status');
      params.status = status;
    }

    if (partnerType && partnerType !== 'all') {
      conditions.push('ep.partnerType = $partnerType');
      params.partnerType = partnerType;
    }

    if (organization) {
      conditions.push('ep.organization CONTAINS $organization');
      params.organization = organization;
    }

    if (search) {
      conditions.push('(ep.name CONTAINS $search OR ep.email CONTAINS $search OR ep.organization CONTAINS $search)');
      params.search = search;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const result = await session.run(
      `MATCH (ep:ExternalParticipant)
       ${whereClause}
       RETURN ep
       ORDER BY ep.name`,
      params
    );

    const participants: ExternalParticipant[] = result.records.map((r) => {
      const ep = r.get('ep').properties;
      return {
        id: ep.id,
        name: ep.name || '',
        email: ep.email || '',
        organization: ep.organization || '',
        partnerType: ep.partnerType || 'operational',
        role: ep.role || '',
        notes: ep.notes || '',
        status: ep.status || 'active',
        createdAt: ep.createdAt?.toString() || '',
        updatedAt: ep.updatedAt?.toString() || '',
        createdBy: ep.createdBy || '',
      };
    });

    res.json({
      success: true,
      data: participants,
      total: participants.length,
    });
  } catch (error) {
    logger.error('Error fetching external participants:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch external participants',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /external-participants/stats
 * Get statistics about external participants
 */
router.get('/stats', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const totalResult = await session.run('MATCH (ep:ExternalParticipant) RETURN count(ep) AS total');
    const activeResult = await session.run('MATCH (ep:ExternalParticipant {status: "active"}) RETURN count(ep) AS active');
    const byTypeResult = await session.run(`
      MATCH (ep:ExternalParticipant)
      RETURN ep.partnerType AS type, count(ep) AS count
    `);

    const total = toNumber(totalResult.records[0]?.get('total') || 0);
    const active = toNumber(activeResult.records[0]?.get('active') || 0);
    
    const byType: Record<string, number> = {};
    byTypeResult.records.forEach((r) => {
      const type = r.get('type') || 'unknown';
      byType[type] = toNumber(r.get('count'));
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        byType,
      },
    });
  } catch (error) {
    logger.error('Error fetching external participants stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /external-participants/:id
 * Get a single external participant by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    const result = await session.run(
      `MATCH (ep:ExternalParticipant {id: $id})
       OPTIONAL MATCH (ep)-[:PARTICIPATED_IN]->(m:Meeting)
       WITH ep, collect(DISTINCT m) AS meetings
       RETURN ep, size(meetings) AS meetingCount`,
      { id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'External participant not found',
      });
      return;
    }

    const record = result.records[0];
    const ep = record.get('ep').properties;
    const meetingCount = toNumber(record.get('meetingCount'));

    res.json({
      success: true,
      data: {
        id: ep.id,
        name: ep.name || '',
        email: ep.email || '',
        organization: ep.organization || '',
        partnerType: ep.partnerType || 'operational',
        role: ep.role || '',
        notes: ep.notes || '',
        status: ep.status || 'active',
        createdAt: ep.createdAt?.toString() || '',
        updatedAt: ep.updatedAt?.toString() || '',
        createdBy: ep.createdBy || '',
        meetingCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching external participant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch external participant',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /external-participants
 * Create a new external participant (Admin only)
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const payload: CreateExternalParticipantPayload = req.body;
    const userId = (req as any).user?.userId || 'system';

    // Validation
    if (!payload.name?.trim()) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      });
      return;
    }

    if (!payload.organization?.trim()) {
      res.status(400).json({
        success: false,
        error: 'Organization is required',
      });
      return;
    }

    const validPartnerTypes: PartnerType[] = ['strategic', 'operational', 'tactical'];
    if (!payload.partnerType || !validPartnerTypes.includes(payload.partnerType)) {
      res.status(400).json({
        success: false,
        error: 'Valid partnerType is required (strategic, operational, tactical)',
      });
      return;
    }

    // Check for duplicate (same name + organization)
    const existingResult = await session.run(
      `MATCH (ep:ExternalParticipant)
       WHERE ep.name = $name AND ep.organization = $organization
       RETURN ep`,
      { name: payload.name.trim(), organization: payload.organization.trim() }
    );

    if (existingResult.records.length > 0) {
      res.status(409).json({
        success: false,
        error: 'An external participant with this name and organization already exists',
      });
      return;
    }

    // Create the participant
    const result = await session.run(
      `CREATE (ep:ExternalParticipant {
         id: randomUUID(),
         name: $name,
         email: $email,
         organization: $organization,
         partnerType: $partnerType,
         role: $role,
         notes: $notes,
         status: 'active',
         createdAt: datetime(),
         updatedAt: datetime(),
         createdBy: $createdBy
       })
       WITH ep
       MERGE (o:Organization {name: $organization})
       ON CREATE SET o.createdAt = datetime(), o.updatedAt = datetime()
       ON MATCH SET o.updatedAt = datetime()
       MERGE (ep)-[:BELONGS_TO]->(o)
       RETURN ep`,
      {
        name: payload.name.trim(),
        email: payload.email?.trim() || '',
        organization: payload.organization.trim(),
        partnerType: payload.partnerType,
        role: payload.role?.trim() || '',
        notes: payload.notes?.trim() || '',
        createdBy: userId,
      }
    );

    const created = result.records[0].get('ep').properties;

    logger.info(`External participant created: ${created.name} (${created.organization})`);

    res.status(201).json({
      success: true,
      data: {
        id: created.id,
        name: created.name,
        email: created.email,
        organization: created.organization,
        partnerType: created.partnerType,
        role: created.role,
        notes: created.notes,
        status: created.status,
        createdAt: created.createdAt?.toString(),
        updatedAt: created.updatedAt?.toString(),
        createdBy: created.createdBy,
      },
    });
  } catch (error) {
    logger.error('Error creating external participant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create external participant',
    });
  } finally {
    await session.close();
  }
});

/**
 * PATCH /external-participants/:id
 * Update an external participant (Admin only)
 */
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;
    const payload: UpdateExternalParticipantPayload = req.body;

    // Check if exists
    const existsResult = await session.run(
      `MATCH (ep:ExternalParticipant {id: $id}) RETURN ep`,
      { id }
    );

    if (existsResult.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'External participant not found',
      });
      return;
    }

    // Build SET clause dynamically
    const updates: string[] = ['ep.updatedAt = datetime()'];
    const params: Record<string, any> = { id };

    if (payload.name !== undefined) {
      updates.push('ep.name = $name');
      params.name = payload.name.trim();
    }

    if (payload.email !== undefined) {
      updates.push('ep.email = $email');
      params.email = payload.email.trim();
    }

    if (payload.organization !== undefined) {
      updates.push('ep.organization = $organization');
      params.organization = payload.organization.trim();
    }

    if (payload.partnerType !== undefined) {
      const validPartnerTypes: PartnerType[] = ['strategic', 'operational', 'tactical'];
      if (!validPartnerTypes.includes(payload.partnerType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid partnerType',
        });
        return;
      }
      updates.push('ep.partnerType = $partnerType');
      params.partnerType = payload.partnerType;
    }

    if (payload.role !== undefined) {
      updates.push('ep.role = $role');
      params.role = payload.role.trim();
    }

    if (payload.notes !== undefined) {
      updates.push('ep.notes = $notes');
      params.notes = payload.notes.trim();
    }

    if (payload.status !== undefined) {
      const validStatuses: ParticipantStatus[] = ['active', 'inactive'];
      if (!validStatuses.includes(payload.status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status',
        });
        return;
      }
      updates.push('ep.status = $status');
      params.status = payload.status;
    }

    const result = await session.run(
      `MATCH (ep:ExternalParticipant {id: $id})
       SET ${updates.join(', ')}
       WITH ep
       OPTIONAL MATCH (ep)-[r:BELONGS_TO]->(:Organization)
       DELETE r
       WITH ep
       MERGE (o:Organization {name: ep.organization})
       ON CREATE SET o.createdAt = datetime(), o.updatedAt = datetime()
       ON MATCH SET o.updatedAt = datetime()
       MERGE (ep)-[:BELONGS_TO]->(o)
       RETURN ep`,
      params
    );

    const updated = result.records[0].get('ep').properties;

    logger.info(`External participant updated: ${updated.name} (${id})`);

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        organization: updated.organization,
        partnerType: updated.partnerType,
        role: updated.role,
        notes: updated.notes,
        status: updated.status,
        createdAt: updated.createdAt?.toString(),
        updatedAt: updated.updatedAt?.toString(),
        createdBy: updated.createdBy,
      },
    });
  } catch (error) {
    logger.error('Error updating external participant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update external participant',
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /external-participants/:id
 * Delete an external participant (Admin only)
 * Note: This performs a soft delete (sets status to 'inactive')
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    if (hardDelete === 'true') {
      // Hard delete - remove node completely
      const result = await session.run(
        `MATCH (ep:ExternalParticipant {id: $id})
         DETACH DELETE ep
         RETURN count(ep) AS deleted`,
        { id }
      );

      const deleted = toNumber(result.records[0]?.get('deleted') || 0);

      if (deleted === 0) {
        res.status(404).json({
          success: false,
          error: 'External participant not found',
        });
        return;
      }

      logger.info(`External participant hard deleted: ${id}`);

      res.json({
        success: true,
        message: 'External participant permanently deleted',
      });
    } else {
      // Soft delete - set status to inactive
      const result = await session.run(
        `MATCH (ep:ExternalParticipant {id: $id})
         SET ep.status = 'inactive', ep.updatedAt = datetime()
         RETURN ep`,
        { id }
      );

      if (result.records.length === 0) {
        res.status(404).json({
          success: false,
          error: 'External participant not found',
        });
        return;
      }

      logger.info(`External participant deactivated: ${id}`);

      res.json({
        success: true,
        message: 'External participant deactivated',
      });
    }
  } catch (error) {
    logger.error('Error deleting external participant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete external participant',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /external-participants/:id/reactivate
 * Reactivate an inactive external participant (Admin only)
 */
router.post('/:id/reactivate', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    const result = await session.run(
      `MATCH (ep:ExternalParticipant {id: $id})
       SET ep.status = 'active', ep.updatedAt = datetime()
       RETURN ep`,
      { id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'External participant not found',
      });
      return;
    }

    const updated = result.records[0].get('ep').properties;

    logger.info(`External participant reactivated: ${updated.name} (${id})`);

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    logger.error('Error reactivating external participant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate external participant',
    });
  } finally {
    await session.close();
  }
});

export default router;
