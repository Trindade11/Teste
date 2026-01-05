import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

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
