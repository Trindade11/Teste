const neo4j = require('neo4j-driver');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔌 Testing Neo4j connection...');
    console.log('URI:', process.env.NEO4J_URI);
    console.log('Username:', process.env.NEO4J_USERNAME);
    
    const driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
    
    const session = driver.session();
    
    // Test connection
    const result = await session.run('RETURN 1 as test');
    console.log('✅ Neo4j connection successful!');
    
    // Check database info
    const dbInfo = await session.run('CALL db.info()');
    console.log('📊 Database:', dbInfo.records[0].get('name'));
    
    // Count nodes
    const nodeCount = await session.run('MATCH (n) RETURN count(n) as count');
    console.log('📦 Total nodes:', nodeCount.records[0].get('count'));
    
    // Check labels
    const labels = await session.run('CALL db.labels() RETURN label');
    console.log('🏷️  Labels:', labels.records.map(r => r.get('label')));
    
    // Sample some nodes
    if (nodeCount.records[0].get('count') > 0) {
      const sampleNodes = await session.run('MATCH (n) RETURN n LIMIT 5');
      console.log('📝 Sample nodes:');
      sampleNodes.records.forEach((record, i) => {
        const node = record.get('n');
        console.log(`  ${i+1}. ${node.labels[0]} - ${node.properties.name || node.properties.email || node.properties.id || 'unnamed'}`);
      });
    }
    
    await session.close();
    await driver.close();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();
