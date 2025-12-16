/**
 * Seed Admin User
 * Creates initial admin user in Neo4j
 */
import { config } from 'dotenv';
import neo4j from 'neo4j-driver';
import bcrypt from 'bcrypt';

config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function seedAdmin() {
  const session = driver.session();
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await session.run(`
      MERGE (u:User {email: $email})
      SET u.name = $name,
          u.password = $password,
          u.role = $role,
          u.company = $company,
          u.created_at = datetime(),
          u.onboarding_completed = false
      RETURN u
    `, {
      email: 'admin@cocreateai.com.br',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      company: 'CoCreateAI'
    });
    
    console.log('✅ Admin user created:', result.records[0].get('u').properties);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedAdmin();
