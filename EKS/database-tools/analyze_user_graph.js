/**
 * Analisar grafo completo do usuário 040
 * Verificar todos os nós e relacionamentos criados
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function analyzeUserGraph() {
  const session = driver.session();
  const userEmail = 'usuario040@aurora.example';
  
  try {
    console.log('🔍 Análise completa do grafo do usuário:', userEmail);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // 1. Todos os nós conectados ao User (com detalhes)
    console.log('🌐 1. TODOS OS NÓS CONECTADOS AO USER:');
    const allNodesResult = await session.run(`
      MATCH (u:User {email: $email})-[r]-(n)
      RETURN 
        type(r) AS relType,
        labels(n) AS nodeLabels,
        n.name AS nodeName,
        n.id AS nodeId,
        n.email AS nodeEmail,
        n.version AS nodeVersion,
        n.status AS nodeStatus,
        properties(n) AS allProps
      ORDER BY relType, nodeLabels[0]
    `, { email: userEmail });
    
    if (allNodesResult.records.length === 0) {
      console.log('   ❌ Nenhum nó conectado ao User');
    } else {
      console.log(`   ✅ ${allNodesResult.records.length} conexões encontradas:`);
      console.log('');
      
      // Agrupar por tipo de nó
      const grouped = {};
      for (const record of allNodesResult.records) {
        const relType = record.get('relType');
        const nodeLabels = record.get('nodeLabels').join(':');
        const key = `${relType} -> ${nodeLabels}`;
        
        if (!grouped[key]) {
          grouped[key] = [];
        }
        
        grouped[key].push({
          name: record.get('nodeName'),
          id: record.get('nodeId'),
          email: record.get('nodeEmail'),
          version: record.get('nodeVersion'),
          status: record.get('nodeStatus'),
          props: record.get('allProps')
        });
      }
      
      for (const [key, nodes] of Object.entries(grouped)) {
        console.log(`   ${key}:`);
        for (const node of nodes) {
          const name = node.name || node.email || 'N/A';
          const id = node.id ? node.id.substring(0, 8) + '...' : 'N/A';
          const version = node.version || '';
          const status = node.status || '';
          
          console.log(`     - ${name} (ID: ${id}) ${version ? `[${version}]` : ''} ${status ? `{${status}}` : ''}`);
          
          // Mostrar propriedades suspeitas
          if (node.props && Object.keys(node.props).length > 0) {
            const suspiciousProps = Object.entries(node.props)
              .filter(([k, v]) => 
                k.includes('initiative') || 
                k.includes('generate') || 
                k.includes('client') || 
                k.includes('persona') ||
                k.includes('Other') ||
                (typeof v === 'string' && v.includes('Other'))
              )
              .slice(0, 3);
            
            if (suspiciousProps.length > 0) {
              console.log(`       ⚠️  Props suspeitas: ${suspiciousProps.map(([k, v]) => `${k}=${JSON.stringify(v).substring(0, 30)}`).join(', ')}`);
            }
          }
        }
        console.log('');
      }
    }
    
    // 2. Verificar nós "Others" ou suspeitos
    console.log('🚨 2. NÓS SUSPEITOS (Others, initiative, generate, etc):');
    const suspiciousResult = await session.run(`
      MATCH (n)
      WHERE 
        n.name CONTAINS 'Other' OR
        n.name CONTAINS 'initiative' OR
        n.name CONTAINS 'generate' OR
        n.name CONTAINS 'client' OR
        n.name CONTAINS 'persona' OR
        labels(n)[0] CONTAINS 'Other'
      RETURN 
        labels(n) AS labels,
        n.name AS name,
        n.id AS id,
        properties(n) AS props
      LIMIT 20
    `);
    
    if (suspiciousResult.records.length > 0) {
      console.log(`   ⚠️  ${suspiciousResult.records.length} nós suspeitos encontrados:`);
      for (const record of suspiciousResult.records) {
        const labels = record.get('labels').join(':');
        const name = record.get('name') || 'N/A';
        const id = record.get('id') || 'N/A';
        console.log(`     - [${labels}] ${name} (ID: ${id})`);
      }
    } else {
      console.log('   ✅ Nenhum nó suspeito encontrado');
    }
    console.log('');
    
    // 3. Verificar relacionamentos com nomes estranhos
    console.log('🔗 3. RELACIONAMENTOS COM NOMES ESTRANHOS:');
    const weirdRelsResult = await session.run(`
      MATCH (u:User {email: $email})-[r]-(n)
      WHERE 
        type(r) CONTAINS 'initiative' OR
        type(r) CONTAINS 'generate' OR
        type(r) CONTAINS 'client' OR
        type(r) CONTAINS 'persona' OR
        type(r) CONTAINS 'Other'
      RETURN 
        type(r) AS relType,
        labels(n) AS nodeLabels,
        n.name AS nodeName,
        properties(r) AS relProps
    `, { email: userEmail });
    
    if (weirdRelsResult.records.length > 0) {
      console.log(`   ⚠️  ${weirdRelsResult.records.length} relacionamentos suspeitos:`);
      for (const record of weirdRelsResult.records) {
        const relType = record.get('relType');
        const nodeLabels = record.get('nodeLabels').join(':');
        const nodeName = record.get('nodeName') || 'N/A';
        console.log(`     - [:${relType}] -> [${nodeLabels}] ${nodeName}`);
      }
    } else {
      console.log('   ✅ Nenhum relacionamento suspeito encontrado');
    }
    console.log('');
    
    // 4. Estrutura esperada vs real
    console.log('📋 4. ESTRUTURA ESPERADA vs REAL:');
    console.log('   Estrutura esperada:');
    console.log('     (:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(:FirstRunOnboarding)');
    console.log('     (:User)-[:HAS_AI_PROFILE]->(:AIProfile)');
    console.log('     (:FirstRunOnboarding)-[:INITIATES]->(:AIProfile)');
    console.log('     (:FirstRunOnboarding)-[:GENERATES]->(:PersonaVersion)');
    console.log('     (:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)');
    console.log('     (:User)-[:HAS_COMPETENCY]->(:Competency) xN');
    console.log('');
    
    // Verificar estrutura real
    const structureResult = await session.run(`
      MATCH (u:User {email: $email})
      OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      OPTIONAL MATCH (u)-[:HAS_AI_PROFILE]->(ai:AIProfile)
      OPTIONAL MATCH (fro)-[:INITIATES]->(ai2:AIProfile)
      OPTIONAL MATCH (fro)-[:GENERATES]->(pv:PersonaVersion)
      OPTIONAL MATCH (ai)-[:CURRENT_PERSONA]->(pv2:PersonaVersion)
      OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
      RETURN 
        count(DISTINCT fro) AS froCount,
        count(DISTINCT ai) AS aiCount,
        count(DISTINCT ai2) AS aiInitCount,
        count(DISTINCT pv) AS pvGenCount,
        count(DISTINCT pv2) || count(DISTINCT pv) AS pvCurrentCount,
        count(DISTINCT c) AS compCount
    `, { email: userEmail });
    
    const structure = structureResult.records[0];
    console.log('   Estrutura real:');
    console.log(`     FirstRunOnboarding: ${structure.get('froCount')}`);
    console.log(`     AIProfile: ${structure.get('aiCount')} (iniciados: ${structure.get('aiInitCount')})`);
    console.log(`     PersonaVersion: ${structure.get('pvGenCount')} (current: ${structure.get('pvCurrentCount')})`);
    console.log(`     Competencies: ${structure.get('compCount')}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

analyzeUserGraph();
