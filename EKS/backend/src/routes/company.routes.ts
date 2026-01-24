import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

interface CompanyProfile {
  name: string;
  description: string;
  industry?: string;
  size?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  updatedBy: string;
  updatedAt: string;
}

/**
 * GET /company/profile
 * Get company profile/description from Organization node
 */
router.get('/profile', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    const result = await session.run(`
      MATCH (o:Organization)
      OPTIONAL MATCH (o)-[:HAS_MISSION]->(m:Mission)
      OPTIONAL MATCH (o)-[:HAS_VISION]->(v:Vision)
      OPTIONAL MATCH (o)-[:HAS_VALUE]->(val:Value)
      RETURN o.name AS name,
             o.description AS description,
             o.industry AS industry,
             o.size AS size,
             m.text AS mission,
             v.text AS vision,
             collect(DISTINCT val.name) AS values,
             o.updatedBy AS updatedBy,
             o.updatedAt AS updatedAt
      ORDER BY o.updatedAt DESC
      LIMIT 1
    `);

    if (result.records.length === 0) {
      // Se não encontrar Organization com descrição, buscar apenas o nome
      const orgResult = await session.run(`
        MATCH (o:Organization)
        RETURN o.name AS name
        LIMIT 1
      `);
      
      if (orgResult.records.length > 0) {
        res.json({
          success: true,
          data: {
            name: orgResult.records[0].get('name'),
            description: '',
            industry: '',
            size: '',
            mission: '',
            vision: '',
            values: [],
          },
        });
        return;
      }
      
      res.json({
        success: true,
        data: null,
      });
      return;
    }

    const record = result.records[0];
    const profile: CompanyProfile = {
      name: record.get('name'),
      description: record.get('description'),
      industry: record.get('industry'),
      size: record.get('size'),
      mission: record.get('mission'),
      vision: record.get('vision'),
      values: record.get('values').filter((v: string) => v),
      updatedBy: record.get('updatedBy'),
      updatedAt: record.get('updatedAt'),
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error getting company profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get company profile',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /company/profile
 * Update Organization profile with description, mission, vision, values (admin only)
 */
router.post('/profile', requireAdmin, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    const { name, description, industry, size, mission, vision, values } = req.body;
    const userEmail = (req as any).user?.email;

    if (!description) {
      res.status(400).json({
        success: false,
        error: 'Description is required',
      });
      return;
    }

    // Find or create Organization node
    let orgName = name;
    if (!orgName) {
      // Se não forneceu nome, buscar o primeiro Organization
      const orgResult = await session.run(`
        MATCH (o:Organization)
        RETURN o.name AS name
        LIMIT 1
      `);
      if (orgResult.records.length > 0) {
        orgName = orgResult.records[0].get('name');
      } else {
        res.status(400).json({
          success: false,
          error: 'No organization found. Please run data ingestion first.',
        });
        return;
      }
    }

    // Delete old Mission, Vision, Values
    await session.run(`
      MATCH (o:Organization {name: $name})
      OPTIONAL MATCH (o)-[:HAS_MISSION]->(m:Mission)
      OPTIONAL MATCH (o)-[:HAS_VISION]->(v:Vision)
      OPTIONAL MATCH (o)-[:HAS_VALUE]->(val:Value)
      DETACH DELETE m, v, val
    `, { name: orgName });

    // Update Organization node with new properties
    await session.run(`
      MERGE (o:Organization {name: $name})
      SET o.description = $description,
          o.industry = $industry,
          o.size = $size,
          o.updatedBy = $updatedBy,
          o.updatedAt = datetime().epochMillis
    `, {
      name: orgName,
      description,
      industry: industry || null,
      size: size || null,
      updatedBy: userEmail,
    });

    // Create Mission node if provided
    if (mission) {
      await session.run(`
        MATCH (o:Organization {name: $name})
        CREATE (m:Mission {
          id: randomUUID(),
          name: 'Missão',
          text: $mission,
          createdAt: datetime().epochMillis,
          createdBy: $createdBy
        })
        CREATE (o)-[:HAS_MISSION]->(m)
      `, { name: orgName, mission, createdBy: userEmail });
    }

    // Create Vision node if provided
    if (vision) {
      await session.run(`
        MATCH (o:Organization {name: $name})
        CREATE (v:Vision {
          id: randomUUID(),
          name: 'Visão',
          text: $vision,
          createdAt: datetime().epochMillis,
          createdBy: $createdBy
        })
        CREATE (o)-[:HAS_VISION]->(v)
      `, { name: orgName, vision, createdBy: userEmail });
    }

    // Create Value nodes if provided
    if (values && Array.isArray(values) && values.length > 0) {
      for (let i = 0; i < values.length; i++) {
        const valueName = values[i];
        if (valueName && valueName.trim()) {
          await session.run(`
            MATCH (o:Organization {name: $name})
            CREATE (val:Value {
              id: randomUUID(),
              name: $valueName,
              order: $order,
              createdAt: datetime().epochMillis,
              createdBy: $createdBy
            })
            CREATE (o)-[:HAS_VALUE]->(val)
          `, { name: orgName, valueName: valueName.trim(), order: i + 1, createdBy: userEmail });
        }
      }
    }

    // Fetch the complete profile
    const result = await session.run(`
      MATCH (o:Organization {name: $name})
      OPTIONAL MATCH (o)-[:HAS_MISSION]->(m:Mission)
      OPTIONAL MATCH (o)-[:HAS_VISION]->(v:Vision)
      OPTIONAL MATCH (o)-[:HAS_VALUE]->(val:Value)
      RETURN o.name AS name,
             o.description AS description,
             o.industry AS industry,
             o.size AS size,
             m.text AS mission,
             v.text AS vision,
             collect(DISTINCT val.name) AS values,
             o.updatedBy AS updatedBy,
             o.updatedAt AS updatedAt
    `, { name: orgName });

    const record = result.records[0];
    const profile: CompanyProfile = {
      name: record.get('name'),
      description: record.get('description'),
      industry: record.get('industry'),
      size: record.get('size'),
      mission: record.get('mission'),
      vision: record.get('vision'),
      values: record.get('values').filter((v: string) => v),
      updatedBy: record.get('updatedBy'),
      updatedAt: record.get('updatedAt'),
    };

    logger.info(`Organization profile updated by ${userEmail}`);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error updating organization profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization profile',
    });
  } finally {
    await session.close();
  }
});

export default router;
