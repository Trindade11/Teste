import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

interface OrgChartUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
}

interface OrgChartResponse {
  user: OrgChartUser;
  manager: OrgChartUser | null;
  peers: OrgChartUser[];
  subordinates: OrgChartUser[];
}

/**
 * GET /orgchart/:email
 * Get organizational chart context for a specific user
 */
router.get('/:email', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const email = req.params.email?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    // Get the user
    const userResult = await session.run(
      `MATCH (u:User {email: $email})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       RETURN 
         u.id AS id,
         u.name AS name,
         u.email AS email,
         u.company AS company,
         u.jobTitle AS role,
         d.name AS department`,
      { email }
    );

    if (userResult.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const userRecord = userResult.records[0];
    const user: OrgChartUser = {
      id: userRecord.get('id'),
      name: userRecord.get('name') || '',
      email: userRecord.get('email'),
      company: userRecord.get('company') || '',
      role: userRecord.get('role') || '',
      department: userRecord.get('department') || '',
    };

    // Get manager (who the user REPORTS_TO)
    const managerResult = await session.run(
      `MATCH (u:User {email: $email})-[:REPORTS_TO]->(m:User)
       OPTIONAL MATCH (m)-[:MEMBER_OF]->(d:Department)
       RETURN 
         m.id AS id,
         m.name AS name,
         m.email AS email,
         m.company AS company,
         m.jobTitle AS role,
         d.name AS department`,
      { email }
    );

    const manager: OrgChartUser | null = managerResult.records.length > 0
      ? {
          id: managerResult.records[0].get('id'),
          name: managerResult.records[0].get('name') || '',
          email: managerResult.records[0].get('email'),
          company: managerResult.records[0].get('company') || '',
          role: managerResult.records[0].get('role') || '',
          department: managerResult.records[0].get('department') || '',
        }
      : null;

    // Get peers (other users who REPORT_TO the same manager)
    let peers: OrgChartUser[] = [];
    if (manager) {
      const peersResult = await session.run(
        `MATCH (peer:User)-[:REPORTS_TO]->(m:User {email: $managerEmail})
         WHERE peer.email <> $email
         OPTIONAL MATCH (peer)-[:MEMBER_OF]->(d:Department)
         RETURN 
           peer.id AS id,
           peer.name AS name,
           peer.email AS email,
           peer.company AS company,
           peer.jobTitle AS role,
           d.name AS department
         ORDER BY peer.name`,
        { managerEmail: manager.email, email }
      );

      peers = peersResult.records.map(r => ({
        id: r.get('id'),
        name: r.get('name') || '',
        email: r.get('email'),
        company: r.get('company') || '',
        role: r.get('role') || '',
        department: r.get('department') || '',
      }));
    }

    // Get subordinates (users who REPORT_TO this user)
    const subordinatesResult = await session.run(
      `MATCH (sub:User)-[:REPORTS_TO]->(u:User {email: $email})
       OPTIONAL MATCH (sub)-[:MEMBER_OF]->(d:Department)
       RETURN 
         sub.id AS id,
         sub.name AS name,
         sub.email AS email,
         sub.company AS company,
         sub.jobTitle AS role,
         d.name AS department
       ORDER BY sub.name`,
      { email }
    );

    const subordinates: OrgChartUser[] = subordinatesResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name') || '',
      email: r.get('email'),
      company: r.get('company') || '',
      role: r.get('role') || '',
      department: r.get('department') || '',
    }));

    const response: OrgChartResponse = {
      user,
      manager,
      peers,
      subordinates,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('OrgChart fetch error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch org chart',
    });
  } finally {
    await session.close();
  }
});

export default router;
