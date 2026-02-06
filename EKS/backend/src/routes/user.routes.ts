import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

router.get('/profile-data', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;
    const tokenEmail = req.user?.email || '';
    const tokenRole = (req.user?.role || '') as string;
    const tokenRoleNormalized = String(tokenRole).toLowerCase().trim();
    const tokenIsAdmin = tokenRoleNormalized.includes('admin') || tokenRoleNormalized.includes('administrador');

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (userId === 'bootstrap-admin') {
      const accessTypes = ['Estratégico', 'Tático', 'Operacional'];
      logger.info('User profile-data resolved (bootstrap-admin)', {
        userId,
        tokenRole,
        accessTypes,
      });

      res.json({
        success: true,
        data: {
          user: {
            userId,
            email: tokenEmail,
            name: 'Bootstrap Admin',
            role: tokenRole || 'admin',
            company: '',
            organizationType: req.user?.organizationType || null,
            jobTitle: null,
            relationshipType: null,
            accessTypes,
            status: null,
            createdAt: null,
            updatedAt: null,
          },
          onboardingResponse: null,
          department: null,
          organization: null,
          location: null,
        },
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:HAS_ONBOARDING_RESPONSE]->(o:OnboardingResponse)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:BELONGS_TO]->(org:Organization)
       OPTIONAL MATCH (u)-[:WORKS_AT]->(l:Location)
       RETURN
         u.id AS userId,
         u.email AS email,
         u.name AS name,
         u.role AS role,
         u.company AS company,
         u.organizationType AS organizationType,
         u.jobTitle AS jobTitle,
         u.relationshipType AS relationshipType,
         u.accessTypes AS accessTypes,
         u.status AS status,
         u.createdAt AS createdAt,
         u.updatedAt AS updatedAt,
         o AS onboardingResponse,
         d.name AS department,
         org.name AS organization,
         l.name AS location`,
      { userId }
    );

    if (result.records.length === 0) {
      if (tokenIsAdmin) {
        const accessTypes = ['Estratégico', 'Tático', 'Operacional'];
        logger.info('User profile-data resolved (token-admin fallback, user not found in Neo4j)', {
          userId,
          tokenRole,
          accessTypes,
        });

        res.json({
          success: true,
          data: {
            user: {
              userId,
              email: tokenEmail,
              name: '',
              role: tokenRole || 'admin',
              company: '',
              organizationType: req.user?.organizationType || null,
              jobTitle: null,
              relationshipType: null,
              accessTypes,
              status: null,
              createdAt: null,
              updatedAt: null,
            },
            onboardingResponse: null,
            department: null,
            organization: null,
            location: null,
          },
        });
        return;
      }

      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];

    const onboardingResponseNode = record.get('onboardingResponse') ?? null;

    const dbRole = (record.get('role') || 'user') as string;
    const role = dbRole || tokenRole || 'user';
    const roleNormalized = String(role).toLowerCase().trim();
    const isAdmin =
      roleNormalized.includes('admin') ||
      roleNormalized.includes('administrador') ||
      tokenRoleNormalized.includes('admin') ||
      tokenRoleNormalized.includes('administrador');

    let accessTypes = record.get('accessTypes') || [];
    if (!Array.isArray(accessTypes)) accessTypes = [];
    if (isAdmin) {
      const adminDefaults = ['Estratégico', 'Tático', 'Operacional'];
      accessTypes = Array.from(new Set([...adminDefaults, ...accessTypes]));
    }

    logger.info('User profile-data resolved', {
      userId: record.get('userId'),
      dbRole,
      tokenRole,
      isAdmin,
      accessTypes,
    });

    res.json({
      success: true,
      data: {
        user: {
          userId: record.get('userId'),
          email: record.get('email'),
          name: record.get('name') || '',
          role,
          company: record.get('company') || '',
          organizationType: record.get('organizationType') || null,
          jobTitle: record.get('jobTitle') || null,
          relationshipType: record.get('relationshipType') || null,
          accessTypes,
          status: record.get('status') || null,
          createdAt: record.get('createdAt') || null,
          updatedAt: record.get('updatedAt') || null,
        },
        onboardingResponse: onboardingResponseNode ? onboardingResponseNode.properties : null,
        department: record.get('department') || null,
        organization: record.get('organization') || null,
        location: record.get('location') || null,
      },
    });
  } catch (error) {
    logger.error('User profile data route error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load user profile data',
    });
  } finally {
    await session.close();
  }
});

export default router;
