/**
 * 🎯 Enrich Onboarding - Complementa estrutura do First-Run Onboarding
 * 
 * O frontend já cria :OnboardingResponse com os dados básicos.
 * Este script LÊ o OnboardingResponse existente e CRIA:
 * - :AIProfile (spec 022)
 * - :PersonaVersion (spec 022)
 * - :Competency nodes (para queries semânticas)
 * - Metadados de proveniência
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function enrichOnboarding(userEmail) {
  const session = driver.session();
  
  try {
    console.log('🔍 Buscando OnboardingResponse existente...');
    console.log(`👤 Usuário: ${userEmail}`);
    console.log('');
    
    // ========================================================================
    // STEP 1: Ler OnboardingResponse existente
    // ========================================================================
    const orResult = await session.run(`
      MATCH (u:User {email: $email})-[:HAS_ONBOARDING_RESPONSE]->(or:OnboardingResponse)
      RETURN u, or
    `, { email: userEmail });
    
    if (orResult.records.length === 0) {
      console.log('❌ OnboardingResponse não encontrado. Execute o onboarding no frontend primeiro.');
      return;
    }
    
    const user = orResult.records[0].get('u').properties;
    const onboardingResponse = orResult.records[0].get('or').properties;
    
    console.log('✅ OnboardingResponse encontrado!');
    console.log(`   ID: ${onboardingResponse.id}`);
    console.log(`   Competências: ${onboardingResponse.competencies?.length || 0}`);
    console.log('');
    
    // ========================================================================
    // STEP 2: Verificar se já foi enriquecido
    // ========================================================================
    const checkResult = await session.run(`
      MATCH (u:User {email: $email})-[:HAS_AI_PROFILE]->(ai:AIProfile)
      RETURN ai
    `, { email: userEmail });
    
    if (checkResult.records.length > 0) {
      console.log('⚠️  Onboarding já foi enriquecido anteriormente.');
      console.log('   Use --force para sobrescrever ou --cleanup para limpar primeiro.');
      
      if (!process.argv.includes('--force')) {
        return;
      }
      console.log('   --force detectado, sobrescrevendo...');
      console.log('');
    }
    
    // ========================================================================
    // STEP 3: Enriquecer OnboardingResponse com metadados
    // ========================================================================
    console.log('📋 Step 1: Enriquecendo OnboardingResponse...');
    
    await session.run(`
      MATCH (or:OnboardingResponse {id: $orId})
      SET or.source_type = 'user_input',
          or.confidence = 1.0,
          or.version = 'v1',
          or.status = 'active',
          or.enriched_at = datetime()
    `, { orId: onboardingResponse.id });
    
    console.log('   ✅ Metadados de proveniência adicionados');
    
    // ========================================================================
    // STEP 4: Criar AIProfile
    // ========================================================================
    console.log('🤖 Step 2: Criando AIProfile...');
    
    await session.run(`
      MATCH (u:User {email: $email})
      MATCH (or:OnboardingResponse {id: $orId})
      
      MERGE (ai:AIProfile {user_email: $email})
      ON CREATE SET
        ai.id = randomUUID(),
        ai.ai_experience_level = 'intermediário',
        ai.technical_path = false,
        ai.preferred_communication = 'direto',
        ai.status = 'active',
        ai.created_at = datetime(),
        ai.source = 'onboarding_response'
      ON MATCH SET
        ai.updated_at = datetime()
      
      MERGE (u)-[:HAS_AI_PROFILE]->(ai)
      MERGE (or)-[:INITIATES]->(ai)
    `, { 
      email: userEmail,
      orId: onboardingResponse.id
    });
    
    console.log('   ✅ AIProfile criado e conectado');
    
    // ========================================================================
    // STEP 5: Criar PersonaVersion
    // ========================================================================
    console.log('🧠 Step 3: Criando PersonaVersion v1...');
    
    // Criar resumo da persona
    const personaSummary = `${user.name} é ${user.jobTitle} na área de ${onboardingResponse.departmentDescription?.substring(0, 50) || 'N/A'}. ${onboardingResponse.profileDescription?.substring(0, 150) || ''}`;
    
    await session.run(`
      MATCH (u:User {email: $email})
      MATCH (or:OnboardingResponse {id: $orId})
      MATCH (ai:AIProfile {user_email: $email})
      
      MERGE (pv:PersonaVersion {user_email: $email, version: 'v1'})
      ON CREATE SET
        pv.id = randomUUID(),
        pv.persona_summary = $personaSummary,
        pv.core_competencies = $competencies,
        pv.organizational_context = $orgContext,
        pv.primary_goals = $primaryObjective,
        pv.key_challenges = $topChallenges,
        pv.status = 'active',
        pv.confidence = 1.0,
        pv.source = 'onboarding_response',
        pv.created_at = datetime()
      ON MATCH SET
        pv.updated_at = datetime()
      
      MERGE (or)-[:GENERATES]->(pv)
      MERGE (ai)-[:CURRENT_PERSONA]->(pv)
      MERGE (u)-[:HAS_PERSONA_VERSION]->(pv)
    `, { 
      email: userEmail,
      orId: onboardingResponse.id,
      personaSummary: personaSummary,
      competencies: onboardingResponse.competencies || [],
      orgContext: onboardingResponse.roleDescription?.substring(0, 200) || '',
      primaryObjective: onboardingResponse.primaryObjective || '',
      topChallenges: onboardingResponse.topChallenges || ''
    });
    
    console.log('   ✅ PersonaVersion v1 criada e conectada');
    
    // ========================================================================
    // STEP 6: Criar nós de Competência
    // ========================================================================
    console.log('💡 Step 4: Criando nós de Competência...');
    
    const competencies = onboardingResponse.competencies || [];
    let compCount = 0;
    
    for (const competency of competencies) {
      await session.run(`
        MATCH (u:User {email: $email})
        MERGE (c:Competency {name: $competencyName})
        ON CREATE SET 
          c.id = randomUUID(),
          c.created_at = datetime()
        MERGE (u)-[:HAS_COMPETENCY {
          source: 'onboarding_response',
          confidence: 1.0,
          declared_at: datetime()
        }]->(c)
      `, {
        email: userEmail,
        competencyName: competency
      });
      compCount++;
    }
    
    console.log(`   ✅ ${compCount} competências criadas/conectadas`);
    
    // ========================================================================
    // STEP 7: Verificação Final
    // ========================================================================
    console.log('');
    console.log('🔍 Step 5: Verificação final...');
    
    const verifyResult = await session.run(`
      MATCH (u:User {email: $email})
      OPTIONAL MATCH (u)-[:HAS_ONBOARDING_RESPONSE]->(or:OnboardingResponse)
      OPTIONAL MATCH (u)-[:HAS_AI_PROFILE]->(ai:AIProfile)
      OPTIONAL MATCH (ai)-[:CURRENT_PERSONA]->(pv:PersonaVersion)
      OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
      RETURN 
        u.name AS userName,
        or.id AS onboardingId,
        or.status AS onboardingStatus,
        ai.id AS aiProfileId,
        pv.version AS personaVersion,
        count(DISTINCT c) AS competencyCount
    `, { email: userEmail });
    
    const record = verifyResult.records[0];
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ENRIQUECIMENTO CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Resumo:');
    console.log(`   👤 Usuário: ${record.get('userName')}`);
    console.log(`   📋 OnboardingResponse: ${record.get('onboardingId')}`);
    console.log(`   🤖 AIProfile: ${record.get('aiProfileId')}`);
    console.log(`   🧠 PersonaVersion: ${record.get('personaVersion')}`);
    console.log(`   💡 Competências: ${record.get('competencyCount')}`);
    console.log('');
    console.log('🔗 Estrutura completa:');
    console.log('   (:User)-[:HAS_ONBOARDING_RESPONSE]->(:OnboardingResponse)');
    console.log('   (:User)-[:HAS_AI_PROFILE]->(:AIProfile)');
    console.log('   (:OnboardingResponse)-[:INITIATES]->(:AIProfile)');
    console.log('   (:OnboardingResponse)-[:GENERATES]->(:PersonaVersion)');
    console.log('   (:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)');
    console.log(`   (:User)-[:HAS_COMPETENCY]->(:Competency) x${record.get('competencyCount')}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

// ============================================================================
// 🧹 FUNÇÃO DE LIMPEZA
// ============================================================================

async function cleanupEnrichment(userEmail) {
  const session = driver.session();
  
  try {
    console.log(`🧹 Limpando enriquecimento do usuário: ${userEmail}`);
    
    // Remover PersonaVersion
    await session.run(`
      MATCH (pv:PersonaVersion {user_email: $email})
      DETACH DELETE pv
    `, { email: userEmail });
    console.log('   ✅ PersonaVersion removida');
    
    // Remover AIProfile
    await session.run(`
      MATCH (ai:AIProfile {user_email: $email})
      DETACH DELETE ai
    `, { email: userEmail });
    console.log('   ✅ AIProfile removido');
    
    // Remover relacionamentos de competência
    await session.run(`
      MATCH (u:User {email: $email})-[r:HAS_COMPETENCY]->()
      DELETE r
    `, { email: userEmail });
    console.log('   ✅ Relacionamentos de competência removidos');
    
    // Limpar metadados do OnboardingResponse
    await session.run(`
      MATCH (u:User {email: $email})-[:HAS_ONBOARDING_RESPONSE]->(or:OnboardingResponse)
      REMOVE or.source_type, or.confidence, or.version, or.status, or.enriched_at
    `, { email: userEmail });
    console.log('   ✅ Metadados de enriquecimento removidos');
    
    console.log('');
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await session.close();
  }
}

// ============================================================================
// 🎯 EXECUÇÃO
// ============================================================================

async function main() {
  const userEmail = 'usuario040@aurora.example';
  
  try {
    if (process.argv.includes('--cleanup')) {
      await cleanupEnrichment(userEmail);
    } else {
      await enrichOnboarding(userEmail);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await driver.close();
  }
}

main();
