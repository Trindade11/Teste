const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkOnboardingResponse() {
  const session = driver.session();
  
  try {
    console.log('🔍 Verificando OnboardingResponse do usuário 040...\n');
    
    const result = await session.run(`
      MATCH (u:User {email: 'usuario040@aurora.example'})-[:HAS_ONBOARDING_RESPONSE]->(or:OnboardingResponse)
      RETURN or
    `);
    
    if (result.records.length > 0) {
      const or = result.records[0].get('or').properties;
      console.log('✅ OnboardingResponse encontrado!\n');
      console.log('📋 PROPRIEDADES COMPLETAS:');
      console.log('═══════════════════════════════════════════════════════════════');
      
      for (const [key, value] of Object.entries(or)) {
        if (typeof value === 'string' && value.length > 100) {
          console.log(`\n${key}:\n   "${value.substring(0, 200)}..."`);
        } else if (Array.isArray(value)) {
          console.log(`\n${key}: [${value.join(', ')}]`);
        } else {
          console.log(`\n${key}: ${JSON.stringify(value)}`);
        }
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════');
    } else {
      console.log('❌ OnboardingResponse não encontrado');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkOnboardingResponse();
