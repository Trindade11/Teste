const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function cleanupCompanyNodes() {
  const session = driver.session();
  
  try {
    console.log('🧹 Limpando nodes Company antigos...\n');

    // Check if Company nodes exist
    const checkResult = await session.run(`
      MATCH (c:Company)
      RETURN count(c) AS count
    `);

    const companyCount = checkResult.records[0].get('count').toNumber();
    
    if (companyCount === 0) {
      console.log('✅ Nenhum node Company encontrado. Banco já está limpo!\n');
    } else {
      console.log(`⚠️  Encontrados ${companyCount} nodes Company\n`);
      
      // Delete Company nodes and related Mission, Vision, Values
      await session.run(`
        MATCH (c:Company)
        OPTIONAL MATCH (c)-[:HAS_MISSION]->(m:Mission)
        OPTIONAL MATCH (c)-[:HAS_VISION]->(v:Vision)
        OPTIONAL MATCH (c)-[:HAS_VALUE]->(val:Value)
        DETACH DELETE c, m, v, val
      `);

      console.log('✅ Nodes Company removidos com sucesso!\n');
    }

    // Check Organization nodes
    console.log('🔍 Verificando nodes Organization...\n');
    const orgResult = await session.run(`
      MATCH (o:Organization)
      RETURN o.name AS name, 
             o.description AS description,
             exists((o)-[:HAS_MISSION]->()) AS hasMission,
             exists((o)-[:HAS_VISION]->()) AS hasVision,
             exists((o)-[:HAS_VALUE]->()) AS hasValues
    `);

    if (orgResult.records.length === 0) {
      console.log('⚠️  Nenhum node Organization encontrado!');
      console.log('   Execute a ingestão de dados primeiro.\n');
    } else {
      orgResult.records.forEach(record => {
        console.log('📊 Organization:');
        console.log(`   Nome: ${record.get('name')}`);
        console.log(`   Descrição: ${record.get('description') || '(vazio)'}`);
        console.log(`   Tem Missão: ${record.get('hasMission') ? '✅' : '❌'}`);
        console.log(`   Tem Visão: ${record.get('hasVision') ? '✅' : '❌'}`);
        console.log(`   Tem Valores: ${record.get('hasValues') ? '✅' : '❌'}`);
        console.log('');
      });
    }

    console.log('✅ Limpeza concluída!');
    console.log('💡 Agora você pode adicionar a descrição da empresa via frontend.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

cleanupCompanyNodes();
