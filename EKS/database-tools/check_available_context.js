/**
 * Verificar dados disponíveis no grafo para PIA
 * - Estrutura organizacional da empresa
 * - Dados do onboarding do usuário
 * - Departamentos, áreas, processos existentes
 */

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function checkAvailableContext() {
  const session = driver.session();
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('ANÁLISE DE CONTEXTO DISPONÍVEL PARA PIA');
    console.log('='.repeat(80));

    // 1. Estrutura Organizacional
    console.log('\n📊 1. ESTRUTURA ORGANIZACIONAL\n');
    
    const orgResult = await session.run(`
      MATCH (o:Organization)
      OPTIONAL MATCH (o)-[:HAS_DEPARTMENT]->(d:Department)
      OPTIONAL MATCH (d)-[:HAS_SUBDEPARTMENT]->(sd:Department)
      RETURN o.name AS org_name, o.type AS org_type, o.description AS org_description,
             collect(DISTINCT d.name) AS departments,
             collect(DISTINCT sd.name) AS subdepartments
    `);

    if (orgResult.records.length > 0) {
      const org = orgResult.records[0];
      console.log(`Organização: ${org.get('org_name')}`);
      console.log(`Tipo: ${org.get('org_type')}`);
      console.log(`Descrição: ${(org.get('org_description') || '').substring(0, 200)}...`);
      console.log(`Departamentos: ${org.get('departments').join(', ')}`);
      console.log(`Subdepartamentos: ${org.get('subdepartments').join(', ')}`);
    }

    // 2. Departamentos com detalhes
    console.log('\n📁 2. DEPARTAMENTOS DETALHADOS\n');
    
    const deptResult = await session.run(`
      MATCH (d:Department)
      OPTIONAL MATCH (d)<-[:MEMBER_OF]-(u:User)
      OPTIONAL MATCH (d)-[:REPORTS_TO]->(parent:Department)
      RETURN d.name AS dept_name, d.description AS description,
             count(DISTINCT u) AS member_count,
             parent.name AS parent_dept
      ORDER BY d.name
    `);

    deptResult.records.forEach(r => {
      console.log(`- ${r.get('dept_name')}`);
      console.log(`  Membros: ${r.get('member_count')}`);
      if (r.get('parent_dept')) console.log(`  Reporta a: ${r.get('parent_dept')}`);
      if (r.get('description')) console.log(`  Descrição: ${r.get('description').substring(0, 100)}...`);
    });

    // 3. Usuários com onboarding completo
    console.log('\n👥 3. USUÁRIOS COM ONBOARDING COMPLETO\n');
    
    const usersResult = await session.run(`
      MATCH (u:User)-[:COMPLETED_FIRST_RUN_ONBOARDING]->(fro:FirstRunOnboarding)
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
      OPTIONAL MATCH (u)-[:HAS_COMPETENCY]->(c:Competency)
      RETURN u.name AS name, u.email AS email, u.jobTitle AS job_title,
             d.name AS department,
             fro.role_description AS role_description,
             fro.primary_objective AS objective,
             fro.top_challenges AS challenges,
             collect(DISTINCT c.name) AS competencies
      ORDER BY u.name
    `);

    usersResult.records.forEach(r => {
      console.log(`\n📧 ${r.get('email')}`);
      console.log(`   Nome: ${r.get('name')}`);
      console.log(`   Cargo: ${r.get('job_title')}`);
      console.log(`   Departamento: ${r.get('department')}`);
      console.log(`   Objetivo: ${(r.get('objective') || '').substring(0, 100)}...`);
      console.log(`   Desafios: ${(r.get('challenges') || '').substring(0, 100)}...`);
      console.log(`   Competências: ${r.get('competencies').slice(0, 5).join(', ')}`);
      if (r.get('role_description')) {
        console.log(`   Descrição do papel: ${r.get('role_description').substring(0, 150)}...`);
      }
    });

    // 4. Processos já mapeados (se houver)
    console.log('\n🔄 4. PROCESSOS JÁ MAPEADOS\n');
    
    const processResult = await session.run(`
      MATCH (p:Process)
      OPTIONAL MATCH (p)-[:HAS_ACTIVITY]->(a:Activity)
      OPTIONAL MATCH (p)<-[:MAPPED_BY]-(pm:ProcessMapping)
      RETURN p.name AS process_name, p.description AS description,
             p.status AS status,
             count(DISTINCT a) AS activity_count,
             pm.mapped_by AS mapped_by
      ORDER BY p.name
    `);

    if (processResult.records.length === 0) {
      console.log('Nenhum processo mapeado ainda.');
    } else {
      processResult.records.forEach(r => {
        console.log(`- ${r.get('process_name')} (${r.get('activity_count')} atividades)`);
        console.log(`  Status: ${r.get('status')}`);
        if (r.get('mapped_by')) console.log(`  Mapeado por: ${r.get('mapped_by')}`);
      });
    }

    // 5. Handoffs existentes
    console.log('\n🤝 5. HANDOFFS EXISTENTES\n');
    
    const handoffResult = await session.run(`
      MATCH (u:User)-[h:HANDS_OFF]->(target)
      RETURN u.name AS from_user, type(h) AS rel_type, 
             labels(target) AS target_labels, 
             COALESCE(target.name, target.email) AS target_name,
             h.what AS what, h.when AS when_handoff
      LIMIT 20
    `);

    if (handoffResult.records.length === 0) {
      console.log('Nenhum handoff mapeado ainda.');
    } else {
      handoffResult.records.forEach(r => {
        console.log(`- ${r.get('from_user')} -> ${r.get('target_name')}`);
        console.log(`  O quê: ${r.get('what')}`);
        console.log(`  Quando: ${r.get('when_handoff')}`);
      });
    }

    // 6. Regras de negócio
    console.log('\n📜 6. REGRAS DE NEGÓCIO\n');
    
    const rulesResult = await session.run(`
      MATCH (br:BusinessRule)
      OPTIONAL MATCH (a:Activity)-[:GOVERNED_BY]->(br)
      RETURN br.name AS rule_name, br.description AS description,
             collect(DISTINCT a.name) AS activities
      LIMIT 10
    `);

    if (rulesResult.records.length === 0) {
      console.log('Nenhuma regra de negócio mapeada ainda.');
    } else {
      rulesResult.records.forEach(r => {
        console.log(`- ${r.get('rule_name')}`);
        console.log(`  Descrição: ${r.get('description')}`);
        console.log(`  Atividades: ${r.get('activities').join(', ')}`);
      });
    }

    // 7. Resumo estatístico
    console.log('\n📈 7. RESUMO ESTATÍSTICO\n');
    
    const statsResult = await session.run(`
      MATCH (n)
      WITH labels(n) AS labels
      UNWIND labels AS label
      WITH label, count(*) AS count
      WHERE label IN ['User', 'Department', 'Organization', 'Process', 'Activity', 
                      'BusinessRule', 'FirstRunOnboarding', 'AIProfile', 'PersonaVersion', 
                      'Competency', 'ProcessMapping']
      RETURN label, count
      ORDER BY count DESC
    `);

    console.log('Contagem de nodes por tipo:');
    statsResult.records.forEach(r => {
      console.log(`  ${r.get('label')}: ${r.get('count')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('FIM DA ANÁLISE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkAvailableContext();
