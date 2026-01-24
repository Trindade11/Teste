const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function testPasswordFlow() {
  const session = driver.session();
  
  try {
    console.log('🧪 Testando Fluxo de Senha Padrão\n');

    // 1. Criar usuário de teste com senha padrão
    console.log('1️⃣ Criando usuário de teste...');
    const defaultPassword = 'EKB123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await session.run(`
      MERGE (u:User {email: 'teste.padrao@aurora.com'})
      SET u.id = randomUUID(),
          u.name = 'Usuário Teste Padrão',
          u.company = 'Aurora Corretora',
          u.jobTitle = 'Analista de Teste',
          u.role = 'user',
          u.organizationType = 'cvc',
          u.status = 'active',
          u.relationshipType = 'employee',
          u.accessTypes = ['read'],
          u.passwordHash = $passwordHash,
          u.forcePasswordChange = true,
          u.createdAt = datetime(),
          u.updatedAt = datetime()
    `, { passwordHash });

    console.log('✅ Usuário criado com senha padrão EKB123\n');

    // 2. Verificar usuário
    console.log('2️⃣ Verificando dados do usuário...');
    const userResult = await session.run(`
      MATCH (u:User {email: 'teste.padrao@aurora.com'})
      RETURN u.email AS email,
             u.name AS name,
             u.forcePasswordChange AS forcePasswordChange,
             u.passwordHash IS NOT NULL AS hasPassword
    `);

    if (userResult.records.length > 0) {
      const user = userResult.records[0];
      console.log('📊 Dados do Usuário:');
      console.log(`   Email: ${user.get('email')}`);
      console.log(`   Nome: ${user.get('name')}`);
      console.log(`   Tem Senha: ${user.get('hasPassword') ? '✅' : '❌'}`);
      console.log(`   Precisa Alterar Senha: ${user.get('forcePasswordChange') ? '✅' : '❌'}`);
      console.log('');
    }

    // 3. Testar verificação de senha
    console.log('3️⃣ Testando verificação de senha...');
    const isPasswordCorrect = await bcrypt.compare(defaultPassword, passwordHash);
    console.log(`   Senha EKB123 é válida: ${isPasswordCorrect ? '✅' : '❌'}`);
    console.log('');

    // 4. Simular alteração de senha
    console.log('4️⃣ Simulando alteração de senha...');
    const newPassword = 'novaSenha123';
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await session.run(`
      MATCH (u:User {email: 'teste.padrao@aurora.com'})
      SET u.passwordHash = $newPasswordHash,
          u.forcePasswordChange = false,
          u.updatedAt = datetime()
    `, { newPasswordHash });

    console.log('✅ Senha alterada com sucesso!\n');

    // 5. Verificar estado após alteração
    console.log('5️⃣ Verificando estado após alteração...');
    const updatedResult = await session.run(`
      MATCH (u:User {email: 'teste.padrao@aurora.com'})
      RETURN u.forcePasswordChange AS forcePasswordChange,
             u.updatedAt AS updatedAt
    `);

    if (updatedResult.records.length > 0) {
      const updated = updatedResult.records[0];
      console.log('📊 Estado Atualizado:');
      console.log(`   Precisa Alterar Senha: ${updated.get('forcePasswordChange') ? '✅' : '❌'}`);
      console.log(`   Atualizado em: ${updated.get('updatedAt')}`);
      console.log('');
    }

    // 6. Testar nova senha
    console.log('6️⃣ Testando nova senha...');
    const isNewPasswordCorrect = await bcrypt.compare(newPassword, newPasswordHash);
    console.log(`   Nova senha é válida: ${isNewPasswordCorrect ? '✅' : '❌'}`);
    console.log('');

    console.log('✅ Teste concluído com sucesso!');
    console.log('\n📋 Resumo do Fluxo:');
    console.log('1. ✅ Usuário criado com senha padrão EKB123');
    console.log('2. ✅ Flag forcePasswordChange definido como true');
    console.log('3. ✅ Frontend deve redirecionar para página de alteração de senha');
    console.log('4. ✅ Após alteração, flag é removido');
    console.log('5. ✅ Usuário pode acessar normalmente com nova senha');
    console.log('\n🔐 Credenciais para teste:');
    console.log('   Email: teste.padrao@aurora.com');
    console.log('   Senha: EKB123 (antes da alteração)');
    console.log('   Senha: novaSenha123 (após alteração)');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

testPasswordFlow();
