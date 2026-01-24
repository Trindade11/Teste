import { Router, Request, Response } from 'express';
import neo4j from 'neo4j-driver';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

const toNumber = (value: unknown): number => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'low' in (value as any)) return (value as any).low;
  return Number(value) || 0;
};

/**
 * GET /structure/overview
 * Get organizational structure overview for Mermaid visualization
 */
router.get('/overview', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    // Get organization info
    const orgResult = await session.run(`
      MATCH (o:Organization)
      OPTIONAL MATCH (u:User)-[:BELONGS_TO]->(o)
      WITH o, count(u) AS userCount
      RETURN o.name AS name, userCount
      ORDER BY userCount DESC
      LIMIT 1
    `);

    // Get departments with user counts
    const deptResult = await session.run(`
      MATCH (d:Department)
      OPTIONAL MATCH (u:User)-[:MEMBER_OF]->(d)
      WITH d, count(u) AS memberCount
      RETURN d.name AS name, memberCount
      ORDER BY memberCount DESC
    `);

    // Get locations
    const locResult = await session.run(`
      MATCH (l:Location)
      OPTIONAL MATCH (u:User)-[:WORKS_AT]->(l)
      WITH l, count(u) AS userCount
      RETURN l.name AS name, userCount
      ORDER BY userCount DESC
    `);

    // Get hierarchy depth
    const hierarchyResult = await session.run(`
      MATCH path = (u:User)-[:REPORTS_TO*]->(m:User)
      WHERE NOT (m)-[:REPORTS_TO]->()
      RETURN max(length(path)) AS maxDepth
    `);

    // Get total counts
    const countsResult = await session.run(`
      MATCH (u:User) WITH count(u) AS users
      MATCH (d:Department) WITH users, count(d) AS departments
      MATCH (o:Organization) WITH users, departments, count(o) AS organizations
      MATCH (l:Location) WITH users, departments, organizations, count(l) AS locations
      RETURN users, departments, organizations, locations
    `);

    const org = orgResult.records[0];
    const counts = countsResult.records[0];
    const hierarchy = hierarchyResult.records[0];

    const departments = deptResult.records.map(r => ({
      name: r.get('name'),
      memberCount: toNumber(r.get('memberCount'))
    }));

    const locations = locResult.records.map(r => ({
      name: r.get('name'),
      userCount: toNumber(r.get('userCount'))
    }));

    res.json({
      success: true,
      data: {
        organization: {
          name: org?.get('name') || 'Organização',
          userCount: org ? toNumber(org.get('userCount')) : 0
        },
        departments,
        locations,
        counts: {
          users: counts ? toNumber(counts.get('users')) : 0,
          departments: counts ? toNumber(counts.get('departments')) : 0,
          organizations: counts ? toNumber(counts.get('organizations')) : 0,
          locations: counts ? toNumber(counts.get('locations')) : 0
        },
        hierarchyDepth: hierarchy ? toNumber(hierarchy.get('maxDepth')) : 0
      }
    });
  } catch (error) {
    logger.error('Error getting structure overview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get structure overview'
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /structure/departments/:name
 * Get department details with members and relationships
 */
router.get('/departments/:name', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  const { name } = req.params;
  
  try {
    // Get department members
    const membersResult = await session.run(`
      MATCH (u:User)-[:MEMBER_OF]->(d:Department {name: $name})
      OPTIONAL MATCH (u)-[:REPORTS_TO]->(m:User)
      RETURN u.name AS name, u.email AS email, u.jobTitle AS jobTitle,
             m.name AS managerName, m.email AS managerEmail
      ORDER BY u.name
    `, { name });

    // Get users with access to this department
    const accessResult = await session.run(`
      MATCH (u:User)-[:HAS_ACCESS_TO]->(d:Department {name: $name})
      WHERE NOT (u)-[:MEMBER_OF]->(d)
      RETURN u.name AS name, u.email AS email, u.jobTitle AS jobTitle
      ORDER BY u.name
    `, { name });

    const members = membersResult.records.map(r => ({
      name: r.get('name'),
      email: r.get('email'),
      jobTitle: r.get('jobTitle'),
      manager: r.get('managerName') ? {
        name: r.get('managerName'),
        email: r.get('managerEmail')
      } : null
    }));

    const accessUsers = accessResult.records.map(r => ({
      name: r.get('name'),
      email: r.get('email'),
      jobTitle: r.get('jobTitle')
    }));

    res.json({
      success: true,
      data: {
        name,
        members,
        accessUsers,
        memberCount: members.length,
        accessCount: accessUsers.length
      }
    });
  } catch (error) {
    logger.error('Error getting department details:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get department details'
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /structure/mermaid
 * Generate Mermaid diagram code for organizational structure
 */
router.get('/mermaid', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    // Get organization
    const orgResult = await session.run(`
      MATCH (o:Organization)
      RETURN o.name AS name
      LIMIT 1
    `);

    // Get departments with member counts
    const deptResult = await session.run(`
      MATCH (d:Department)
      OPTIONAL MATCH (u:User)-[:MEMBER_OF]->(d)
      WITH d, count(u) AS memberCount
      RETURN d.name AS name, memberCount
      ORDER BY memberCount DESC
    `);

    const orgName = orgResult.records[0]?.get('name') || 'Organização';
    const departments = deptResult.records.map(r => ({
      name: r.get('name') as string,
      memberCount: toNumber(r.get('memberCount'))
    }));

    // Generate Mermaid flowchart
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
    
    let mermaid = `flowchart TB\n`;
    mermaid += `  ORG["🏢 ${orgName}"]\n`;
    mermaid += `  style ORG fill:#3b82f6,color:#fff,stroke:#2563eb\n\n`;

    departments.forEach((dept, i) => {
      const id = `DEPT_${sanitize(dept.name)}`;
      mermaid += `  ${id}["📁 ${dept.name}<br/><small>${dept.memberCount} membros</small>"]\n`;
      mermaid += `  ORG --> ${id}\n`;
      
      // Style based on size
      if (dept.memberCount > 5) {
        mermaid += `  style ${id} fill:#10b981,color:#fff,stroke:#059669\n`;
      } else if (dept.memberCount > 0) {
        mermaid += `  style ${id} fill:#6366f1,color:#fff,stroke:#4f46e5\n`;
      } else {
        mermaid += `  style ${id} fill:#94a3b8,color:#fff,stroke:#64748b\n`;
      }
    });

    res.json({
      success: true,
      data: {
        mermaid,
        organization: orgName,
        departmentCount: departments.length
      }
    });
  } catch (error) {
    logger.error('Error generating mermaid diagram:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate diagram'
    });
  } finally {
    await session.close();
  }
});

/**
 * GET /structure/hierarchy
 * Get hierarchical structure for org chart
 */
router.get('/hierarchy', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    // Get top-level managers (users with no manager)
    const topResult = await session.run(`
      MATCH (u:User)
      WHERE NOT (u)-[:REPORTS_TO]->()
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
      RETURN u.name AS name, u.email AS email, u.jobTitle AS jobTitle, d.name AS department
      ORDER BY u.name
    `);

    // Get all reporting relationships
    const reportsResult = await session.run(`
      MATCH (u:User)-[:REPORTS_TO]->(m:User)
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
      RETURN u.name AS name, u.email AS email, u.jobTitle AS jobTitle, 
             d.name AS department, m.email AS managerEmail
      ORDER BY u.name
    `);

    const topManagers = topResult.records.map(r => ({
      name: r.get('name'),
      email: r.get('email'),
      jobTitle: r.get('jobTitle'),
      department: r.get('department')
    }));

    const reports = reportsResult.records.map(r => ({
      name: r.get('name'),
      email: r.get('email'),
      jobTitle: r.get('jobTitle'),
      department: r.get('department'),
      managerEmail: r.get('managerEmail')
    }));

    // Build hierarchy tree
    const buildTree = (managerEmail: string | null): any[] => {
      if (managerEmail === null) {
        return topManagers.map(m => ({
          ...m,
          subordinates: buildTree(m.email)
        }));
      }
      return reports
        .filter(r => r.managerEmail === managerEmail)
        .map(r => ({
          name: r.name,
          email: r.email,
          jobTitle: r.jobTitle,
          department: r.department,
          subordinates: buildTree(r.email)
        }));
    };

    const hierarchy = buildTree(null);

    res.json({
      success: true,
      data: {
        hierarchy,
        topManagerCount: topManagers.length,
        totalReports: reports.length
      }
    });
  } catch (error) {
    logger.error('Error getting hierarchy:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hierarchy'
    });
  } finally {
    await session.close();
  }
});

export default router;
