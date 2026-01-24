/**
 * Verificar se a estrutura do FirstRunOnboarding está correta
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkStructure() {
  const session = driver.session();
  const userEmail = 'usuario040@aurora.example';
  
  try {
    console.log('🔍 Verificando estrutura do FirstRunOnboarding');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // 1. Verificar FirstRunOnboarding e seus relacionamentos
    console.log('📋 1. FirstRunOnboarding:');
    const froResult = await session.run(`
      MATCH (u:User {email: $email})-[r1:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      OPTIONAL MATCH (fro)-[r2:INITIATES]->(ai:AIProfile)
      OPTIONAL MATCH (fro)-[r3:GENERATES]->(pv:PersonaVersion)
      OPTIONAL MATCH (fro)-[r4:CONFIRMS_POSITION]->(confirmed:User)
      RETURN 
        fro.id AS froId,
        fro.version AS froVersion,
        fro.status AS froStatus,
        fro.source_type AS sourceType,
        fro.confidence AS confidence,
        fro.created_at AS createdAt,
        ai.id AS aiId,
        ai.status AS aiStatus,
        pv.id AS pvId,
        pv.version AS pvVersion,
        pv.status AS pvStatus,
        confirmed.name AS confirmedName
    `, { email: userEmail });
    
    if (froResult.records.length > 0) {
      const record = froResult.records[0];
      console.log('   ✅ Estrutura encontrada:');
      console.log(`      FirstRunOnboarding: ${record.get('froId')?.substring(0, 8)}... [v${record.get('froVersion')}] {${record.get('froStatus')}}`);
      console.log(`      Source: ${record.get('sourceType')}, Confidence: ${record.get('confidence')}`);
      console.log(`      AIProfile: ${record.get('aiId')?.substring(0, 8)}... {${record.get('aiStatus')}}`);
      console.log(`      PersonaVersion: ${record.get('pvId')?.substring(0, 8)}... [v${record.get('pvVersion')}] {${record.get('pvStatus')}}`);
      console.log(`      Posição confirmada: ${record.get('confirmedName') || 'NÃO'}`);
    } else {
      console.log('   ❌ FirstRunOnboarding não encontrado');
    }
    console.log('');
    
    // 2. Verificar relacionamento CURRENT_PERSONA
    console.log('🤖 2. AIProfile -> PersonaVersion:');
    const currentPersonaResult = await session.run(`
      MATCH (u:User {email: $email})-[:HAS_AI_PROFILE]->(ai:AIProfile)
      OPTIONAL MATCH (ai)-[:CURRENT_PERSONA]->(pv:PersonaVersion)
      RETURN 
        ai.id AS aiId,
        ai.status AS aiStatus,
        pv.id AS pvId,
        pv.version AS pvVersion,
        pv.status AS pvStatus
    `, { email: userEmail });
    
    if (currentPersonaResult.records.length > 0) {
      const record = currentPersonaResult.records[0];
      if (record.get('pvId')) {
        console.log('   ✅ CURRENT_PERSONA encontrado:');
        console.log(`      AIProfile: ${record.get('aiId')?.substring(0, 8)}... {${record.get('aiStatus')}}`);
        console.log(`      PersonaVersion: ${record.get('pvId')?.substring(0, 8)}... [v${record.get('pvVersion')}] {${record.get('pvStatus')}}`);
      } else {
        console.log('   ❌ AIProfile encontrado, mas sem CURRENT_PERSONA');
      }
    } else {
      console.log('   ❌ AIProfile não encontrado');
    }
    console.log('');
    
    // 3. Verificar competências
    console.log('💡 3. Competencies:');
    const compResult = await session.run(`
      MATCH (u:User {email: $email})-[:HAS_COMPETENCY]->(c:Competency)
      RETURN c.name AS name, c.id AS id
      ORDER BY name
    `, { email: userEmail });
    
    if (compResult.records.length > 0) {
      console.log(`   ✅ ${compResult.records.length} competências encontradas:`);
      for (const record of compResult.records) {
        console.log(`      - ${record.get('name')} (${record.get('id')?.substring(0, 8)}...)`);
      }
    } else {
      console.log('   ❌ Nenhuma competência encontrada');
    }
    console.log('');
    
    // 4. Verificar se há nós duplicados ou estranhos
    console.log('🚨 4. Verificação de problemas:');
    
    // Verificar múltiplos FirstRunOnboarding
    const multipleFroResult = await session.run(`
      MATCH (u:User {email: $email})-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      RETURN count(fro) AS count
    `, { email: userEmail });
    
    const froCount = multipleFroResult.records[0].get('count').toNumber();
    if (froCount > 1) {
      console.log(`   ⚠️  Múltiplos FirstRunOnboarding: ${froCount}`);
    } else if (froCount === 1) {
      console.log('   ✅ Apenas um FirstRunOnboarding');
    } else {
      console.log('   ❌ Nenhum FirstRunOnboarding');
    }
    
    // Verificar nós sem nome ou com nome estranho
    const weirdNodesResult = await session.run(`
      MATCH (u:User {email: $email})-[r]-(n)
      WHERE (n.name IS NULL OR n.name = '') AND labels(n)[0] NOT IN ['Conversation']
      RETURN labels(n) AS labels, n.id AS id
    `, { email: userEmail });
    
    if (weirdNodesResult.records.length > 0) {
      console.log(`   ⚠️  ${weirdNodesResult.records.length} nós sem nome:`);
      for (const record of weirdNodesResult.records) {
        console.log(`      - [${record.get('labels').join(':')}] ${record.get('id')?.substring(0, 8)}...`);
      }
    } else {
      console.log('   ✅ Todos os nós têm nome (exceto Conversation)');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO FINAL:');
    console.log(`   FirstRunOnboarding: ${froCount === 1 ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   AIProfile: ${currentPersonaResult.records.length > 0 ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   PersonaVersion: ${compResult.records.length > 0 ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   Competencies: ${compResult.records.length} encontradas`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkStructure();
