const neo4j = require('neo4j-driver');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkDatabaseStatus() {
  const session = driver.session();
  
  try {
    console.log('🔍 Verificando estado atual do banco de dados...');
    
    // Contar nós Person
    const personCount = await session.run('MATCH (p:Person) RETURN count(p) AS count');
    console.log('👥 Total de Person nodes:', personCount.records[0].get('count'));
    
    // Verificar usuário Aurora
    const auroraUser = await session.run('MATCH (p:Person {email: $email}) RETURN p.name AS name, p.role AS role', {
      email: 'usuario040@aurora.example'
    });
    
    if (auroraUser.records.length > 0) {
      console.log('✅ Usuário Aurora encontrado:', auroraUser.records[0].get('name'), '- Role:', auroraUser.records[0].get('role'));
    } else {
      console.log('❌ Usuário Aurora não encontrado');
    }
    
    // Verificar se caracteres especiais estão corretos
    const specialChars = await session.run(`
      MATCH (p:Person) 
      WHERE p.jobTitle CONTAINS 'Execução' OR p.jobTitle CONTAINS 'Finanças' OR p.jobTitle CONTAINS 'Portfólio'
      RETURN count(p) AS count
    `);
    console.log('🔧 Registros com caracteres especiais corretos:', specialChars.records[0].get('count'));
    
    // Verificar registros com caracteres corrompidos
    const corruptedChars = await session.run(`
      MATCH (p:Person) 
      WHERE p.jobTitle CONTAINS 'Execuo' OR p.jobTitle CONTAINS 'Finanas' OR p.jobTitle CONTAINS 'Portiflio'
      RETURN count(p) AS count
    `);
    console.log('⚠️ Registros com caracteres corrompidos:', corruptedChars.records[0].get('count'));
    
    // Amostra de dados
    const sample = await session.run('MATCH (p:Person) RETURN p.name AS name, p.email AS email, p.jobTitle AS jobTitle LIMIT 5');
    console.log('📊 Amostra de dados:');
    sample.records.forEach((record, i) => {
      console.log(`  ${i+1}. ${record.get('name')} - ${record.get('email')} - ${record.get('jobTitle')}`);
    });
    
    // Verificar relacionamentos
    const relationships = await session.run('MATCH ()-[r:REPORTS_TO]->() RETURN count(r) AS count');
    console.log('🔗 Total de relacionamentos REPORTS_TO:', relationships.records[0].get('count'));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkDatabaseStatus();
