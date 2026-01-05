const neo4j = require('neo4j-driver');
const uri = 'neo4j+ssc://af132785.databases.neo4j.io';
const user = 'neo4j';
const password = '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A';
(async () => {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session({ database: 'neo4j' });
  try {
    const labels = await session.run('CALL db.labels()');
    const rels = await session.run('CALL db.relationshipTypes()');
    const schema = await session.run('CALL db.schema.visualization()');
    console.log('LABELS', labels.records.map(r => r.get(0)));
    console.log('RELS', rels.records.map(r => r.get(0)));
    console.log('SCHEMA NODES', schema.records[0].get('nodes').map(n => n.properties.name));
    console.log('SCHEMA RELS', schema.records[0].get('relationships').map(r => r.type));
  } finally {
    await session.close();
    await driver.close();
  }
})();
