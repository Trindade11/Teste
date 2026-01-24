import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { parse } from 'csv-parse/sync';
import neo4j from 'neo4j-driver';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const router = Router();

// Configure multer for file upload (memory storage for CSV)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Apply auth middleware
router.use(authenticate);
router.use(requireAdmin);

interface CsvRow {
  name: string;
  company: string;
  jobTitle: string;
  department: string;
  access: string;
  relationshipType: string;
  accessTypes: string;
  location?: string;
  email: string;
  status: string;
  role: 'admin' | 'user';
  managerEmail?: string;
}

const REQUIRED_CSV_COLUMNS: Array<keyof CsvRow> = [
  'name',
  'company',
  'jobTitle',
  'department',
  'access',
  'relationshipType',
  'accessTypes',
  'email',
  'status',
  'role',
];

const normalizeHeaderStrict = (raw: string): string => raw.replace(/^\uFEFF/, '').trim();

interface IngestResult {
  success: boolean;
  summary: {
    totalRows: number;
    usersCreated: number;
    usersUpdated: number;
    departmentsCreated: number;
    locationsCreated: number;
    organizationsCreated: number;
    relationshipsCreated: number;
    reportsToCreated: number;
    errors: Array<{ row: number; email: string; error: string }>;
  };
  users: Array<{
    email: string;
    name: string;
    action: 'created' | 'updated';
    department: string;
    accessAreas: string[];
    accessTypes: string[];
  }>;
}

/**
 * GET /admin/ingest/status
 * Get current database status (counts of nodes and relationships)
 */
