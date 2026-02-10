const neo4j = require('neo4j-driver');
require('dotenv').config();

function toNumber(value) {
  if (neo4j.isInt && neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  if (value && typeof value === 'object' && 'low' in value) return value.low;
  return Number(value);
}

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
    const totalNodes = toNumber(nodeCount.records[0].get('count'));
    console.log('📦 Total nodes:', totalNodes);

    // Count relationships
    const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
    const totalRels = toNumber(relCount.records[0].get('count'));
    console.log('🧷 Total relationships:', totalRels);

    // Density metrics
    if (totalNodes > 0) {
      console.log('📐 Relationships per node (R/N):', (totalRels / totalNodes).toFixed(4));
      console.log('📐 Avg total degree (2R/N):', ((2 * totalRels) / totalNodes).toFixed(4));
    }
    
    // Check labels
    const labels = await session.run('CALL db.labels() YIELD label RETURN label');
    console.log('🏷️  Labels:', labels.records.map(r => r.get('label')));

    // Check relationship types
    const relTypes = await session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType');
    console.log('🔗 Relationship types:', relTypes.records.map(r => r.get('relationshipType')));

    // Degree distribution (p50, p90)
    console.log('\n📊 ONTOLOGICAL HEALTH METRICS:');
    const degreeStats = await session.run(`
      MATCH (n)
      WITH COUNT { (n)--() } AS deg
      RETURN
        avg(toFloat(deg)) AS avgDegree,
        percentileCont(toFloat(deg), 0.5) AS p50,
        percentileCont(toFloat(deg), 0.9) AS p90,
        max(toFloat(deg)) AS maxDegree,
        min(toFloat(deg)) AS minDegree
    `);
    const stats = degreeStats.records[0];
    console.log('  📈 Avg Degree:', toNumber(stats.get('avgDegree')).toFixed(2));
    console.log('  📈 p50 (median):', toNumber(stats.get('p50')));
    console.log('  📈 p90:', toNumber(stats.get('p90')));
    console.log('  📈 Max Degree:', toNumber(stats.get('maxDegree')));
    console.log('  📈 Min Degree:', toNumber(stats.get('minDegree')));

    // Top 5 most connected nodes (potential supernodes)
    const topNodes = await session.run(`
      MATCH (n)
      WITH n, COUNT { (n)--() } AS deg
      RETURN labels(n)[0] AS tipo, n.name AS nome, deg AS grau
      ORDER BY deg DESC
      LIMIT 5
    `);
    console.log('\n🔝 Top 5 Supernós:');
    topNodes.records.forEach((record, i) => {
      console.log(`  ${i+1}. ${record.get('tipo')} "${record.get('nome')}" → ${toNumber(record.get('grau'))} conexões`);
    });

    // Orphan nodes count
    const orphans = await session.run(`
      MATCH (n) WHERE NOT (n)--()
      RETURN count(n) AS orphanCount
    `);
    const orphanCount = toNumber(orphans.records[0].get('orphanCount'));
    const orphanPct = ((orphanCount / totalNodes) * 100).toFixed(1);
    console.log(`\n🚨 Nós órfãos: ${orphanCount} (${orphanPct}%)`);
    
    // Sample some nodes
    if (totalNodes > 0) {
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
