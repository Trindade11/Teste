require('dotenv').config();
const bcrypt = require('bcryptjs');
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function createPassword() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });
  
  try {
    console.log('🔐 Criando senha para usuário admin...\n');
    
    const email = 'trindade@cocreateai.com.br';
    const password = 'admin123'; // senha simples para testes
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔑 Senha hash gerada:', hashedPassword.substring(0, 20) + '...');
    
    // Atualizar usuário no Neo4j
    const result = await session.run(`
      MATCH (u:User {email: $email})
      SET u.password = $password, u.updatedAt = datetime()
      RETURN u.email AS email, u.name AS name
    `, {
      email,
      password: hashedPassword
    });
    
    if (result.records.length > 0) {
      const user = result.records[0];
      console.log('✅ Senha criada com sucesso!');
      console.log('Email:', user.get('email'));
      console.log('Nome:', user.get('name'));
      console.log('\n🔑 Use estas credenciais para login:');
      console.log('Email:', email);
      console.log('Senha:', password);
    } else {
      console.log('❌ Usuário não encontrado:', email);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

createPassword();
