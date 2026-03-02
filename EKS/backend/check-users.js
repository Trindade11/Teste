require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkUsers() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });
  
  try {
    console.log('🔍 Verificando usuários no sistema...\n');
    
    const result = await session.run(`
      MATCH (u:User)
      RETURN u.email AS email, u.name AS name, u.role AS role, u.password AS hasPassword
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${result.records.length} usuários:\n`);
    
    if (result.records.length === 0) {
      console.log('❌ Nenhum usuário encontrado no sistema!');
      console.log('📝 Você precisa criar um usuário primeiro.');
    } else {
      result.records.forEach((record, index) => {
        console.log(`--- Usuário ${index + 1} ---`);
        console.log('Email:', record.get('email'));
        console.log('Nome:', record.get('name'));
        console.log('Role:', record.get('role'));
        console.log('Tem senha:', !!record.get('hasPassword'));
        console.log('');
      });
    }
    
    // Verificar se há usuário admin padrão
    const adminResult = await session.run(`
      MATCH (u:User {role: 'admin'})
      RETURN u.email AS email, u.name AS name
      LIMIT 1
    `);
    
    if (adminResult.records.length > 0) {
      const admin = adminResult.records[0];
      console.log('👑 Usuário admin encontrado:');
      console.log('Email:', admin.get('email'));
      console.log('Nome:', admin.get('name'));
      console.log('\n💡 Use este email para fazer login no frontend.');
    } else {
      console.log('⚠️ Nenhum usuário admin encontrado.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkUsers();
