/**
 * PIA Routes - Process Intelligence & Analysis
 * Endpoints for organizational structure and process mapping
 * Note: Gamification replaced by Resonance model (see spec 020)
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import {
  inferProcessesFromOnboarding,
  detailProcessActivities,
  extractBusinessRules,
} from '../services/pia.service';

const router = Router();

router.use(authenticate);

/**
 * GET /api/pia/context
 * Get user context for PIA (from onboarding + org structure)
 */
router.get('/context', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
       OPTIONAL MATCH (u)-[:HAS_PERSONA_VERSION]->(pv:PersonaVersion)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
       OPTIONAL MATCH (d)<-[:HAS_DEPARTMENT]-(o:Organization)
       RETURN 
         u.name AS fullName,
         u.email AS email,
         u.jobTitle AS jobTitle,
         d.name AS department,
         o.name AS company,
         o.description AS companyDescription,
         fro.role_description AS roleDescription,
         fro.department_description AS departmentDescription,
         fro.primary_objective AS primaryObjective,
         fro.top_challenges AS topChallenges,
         pv.persona_summary AS personaSummary,
         collect(DISTINCT c.name) AS competencies,
         fro IS NOT NULL AS hasOnboarding`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const r = result.records[0];

    res.json({
      success: true,
      data: {
        fullName: r.get('fullName'),
        email: r.get('email'),
        jobTitle: r.get('jobTitle'),
        department: r.get('department'),
        company: r.get('company'),
        companyDescription: r.get('companyDescription'),
        roleDescription: r.get('roleDescription'),
        departmentDescription: r.get('departmentDescription'),
        primaryObjective: r.get('primaryObjective'),
        topChallenges: r.get('topChallenges'),
        personaSummary: r.get('personaSummary'),
        competencies: r.get('competencies'),
        hasOnboarding: r.get('hasOnboarding'),
      },
    });
  } catch (error) {
    logger.error('PIA context error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get PIA context',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /api/pia/suggest-processes
 * Infer and suggest processes based on user's onboarding data
 */
router.post('/suggest-processes', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user context from onboarding
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
       OPTIONAL MATCH (d)<-[:HAS_DEPARTMENT]-(o:Organization)
       RETURN 
         u.name AS fullName,
         u.jobTitle AS jobTitle,
         d.name AS department,
         o.name AS company,
         fro.role_description AS roleDescription,
         fro.department_description AS departmentDescription,
         fro.primary_objective AS primaryObjective,
         fro.top_challenges AS topChallenges,
         collect(DISTINCT c.name) AS competencies`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const r = result.records[0];

    const context = {
      fullName: r.get('fullName') || '',
      jobTitle: r.get('jobTitle') || '',
      department: r.get('department') || '',
      company: r.get('company') || '',
      roleDescription: r.get('roleDescription') || '',
      departmentDescription: r.get('departmentDescription') || '',
      primaryObjective: r.get('primaryObjective') || '',
      topChallenges: r.get('topChallenges') || '',
      competencies: r.get('competencies') || [],
    };

    // Check if user has enough context
    if (!context.roleDescription && !context.primaryObjective) {
      res.status(400).json({
        success: false,
        error: 'Onboarding incompleto. Complete o onboarding primeiro.',
      });
      return;
    }

    // Infer processes using LLM
    const suggestions = await inferProcessesFromOnboarding(context);

    logger.info(`Suggested ${suggestions.length} processes for user ${userId}`);

    res.json({
      success: true,
      data: {
        context: {
          fullName: context.fullName,
          jobTitle: context.jobTitle,
          department: context.department,
        },
        suggestions,
      },
    });
  } catch (error) {
    logger.error('PIA suggest-processes error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest processes',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /api/pia/map-process
 * Create a new process mapping
 */
router.post('/map-process', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { name, description, activities, departmentName } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Process name required' });
      return;
    }

    const now = new Date().toISOString();
    const processId = randomUUID();

    // Create process and activities
    await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (d:Department {name: $departmentName})
       
       CREATE (p:Process {
         id: $processId,
         name: $name,
         description: $description,
         owner_id: $userId,
         status: 'draft',
         quality_score: 0.5,
         source: 'user_mapping',
         created_at: datetime($now),
         updated_at: datetime($now)
       })
       
       CREATE (u)-[:MAPPED {
         mapped_at: datetime($now)
       }]->(p)
       
       WITH p, d
       WHERE d IS NOT NULL
       CREATE (d)-[:HAS_PROCESS]->(p)`,
      { userId, processId, name, description: description || '', departmentName: departmentName || '', now }
    );

    // Create activities if provided
    if (activities && Array.isArray(activities) && activities.length > 0) {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const activityId = randomUUID();

        await session.run(
          `MATCH (p:Process {id: $processId})
           CREATE (a:Activity {
             id: $activityId,
             name: $activityName,
             description: $activityDescription,
             sequence_order: $sequenceOrder,
             is_decision_point: $isDecisionPoint,
             duration_estimate: $durationEstimate,
             created_at: datetime($now)
           })
           CREATE (p)-[:HAS_ACTIVITY]->(a)`,
          {
            processId,
            activityId,
            activityName: activity.name || `Atividade ${i + 1}`,
            activityDescription: activity.description || '',
            sequenceOrder: i + 1,
            isDecisionPoint: activity.isDecisionPoint || false,
            durationEstimate: activity.durationEstimate || 30,
            now,
          }
        );
      }
    }

    logger.info(`Process mapped: ${processId} by user ${userId}`);

    res.json({
      success: true,
      data: {
        processId,
        name,
        activitiesCount: activities?.length || 0,
      },
    });
  } catch (error) {
    logger.error('PIA map-process error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to map process',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /api/pia/detail-activities
 * Get detailed activity suggestions for a process
 */
router.post('/detail-activities', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { processName, processDescription } = req.body;

    if (!processName) {
      res.status(400).json({ success: false, error: 'Process name required' });
      return;
    }

    // Get user context
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (d)<-[:HAS_DEPARTMENT]-(o:Organization)
       RETURN u.name AS fullName, u.jobTitle AS jobTitle, d.name AS department, o.name AS company`,
      { userId }
    );

    const r = result.records[0];
    const context = {
      fullName: r?.get('fullName') || '',
      jobTitle: r?.get('jobTitle') || '',
      department: r?.get('department') || '',
      company: r?.get('company') || '',
      roleDescription: '',
      primaryObjective: '',
      topChallenges: '',
      competencies: [],
    };

    const activities = await detailProcessActivities(processName, processDescription || '', context);

    res.json({
      success: true,
      data: {
        processName,
        activities,
      },
    });
  } catch (error) {
    logger.error('PIA detail-activities error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detail activities',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /api/pia/map-handoff
 * Create a handoff relationship
 */
router.post('/map-handoff', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { activityId, toUserEmail, what, when, how } = req.body;

    if (!activityId || !toUserEmail) {
      res.status(400).json({ success: false, error: 'Activity ID and recipient email required' });
      return;
    }

    const now = new Date().toISOString();

    // Create handoff
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       MATCH (a:Activity {id: $activityId})
       MATCH (toUser:User {email: $toUserEmail})
       
       CREATE (u)-[:HANDS_OFF {
         what: $what,
         when: $when,
         how: $how,
         status: 'pending',
         created_at: datetime($now)
       }]->(a)
       
       CREATE (a)-[:TO]->(toUser)
       
       RETURN toUser.name AS recipientName`,
      { userId, activityId, toUserEmail, what: what || '', when: when || '', how: how || '', now }
    );

    if (result.records.length === 0) {
      res.status(404).json({ success: false, error: 'Activity or recipient not found' });
      return;
    }

    const recipientName = result.records[0].get('recipientName');

    logger.info(`Handoff mapped: ${userId} -> ${activityId} -> ${toUserEmail}`);

    res.json({
      success: true,
      data: {
        activityId,
        recipientEmail: toUserEmail,
        recipientName,
        status: 'pending',
      },
    });
  } catch (error) {
    logger.error('PIA map-handoff error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to map handoff',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /api/pia/extract-rules
 * Extract business rules from process description
 */
router.post('/extract-rules', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { processName, activities, additionalContext } = req.body;

    if (!processName) {
      res.status(400).json({ success: false, error: 'Process name required' });
      return;
    }

    const rules = await extractBusinessRules(
      processName,
      activities || [],
      additionalContext || ''
    );

    res.json({
      success: true,
      data: {
        processName,
        rules,
      },
    });
  } catch (error) {
    logger.error('PIA extract-rules error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract rules',
    });
  }
});

/**
 * GET /api/pia/organizational-structure
 * Get complete organizational structure for PIA context
 */
router.get('/organizational-structure', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get organization info
    const orgResult = await session.run(
      `MATCH (o:Organization)
       OPTIONAL MATCH (o)-[:HAS_DEPARTMENT]->(d:Department)
       OPTIONAL MATCH (d)<-[:MEMBER_OF]-(u:User)
       OPTIONAL MATCH (d)-[:HAS_PROCESS]->(p:Process)
       WITH o, d, count(DISTINCT u) AS memberCount, count(DISTINCT p) > 0 AS hasProcesses
       WITH o, collect(DISTINCT CASE WHEN d IS NOT NULL THEN {
           name: d.name,
           memberCount: memberCount,
           hasProcesses: hasProcesses
         } END) AS departments
       RETURN 
         o.name AS orgName,
         o.description AS orgDescription,
         o.organizationType AS orgType,
         [dept IN departments WHERE dept IS NOT NULL] AS departments`
    );

    // Get user counts
    const userResult = await session.run(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
       WITH u, fro IS NOT NULL AS hasOnboarding
       RETURN 
         count(u) AS totalUsers,
         sum(CASE WHEN hasOnboarding THEN 1 ELSE 0 END) AS usersWithOnboarding`
    );

    // Get mapping coverage
    const coverageResult = await session.run(
      `MATCH (d:Department)
       OPTIONAL MATCH (d)-[:HAS_PROCESS]->(p:Process)
       WITH d, count(p) > 0 AS hasMappedProcesses
       RETURN 
         count(d) AS totalDepartments,
         sum(CASE WHEN hasMappedProcesses THEN 1 ELSE 0 END) AS departmentsMapped`
    );

    const org = orgResult.records[0];
    const users = userResult.records[0];
    const coverage = coverageResult.records[0];

    const totalDepts = coverage?.get('totalDepartments')?.toNumber?.() || 0;
    const mappedDepts = coverage?.get('departmentsMapped')?.toNumber?.() || 0;

    const rawDepartments = org?.get('departments') || [];
    const departments = rawDepartments.map((d: any) => ({
      name: d.name,
      memberCount: d.memberCount?.toNumber?.() || 0,
      hasProcesses: d.hasProcesses
    }));

    res.json({
      success: true,
      data: {
        organization: org ? {
          name: org.get('orgName'),
          description: org.get('orgDescription'),
          type: org.get('orgType'),
        } : null,
        departments,
        users: {
          total: users?.get('totalUsers')?.toNumber?.() || 0,
          withOnboarding: users?.get('usersWithOnboarding')?.toNumber?.() || 0,
          withoutOnboarding: (users?.get('totalUsers')?.toNumber?.() || 0) - (users?.get('usersWithOnboarding')?.toNumber?.() || 0),
        },
        mappingCoverage: {
          departmentsMapped: mappedDepts,
          totalDepartments: totalDepts,
          percentageMapped: totalDepts > 0 ? Math.round((mappedDepts / totalDepts) * 100) : 0,
        },
      },
    });
  } catch (error) {
    logger.error('PIA organizational-structure error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get organizational structure',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /api/pia/processes
 * Get all processes mapped by the user or in their department
 */
router.get('/processes', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       
       // Processos mapeados pelo usuário
       OPTIONAL MATCH (u)-[:MAPPED]->(myProcess:Process)
       
       // Processos do departamento
       OPTIONAL MATCH (d)-[:HAS_PROCESS]->(deptProcess:Process)
       
       WITH u, collect(DISTINCT myProcess) AS myProcesses, collect(DISTINCT deptProcess) AS deptProcesses
       
       UNWIND (myProcesses + deptProcesses) AS p
       WITH DISTINCT p
       WHERE p IS NOT NULL
       
       OPTIONAL MATCH (p)-[:HAS_ACTIVITY]->(a:Activity)
       OPTIONAL MATCH (mapper:User)-[:MAPPED]->(p)
       
       RETURN 
         p.id AS id,
         p.name AS name,
         p.description AS description,
         p.status AS status,
         p.quality_score AS qualityScore,
         p.created_at AS createdAt,
         count(DISTINCT a) AS activityCount,
         mapper.name AS mappedBy
       ORDER BY p.created_at DESC`,
      { userId }
    );

    const processes = result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description'),
      status: r.get('status'),
      qualityScore: r.get('qualityScore'),
      createdAt: r.get('createdAt'),
      activityCount: r.get('activityCount')?.toNumber?.() || 0,
      mappedBy: r.get('mappedBy'),
    }));

    res.json({
      success: true,
      data: {
        processes,
        count: processes.length,
      },
    });
  } catch (error) {
    logger.error('PIA processes error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get processes',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /api/pia/onboarding-summary
 * Get summary of all users who completed onboarding with their key data
 */
router.get('/onboarding-summary', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const result = await session.run(
      `MATCH (u:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
       RETURN 
         u.name AS userName,
         u.email AS email,
         u.jobTitle AS jobTitle,
         d.name AS department,
         fro.role_description AS roleDescription,
         fro.primary_objective AS primaryObjective,
         fro.top_challenges AS topChallenges,
         collect(DISTINCT c.name) AS competencies,
         fro.created_at AS onboardingDate
       ORDER BY fro.created_at DESC`
    );

    const users = result.records.map(r => ({
      name: r.get('userName'),
      email: r.get('email'),
      jobTitle: r.get('jobTitle'),
      department: r.get('department'),
      roleDescription: r.get('roleDescription'),
      primaryObjective: r.get('primaryObjective'),
      topChallenges: r.get('topChallenges'),
      competencies: r.get('competencies'),
      onboardingDate: r.get('onboardingDate'),
    }));

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    logger.error('PIA onboarding-summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get onboarding summary',
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /api/pia/department-details/:departmentName
 * Get detailed info about a specific department
 */
router.get('/department-details/:departmentName', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;
    const { departmentName } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const result = await session.run(
      `MATCH (d:Department {name: $departmentName})
       OPTIONAL MATCH (d)<-[:MEMBER_OF]-(u:User)
       OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
       OPTIONAL MATCH (d)-[:HAS_PROCESS]->(p:Process)
       WITH d, u, fro, collect(DISTINCT p.name) AS processes
       RETURN 
         d.name AS departmentName,
         d.description AS departmentDescription,
         collect(DISTINCT {
           name: u.name,
           email: u.email,
           jobTitle: u.jobTitle,
           hasOnboarding: fro IS NOT NULL,
           roleDescription: fro.role_description
         }) AS members,
         processes`,
      { departmentName }
    );

    if (result.records.length === 0) {
      res.status(404).json({ success: false, error: 'Department not found' });
      return;
    }

    const r = result.records[0];

    res.json({
      success: true,
      data: {
        name: r.get('departmentName'),
        description: r.get('departmentDescription'),
        members: r.get('members'),
        processes: r.get('processes'),
      },
    });
  } catch (error) {
    logger.error('PIA department-details error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get department details',
    });
  } finally {
    await session.close();
  }
});

export default router;
