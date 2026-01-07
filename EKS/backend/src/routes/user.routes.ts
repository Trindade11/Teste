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

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
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
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];

    const onboardingResponseNode = record.get('onboardingResponse') ?? null;

    res.json({
      success: true,
      data: {
        user: {
          userId: record.get('userId'),
          email: record.get('email'),
          name: record.get('name') || '',
          role: record.get('role') || 'user',
          company: record.get('company') || '',
          organizationType: record.get('organizationType') || null,
          jobTitle: record.get('jobTitle') || null,
          relationshipType: record.get('relationshipType') || null,
          accessTypes: record.get('accessTypes') || [],
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
