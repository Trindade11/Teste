require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkProjects() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });
  
  try {
    console.log('🔍 Buscando TODOS os nós com label Project ou project...\n');
    
    const result = await session.run(`
      MATCH (n)
      WHERE n:Project OR n:project
      RETURN labels(n) AS labels, 
             n.id AS id, 
             n.projectId AS projectId,
             n.name AS name,
             n.status AS status,
             elementId(n) AS elementId
      LIMIT 20
    `);
    
    console.log(`✅ Encontrados ${result.records.length} projetos:\n`);
    
    result.records.forEach((record, index) => {
      console.log(`--- Projeto ${index + 1} ---`);
      console.log('Labels:', record.get('labels'));
      console.log('id:', record.get('id'));
      console.log('projectId:', record.get('projectId'));
      console.log('name:', record.get('name'));
      console.log('status:', record.get('status'));
      console.log('elementId:', record.get('elementId'));
      console.log('');
    });
    
    // Agora testa a query que o backend usa
    console.log('\n🔍 Testando query do backend (linkable-entities)...\n');
    
    const backendResult = await session.run(`
      MATCH (p)
      WHERE (p:Project OR p:project)
        AND (p.status IS NULL OR p.status <> 'archived')
      OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
      OPTIONAL MATCH (p)-[:BELONGS_TO]->(dept:Department)
      RETURN coalesce(p.id, p.projectId, elementId(p)) AS id,
             p.name AS name, 'project' AS type, p.status AS status, 
             dept.name AS department, owner.name AS owner
      ORDER BY p.name
      LIMIT 100
    `);
    
    console.log(`✅ Query do backend retornou ${backendResult.records.length} projetos:\n`);
    
    backendResult.records.forEach((record, index) => {
      console.log(`${index + 1}. ${record.get('name')} (id: ${record.get('id')}, status: ${record.get('status')})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkProjects();
