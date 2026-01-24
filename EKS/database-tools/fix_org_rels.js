const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function fixOrgRels() {
  const session = driver.session();
  try {
    console.log('🔗 Connecting Organization to Departments...');
    
    const result = await session.run(`
      MATCH (o:Organization {name: 'Aurora Corretora'})
      MATCH (d:Department)
      MERGE (o)-[:HAS_DEPARTMENT]->(d)
      RETURN o.name, d.name
    `);
    
    console.log(`✅ Connected ${result.records.length} departments to Aurora Corretora:`);
    result.records.forEach(r => {
      console.log(`   - ${r.get('d.name')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

fixOrgRels();
