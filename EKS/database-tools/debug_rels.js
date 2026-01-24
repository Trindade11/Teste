const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkDepartments() {
  const session = driver.session();
  try {
    console.log('Checking Departments...');
    const result = await session.run(`
      MATCH (d:Department)
      OPTIONAL MATCH (d)<-[r]-(n)
      RETURN d.name, type(r) as relType, labels(n) as sourceLabels, n.name as sourceName
    `);
    
    result.records.forEach(r => {
      console.log(`Dept: ${r.get('d.name')} <- [${r.get('relType')}] - ${r.get('sourceLabels')} (${r.get('sourceName')})`);
    });
    
    console.log('\nChecking Organization...');
    const orgResult = await session.run(`
      MATCH (o:Organization)
      RETURN o.name
    `);
    orgResult.records.forEach(r => {
      console.log(`Org: ${r.get('o.name')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkDepartments();
