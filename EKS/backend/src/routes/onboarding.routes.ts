import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

router.get('/draft', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:HAS_ONBOARDING_DRAFT]->(d:OnboardingDraft)
       RETURN d.dataJson AS dataJson, d.updatedAt AS updatedAt`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];
    const dataJson = record.get('dataJson') ?? null;
    const updatedAt = record.get('updatedAt') ?? null;

    res.json({
      success: true,
      data: dataJson
        ? {
            draft: JSON.parse(dataJson),
            updatedAt,
          }
        : null,
    });
  } catch (error) {
    logger.error('Onboarding draft get error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding draft',
    });
  } finally {
    await session.close();
  }
});

router.post('/draft', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const draft = req.body?.draft;

    if (!draft || typeof draft !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid draft payload',
      });
      return;
    }

    const now = new Date().toISOString();
    const dataJson = JSON.stringify(draft);

    await session.run(
      `MATCH (u:User {id: $userId})
       MERGE (d:OnboardingDraft {userId: $userId})
       SET d.dataJson = $dataJson,
           d.updatedAt = $now
       MERGE (u)-[:HAS_ONBOARDING_DRAFT]->(d)`,
      { userId, dataJson, now }
    );

    res.json({
      success: true,
      data: {
        updatedAt: now,
      },
    });
  } catch (error) {
    logger.error('Onboarding draft save error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save onboarding draft',
    });
  } finally {
    await session.close();
  }
});

router.post('/complete', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const payload = req.body?.payload;

    if (!payload || typeof payload !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid onboarding payload',
      });
      return;
    }

    const now = new Date().toISOString();
    const recordId = randomUUID();

    const roleDescription = typeof payload.roleDescription === 'string' ? payload.roleDescription : '';
    const departmentDescription = typeof payload.departmentDescription === 'string' ? payload.departmentDescription : '';
    const profileDescription = typeof payload.profileDescription === 'string' ? payload.profileDescription : '';
    const competencies = Array.isArray(payload.competencies) ? payload.competencies : [];
    const primaryObjective = typeof payload.primaryObjective === 'string' ? payload.primaryObjective : '';
    const topChallenges = typeof payload.topChallenges === 'string' ? payload.topChallenges : '';
    const orgChartValidated = Boolean(payload.orgChartValidated);
    const defaultVisibility = payload.defaultVisibility === 'personal' ? 'personal' : 'corporate';
    const memoryLevel = ['short', 'medium', 'long'].includes(payload.memoryLevel) ? payload.memoryLevel : 'long';

    await session.run(
      `MATCH (u:User {id: $userId})
       MERGE (r:OnboardingResponse {userId: $userId})
       ON CREATE SET r.id = $recordId,
                     r.createdAt = $now
       SET r.updatedAt = $now,
           r.roleDescription = $roleDescription,
           r.departmentDescription = $departmentDescription,
           r.profileDescription = $profileDescription,
           r.competencies = $competencies,
           r.primaryObjective = $primaryObjective,
           r.topChallenges = $topChallenges,
           r.orgChartValidated = $orgChartValidated,
           r.defaultVisibility = $defaultVisibility,
           r.memoryLevel = $memoryLevel
       MERGE (u)-[:HAS_ONBOARDING_RESPONSE]->(r)
       WITH u
       OPTIONAL MATCH (u)-[:HAS_ONBOARDING_DRAFT]->(d:OnboardingDraft)
       DETACH DELETE d
       SET u.onboardingStatus = 'completed',
           u.onboardingCompletedAt = $now`,
      {
        userId,
        recordId,
        now,
        roleDescription,
        departmentDescription,
        profileDescription,
        competencies,
        primaryObjective,
        topChallenges,
        orgChartValidated,
        defaultVisibility,
        memoryLevel,
      }
    );

    res.json({
      success: true,
      data: {
        completedAt: now,
      },
    });
  } catch (error) {
    logger.error('Onboarding complete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding',
    });
  } finally {
    await session.close();
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       RETURN u.onboardingStatus AS status, u.onboardingCompletedAt AS completedAt`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];
    const status = record.get('status') || 'not_started';
    const completedAt = record.get('completedAt') || null;

    res.json({
      success: true,
      data: {
        status,
        completedAt,
      },
    });
  } catch (error) {
    logger.error('Onboarding status get error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding status',
    });
  } finally {
    await session.close();
  }
});

router.get('/prefill', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const email = req.user?.email?.trim().toLowerCase();

    if (!email) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {email: $email})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:WORKS_AT]->(l:Location)
       RETURN
         u.id AS id,
         u.email AS email,
         u.name AS name,
         u.company AS company,
         u.jobTitle AS jobTitle,
         u.organizationType AS organizationType,
         u.status AS status,
         u.relationshipType AS relationshipType,
         u.accessTypes AS accessTypes,
         d.name AS department,
         l.name AS location`,
      { email }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];

    const prefill = {
      name: record.get('name') ?? null,
      email: record.get('email') ?? null,
      company: record.get('company') ?? null,
      jobTitle: record.get('jobTitle') ?? null,
      department: record.get('department') ?? null,
      location: record.get('location') ?? null,
      organizationType: record.get('organizationType') ?? null,
      status: record.get('status') ?? null,
      relationshipType: record.get('relationshipType') ?? null,
      accessTypes: record.get('accessTypes') ?? [],
    };

    res.json({
      success: true,
      data: {
        userId: record.get('id'),
        prefill,
      },
    });
  } catch (error) {
    logger.error('Onboarding prefill error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding prefill',
    });
  } finally {
    await session.close();
  }
});

export default router;
