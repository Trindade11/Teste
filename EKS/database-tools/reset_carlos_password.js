const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function resetCarlosPassword() {
  const session = driver.session();
  
  try {
    console.log('🔧 Resetando senha do Carlos Silva para EKB123...\n');

    // 1. Criar hash correto para EKB123
    console.log('1️⃣ Criando hash para senha EKB123...');
    const correctPassword = 'EKB123';
    const passwordHash = await bcrypt.hash(correctPassword, 10);
    console.log(`   Hash criado: ${passwordHash.substring(0, 30)}...`);

    // 2. Atualizar senha no banco
    console.log('\n2️⃣ Atualizando senha no banco...');
    await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      SET u.passwordHash = $passwordHash,
          u.forcePasswordChange = true,
          u.updatedAt = datetime()
    `, { passwordHash });

    console.log('✅ Senha atualizada com sucesso!');

    // 3. Verificar se funciona
    console.log('\n3️⃣ Testando nova senha...');
    const testResult = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.passwordHash AS passwordHash,
             u.forcePasswordChange AS forcePasswordChange
    `);

    if (testResult.records.length > 0) {
      const record = testResult.records[0];
      const storedHash = record.get('passwordHash');
      const forceChange = record.get('forcePasswordChange');
      
      console.log(`   Hash armazenado: ${storedHash.substring(0, 30)}...`);
      console.log(`   ForcePasswordChange: ${forceChange}`);
      
      // Testar comparação
      const isValid = await bcrypt.compare(correctPassword, storedHash);
      console.log(`   ✅ Senha EKB123 válida: ${isValid}`);
      
      if (isValid) {
        console.log('\n🎉 Senha resetada com sucesso!');
        console.log('\n🔐 Credenciais para login:');
        console.log('   Email: carlos.silva@aurora.com');
        console.log('   Senha: EKB123');
        console.log('\n📋 Próximos passos:');
        console.log('1. Faça login com essas credenciais');
        console.log('2. Será redirecionado para alterar senha');
        console.log('3. Altere para uma senha pessoal');
      } else {
        console.log('❌ Ainda não funciona! Verificando...');
        
        // Debug adicional
        console.log('\n🔍 Debug adicional:');
        console.log(`   Senha testada: "${correctPassword}"`);
        console.log(`   Hash esperado: ${passwordHash.substring(0, 30)}...`);
        console.log(`   Hash no banco: ${storedHash.substring(0, 30)}...`);
        console.log(`   Hashes iguais: ${passwordHash === storedHash}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

resetCarlosPassword();
