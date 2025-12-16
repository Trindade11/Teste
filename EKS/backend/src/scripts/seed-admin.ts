import { authService } from '../services/AuthService';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Seed initial admin user (CoCreate Semantic Curator)
 */
async function seedAdmin() {
  try {
    logger.info('🌱 Starting admin seed...');

    // Connect to Neo4j
    await neo4jConnection.connect();

    const session = neo4jConnection.getSession();

    // Check if admin already exists
    const existingAdmin = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email: 'admin@cocreateai.com.br' }
    );

    let adminId: string;

    if (existingAdmin.records.length > 0) {
      logger.warn('⚠️  Admin user already exists. Ensuring organization relationship.');
      adminId = existingAdmin.records[0].get('u').properties.id as string;
    } else {
      // Create global CoCreate admin (Semantic Curator with full access)
      const admin = await authService.createUser({
        name: 'Admin CoCreate',
        email: 'admin@cocreateai.com.br',
        password: '1234', // Simple password for development
        role: 'admin',
        organizationType: 'cocreate',
        company: 'CoCreateAI',
      });

      adminId = admin.id;

      logger.info('✅ Admin user created successfully!');
      logger.info(`📧 Email: ${admin.email}`);
      logger.info(`🔑 Password: 1234`);
      logger.warn('⚠️  IMPORTANT: Change password on first login!');
    }

    // Ensure Organization node and BELONGS_TO relationship for the admin
    await session.run(
      `MATCH (u:User {id: $adminId})
       MERGE (o:Organization { name: $company })
       ON CREATE SET
         o.organizationType = $organizationType,
         o.createdAt = datetime($createdAt)
       MERGE (u)-[:BELONGS_TO]->(o)`,
      {
        adminId,
        company: 'CoCreateAI',
        organizationType: 'cocreate',
        createdAt: new Date().toISOString(),
      }
    );

    await session.close();

  } catch (error) {
    logger.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await neo4jConnection.disconnect();
    process.exit(0);
  }
}

// Run seed
seedAdmin();
