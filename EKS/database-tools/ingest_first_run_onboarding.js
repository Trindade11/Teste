/**
 * 🎯 First-Run Onboarding - Script de Ingestão Refinado
 * 
 * Este script ingere os dados do First-Run Onboarding no Neo4j
 * criando a estrutura completa conforme as especificações:
 * - spec 022: PKP & Onboarding (AIProfile, PersonaVersion)
 * - spec 046: PIA - Process Intelligence
 * - spec 050: Meta-Graph Schema
 * 
 * Estrutura criada:
 * (:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(:FirstRunOnboarding)
 * (:FirstRunOnboarding)-[:INITIATES]->(:AIProfile)
 * (:FirstRunOnboarding)-[:GENERATES]->(:PersonaVersion)
 * (:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)
 */

const neo4j = require('neo4j-driver');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

// ============================================================================
// 📋 DADOS DO ONBOARDING - Usuário 040 (Pessoa 040)
// Baseado no frontend: OnboardingWizard.tsx e onboarding-store.ts
// ============================================================================
const onboardingData = {
  // === Identificação do Usuário ===
  userEmail: 'usuario040@aurora.example',
  userName: 'Pessoa 040',
  
  // === Etapa: Profile ===
  fullName: 'Pessoa 040',
  email: 'usuario040@aurora.example',
  jobRole: 'Coord. de Projetos',
  company: 'Aurora',
  department: 'Plataforma',
  
  // === Etapa: Profile Description ===
  profileDescription: `Sou Coordenador de Projetos na área de Plataforma. Tenho um perfil pragmático e orientado a execução, com foco em alinhamento entre áreas e entrega de valor. Gosto de trabalhar com clareza de escopo, priorização e comunicação direta com stakeholders. Valorizo processos bem definidos que permitam visibilidade do trabalho e reduzam retrabalho.`,
  
  // === Etapa: Organization - Descrição da Função ===
  roleDescription: `Atuo como Coordenador de Projetos no time de Plataforma. Minha responsabilidade é planejar, coordenar e acompanhar projetos que envolvem múltiplas áreas, garantindo alinhamento de escopo, prazos e expectativas. Faço gestão de stakeholders, organizo rituais de acompanhamento (dailies, reviews, retrospectivas) e priorizo demandas com base em impacto e capacidade. Sou o ponto focal entre as áreas técnicas e de negócio, traduzindo necessidades em entregas viáveis.`,
  
  // === Etapa: Organization - Descrição da Área ===
  departmentDescription: `A área de Plataforma dá sustentação para a operação e evolução dos sistemas e capacidades internas, garantindo que as demais áreas consigam executar com eficiência. Nosso papel é manter uma base tecnológica confiável, viabilizar integrações entre sistemas e implementar melhorias que aumentem produtividade e qualidade. Atuamos como enablers para toda a organização.`,
  
  // === Etapa: Org Chart ===
  orgChartValidated: true,
  managerEmail: 'usuario025@aurora.example', // Pessoa 025
  
  // === Etapa: Competencies ===
  competencies: [
    'Gestão de Projetos',
    'Priorização e Planejamento',
    'Gestão de Stakeholders',
    'Comunicação entre Áreas',
    'Análise de Problemas',
    'Facilitação de Reuniões',
    'Metodologias Ágeis',
    'Gestão de Riscos'
  ],
  
  // === Etapa: Goals ===
  primaryObjective: `Ganhar visibilidade e controle do trabalho (demandas, decisões, dependências e entregas) e transformar isso em um mapa vivo que me ajude a planejar melhor, reduzir retrabalho e acelerar a execução. Quero que o sistema me ajude a antecipar problemas e manter todos os stakeholders alinhados.`,
  
  topChallenges: `1. Falta de visibilidade ponta a ponta quando várias áreas participam do mesmo projeto
2. Mudança frequente de prioridades e demandas urgentes que desorganizam o planejamento
3. Dependências e bloqueios entre áreas que atrasam entregas
4. Dificuldade em alinhar expectativas com stakeholders de diferentes níveis
5. Documentação dispersa em múltiplos sistemas que gera retrabalho e perda de contexto`,
  
  // === Metadados da Sessão ===
  sessionId: `onboarding-session-${Date.now()}`,
  startedAt: new Date().toISOString(),
  durationSeconds: 480 // ~8 minutos estimado
};

// ============================================================================
// 🚀 FUNÇÕES DE INGESTÃO
// ============================================================================

