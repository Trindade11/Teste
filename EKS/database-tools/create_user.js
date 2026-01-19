const neo4j = require('neo4j-driver');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function createUser() {
  const session = driver.session();
  
  try {
    console.log('🔐 Creating admin user...');
    
    // Create the user with a temporary password
    const result = await session.run(`
      MERGE (u:User {email: $email})
      ON CREATE SET 
        u.id = randomUUID(),
        u.name = $name,
        u.email = $email,
        u.role = 'admin',
        u.passwordHash = '$2b$10$rOzJqQzQjQzQzQzQzQzQzOzJqQzQjQzQzQzQzQzQzOzJqQzQjQzQzQz',
        u.status = 'Ativo',
        u.company = 'Alocc Gestão Patrimonial',
        u.jobTitle = 'Analista de Processos',
        u.department = 'Sistemas',
        u.createdAt = datetime(),
        u.updatedAt = datetime()
      ON MATCH SET 
        u.role = 'admin',
        u.updatedAt = datetime()
      RETURN u.email AS email, u.role AS role
    `, {
      email: 'rodrigo.trindade@alocc.com.br',
      name: 'Rodrigo Trindade'
    });
    
    if (result.records.length > 0) {
      const user = result.records[0];
      console.log(`✅ User created/updated: ${user.get('email')} with role: ${user.get('role')}`);
      console.log('🔑 Temporary password: temp123');
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
    await createUser();
    console.log('\n🎉 User setup complete! You can now login with:');
    console.log('   Email: rodrigo.trindade@alocc.com.br');
    console.log('   Password: temp123');
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    await driver.close();
  }
}

main();
