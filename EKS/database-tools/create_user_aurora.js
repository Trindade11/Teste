const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function createUserAurora() {
  const session = driver.session();
  
  try {
    console.log('🔐 Creating user usuario040@aurora.example...');
    
    // Hash the password "aurora123"
    const passwordHash = await bcrypt.hash('aurora123', 10);
    console.log('🔑 Password hash generated');
    
    // Create the user with proper password hash
    const result = await session.run(`
      MERGE (u:User {email: $email})
      ON CREATE SET 
        u.id = randomUUID(),
        u.name = $name,
        u.email = $email,
        u.role = 'admin',
        u.passwordHash = $passwordHash,
        u.status = 'Ativo',
        u.company = 'Aurora',
        u.jobTitle = 'Admin',
        u.department = 'TI',
        u.organizationType = 'enterprise',
        u.createdAt = datetime(),
        u.updatedAt = datetime()
      ON MATCH SET 
        u.passwordHash = $passwordHash,
        u.role = 'admin',
        u.updatedAt = datetime()
      RETURN u.email AS email, u.role AS role, u.name AS name
    `, {
      email: 'usuario040@aurora.example',
      name: 'Usuario Aurora',
      passwordHash: passwordHash
    });
    
    if (result.records.length > 0) {
      const user = result.records[0];
      console.log(`✅ User created/updated: ${user.get('email')} with role: ${user.get('role')}`);
      console.log(`👤 Name: ${user.get('name')}`);
      console.log('🔑 Password: aurora123');
      console.log('⚠️  Please change your password after first login!');
    } else {
      console.log('❌ Failed to create user');
    }
    
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    await session.close();
  }
}

async function main() {
  try {
    await createUserAurora();
    console.log('\n🎉 User setup complete! You can now login with:');
    console.log('   Email: usuario040@aurora.example');
    console.log('   Password: aurora123');
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    await driver.close();
  }
}

main();