async function ingestFirstRunOnboarding(data) {
  const session = driver.session();
  
  try {
    console.log('🚀 Iniciando ingestão do First-Run Onboarding...');
    console.log(`👤 Usuário: ${data.userName} (${data.userEmail})`);
    console.log('');
    
    // ========================================================================
    // STEP 1: Criar nó FirstRunOnboarding
    // ========================================================================
    console.log('📋 Step 1: Criando nó FirstRunOnboarding...');
    
    const froResult = await session.run(`
      CREATE (fro:FirstRunOnboarding {
        // === Identificação ===
        id: randomUUID(),
        user_email: $userEmail,
        
        // === Dados do Perfil ===
        full_name: $fullName,
        job_role: $jobRole,
        company: $company,
        department: $department,
        
        // === Conteúdo Principal ===
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
        
        // === Metadados de Proveniência ===
        source_type: 'user_input',
        confidence: 1.0,
        
        // === Metadados Temporais ===
        created_at: datetime(),
        completed_at: datetime(),
        updated_at: datetime(),
        
        // === Versionamento ===
        version: 'v1',
        status: 'active',
        
        // === Contexto de Captura ===
        session_id: $sessionId,
        duration_seconds: $durationSeconds
      })
      RETURN fro.id AS froId
    `, {
      userEmail: data.userEmail,
      fullName: data.fullName,
      jobRole: data.jobRole,
      company: data.company,
      department: data.department,
      profileDescription: data.profileDescription,
      roleDescription: data.roleDescription,
      departmentDescription: data.departmentDescription,
      competencies: data.competencies,
      primaryObjective: data.primaryObjective,
      topChallenges: data.topChallenges,
      orgChartValidated: data.orgChartValidated,
      sessionId: data.sessionId,
      durationSeconds: neo4j.int(data.durationSeconds)
    });
    
    const froId = froResult.records[0].get('froId');
    console.log(`   ✅ FirstRunOnboarding criado: ${froId}`);
    
    // ========================================================================
    // STEP 2: Conectar ao User existente
    // ========================================================================
    console.log('🔗 Step 2: Conectando ao User existente...');
    
    await session.run(`
      MATCH (u:User {email: $userEmail})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      CREATE (u)-[:COMPLETED_FIRST_RUN_ONBOARDING {
        completed_at: datetime(),
        duration_seconds: $durationSeconds,
        version: 'v1'
      }]->(fro)
      CREATE (fro)-[:CONFIRMS_POSITION {
        validated: $orgChartValidated,
        validated_at: datetime()
      }]->(u)
    `, {
      userEmail: data.userEmail,
      froId: froId,
      durationSeconds: neo4j.int(data.durationSeconds),
      orgChartValidated: data.orgChartValidated
    });
    
    console.log('   ✅ Relacionamentos User <-> FirstRunOnboarding criados');
    
    // ========================================================================
    // STEP 3: Criar AIProfile (spec 022)
    // ========================================================================
    console.log('🤖 Step 3: Criando AIProfile...');
    
    await session.run(`
      MATCH (u:User {email: $userEmail})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      
      // Criar AIProfile
      CREATE (ai:AIProfile {
        id: randomUUID(),
        user_email: $userEmail,
        
        // Configurações iniciais baseadas no onboarding
        ai_experience_level: 'intermediário',
        technical_path: false,
        preferred_communication: 'direto',
        
        // Estado
        status: 'active',
        created_at: datetime(),
        updated_at: datetime(),
        
        // Fonte
        source: 'first_run_onboarding'
      })
      
      // Conectar
      CREATE (u)-[:HAS_AI_PROFILE]->(ai)
      CREATE (fro)-[:INITIATES]->(ai)
      
      RETURN ai.id AS aiProfileId
    `, {
      userEmail: data.userEmail,
      froId: froId
    });
    
    console.log('   ✅ AIProfile criado e conectado');
    
    // ========================================================================
    // STEP 4: Criar PersonaVersion v1 (spec 022)
    // ========================================================================
    console.log('🧠 Step 4: Criando PersonaVersion v1...');
    
    await session.run(`
      MATCH (u:User {email: $userEmail})
      MATCH (fro:FirstRunOnboarding {id: $froId})
      MATCH (ai:AIProfile {user_email: $userEmail})
      
      // Criar PersonaVersion
      CREATE (pv:PersonaVersion {
        id: randomUUID(),
        user_email: $userEmail,
        version: 'v1',
        
        // Resumo da persona extraído do onboarding
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
        created_at: datetime(),
        updated_at: datetime()
      })
      
      // Conectar
      CREATE (fro)-[:GENERATES]->(pv)
      CREATE (ai)-[:CURRENT_PERSONA]->(pv)
      CREATE (u)-[:HAS_PERSONA_VERSION]->(pv)
      
      RETURN pv.id AS personaVersionId
    `, {
      userEmail: data.userEmail,
      froId: froId,
      personaSummary: `${data.fullName} é ${data.jobRole} na área de ${data.department}. ${data.profileDescription.substring(0, 200)}...`,
      competencies: data.competencies,
      orgContext: `${data.roleDescription.substring(0, 150)}...`,
      primaryObjective: data.primaryObjective,
      topChallenges: data.topChallenges
    });
    
    console.log('   ✅ PersonaVersion v1 criada e conectada');
    
    // ========================================================================
    // STEP 5: Atualizar User com dados do onboarding
    // ========================================================================
    console.log('📝 Step 5: Atualizando User com dados do onboarding...');
    
    await session.run(`
      MATCH (u:User {email: $userEmail})
      SET u.onboarding_completed = true,
          u.onboarding_completed_at = datetime(),
          u.profile_description = $profileDescription,
          u.role_description = $roleDescription,
          u.competencies = $competencies,
          u.primary_objective = $primaryObjective,
          u.updatedAt = datetime()
    `, {
      userEmail: data.userEmail,
      profileDescription: data.profileDescription,
      roleDescription: data.roleDescription,
      competencies: data.competencies,
      primaryObjective: data.primaryObjective
    });
    
    console.log('   ✅ User atualizado com dados do onboarding');
    
    // ========================================================================
    // STEP 6: Criar nós de Competência (para futuras conexões)
    // ========================================================================
    console.log('💡 Step 6: Criando nós de Competência...');
    
    for (const competency of data.competencies) {
      await session.run(`
        MATCH (u:User {email: $userEmail})
        MERGE (c:Competency {name: $competencyName})
        ON CREATE SET 
          c.id = randomUUID(),
          c.created_at = datetime()
        MERGE (u)-[:HAS_COMPETENCY {
          source: 'first_run_onboarding',
          confidence: 1.0,
          declared_at: datetime()
        }]->(c)
      `, {
        userEmail: data.userEmail,
        competencyName: competency
      });
    }
    
    console.log(`   ✅ ${data.competencies.length} competências criadas/conectadas`);
    
    // ========================================================================
    // STEP 7: Verificação Final
    // ========================================================================
    console.log('');
    console.log('🔍 Step 7: Verificação final...');
    
    const verifyResult = await session.run(`
      MATCH (u:User {email: $userEmail})
      OPTIONAL MATCH (u)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      OPTIONAL MATCH (u)-[:HAS_AI_PROFILE]->(ai:AIProfile)
      OPTIONAL MATCH (ai)-[:CURRENT_PERSONA]->(pv:PersonaVersion)
      OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
      RETURN 
        u.name AS userName,
        u.onboarding_completed AS onboardingCompleted,
        fro.id AS froId,
        fro.version AS froVersion,
        ai.id AS aiProfileId,
        pv.version AS personaVersion,
        count(DISTINCT c) AS competencyCount
    `, { userEmail: data.userEmail });
    
    const record = verifyResult.records[0];
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ INGESTÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Resumo:');
    console.log(`   👤 Usuário: ${record.get('userName')}`);
    console.log(`   ✅ Onboarding Completo: ${record.get('onboardingCompleted')}`);
    console.log(`   📋 FirstRunOnboarding ID: ${record.get('froId')}`);
    console.log(`   🤖 AIProfile ID: ${record.get('aiProfileId')}`);
    console.log(`   🧠 PersonaVersion: ${record.get('personaVersion')}`);
    console.log(`   💡 Competências: ${record.get('competencyCount')}`);
    console.log('');
    console.log('🔗 Estrutura criada:');
    console.log('   (:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(:FirstRunOnboarding)');
    console.log('   (:User)-[:HAS_AI_PROFILE]->(:AIProfile)');
    console.log('   (:FirstRunOnboarding)-[:INITIATES]->(:AIProfile)');
    console.log('   (:FirstRunOnboarding)-[:GENERATES]->(:PersonaVersion)');
    console.log('   (:AIProfile)-[:CURRENT_PERSONA]->(:PersonaVersion)');
    console.log('   (:User)-[:HAS_COMPETENCY]->(:Competency) x', record.get('competencyCount').toNumber());
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro na ingestão:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

// ============================================================================
// 🧹 FUNÇÃO DE LIMPEZA (caso precise resetar)
// ============================================================================

async function cleanupOnboarding(userEmail) {
  const session = driver.session();
  
  try {
    console.log(`🧹 Limpando onboarding do usuário: ${userEmail}`);
    
    // Remover PersonaVersion
    await session.run(`
      MATCH (pv:PersonaVersion {user_email: $userEmail})
      DETACH DELETE pv
    `, { userEmail });
    console.log('   ✅ PersonaVersion removida');
    
    // Remover AIProfile
    await session.run(`
      MATCH (ai:AIProfile {user_email: $userEmail})
      DETACH DELETE ai
    `, { userEmail });
    console.log('   ✅ AIProfile removido');
    
    // Remover FirstRunOnboarding
    await session.run(`
      MATCH (fro:FirstRunOnboarding {user_email: $userEmail})
      DETACH DELETE fro
    `, { userEmail });
    console.log('   ✅ FirstRunOnboarding removido');
    
    // Limpar dados de onboarding do User
    await session.run(`
      MATCH (u:User {email: $userEmail})
      REMOVE u.onboarding_completed, 
             u.onboarding_completed_at,
             u.profile_description,
             u.role_description,
             u.competencies,
             u.primary_objective
    `, { userEmail });
    console.log('   ✅ Dados de onboarding do User limpos');
    
    // Remover relacionamentos de competência (mas manter nós)
    await session.run(`
      MATCH (u:User {email: $userEmail})-[r:HAS_COMPETENCY]->()
      DELETE r
    `, { userEmail });
    console.log('   ✅ Relacionamentos de competência removidos');
    
    console.log('');
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

// ============================================================================
// 🎯 EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--cleanup')) {
      // Modo limpeza
      await cleanupOnboarding(onboardingData.userEmail);
    } else {
      // Modo ingestão
      await ingestFirstRunOnboarding(onboardingData);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await driver.close();
  }
}

main();
