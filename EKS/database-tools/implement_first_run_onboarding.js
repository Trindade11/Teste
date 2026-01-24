/**
 * 🎯 Implementar First-Run Onboarding - Schema Refinado
 * 
 * Este script implementa a estrutura DEFINIDA no schema refinado:
 * - Cria :FirstRunOnboarding como nó principal
 * - Transforma dados do OnboardingResponse antigo
 * - Cria relacionamento [:COMPLETED_FIRST_RUN_ONBOARDING]
 * - Conecta com :AIProfile e :PersonaVersion
 * 
 * NÃO aproveita estrutura anterior - IMPLEMENTA a nova estrutura.
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function implementFirstRunOnboarding(userEmail) {
  const session = driver.session();
  
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 IMPLEMENTANDO SCHEMA REFINADO: FirstRunOnboarding');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`👤 Usuário: ${userEmail}`);
    console.log('');
    
    // ========================================================================
    // STEP 1: Ler dados existentes do OnboardingResponse
    // ========================================================================
    console.log('📥 Step 1: Lendo dados do OnboardingResponse existente...');
    
    const existingResult = await session.run(`
      MATCH (u:User {email: $email})
      OPTIONAL MATCH (u)-[:HAS_ONBOARDING_RESPONSE]->(or:OnboardingResponse)
      RETURN u, or
    `, { email: userEmail });
    
    if (existingResult.records.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const user = existingResult.records[0].get('u').properties;
    const oldOnboarding = existingResult.records[0].get('or')?.properties;
    
    if (!oldOnboarding) {
      throw new Error('OnboardingResponse não encontrado. Execute o onboarding no frontend primeiro.');
    }
    
    console.log(`   ✅ Dados encontrados: ${Object.keys(oldOnboarding).length} propriedades`);
    console.log('');
    
    // ========================================================================
    // STEP 2: Limpar estrutura anterior (AIProfile, PersonaVersion, etc)
    // ========================================================================
    console.log('🧹 Step 2: Limpando estrutura anterior...');
    
    await session.run(`
      MATCH (u:User {email: $email})-[r:HAS_AI_PROFILE]->(ai:AIProfile)
      DETACH DELETE ai
    `, { email: userEmail });
    
    await session.run(`
      MATCH (pv:PersonaVersion {user_email: $email})
      DETACH DELETE pv
    `, { email: userEmail });
    
    await session.run(`
      MATCH (u:User {email: $email})-[r:HAS_COMPETENCY]->()
      DELETE r
    `, { email: userEmail });
    
    await session.run(`
      MATCH (fro:FirstRunOnboarding {user_email: $email})
      DETACH DELETE fro
    `, { email: userEmail });
    
    console.log('   ✅ Estrutura anterior removida');
    console.log('');
    
    // ========================================================================
    // STEP 3: Criar :FirstRunOnboarding conforme SCHEMA DEFINIDO
    // ========================================================================
    console.log('📋 Step 3: Criando :FirstRunOnboarding conforme schema refinado...');
    
    const froResult = await session.run(`
      CREATE (fro:FirstRunOnboarding {
        // === Identificação ===
        id: randomUUID(),
        user_email: $userEmail,
        
        // === Dados do Perfil (do User) ===
        full_name: $fullName,
        job_role: $jobRole,
        company: $company,
        department: $department,
        
        // === Conteúdo Principal (do OnboardingResponse) ===
        profile_description: $profileDescription,
        role_description: $roleDescription,
        department_description: $departmentDescription,
        
        // === Competências (array) ===
        competencies: $competencies,
        
        // === Objetivos e Desafios ===
        primary_objective: $primaryObjective,
        top_challenges: $topChallenges,
        
        // === Validações ===
        org_chart_validated: $orgChartValidated,
        
        // === METADADOS DE PROVENIÊNCIA (schema refinado) ===
        source_type: 'user_input',
        confidence: 1.0,
        
        // === METADADOS TEMPORAIS (schema refinado) ===
        created_at: datetime($createdAt),
        completed_at: datetime(),
        updated_at: datetime(),
        
        // === VERSIONAMENTO (schema refinado) ===
        version: 'v1',
        status: 'active',
        
        // === CONTEXTO DE CAPTURA (schema refinado) ===
        session_id: $sessionId,
        duration_seconds: 480,
        
        // === CONFIGURAÇÕES DE MEMÓRIA ===
        memory_level: $memoryLevel,
        default_visibility: $defaultVisibility
      })
      RETURN fro.id AS froId
    `, {
      userEmail: userEmail,
      fullName: user.name || oldOnboarding.fullName || '',
      jobRole: user.jobTitle || oldOnboarding.jobRole || '',
      company: user.company || oldOnboarding.company || '',
      department: user.department || oldOnboarding.department || '',
      profileDescription: oldOnboarding.profileDescription || '',
      roleDescription: oldOnboarding.roleDescription || '',
      departmentDescription: oldOnboarding.departmentDescription || '',
      competencies: oldOnboarding.competencies || [],
      primaryObjective: oldOnboarding.primaryObjective || '',
      topChallenges: oldOnboarding.topChallenges || '',
      orgChartValidated: oldOnboarding.orgChartValidated || false,
      createdAt: oldOnboarding.createdAt || new Date().toISOString(),
      sessionId: `fro-session-${Date.now()}`,
      memoryLevel: oldOnboarding.memoryLevel || 'long',
      defaultVisibility: oldOnboarding.defaultVisibility || 'corporate'
    });
    
    const froId = froResult.records[0].get('froId');
    console.log(`   ✅ FirstRunOnboarding criado: ${froId}`);
    console.log('');
    
    // ========================================================================
    // STEP 4: Criar relacionamento [:COMPLETED_FIRST_RUN_ONBOARDING]
    // ========================================================================
    console.log('🔗 Step 4: Criando relacionamento COMPLETED_FIRST_RUN_ONBOARDING...');
    
    await session.run(`
      MATCH (u:User {email: $email})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      CREATE (u)-[:COMPLETED_FIRST_RUN_ONBOARDING {
        completed_at: datetime(),
        duration_seconds: 480,
        version: 'v1'
      }]->(fro)
    `, { email: userEmail, froId: froId });
    
    console.log('   ✅ Relacionamento criado');
    console.log('');
    
    // ========================================================================
    // STEP 5: Criar relacionamento [:CONFIRMS_POSITION]
    // ========================================================================
    console.log('🔗 Step 5: Criando relacionamento CONFIRMS_POSITION...');
    
    await session.run(`
      MATCH (u:User {email: $email})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      CREATE (fro)-[:CONFIRMS_POSITION {
        validated: $validated,
        validated_at: datetime()
      }]->(u)
    `, { 
      email: userEmail, 
      froId: froId,
      validated: oldOnboarding.orgChartValidated || false
    });
    
    console.log('   ✅ Posição no organograma confirmada');
    console.log('');
    
    // ========================================================================
    // STEP 6: Criar :AIProfile (spec 022)
    // ========================================================================
    console.log('🤖 Step 6: Criando AIProfile...');
    
    const aiResult = await session.run(`
      MATCH (u:User {email: $email})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      
      CREATE (ai:AIProfile {
        id: randomUUID(),
        user_email: $email,
        
        // Configurações iniciais
        ai_experience_level: 'intermediário',
        technical_path: false,
        preferred_communication: 'direto',
        
        // Estado
        status: 'active',
        created_at: datetime(),
        updated_at: datetime(),
        
        // Fonte - referência ao FirstRunOnboarding
        source: 'first_run_onboarding',
        source_id: $froId
      })
      
      // Relacionamentos conforme schema
      CREATE (u)-[:HAS_AI_PROFILE]->(ai)
      CREATE (fro)-[:INITIATES]->(ai)
      
      RETURN ai.id AS aiId
    `, { email: userEmail, froId: froId });
    
    const aiId = aiResult.records[0].get('aiId');
    console.log(`   ✅ AIProfile criado: ${aiId}`);
    console.log('');
    
    // ========================================================================
    // STEP 7: Criar :PersonaVersion v1 (spec 022)
    // ========================================================================
    console.log('🧠 Step 7: Criando PersonaVersion v1...');
    
    const personaSummary = `${user.name} é ${user.jobTitle} na área de ${user.department || 'N/A'}. ${(oldOnboarding.profileDescription || '').substring(0, 150)}`;
    
    const pvResult = await session.run(`
      MATCH (u:User {email: $email})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      MATCH (ai:AIProfile {id: $aiId})
      
      CREATE (pv:PersonaVersion {
        id: randomUUID(),
        user_email: $email,
        version: 'v1',
        
        // Resumo da persona
        persona_summary: $personaSummary,
        
        // Competências principais
        core_competencies: $competencies,
        
        // Contexto organizacional
        organizational_context: $orgContext,
        
        // Objetivos e motivações
        primary_goals: $primaryObjective,
        key_challenges: $topChallenges,
        
        // Metadados
        status: 'active',
        confidence: 1.0,
        source: 'first_run_onboarding',
        source_id: $froId,
        created_at: datetime(),
        updated_at: datetime()
      })
      
      // Relacionamentos conforme schema
      CREATE (fro)-[:GENERATES]->(pv)
      CREATE (ai)-[:CURRENT_PERSONA]->(pv)
      CREATE (u)-[:HAS_PERSONA_VERSION]->(pv)
      
      RETURN pv.id AS pvId
    `, { 
      email: userEmail, 
      froId: froId,
      aiId: aiId,
      personaSummary: personaSummary,
      competencies: oldOnboarding.competencies || [],
      orgContext: (oldOnboarding.roleDescription || '').substring(0, 200),
      primaryObjective: oldOnboarding.primaryObjective || '',
      topChallenges: oldOnboarding.topChallenges || ''
    });
    
    const pvId = pvResult.records[0].get('pvId');
    console.log(`   ✅ PersonaVersion v1 criada: ${pvId}`);
    console.log('');
    
    // ========================================================================
    // STEP 8: Criar nós :Competency individuais
    // ========================================================================
    console.log('💡 Step 8: Criando nós de Competência...');
    
    const competencies = oldOnboarding.competencies || [];
    for (const competency of competencies) {
      await session.run(`
        MATCH (u:User {email: $email})
        MATCH (fro:FirstRunOnboarding {id: $froId})
        
        MERGE (c:Competency {name: $competencyName})
        ON CREATE SET 
          c.id = randomUUID(),
          c.created_at = datetime()
        
        MERGE (u)-[:HAS_COMPETENCY {
          source: 'first_run_onboarding',
          source_id: $froId,
          confidence: 1.0,
          declared_at: datetime()
        }]->(c)
      `, {
        email: userEmail,
        froId: froId,
        competencyName: competency
      });
    }
    
    console.log(`   ✅ ${competencies.length} competências criadas`);
    console.log('');
    
    // ========================================================================
    // STEP 9: Remover OnboardingResponse antigo (opcional - manter para histórico)
    // ========================================================================
    console.log('📦 Step 9: Arquivando OnboardingResponse antigo...');
    
    await session.run(`
      MATCH (or:OnboardingResponse {id: $orId})
      SET or.status = 'migrated_to_first_run_onboarding',
          or.migrated_at = datetime(),
          or.migrated_to = $froId
    `, { 
      orId: oldOnboarding.id,
      froId: froId 
    });
    
    console.log('   ✅ OnboardingResponse marcado como migrado');
    console.log('');
    
    // ========================================================================
    // VERIFICAÇÃO FINAL
    // ========================================================================
    console.log('🔍 Verificação final...');
    
    const verifyResult = await session.run(`
      MATCH (u:User {email: $email})
      OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      OPTIONAL MATCH (fro)-[:INITIATES]->(ai:AIProfile)
      OPTIONAL MATCH (fro)-[:GENERATES]->(pv:PersonaVersion)
      OPTIONAL MATCH (fro)-[:CONFIRMS_POSITION]->(confirmed:User)
      OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
      RETURN 
        u.name AS userName,
        fro.id AS froId,
        fro.version AS froVersion,
        fro.status AS froStatus,
        fro.source_type AS sourceType,
        fro.confidence AS confidence,
        ai.id AS aiProfileId,
        pv.id AS personaVersionId,
        pv.version AS pvVersion,
        confirmed.name AS confirmedPosition,
        count(DISTINCT c) AS competencyCount
    `, { email: userEmail });
    
    const r = verifyResult.records[0];
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ IMPLEMENTAÇÃO DO SCHEMA REFINADO CONCLUÍDA!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Estrutura Criada:');
    console.log('');
    console.log(`   👤 Usuário: ${r.get('userName')}`);
    console.log('');
    console.log('   📋 FirstRunOnboarding:');
    console.log(`      ID: ${r.get('froId')}`);
    console.log(`      Version: ${r.get('froVersion')}`);
    console.log(`      Status: ${r.get('froStatus')}`);
    console.log(`      Source Type: ${r.get('sourceType')}`);
    console.log(`      Confidence: ${r.get('confidence')}`);
    console.log('');
    console.log(`   🤖 AIProfile: ${r.get('aiProfileId')}`);
    console.log(`   🧠 PersonaVersion: ${r.get('pvVersion')} (${r.get('personaVersionId')})`);
    console.log(`   ✅ Posição Confirmada: ${r.get('confirmedPosition')}`);
    console.log(`   💡 Competências: ${r.get('competencyCount')}`);
    console.log('');
    console.log('🔗 Relacionamentos (conforme schema):');
    console.log('   (:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(:FirstRunOnboarding)');
    console.log('   (:FirstRunOnboarding)-[:CONFIRMS_POSITION]->(:User)');
    console.log('   (:FirstRunOnboarding)-[:INITIATES]->(:AIProfile)');
    console.log('   (:FirstRunOnboarding)-[:GENERATES]->(:PersonaVersion)');
    console.log('   (:User)-[:HAS_AI_PROFILE]->(:AIProfile)');
    console.log('   (:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)');
    console.log('   (:User)-[:HAS_PERSONA_VERSION]->(:PersonaVersion)');
    console.log(`   (:User)-[:HAS_COMPETENCY]->(:Competency) x${r.get('competencyCount')}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
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
    await implementFirstRunOnboarding(userEmail);
  } catch (error) {
    console.error('Falha:', error.message);
  } finally {
    await driver.close();
  }
}

main();
