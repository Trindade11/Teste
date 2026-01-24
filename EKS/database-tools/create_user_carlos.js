const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function createUser() {
  const session = driver.session();
  
  try {
    const email = 'carlos.silva@aurora.com';
    const password = 'aurora123';
    const name = 'Carlos Silva';
    const role = 'admin';

    console.log(`🔐 Creating user ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);
    console.log('🔑 Password hash generated');

    await session.run(
      `MERGE (u:User {email: $email})
       ON CREATE SET
         u.id = randomUUID(),
         u.name = $name,
         u.passwordHash = $passwordHash,
         u.role = $role,
         u.company = 'Aurora Corretora',
         u.jobTitle = 'CEO',
         u.department = 'Diretoria',
         u.organizationType = 'enterprise',
         u.status = 'Ativo',
         u.createdAt = datetime(),
         u.updatedAt = datetime()
       ON MATCH SET
         u.name = $name,
         u.passwordHash = $passwordHash,
         u.role = $role,
         u.company = 'Aurora Corretora',
         u.jobTitle = 'CEO',
         u.department = 'Diretoria',
         u.updatedAt = datetime()
       RETURN u.email AS email, u.role AS role`,
      { email, name, passwordHash, role }
    );

    console.log(`✅ User created/updated: ${email} with role: ${role}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  Please change your password after first login!');
    console.log('');
    console.log('🎉 User setup complete! You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

createUser();
