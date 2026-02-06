import { Router, Request, Response } from 'express';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';

const router = Router();

// Helper to get user email from authenticated request
const getUserEmail = (req: Request): string => {
  return (req as any).user?.email || '';
};

// ============================================================================
// INTERFACES - Modelo de Projeto com relacionamentos completos
// ============================================================================

interface TeamMember {
  userId: string;
  role: 'owner' | 'lead' | 'member' | 'stakeholder';
  addedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completedAt?: string;
}

interface Budget {
  planned: number;
  spent: number;
  currency: string;
  lastUpdated: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  phase: 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ownerId: string;
  department: string;
  linkedOkrIds: string[];
  teamMembers: TeamMember[];
  milestones: Milestone[];
  budget: Budget | null;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  visibility: 'corporate' | 'personal';
  memoryClass: 'semantic' | 'episodic' | 'procedural' | 'evaluative';
  tags: string[];
  notes: string;
  version: number;
  previousVersionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface OKR {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  objectiveId: string;
  objectiveTitle: string;
  ownerId: string;
  ownerName: string;
  department: string;
  status: 'active' | 'completed' | 'archived';
  version: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'archived';
  targetDate: string;
  ownerId: string;
  ownerName: string;
  department: string;
  version: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

// ============================================================================
// PROJECTS CRUD
// ============================================================================

/**
 * GET /projects
 * List all projects with their relationships
 */
router.get('/', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { status, department, ownerId } = req.query;

    let query = `
      MATCH (p:Project)
      WHERE p.status <> 'archived' OR $includeArchived = true
    `;

    if (status) {
      query += ` AND p.status = $status`;
    }
    if (department) {
      query += ` AND p.department = $department`;
    }
    if (ownerId) {
      query += ` AND p.ownerId = $ownerId`;
    }

    query += `
      OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
      OPTIONAL MATCH (p)-[:BELONGS_TO]->(dept:Department)
      OPTIONAL MATCH (p)-[:LINKED_TO_OKR]->(okr:OKR)
      OPTIONAL MATCH (p)-[:HAS_TEAM_MEMBER]->(member:User)
      OPTIONAL MATCH (p)-[:HAS_EXTERNAL_PARTICIPANT]->(ext:ExternalParticipant)
      RETURN p,
             owner.name AS ownerName,
             owner.email AS ownerEmail,
             dept.name AS departmentName,
             collect(DISTINCT okr.id) AS linkedOkrIds,
             collect(DISTINCT {userId: member.id, name: member.name, role: 'member'}) AS teamMembers,
             collect(DISTINCT ext.id) AS externalParticipantIds
      ORDER BY p.updatedAt DESC
    `;

    const result = await session.run(query, {
      status: status || null,
      department: department || null,
      ownerId: ownerId || null,
      includeArchived: req.query.includeArchived === 'true',
    });

    const projects = result.records.map((record) => {
      const p = record.get('p').properties;
      return {
        ...p,
        ownerName: record.get('ownerName') || '',
        ownerEmail: record.get('ownerEmail') || '',
        departmentName: record.get('departmentName') || p.department,
        linkedOkrIds: record.get('linkedOkrIds') || [],
        // teamMembers dos relacionamentos (mais confiável que a propriedade JSON)
        teamMembers: record.get('teamMembers')?.filter((m: any) => m.userId) || JSON.parse(p.teamMembers || '[]'),
        externalParticipantIds: record.get('externalParticipantIds') || [],
        milestones: JSON.parse(p.milestones || '[]'),
        budget: p.budget ? JSON.parse(p.budget) : null,
        tags: JSON.parse(p.tags || '[]'),
      };
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    logger.error('Projects list error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /projects/:id
 * Get a single project with full relationships
 */
router.get('/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    const result = await session.run(
      `
      MATCH (p:Project {id: $id})
      OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
      OPTIONAL MATCH (p)-[:BELONGS_TO]->(dept:Department)
      OPTIONAL MATCH (p)-[:LINKED_TO_OKR]->(okr:OKR)-[:BELONGS_TO_OBJECTIVE]->(obj:Objective)
      OPTIONAL MATCH (p)-[:HAS_TEAM_MEMBER]->(member:User)
      OPTIONAL MATCH (p)-[:HAS_EXTERNAL_PARTICIPANT]->(ext:ExternalParticipant)
      OPTIONAL MATCH (prev:Project {id: p.previousVersionId})
      RETURN p,
             owner,
             dept,
             collect(DISTINCT {
               id: okr.id,
               title: okr.title,
               objectiveId: obj.id,
               objectiveTitle: obj.title,
               status: okr.status
             }) AS linkedOkrs,
             collect(DISTINCT {
               userId: member.id,
               name: member.name,
               email: member.email,
               department: member.department
             }) AS teamMembers,
             collect(DISTINCT ext.id) AS externalParticipantIds,
             prev.id AS previousVersionId
      `,
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const record = result.records[0];
    const p = record.get('p').properties;
    const owner = record.get('owner')?.properties || {};

    const project = {
      ...p,
      ownerName: owner.name || '',
      ownerEmail: owner.email || '',
      linkedOkrs: record.get('linkedOkrs').filter((o: any) => o.id),
      // teamMembers vêm dos relacionamentos (fonte da verdade)
      teamMembers: record.get('teamMembers')?.filter((m: any) => m.userId) || JSON.parse(p.teamMembers || '[]'),
      externalParticipantIds: record.get('externalParticipantIds') || [],
      milestones: JSON.parse(p.milestones || '[]'),
      budget: p.budget ? JSON.parse(p.budget) : null,
      tags: JSON.parse(p.tags || '[]'),
    };

    res.json({ success: true, data: project });
  } catch (error) {
    logger.error('Project fetch error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /projects
 * Create a new project with all relationships
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const createdBy = getUserEmail(req);

  try {
    const {
      name,
      description,
      status = 'draft',
      phase = 'initiation',
      priority = 'medium',
      ownerId,
      department,
      linkedOkrIds = [],
      teamMembers = [],
      externalParticipantIds = [],
      milestones = [],
      budget = null,
      startDate,
      targetEndDate,
      visibility = 'corporate',
      memoryClass = 'procedural',
      tags = [],
      notes = '',
    } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Name and department are required',
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Create project node
    const result = await session.run(
      `
      CREATE (p:Project {
        id: $id,
        name: $name,
        description: $description,
        status: $status,
        phase: $phase,
        priority: $priority,
        ownerId: $ownerId,
        department: $department,
        teamMembers: $teamMembers,
        milestones: $milestones,
        budget: $budget,
        startDate: $startDate,
        targetEndDate: $targetEndDate,
        visibility: $visibility,
        memoryClass: $memoryClass,
        tags: $tags,
        notes: $notes,
        version: 1,
        createdAt: $now,
        updatedAt: $now,
        createdBy: $createdBy
      })
      RETURN p
      `,
      {
        id,
        name,
        description: description || '',
        status,
        phase,
        priority,
        ownerId: ownerId || '',
        department,
        teamMembers: JSON.stringify(teamMembers),
        milestones: JSON.stringify(milestones),
        budget: budget ? JSON.stringify(budget) : null,
        startDate: startDate || '',
        targetEndDate: targetEndDate || '',
        visibility,
        memoryClass,
        tags: JSON.stringify(tags),
        notes,
        now,
        createdBy: createdBy || '',
      }
    );

    // Create relationships
    // Owner relationship
    if (ownerId) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (u:User {id: $ownerId})
        MERGE (p)-[:OWNED_BY]->(u)
        `,
        { projectId: id, ownerId }
      );
    }

    // Department relationship
    await session.run(
      `
      MATCH (p:Project {id: $projectId})
      MERGE (d:Department {name: $department})
      MERGE (p)-[:BELONGS_TO]->(d)
      `,
      { projectId: id, department }
    );

    // OKR relationships
    for (const okrId of linkedOkrIds) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (okr:OKR {id: $okrId})
        MERGE (p)-[:LINKED_TO_OKR]->(okr)
        `,
        { projectId: id, okrId }
      );
    }

    // Team member relationships
    for (const member of teamMembers) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (u:User {id: $userId})
        MERGE (p)-[:HAS_TEAM_MEMBER {role: $role, addedAt: $addedAt}]->(u)
        `,
        {
          projectId: id,
          userId: member.userId,
          role: member.role || 'member',
          addedAt: member.addedAt || now,
        }
      );
    }

    // External participant relationships
    for (const externalId of externalParticipantIds) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (ep:ExternalParticipant {id: $externalId})
        MERGE (p)-[:HAS_EXTERNAL_PARTICIPANT {addedAt: $addedAt}]->(ep)
        `,
        {
          projectId: id,
          externalId,
          addedAt: now,
        }
      );
    }

    const project = result.records[0].get('p').properties;

    logger.info(`Project created: ${id} - ${name}`);

    res.status(201).json({
      success: true,
      data: {
        ...project,
        teamMembers,
        externalParticipantIds,
        milestones,
        budget,
        tags,
        linkedOkrIds,
      },
    });
  } catch (error) {
    logger.error('Project create error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /projects/:id/new-version
 * Create a new version of a project (projects are NOT editable, create new version)
 * This maintains full history and traceability
 */
router.post('/:id/new-version', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id: previousId } = req.params;
    const updates = req.body;

    // Get the current project
    const currentResult = await session.run(
      `MATCH (p:Project {id: $id}) RETURN p`,
      { id: previousId }
    );

    if (currentResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const current = currentResult.records[0].get('p').properties;

    // Archive the current version
    await session.run(
      `
      MATCH (p:Project {id: $id})
      SET p.status = 'archived',
          p.archivedAt = $now,
          p.archivedReason = 'superseded_by_new_version'
      `,
      { id: previousId, now: new Date().toISOString() }
    );

    // Create new version
    const newId = uuidv4();
    const now = new Date().toISOString();
    const newVersion = (current.version || 1) + 1;

    const newProject = {
      id: newId,
      name: updates.name || current.name,
      description: updates.description || current.description,
      status: updates.status || 'active',
      phase: updates.phase || current.phase,
      priority: updates.priority || current.priority,
      ownerId: updates.ownerId || current.ownerId,
      department: updates.department || current.department,
      teamMembers: JSON.stringify(updates.teamMembers || JSON.parse(current.teamMembers || '[]')),
      milestones: JSON.stringify(updates.milestones || JSON.parse(current.milestones || '[]')),
      budget: updates.budget ? JSON.stringify(updates.budget) : current.budget,
      startDate: updates.startDate || current.startDate,
      targetEndDate: updates.targetEndDate || current.targetEndDate,
      visibility: updates.visibility || current.visibility,
      memoryClass: updates.memoryClass || current.memoryClass,
      tags: JSON.stringify(updates.tags || JSON.parse(current.tags || '[]')),
      notes: updates.notes || current.notes,
      version: newVersion,
      previousVersionId: previousId,
      createdAt: now,
      updatedAt: now,
      createdBy: updates.createdBy || current.createdBy,
    };

    await session.run(
      `
      CREATE (p:Project $props)
      WITH p
      MATCH (prev:Project {id: $previousId})
      CREATE (p)-[:SUPERSEDES]->(prev)
      RETURN p
      `,
      { props: newProject, previousId }
    );

    // Recreate relationships for new version
    if (newProject.ownerId) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (u:User {id: $ownerId})
        MERGE (p)-[:OWNED_BY]->(u)
        `,
        { projectId: newId, ownerId: newProject.ownerId }
      );
    }

    await session.run(
      `
      MATCH (p:Project {id: $projectId})
      MERGE (d:Department {name: $department})
      MERGE (p)-[:BELONGS_TO]->(d)
      `,
      { projectId: newId, department: newProject.department }
    );

    const linkedOkrIds = updates.linkedOkrIds || [];
    for (const okrId of linkedOkrIds) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        MATCH (okr:OKR {id: $okrId})
        MERGE (p)-[:LINKED_TO_OKR]->(okr)
        `,
        { projectId: newId, okrId }
      );
    }

    logger.info(`Project new version created: ${newId} (v${newVersion}) supersedes ${previousId}`);

    res.status(201).json({
      success: true,
      data: {
        ...newProject,
        teamMembers: updates.teamMembers || JSON.parse(current.teamMembers || '[]'),
        milestones: updates.milestones || JSON.parse(current.milestones || '[]'),
        budget: updates.budget || (current.budget ? JSON.parse(current.budget) : null),
        tags: updates.tags || JSON.parse(current.tags || '[]'),
        linkedOkrIds,
      },
      message: `New version ${newVersion} created. Previous version ${previousId} archived.`,
    });
  } catch (error) {
    logger.error('Project new version error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create new version',
    });
  } finally {
    await session.close();
  }
});

/**
 * PUT /projects/:id
 * Update an existing project
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const updatedBy = getUserEmail(req);

  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      phase,
      priority,
      ownerId,
      department,
      linkedOkrIds = [],
      teamMembers = [],
      externalParticipantIds = [],
      startDate,
      targetEndDate,
      visibility,
      memoryClass,
      tags = [],
      notes,
    } = req.body;

    // Check if project exists
    const checkResult = await session.run(
      `MATCH (p:Project {id: $id}) RETURN p`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const now = new Date().toISOString();

    // Update project properties (also fill createdBy if empty)
    const result = await session.run(
      `
      MATCH (p:Project {id: $id})
      SET p.name = $name,
          p.description = $description,
          p.status = $status,
          p.phase = $phase,
          p.priority = $priority,
          p.ownerId = $ownerId,
          p.department = $department,
          p.startDate = $startDate,
          p.targetEndDate = $targetEndDate,
          p.visibility = $visibility,
          p.memoryClass = $memoryClass,
          p.tags = $tags,
          p.notes = $notes,
          p.updatedAt = $now,
          p.updatedBy = $updatedBy,
          p.createdBy = CASE WHEN p.createdBy = '' OR p.createdBy IS NULL THEN $updatedBy ELSE p.createdBy END
      RETURN p
      `,
      {
        id,
        name,
        description: description || '',
        status: status || 'draft',
        phase: phase || 'initiation',
        priority: priority || 'medium',
        ownerId: ownerId || '',
        department: department || '',
        startDate: startDate || '',
        targetEndDate: targetEndDate || '',
        visibility: visibility || 'corporate',
        memoryClass: memoryClass || 'procedural',
        tags: JSON.stringify(tags),
        notes: notes || '',
        now,
        updatedBy,
      }
    );

    // Update owner relationship
    await session.run(
      `MATCH (p:Project {id: $id})-[r:OWNED_BY]->() DELETE r`,
      { id }
    );
    if (ownerId) {
      await session.run(
        `
        MATCH (p:Project {id: $id})
        MATCH (u:User {id: $ownerId})
        MERGE (p)-[:OWNED_BY]->(u)
        `,
        { id, ownerId }
      );
    }

    // Update department relationship
    await session.run(
      `MATCH (p:Project {id: $id})-[r:BELONGS_TO]->() DELETE r`,
      { id }
    );
    if (department) {
      await session.run(
        `
        MATCH (p:Project {id: $id})
        MERGE (d:Department {name: $department})
        MERGE (p)-[:BELONGS_TO]->(d)
        `,
        { id, department }
      );
    }

    // Update OKR relationships
    await session.run(
      `MATCH (p:Project {id: $id})-[r:LINKED_TO_OKR]->() DELETE r`,
      { id }
    );
    for (const okrId of linkedOkrIds) {
      await session.run(
        `
        MATCH (p:Project {id: $id})
        MATCH (okr:OKR {id: $okrId})
        MERGE (p)-[:LINKED_TO_OKR]->(okr)
        `,
        { id, okrId }
      );
    }

    // Update team member relationships - delete existing and recreate
    await session.run(
      `MATCH (p:Project {id: $id})-[r:HAS_TEAM_MEMBER]->() DELETE r`,
      { id }
    );
    for (const member of teamMembers) {
      await session.run(
        `
        MATCH (p:Project {id: $id})
        MATCH (u:User {id: $userId})
        MERGE (p)-[:HAS_TEAM_MEMBER {role: $role, addedAt: $addedAt}]->(u)
        `,
        {
          id,
          userId: member.userId,
          role: member.role || 'member',
          addedAt: member.addedAt || now,
        }
      );
    }

    // Update external participant relationships - delete existing and recreate
    await session.run(
      `MATCH (p:Project {id: $id})-[r:HAS_EXTERNAL_PARTICIPANT]->() DELETE r`,
      { id }
    );
    for (const externalId of externalParticipantIds) {
      await session.run(
        `
        MATCH (p:Project {id: $id})
        MATCH (ep:ExternalParticipant {id: $externalId})
        MERGE (p)-[:HAS_EXTERNAL_PARTICIPANT {addedAt: $addedAt}]->(ep)
        `,
        {
          id,
          externalId,
          addedAt: now,
        }
      );
    }

    const project = result.records[0].get('p').properties;

    logger.info(`Project updated: ${id} by ${updatedBy}`);

    res.json({
      success: true,
      data: {
        ...project,
        tags: JSON.parse(project.tags || '[]'),
        linkedOkrIds,
        teamMembers,
        externalParticipantIds,
      },
    });
  } catch (error) {
    logger.error('Project update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /projects/:id
 * Permanently delete a project and its relationships
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    // Check if project exists
    const checkResult = await session.run(
      `MATCH (p:Project {id: $id}) RETURN p`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Delete project and all its relationships
    await session.run(
      `MATCH (p:Project {id: $id}) DETACH DELETE p`,
      { id }
    );

    logger.info(`Project permanently deleted: ${id}`);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Project delete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /projects/:id/history
 * Get version history of a project
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    const result = await session.run(
      `
      MATCH (p:Project {id: $id})
      OPTIONAL MATCH path = (p)-[:SUPERSEDES*]->(prev:Project)
      WITH p, collect(prev) AS previousVersions
      RETURN p, previousVersions
      ORDER BY p.version DESC
      `,
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const record = result.records[0];
    const current = record.get('p').properties;
    const previous = record.get('previousVersions').map((n: any) => n.properties);

    const history = [current, ...previous].map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      status: p.status,
      phase: p.phase,
      createdAt: p.createdAt,
      archivedAt: p.archivedAt,
      archivedReason: p.archivedReason,
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Project history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project history',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// OKRs ENDPOINTS
// ============================================================================

/**
 * GET /projects/okrs/list
 * List all OKRs available for linking (with their objectives)
 */
router.get('/okrs/list', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(
      `
      MATCH (okr:OKR)
      WHERE okr.status <> 'archived'
      OPTIONAL MATCH (okr)-[:BELONGS_TO_OBJECTIVE]->(obj:Objective)
      OPTIONAL MATCH (okr)-[:OWNED_BY]->(owner:User)
      RETURN okr,
             obj.id AS objectiveId,
             obj.title AS objectiveTitle,
             owner.id AS ownerId,
             owner.name AS ownerName
      ORDER BY obj.title, okr.title
      `
    );

    const okrs: OKR[] = result.records.map((record) => {
      const okr = record.get('okr').properties;
      return {
        id: okr.id,
        title: okr.title,
        targetValue: okr.targetValue || 0,
        currentValue: okr.currentValue || 0,
        unit: okr.unit || '',
        deadline: okr.deadline || '',
        objectiveId: record.get('objectiveId') || '',
        objectiveTitle: record.get('objectiveTitle') || '',
        ownerId: record.get('ownerId') || okr.ownerId || '',
        ownerName: record.get('ownerName') || '',
        department: okr.department || '',
        status: okr.status || 'active',
        version: okr.version || 1,
        validFrom: okr.validFrom || okr.createdAt || '',
        validUntil: okr.validUntil || okr.deadline || '',
        createdAt: okr.createdAt || '',
      };
    });

    res.json({ success: true, data: okrs });
  } catch (error) {
    logger.error('OKRs list error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch OKRs',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /projects/objectives/list
 * List all Objectives with their OKRs
 */
router.get('/objectives/list', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(
      `
      MATCH (obj:Objective)
      WHERE obj.status <> 'archived'
      OPTIONAL MATCH (obj)<-[:BELONGS_TO_OBJECTIVE]-(okr:OKR)
      WHERE okr IS NULL OR okr.status <> 'archived'
      OPTIONAL MATCH (obj)-[:OWNED_BY]->(owner:User)
      RETURN obj,
             owner.id AS ownerId,
             owner.name AS ownerName,
             collect(CASE WHEN okr IS NOT NULL THEN {
               id: okr.id,
               title: okr.title,
               targetValue: okr.targetValue,
               currentValue: okr.currentValue,
               unit: okr.unit,
               deadline: okr.deadline,
               ownerId: okr.ownerId,
               department: okr.department,
               status: okr.status
             } ELSE null END) AS okrs
      ORDER BY obj.title
      `
    );

    const objectives: Objective[] = result.records.map((record) => {
      const obj = record.get('obj').properties;
      return {
        id: obj.id,
        title: obj.title,
        description: obj.description || '',
        status: obj.status || 'active',
        targetDate: obj.targetDate || '',
        ownerId: record.get('ownerId') || obj.ownerId || '',
        ownerName: record.get('ownerName') || '',
        department: obj.department || '',
        version: obj.version || 1,
        validFrom: obj.validFrom || obj.createdAt || '',
        validUntil: obj.validUntil || obj.targetDate || '',
        createdAt: obj.createdAt || '',
        okrs: record.get('okrs').filter((o: any) => o.id),
      };
    });

    res.json({ success: true, data: objectives });
  } catch (error) {
    logger.error('Objectives list error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch objectives',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /projects/okrs
 * Create a new OKR (OKRs are immutable - create new, don't edit)
 */
router.post('/okrs', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const createdBy = getUserEmail(req);

  try {
    const {
      title,
      targetValue,
      currentValue = 0,
      unit,
      deadline,
      objectiveId,
      ownerId,
      department,
      validFrom,
      validUntil,
    } = req.body;

    if (!title || !objectiveId) {
      return res.status(400).json({
        success: false,
        error: 'Title and objectiveId are required',
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await session.run(
      `
      CREATE (okr:OKR {
        id: $id,
        title: $title,
        targetValue: $targetValue,
        currentValue: $currentValue,
        unit: $unit,
        deadline: $deadline,
        ownerId: $ownerId,
        department: $department,
        status: 'active',
        version: 1,
        validFrom: $validFrom,
        validUntil: $validUntil,
        createdAt: $now,
        createdBy: $createdBy
      })
      WITH okr
      MATCH (obj:Objective {id: $objectiveId})
      CREATE (okr)-[:BELONGS_TO_OBJECTIVE]->(obj)
      RETURN okr, obj.title AS objectiveTitle
      `,
      {
        id,
        title,
        targetValue: targetValue || 0,
        currentValue,
        unit: unit || '',
        deadline: deadline || '',
        ownerId: ownerId || '',
        department: department || '',
        validFrom: validFrom || now,
        validUntil: validUntil || deadline || '',
        now,
        objectiveId,
        createdBy: createdBy || '',
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Objective not found' });
    }

    // Create owner relationship
    if (ownerId) {
      await session.run(
        `
        MATCH (okr:OKR {id: $okrId})
        MATCH (u:User {id: $ownerId})
        MERGE (okr)-[:OWNED_BY]->(u)
        `,
        { okrId: id, ownerId }
      );
    }

    const okr = result.records[0].get('okr').properties;

    logger.info(`OKR created: ${id} - ${title}`);

    res.status(201).json({
      success: true,
      data: {
        ...okr,
        objectiveId,
        objectiveTitle: result.records[0].get('objectiveTitle'),
      },
    });
  } catch (error) {
    logger.error('OKR create error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create OKR',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /projects/objectives
 * Create a new Objective (Objectives are immutable - create new, don't edit)
 */
router.post('/objectives', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const createdBy = getUserEmail(req);

  try {
    const {
      title,
      description,
      targetDate,
      ownerId,
      department,
      validFrom,
      validUntil,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await session.run(
      `
      CREATE (obj:Objective {
        id: $id,
        title: $title,
        description: $description,
        targetDate: $targetDate,
        ownerId: $ownerId,
        department: $department,
        status: 'active',
        version: 1,
        validFrom: $validFrom,
        validUntil: $validUntil,
        createdAt: $now,
        createdBy: $createdBy
      })
      RETURN obj
      `,
      {
        id,
        title,
        description: description || '',
        targetDate: targetDate || '',
        ownerId: ownerId || '',
        department: department || '',
        validFrom: validFrom || now,
        validUntil: validUntil || targetDate || '',
        now,
        createdBy: createdBy || '',
      }
    );

    // Create owner and department relationships
    if (ownerId) {
      await session.run(
        `
        MATCH (obj:Objective {id: $objId})
        MATCH (u:User {id: $ownerId})
        MERGE (obj)-[:OWNED_BY]->(u)
        `,
        { objId: id, ownerId }
      );
    }

    if (department) {
      await session.run(
        `
        MATCH (obj:Objective {id: $objId})
        MERGE (d:Department {name: $department})
        MERGE (obj)-[:BELONGS_TO]->(d)
        `,
        { objId: id, department }
      );
    }

    const obj = result.records[0].get('obj').properties;

    logger.info(`Objective created: ${id} - ${title}`);

    res.status(201).json({ success: true, data: obj });
  } catch (error) {
    logger.error('Objective create error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create objective',
    });
  } finally {
    await session.close();
  }
});

/**
 * PUT /projects/objectives/:id
 * Update an existing Objective
 */
router.put('/objectives/:id', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const updatedBy = getUserEmail(req);

  try {
    const { id } = req.params;
    const {
      title,
      description,
      targetDate,
      ownerId,
      department,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    // Check if objective exists
    const checkResult = await session.run(
      `MATCH (obj:Objective {id: $id}) RETURN obj`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Objective not found' });
    }

    const now = new Date().toISOString();

    // Update objective properties (also fill createdBy if empty)
    const result = await session.run(
      `
      MATCH (obj:Objective {id: $id})
      SET obj.title = $title,
          obj.description = $description,
          obj.targetDate = $targetDate,
          obj.ownerId = $ownerId,
          obj.department = $department,
          obj.updatedAt = $now,
          obj.updatedBy = $updatedBy,
          obj.createdBy = CASE WHEN obj.createdBy = '' OR obj.createdBy IS NULL THEN $updatedBy ELSE obj.createdBy END
      RETURN obj
      `,
      {
        id,
        title,
        description: description || '',
        targetDate: targetDate || '',
        ownerId: ownerId || '',
        department: department || '',
        now,
        updatedBy,
      }
    );

    // Update owner relationship
    await session.run(
      `MATCH (obj:Objective {id: $id})-[r:OWNED_BY]->() DELETE r`,
      { id }
    );
    if (ownerId) {
      await session.run(
        `
        MATCH (obj:Objective {id: $id})
        MATCH (u:User {id: $ownerId})
        MERGE (obj)-[:OWNED_BY]->(u)
        `,
        { id, ownerId }
      );
    }

    // Update department relationship
    await session.run(
      `MATCH (obj:Objective {id: $id})-[r:BELONGS_TO]->(:Department) DELETE r`,
      { id }
    );
    if (department) {
      await session.run(
        `
        MATCH (obj:Objective {id: $id})
        MERGE (d:Department {name: $department})
        MERGE (obj)-[:BELONGS_TO]->(d)
        `,
        { id, department }
      );
    }

    const obj = result.records[0].get('obj').properties;

    logger.info(`Objective updated: ${id} - ${title}`);

    res.json({ success: true, data: obj });
  } catch (error) {
    logger.error('Objective update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update objective',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /projects/okrs/:id/archive
 * Archive an OKR (mark as superseded when creating a new version)
 */
router.post('/okrs/:id/archive', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;
    const { reason, supersededById } = req.body;

    const result = await session.run(
      `
      MATCH (okr:OKR {id: $id})
      SET okr.status = 'archived',
          okr.archivedAt = $now,
          okr.archivedReason = $reason,
          okr.supersededById = $supersededById
      RETURN okr
      `,
      {
        id,
        now: new Date().toISOString(),
        reason: reason || 'manual_archive',
        supersededById: supersededById || null,
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }

    logger.info(`OKR archived: ${id}`);

    res.json({ success: true, message: 'OKR archived successfully' });
  } catch (error) {
    logger.error('OKR archive error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive OKR',
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /projects/okrs/:id
 * Permanently delete an OKR and its relationships
 */
router.delete('/okrs/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    // Primeiro verificar se existe
    const checkResult = await session.run(
      `MATCH (okr:OKR {id: $id}) RETURN okr`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }

    // DETACH DELETE remove o node e todos os relacionamentos
    await session.run(
      `MATCH (okr:OKR {id: $id}) DETACH DELETE okr`,
      { id }
    );

    logger.info(`OKR permanently deleted: ${id}`);

    res.json({ success: true, message: 'OKR permanently deleted' });
  } catch (error) {
    logger.error('OKR delete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete OKR',
    });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /projects/objectives/:id
 * Permanently delete an Objective and all its OKRs + relationships
 */
router.delete('/objectives/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { id } = req.params;

    // Primeiro verificar se existe
    const checkResult = await session.run(
      `MATCH (obj:Objective {id: $id}) RETURN obj`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Objective not found' });
    }

    // Deletar todos os OKRs associados primeiro
    await session.run(
      `
      MATCH (obj:Objective {id: $id})<-[:BELONGS_TO_OBJECTIVE]-(okr:OKR)
      DETACH DELETE okr
      `,
      { id }
    );

    // Depois deletar o Objective
    await session.run(
      `MATCH (obj:Objective {id: $id}) DETACH DELETE obj`,
      { id }
    );

    logger.info(`Objective and its OKRs permanently deleted: ${id}`);

    res.json({ success: true, message: 'Objective and its OKRs permanently deleted' });
  } catch (error) {
    logger.error('Objective delete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete Objective',
    });
  } finally {
    await session.close();
  }
});

export default router;
