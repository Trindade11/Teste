const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function debugCarlosLogin() {
  const session = driver.session();
  
  try {
    console.log('🔍 Debugando Login do Carlos Silva...\n');

    // 1. Verificar dados exatos do usuário
    console.log('1️⃣ Verificando dados completos do usuário...');
    const userResult = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.email AS email,
             u.name AS name,
             u.passwordHash AS passwordHash,
             u.forcePasswordChange AS forcePasswordChange,
             u.role AS role,
             u.createdAt AS createdAt
    `);

    if (userResult.records.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = userResult.records[0];
    const passwordHash = user.get('passwordHash');
    
    console.log('📊 Dados Completos:');
    console.log(`   Email: "${user.get('email')}"`);
    console.log(`   Nome: "${user.get('name')}"`);
    console.log(`   Role: "${user.get('role')}"`);
    console.log(`   PasswordHash: ${passwordHash ? passwordHash.substring(0, 30) + '...' : 'NULL'}`);
    console.log(`   ForcePasswordChange: ${user.get('forcePasswordChange')}`);
    console.log(`   CreatedAt: ${user.get('createdAt')}`);

    // 2. Testar comparação de senha em detalhes
    if (passwordHash) {
      console.log('\n2️⃣ Testando comparação de senha...');
      const testPassword = 'EKB123';
      
      console.log(`   Senha teste: "${testPassword}"`);
      console.log(`   Hash armazenado: ${passwordHash.substring(0, 30)}...`);
      
      try {
        const isValid = await bcrypt.compare(testPassword, passwordHash);
        console.log(`   ✅ bcrypt.compare resultado: ${isValid}`);
        
        // Testar criando um novo hash para comparar
        console.log('\n3️⃣ Testando criação de novo hash...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`   Novo hash: ${newHash.substring(0, 30)}...`);
        
        const isNewValid = await bcrypt.compare(testPassword, newHash);
        console.log(`   ✅ Novo hash válido: ${isNewValid}`);
        
        // Comparar hashes
        console.log('\n4️⃣ Comparando hashes...');
        console.log(`   Hash original: ${passwordHash.substring(0, 30)}...`);
        console.log(`   Hash novo: ${newHash.substring(0, 30)}...`);
        console.log(`   São iguais: ${passwordHash === newHash}`);
        
      } catch (bcryptError) {
        console.log(`   ❌ Erro no bcrypt: ${bcryptError.message}`);
      }
    } else {
      console.log('❌ PasswordHash é NULL!');
    }

    // 5. Simular exatamente o que o AuthService faz
    console.log('\n5️⃣ Simulando AuthService.login()...');
    
    // Buscar usuário como o AuthService faz
    const authServiceResult = await session.run(
      `MATCH (u:User {email: $email})
       RETURN u.id as id, u.email as email, u.passwordHash as passwordHash, 
              u.role as role, u.organizationType as organizationType`,
      { email: 'carlos.silva@aurora.com' }
    );

    if (authServiceResult.records.length === 0) {
      console.log('❌ AuthService não encontrou usuário!');
      return;
    }

    const authUser = authServiceResult.records[0].toObject();
    console.log('📊 Dados que o AuthService recebe:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   PasswordHash: ${authUser.passwordHash ? 'EXISTS' : 'NULL'}`);
    console.log(`   Role: ${authUser.role}`);

    // Verificar senha como o AuthService faz
    if (!authUser.passwordHash) {
      console.log('❌ AuthService detectou passwordHash NULL!');
    } else {
      try {
        const authIsValid = await bcrypt.compare('EKB123', authUser.passwordHash);
        console.log(`   ✅ AuthService bcrypt.compare: ${authIsValid}`);
        
        if (!authIsValid) {
          console.log('❌ POR ISSO O LOGIN FALHA! Senha inválida para o AuthService');
          
          // Tentar descobrir qual seria a senha correta
          console.log('\n6️⃣ Tentando descobrir a senha correta...');
          const possiblePasswords = ['EKB123', 'aurora123', 'carlos123', 'admin123', 'password'];
          
          for (const pwd of possiblePasswords) {
            try {
              const testResult = await bcrypt.compare(pwd, authUser.passwordHash);
              if (testResult) {
                console.log(`   🎯 SENHA CORRETA ENCONTRADA: "${pwd}"`);
                break;
              } else {
                console.log(`   ❌ "${pwd}" não é válida`);
              }
            } catch (e) {
              console.log(`   ❌ Erro ao testar "${pwd}": ${e.message}`);
            }
          }
        }
      } catch (compareError) {
        console.log(`❌ Erro no bcrypt.compare do AuthService: ${compareError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugCarlosLogin();
