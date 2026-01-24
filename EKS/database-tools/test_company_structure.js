const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '../backend/.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function testCompanyStructure() {
  const session = driver.session();
  
  try {
    console.log('🔍 Verificando estrutura da empresa no Neo4j...\n');

    // Check Organization node
    const orgResult = await session.run(`
      MATCH (o:Organization)
      RETURN o.name AS name, 
             o.description AS description,
             o.industry AS industry,
             o.size AS size
    `);

    if (orgResult.records.length > 0) {
      const org = orgResult.records[0];
      console.log('🏢 Organization Node:');
      console.log(`   Nome: ${org.get('name')}`);
      console.log(`   Descrição: ${org.get('description') || '(vazio)'}`);
      console.log(`   Setor: ${org.get('industry') || 'N/A'}`);
      console.log(`   Tamanho: ${org.get('size') || 'N/A'}\n`);
    } else {
      console.log('❌ Nenhum Organization node encontrado\n');
    }

    // Check Mission
    const missionResult = await session.run(`
      MATCH (o:Organization)-[:HAS_MISSION]->(m:Mission)
      RETURN m.name AS name, m.text AS text, m.createdBy AS createdBy
    `);

    if (missionResult.records.length > 0) {
      const mission = missionResult.records[0];
      console.log('🎯 Mission Node:');
      console.log(`   Nome: ${mission.get('name')}`);
      console.log(`   Texto: ${mission.get('text')}`);
      console.log(`   Criado por: ${mission.get('createdBy')}\n`);
    } else {
      console.log('⚠️  Nenhum Mission node encontrado\n');
    }

    // Check Vision
    const visionResult = await session.run(`
      MATCH (o:Organization)-[:HAS_VISION]->(v:Vision)
      RETURN v.name AS name, v.text AS text, v.createdBy AS createdBy
    `);

    if (visionResult.records.length > 0) {
      const vision = visionResult.records[0];
      console.log('🔮 Vision Node:');
      console.log(`   Nome: ${vision.get('name')}`);
      console.log(`   Texto: ${vision.get('text')}`);
      console.log(`   Criado por: ${vision.get('createdBy')}\n`);
    } else {
      console.log('⚠️  Nenhum Vision node encontrado\n');
    }

    // Check Values
    const valuesResult = await session.run(`
      MATCH (o:Organization)-[:HAS_VALUE]->(v:Value)
      RETURN v.name AS name, v.order AS order
      ORDER BY v.order
    `);

    if (valuesResult.records.length > 0) {
      console.log('💎 Value Nodes:');
      valuesResult.records.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.get('name')}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhum Value node encontrado\n');
    }

    // Check relationships
    const relationshipsResult = await session.run(`
      MATCH (o:Organization)
      OPTIONAL MATCH (o)-[r1:HAS_MISSION]->()
      OPTIONAL MATCH (o)-[r2:HAS_VISION]->()
      OPTIONAL MATCH (o)-[r3:HAS_VALUE]->()
      RETURN count(r1) AS missions,
             count(r2) AS visions,
             count(r3) AS values
    `);

    if (relationshipsResult.records.length > 0) {
      const rels = relationshipsResult.records[0];
      console.log('🔗 Relacionamentos:');
      console.log(`   HAS_MISSION: ${rels.get('missions').toNumber()}`);
      console.log(`   HAS_VISION: ${rels.get('visions').toNumber()}`);
      console.log(`   HAS_VALUE: ${rels.get('values').toNumber()}\n`);
    }

    // Visualize complete structure
    console.log('📊 Estrutura Completa (Cypher):');
    const structureResult = await session.run(`
      MATCH (o:Organization)
      OPTIONAL MATCH (o)-[:HAS_MISSION]->(m:Mission)
      OPTIONAL MATCH (o)-[:HAS_VISION]->(v:Vision)
      OPTIONAL MATCH (o)-[:HAS_VALUE]->(val:Value)
      RETURN o, m, v, collect(val) AS values
    `);

    if (structureResult.records.length > 0) {
      console.log('   (:Organization)');
      console.log('     -[:HAS_MISSION]->(:Mission {name: "Missão"})');
      console.log('     -[:HAS_VISION]->(:Vision {name: "Visão"})');
      console.log('     -[:HAS_VALUE]->(:Value) [múltiplos]');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

testCompanyStructure();
