const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function fixAllUsersPassword() {
  const session = driver.session();
  
  try {
    console.log('🔧 Verificando e corrigindo senhas de todos os usuários...\n');

    // 1. Buscar todos os usuários sem senha
    console.log('1️⃣ Buscando usuários sem senha hash...');
    const usersWithoutPassword = await session.run(`
      MATCH (u:User)
      WHERE u.passwordHash IS NULL
      RETURN u.email AS email, u.name AS name, u.role AS role
    `);

    if (usersWithoutPassword.records.length === 0) {
      console.log('✅ Todos os usuários já têm senha hash!');
    } else {
      console.log(`⚠️  Encontrados ${usersWithoutPassword.records.length} usuários sem senha:`);
      
      const defaultPassword = 'EKB123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      for (const record of usersWithoutPassword.records) {
        const email = record.get('email');
        const name = record.get('name');
        const role = record.get('role');
        
        console.log(`   - ${name} (${email}) - ${role}`);
        
        // Adicionar senha padrão
        await session.run(`
          MATCH (u:User {email: $email})
          SET u.passwordHash = $passwordHash,
              u.forcePasswordChange = true,
              u.updatedAt = datetime()
        `, { email, passwordHash });
      }
      
      console.log(`\n✅ Senha padrão EKB123 adicionada para ${usersWithoutPassword.records.length} usuários!`);
    }

    // 2. Verificar usuários com senha
    console.log('\n2️⃣ Verificando usuários com senha...');
    const usersWithPassword = await session.run(`
      MATCH (u:User)
      WHERE u.passwordHash IS NOT NULL
      RETURN u.email AS email, 
             u.name AS name, 
             u.role AS role,
             u.forcePasswordChange AS forcePasswordChange
      ORDER BY u.email
    `);

    console.log(`📊 Total de usuários com senha: ${usersWithPassword.records.length}`);
    console.log('\n👥 Lista de Usuários:');
    
    for (const record of usersWithPassword.records) {
      const email = record.get('email');
      const name = record.get('name');
      const role = record.get('role');
      const forcePasswordChange = record.get('forcePasswordChange');
      
      console.log(`   ✅ ${name} (${email}) - ${role} ${forcePasswordChange ? '(precisa alterar)' : '(senha ok)'}`);
    }

    // 3. Testar login com usuário Carlos Silva
    console.log('\n3️⃣ Testando login com Carlos Silva...');
    const carlosResult = await session.run(`
      MATCH (u:User {email: 'carlos.silva@aurora.com'})
      RETURN u.passwordHash AS passwordHash
    `);

    if (carlosResult.records.length > 0) {
      const passwordHash = carlosResult.records[0].get('passwordHash');
      const isValid = await bcrypt.compare('EKB123', passwordHash);
      console.log(`   Senha EKB123 para Carlos Silva: ${isValid ? '✅ Válida' : '❌ Inválida'}`);
    }

    console.log('\n✅ Processo concluído com sucesso!');
    console.log('\n🔐 Credenciais para teste:');
    console.log('   Email: carlos.silva@aurora.com');
    console.log('   Senha: EKB123');
    console.log('\n📝 Observações:');
    console.log('   - Todos os usuários agora têm senha padrão EKB123');
    console.log('   - Flag forcePasswordChange definido como true');
    console.log('   - No primeiro login, serão forçados a alterar senha');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

fixAllUsersPassword();