router.get('/status', async (_req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    const toNumber = (value: unknown): number => {
      if (neo4j.isInt(value)) return value.toNumber();
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return Number(value);
      if (value && typeof value === 'object' && 'low' in (value as any)) return (value as any).low;
      return Number(value);
    };

    // Get node counts (avoid CALL subqueries for compatibility)
    const userCountResult = await session.run('MATCH (u:User) RETURN count(u) AS count');
    const deptCountResult = await session.run('MATCH (d:Department) RETURN count(d) AS count');
    const orgCountResult = await session.run('MATCH (o:Organization) RETURN count(o) AS count');
    const locCountResult = await session.run('MATCH (l:Location) RETURN count(l) AS count');

    // Get relationship counts
    const memberOfCountResult = await session.run('MATCH ()-[r:MEMBER_OF]->() RETURN count(r) AS count');
    const hasAccessToCountResult = await session.run('MATCH ()-[r:HAS_ACCESS_TO]->() RETURN count(r) AS count');
    const belongsToCountResult = await session.run('MATCH ()-[r:BELONGS_TO]->() RETURN count(r) AS count');
    const worksAtCountResult = await session.run('MATCH ()-[r:WORKS_AT]->() RETURN count(r) AS count');
    const reportsToCountResult = await session.run('MATCH ()-[r:REPORTS_TO]->() RETURN count(r) AS count');

    // Get sample users
    const sampleUsersResult = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
      OPTIONAL MATCH (u)-[:BELONGS_TO]->(o:Organization)
      RETURN u.email AS email, u.name AS name, u.status AS status, 
             d.name AS department, o.name AS organization,
             u.accessTypes AS accessTypes
      ORDER BY u.name
      LIMIT 10
    `);

    const nodeCounts: Record<string, number> = {
      User: toNumber(userCountResult.records[0].get('count')),
      Department: toNumber(deptCountResult.records[0].get('count')),
      Organization: toNumber(orgCountResult.records[0].get('count')),
      Location: toNumber(locCountResult.records[0].get('count')),
    };

    const relationshipCounts: Record<string, number> = {
      MEMBER_OF: toNumber(memberOfCountResult.records[0].get('count')),
      HAS_ACCESS_TO: toNumber(hasAccessToCountResult.records[0].get('count')),
      BELONGS_TO: toNumber(belongsToCountResult.records[0].get('count')),
      WORKS_AT: toNumber(worksAtCountResult.records[0].get('count')),
      REPORTS_TO: toNumber(reportsToCountResult.records[0].get('count')),
    };

    const sampleUsers = sampleUsersResult.records.map((r) => ({
      email: r.get('email'),
      name: r.get('name'),
      status: r.get('status'),
      department: r.get('department'),
      organization: r.get('organization'),
      accessTypes: r.get('accessTypes') || [],
    }));

    res.json({
      success: true,
      nodeCounts,
      relationshipCounts,
      sampleUsers,
      isEmpty: (nodeCounts['User'] || 0) === 0,
    });
  } catch (error) {
    logger.error('Error getting database status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get database status',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /admin/ingest/orgchart
 * Upload CSV and upsert org chart data into Neo4j
 */
router.post('/orgchart', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const session = neo4jConnection.getSession();
  const result: IngestResult = {
    success: true,
    summary: {
      totalRows: 0,
      usersCreated: 0,
      usersUpdated: 0,
      departmentsCreated: 0,
      locationsCreated: 0,
      organizationsCreated: 0,
      relationshipsCreated: 0,
      reportsToCreated: 0,
      errors: [],
    },
    users: [],
  };

  try {
    // Parse CSV (UTF-8, semicolon delimiter)
    const csvContent = req.file.buffer.toString('utf-8');
    const records: CsvRow[] = parse(csvContent, {
      columns: (header: string[]) => header.map(normalizeHeaderStrict),
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const firstRow = records[0] as unknown as Record<string, unknown> | undefined;
    const missingColumns = REQUIRED_CSV_COLUMNS.filter((c) => !firstRow || !(c in firstRow));
    if (missingColumns.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required CSV columns: ${missingColumns.join(', ')}`,
      });
      return;
    }

    result.summary.totalRows = records.length;
    logger.info(`Ingesting ${records.length} rows from CSV`);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // 1-indexed + header

      const email = (row.email || '').trim().toLowerCase();
      if (!email) {
        result.summary.errors.push({ row: rowNum, email: '', error: 'Missing email' });
        continue;
      }

      const name = (row.name || '').trim();
      const company = (row.company || '').trim();
      const jobRole = (row.jobTitle || '').trim();
      const department = (row.department || '').trim();
      const accessAreasRaw = (row.access || '').trim();
      const relationshipType = (row.relationshipType || '').trim();
      const accessTypesRaw = (row.accessTypes || '').replace(/"/g, '').trim();
      const location = (row.location || '').trim();
      const status = (row.status || '').trim();
      const csvRole = (row.role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
      const managerEmail = (row.managerEmail || '').trim().toLowerCase();

      // Parse arrays (semicolon-separated)
      const accessAreas = accessAreasRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      const accessTypes = accessTypesRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      try {
        // Check if user exists
        const existsResult = await session.run(
          'MATCH (u:User {email: $email}) RETURN u.id AS id, u.passwordHash IS NOT NULL AS hasPassword',
          { email }
        );

        const userExists = existsResult.records.length > 0;
        const action: 'created' | 'updated' = userExists ? 'updated' : 'created';

        // Create default password hash for new users
        const defaultPassword = 'EKB123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Upsert User (MERGE by email, preserve passwordHash and role if exists)
        await session.run(
          `MERGE (u:User {email: $email})
           ON CREATE SET
             u.id = randomUUID(),
             u.name = $name,
             u.company = $company,
             u.jobTitle = $jobRole,
             u.role = $role,
             u.organizationType = 'cvc',
             u.status = $status,
             u.relationshipType = $relationshipType,
             u.accessTypes = $accessTypes,
             u.passwordHash = $passwordHash,
             u.forcePasswordChange = true,
             u.createdAt = datetime(),
             u.updatedAt = datetime()
           ON MATCH SET
             u.name = $name,
             u.company = $company,
             u.jobTitle = $jobRole,
             u.role = CASE WHEN u.role IN ['admin', 'Administrador'] THEN u.role ELSE $role END,
             u.status = $status,
             u.relationshipType = $relationshipType,
             u.accessTypes = $accessTypes,
             u.updatedAt = datetime()
           RETURN u.id AS id`,
          { email, name, company, jobRole, status, relationshipType, accessTypes, role: csvRole, passwordHash }
        );

        if (action === 'created') {
          result.summary.usersCreated++;
        } else {
          result.summary.usersUpdated++;
        }

        // Upsert Organization and create BELONGS_TO
        if (company) {
          const orgResult = await session.run(
            `MERGE (o:Organization {name: $company})
             ON CREATE SET o.createdAt = datetime(), o.updatedAt = datetime()
             WITH o
             MATCH (u:User {email: $email})
             MERGE (u)-[:BELONGS_TO]->(o)
             RETURN o.name AS name`,
            { company, email }
          );
          if (orgResult.records.length > 0) {
            result.summary.organizationsCreated++;
          }
        }

        // Upsert Department (primary) and create MEMBER_OF
        if (department) {
          const deptResult = await session.run(
            `MERGE (d:Department {name: $department})
             ON CREATE SET d.createdAt = datetime(), d.updatedAt = datetime()
             WITH d
             MATCH (u:User {email: $email})
             MERGE (u)-[:MEMBER_OF]->(d)
             RETURN d.name AS name`,
            { department, email }
          );
          if (deptResult.records.length > 0) {
            result.summary.departmentsCreated++;
          }
        }

        // Upsert Location and create WORKS_AT
        if (location) {
          const locResult = await session.run(
            `MERGE (l:Location {name: $location})
             ON CREATE SET l.createdAt = datetime(), l.updatedAt = datetime()
             WITH l
             MATCH (u:User {email: $email})
             MERGE (u)-[:WORKS_AT]->(l)
             RETURN l.name AS name`,
            { location, email }
          );
          if (locResult.records.length > 0) {
            result.summary.locationsCreated++;
          }
        }

        // Clear old HAS_ACCESS_TO and create new ones
        await session.run(
          `MATCH (u:User {email: $email})-[r:HAS_ACCESS_TO]->()
           DELETE r`,
          { email }
        );

        for (const area of accessAreas) {
          await session.run(
            `MERGE (d:Department {name: $area})
             ON CREATE SET d.createdAt = datetime(), d.updatedAt = datetime()
             WITH d
             MATCH (u:User {email: $email})
             MERGE (u)-[:HAS_ACCESS_TO]->(d)`,
            { area, email }
          );
          result.summary.relationshipsCreated++;
        }

        // Create REPORTS_TO relationship (manager hierarchy)
        if (managerEmail) {
          // First, clear any existing REPORTS_TO for this user
          await session.run(
            `MATCH (u:User {email: $email})-[r:REPORTS_TO]->()
             DELETE r`,
            { email }
          );

          // Create new REPORTS_TO relationship
          const reportsToResult = await session.run(
            `MATCH (u:User {email: $email})
             MATCH (m:User {email: $managerEmail})
             MERGE (u)-[:REPORTS_TO]->(m)
             RETURN m.email AS manager`,
            { email, managerEmail }
          );

          if (reportsToResult.records.length > 0) {
            result.summary.reportsToCreated++;
          } else {
            logger.warn(`Manager not found for ${email}: ${managerEmail}`);
          }
        }

        result.users.push({
          email,
          name,
          action,
          department,
          accessAreas,
          accessTypes,
        });
      } catch (rowError) {
        const errorMsg = rowError instanceof Error ? rowError.message : 'Unknown error';
        result.summary.errors.push({ row: rowNum, email, error: errorMsg });
        logger.error(`Error processing row ${rowNum} (${email}):`, rowError);
      }
    }

    logger.info(`Ingestion complete: ${result.summary.usersCreated} created, ${result.summary.usersUpdated} updated, ${result.summary.errors.length} errors`);

    res.json(result);
  } catch (error) {
    logger.error('Ingestion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV',
    });
  } finally {
    await session.close();
  }
});

export default router;
