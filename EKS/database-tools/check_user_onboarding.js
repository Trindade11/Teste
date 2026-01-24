/**
 * Verificar estado atual do usuário 040 no Neo4j
 * - O que existe?
 * - O que foi criado pelo frontend?
 * - O que está faltando?
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkUserOnboarding() {
  const session = driver.session();
  const userEmail = 'usuario040@aurora.example';
  
  try {
    console.log('🔍 Verificando estado do usuário:', userEmail);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // 1. Verificar User
    console.log('👤 1. USUÁRIO:');
    const userResult = await session.run(`
      MATCH (u:User {email: $email})
      RETURN u
    `, { email: userEmail });
    
    if (userResult.records.length > 0) {
      const user = userResult.records[0].get('u').properties;
      console.log('   ✅ User encontrado');
      console.log('   Propriedades:', JSON.stringify(user, null, 2));
    } else {
      console.log('   ❌ User NÃO encontrado');
    }
    console.log('');
    
    // 2. Verificar todos os relacionamentos do User
    console.log('🔗 2. RELACIONAMENTOS DO USER:');
    const relsResult = await session.run(`
      MATCH (u:User {email: $email})-[r]->(n)
      RETURN type(r) AS relType, labels(n) AS nodeLabels, n AS node
    `, { email: userEmail });
    
    if (relsResult.records.length > 0) {
      console.log(`   ✅ ${relsResult.records.length} relacionamentos encontrados:`);
      for (const record of relsResult.records) {
        const relType = record.get('relType');
        const nodeLabels = record.get('nodeLabels');
        const node = record.get('node').properties;
        console.log(`   - [:${relType}] -> (:${nodeLabels.join(':')})`);
        console.log(`     Props: ${JSON.stringify(node).substring(0, 100)}...`);
      }
    } else {
      console.log('   ❌ Nenhum relacionamento encontrado');
    }
    console.log('');
    
    // 3. Verificar FirstRunOnboarding
    console.log('📋 3. FIRST RUN ONBOARDING:');
    const froResult = await session.run(`
      MATCH (fro:FirstRunOnboarding {user_email: $email})
      RETURN fro
    `, { email: userEmail });
    
    if (froResult.records.length > 0) {
      const fro = froResult.records[0].get('fro').properties;
      console.log('   ✅ FirstRunOnboarding encontrado');
      console.log('   ID:', fro.id);
      console.log('   Version:', fro.version);
      console.log('   Status:', fro.status);
    } else {
      console.log('   ❌ FirstRunOnboarding NÃO encontrado');
    }
    console.log('');
    
    // 4. Verificar AIProfile
    console.log('🤖 4. AI PROFILE:');
    const aiResult = await session.run(`
      MATCH (ai:AIProfile {user_email: $email})
      RETURN ai
    `, { email: userEmail });
    
    if (aiResult.records.length > 0) {
      const ai = aiResult.records[0].get('ai').properties;
      console.log('   ✅ AIProfile encontrado');
      console.log('   ID:', ai.id);
    } else {
      console.log('   ❌ AIProfile NÃO encontrado');
    }
    console.log('');
    
    // 5. Verificar PersonaVersion
    console.log('🧠 5. PERSONA VERSION:');
    const pvResult = await session.run(`
      MATCH (pv:PersonaVersion {user_email: $email})
      RETURN pv
    `, { email: userEmail });
    
    if (pvResult.records.length > 0) {
      const pv = pvResult.records[0].get('pv').properties;
      console.log('   ✅ PersonaVersion encontrada');
      console.log('   ID:', pv.id);
      console.log('   Version:', pv.version);
    } else {
      console.log('   ❌ PersonaVersion NÃO encontrada');
    }
    console.log('');
    
    // 6. Verificar Competencies
    console.log('💡 6. COMPETÊNCIAS:');
    const compResult = await session.run(`
      MATCH (u:User {email: $email})-[:HAS_COMPETENCY]->(c:Competency)
      RETURN c.name AS name
    `, { email: userEmail });
    
    if (compResult.records.length > 0) {
      console.log(`   ✅ ${compResult.records.length} competências encontradas:`);
      for (const record of compResult.records) {
        console.log(`   - ${record.get('name')}`);
      }
    } else {
      console.log('   ❌ Nenhuma competência encontrada');
    }
    console.log('');
    
    // 7. Verificar OnboardingResponse (caso o frontend crie isso)
    console.log('📝 7. ONBOARDING RESPONSE (se existir):');
    const orResult = await session.run(`
      MATCH (or:OnboardingResponse)
      WHERE or.user_email = $email OR or.userEmail = $email
      RETURN or
    `, { email: userEmail });
    
    if (orResult.records.length > 0) {
      const or = orResult.records[0].get('or').properties;
      console.log('   ✅ OnboardingResponse encontrado');
      console.log('   Props:', JSON.stringify(or, null, 2));
    } else {
      console.log('   ❌ OnboardingResponse NÃO encontrado');
    }
    console.log('');
    
    // 8. TODOS os nós conectados ao User
    console.log('🌐 8. TODOS OS NÓS CONECTADOS AO USER:');
    const allNodesResult = await session.run(`
      MATCH (u:User {email: $email})-[r]-(n)
      RETURN DISTINCT labels(n) AS labels, type(r) AS relType, count(*) AS count
    `, { email: userEmail });
    
    if (allNodesResult.records.length > 0) {
      console.log('   Resumo de conexões:');
      for (const record of allNodesResult.records) {
        console.log(`   - [:${record.get('relType')}] <-> (:${record.get('labels').join(':')}) x${record.get('count')}`);
      }
    } else {
      console.log('   ❌ User não tem conexões');
    }
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkUserOnboarding();
