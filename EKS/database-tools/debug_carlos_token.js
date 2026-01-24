const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function debugCarlosToken() {
  const session = driver.session();
  
  try {
    console.log('🔍 Verificando dados do Carlos Silva...\n');

    // 1. Buscar dados completos do Carlos
    console.log('1️⃣ Dados no Neo4j:');
    const result = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.id AS userId, u.email AS email, u.passwordHash AS passwordHash, 
             u.forcePasswordChange AS forcePasswordChange, u.role AS role
    `);

    if (result.records.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const record = result.records[0];
    const userData = {
      userId: record.get('userId'),
      email: record.get('email'),
      passwordHash: record.get('passwordHash'),
      forcePasswordChange: record.get('forcePasswordChange'),
      role: record.get('role')
    };

    console.log('   Dados do usuário:');
    console.log(`   - ID: ${userData.userId}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Role: ${userData.role}`);
    console.log(`   - ForcePasswordChange: ${userData.forcePasswordChange}`);
    console.log(`   - Tem passwordHash: ${!!userData.passwordHash}`);

    // 2. Testar senha EKB123
    console.log('\n2️⃣ Testando senha EKB123:');
    if (userData.passwordHash) {
      const isValid = await bcrypt.compare('EKB123', userData.passwordHash);
      console.log(`   ✅ Senha EKB123 válida: ${isValid}`);
    } else {
      console.log('   ❌ Sem passwordHash para testar');
    }

    // 3. Simular geração de token (como o AuthService faria)
    console.log('\n3️⃣ Simulação de token JWT:');
    const jwt = require('jsonwebtoken');
    
    const payload = {
      userId: userData.userId,
      email: userData.email,
      role: userData.role,
      organizationType: 'cvc' // default do bootstrap
    };

    console.log('   Payload que seria gerado:');
    console.log(JSON.stringify(payload, null, 2));

    // 4. Verificar se o frontend está usando o token certo
    console.log('\n4️⃣ Verificação de token no frontend:');
    console.log('   No console do navegador, execute:');
    console.log('   localStorage.getItem("accessToken")');
    console.log('   localStorage.getItem("refreshToken")');
    console.log('   E verifique se não estão nulos/vazios');

    // 5. Verificar se o token está expirado
    console.log('\n5️⃣ Se você tiver um token, pode testar aqui:');
    console.log('   Copie o token do localStorage e cole aqui para verificar');
    console.log('   (ou execute no console do navegador):');
    console.log(`
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', payload);
          console.log('Token expirado?', Date.now() > payload.exp * 1000);
        } catch (e) {
          console.log('Token inválido:', e);
        }
      }
    `);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugCarlosToken();
