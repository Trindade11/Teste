const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkCarlosSilva() {
  const session = driver.session();
  
  try {
    console.log('🔍 Verificando usuário Carlos Silva...\n');

    // 1. Verificar se usuário existe
    console.log('1️⃣ Buscando usuário carlos.silva@aurora.com...');
    const userResult = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.email AS email,
             u.name AS name,
             u.passwordHash IS NOT NULL AS hasPassword,
             u.passwordHash AS passwordHash,
             u.forcePasswordChange AS forcePasswordChange,
             u.role AS role
    `);

    if (userResult.records.length === 0) {
      console.log('❌ Usuário carlos.silva@aurora.com não encontrado!');
      
      // Criar usuário Carlos Silva
      console.log('\n🔧 Criando usuário Carlos Silva...');
      const bcrypt = require('bcryptjs');
      const defaultPassword = 'EKB123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await session.run(`
        MERGE (u:User {email: 'carlos.silva@aurora.com'})
        SET u.id = randomUUID(),
            u.name = 'Carlos Silva',
            u.company = 'Aurora Corretora',
            u.jobTitle = 'Administrador',
            u.role = 'admin',
            u.organizationType = 'cvc',
            u.status = 'active',
            u.relationshipType = 'employee',
            u.accessTypes = ['admin', 'read', 'write'],
            u.passwordHash = $passwordHash,
            u.forcePasswordChange = true,
            u.createdAt = datetime(),
            u.updatedAt = datetime()
      `, { passwordHash });

      console.log('✅ Usuário Carlos Silva criado com senha padrão EKB123');
      
    } else {
      const user = userResult.records[0];
      console.log('📊 Dados do Usuário:');
      console.log(`   Email: ${user.get('email')}`);
      console.log(`   Nome: ${user.get('name')}`);
      console.log(`   Role: ${user.get('role')}`);
      console.log(`   Tem Senha: ${user.get('hasPassword') ? '✅' : '❌'}`);
      console.log(`   Precisa Alterar Senha: ${user.get('forcePasswordChange') ? '✅' : '❌'}`);
      
      if (!user.get('hasPassword')) {
        console.log('❌ Usuário não tem senha hash!');
        
        // Adicionar senha padrão
        console.log('\n🔧 Adicionando senha padrão...');
        const bcrypt = require('bcryptjs');
        const defaultPassword = 'EKB123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await session.run(`
          MATCH (u:User {email: 'carlos.silva@aurora.com'})
          SET u.passwordHash = $passwordHash,
              u.forcePasswordChange = true,
              u.updatedAt = datetime()
        `, { passwordHash });

        console.log('✅ Senha padrão EKB123 adicionada!');
      } else {
        console.log(`   PasswordHash: ${user.get('passwordHash')?.substring(0, 20)}...`);
      }
    }

    // 2. Verificar se senha funciona
    console.log('\n2️⃣ Testando senha EKB123...');
    const bcrypt = require('bcryptjs');
    const testResult = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.passwordHash AS passwordHash
    `);

    if (testResult.records.length > 0) {
      const passwordHash = testResult.records[0].get('passwordHash');
      if (passwordHash) {
        const isValid = await bcrypt.compare('EKB123', passwordHash);
        console.log(`   Senha EKB123 é válida: ${isValid ? '✅' : '❌'}`);
      } else {
        console.log('❌ PasswordHash é null!');
      }
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n🔐 Credenciais para login:');
    console.log('   Email: carlos.silva@aurora.com');
    console.log('   Senha: EKB123');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkCarlosSilva();
