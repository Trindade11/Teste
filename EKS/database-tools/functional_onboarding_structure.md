# 🏗️ Estrutura do Functional Onboarding para Ingestão Manual

## 📋 **O que será Criado no Neo4j**

Quando o usuário 040 preencher o Functional Onboarding, o sistema criará:

### **👤 Nodes Principais**
```cypher
// Usuário (já existe)
(:User {email: 'usuario040@aurora.example', name: 'Pessoa 040'})

// Processos (novos)
(:Process {name: '[nome_processo]', owner_id: 'usuario040@aurora.example'})

// Atividades (novas)
(:Activity {name: '[nome_atividade]', process_name: '[nome_processo]'})

// Regras de Negócio (novas)
(:BusinessRule {name: '[nome_regra]', source_user_id: 'usuario040@aurora.example'})

// Gamification (novo)
(:GamificationScore {user_email: 'usuario040@aurora.example'})
```

### **🔗 Relacionamentos**
```cypher
// Conexões existentes + novas
(:User)-[:WORKS_AT]->(:Department)
(:Department)-[:HAS_PROCESS]->(:Process)
(:Process)-[:HAS_ACTIVITY]->(:Activity)
(:Activity)-[:GOVERNED_BY]->(:BusinessRule)
(:User)-[:HANDS_OFF]->(:Activity)
(:Activity)-[:TO]->(:Person)
(:User)-[:HAS_SCORE]->(:GamificationScore)
```

---

## 📝 **Estrutura de Dados para Ingestão**

### **1. Dados do Usuário**
```javascript
// Já existe no sistema
const userData = {
  email: 'usuario040@aurora.example',
  name: 'Pessoa 040',
  jobTitle: 'Coord. de Projetos',
  department: 'Plataforma'
};
```

### **2. Respostas do Functional Onboarding**
```javascript
// Exemplo de estrutura que será capturada do frontend
const onboardingData = {
  user: 'usuario040@aurora.example',
  
  // Etapa 2: Áreas de interface
  interfaceAreas: ['Execução', 'Clientes', 'Produtos', 'Sistemas'],
  
  // Etapa 3: Processos principais
  processes: [
    {
      name: 'Planejamento de Projetos',
      description: 'Processo completo de planejamento desde demanda até início',
      area: 'Plataforma'
    },
    {
      name: 'Acompanhamento de Entregas',
      description: 'Monitoramento e controle do progresso dos projetos',
      area: 'Plataforma'
    },
    // ... outros processos
  ],
  
  // Etapa 4: Atividades por processo
  activities: {
    'Planejamento de Projetos': [
      {
        name: 'Receber demanda',
        sequence: 1,
        duration: 30,
        description: 'Receber e analisar demanda inicial'
      },
      {
        name: 'Analisar escopo',
        sequence: 2,
        duration: 60,
        description: 'Analisar viabilidade e definir escopo'
      },
      // ... outras atividades
    ]
    // ... outros processos
  },
  
  // Etapa 5-6: Handoffs
  handoffs: [
    {
      from_activity: 'Receber demanda',
      to_person: 'Pessoa 025',
      to_department: 'Execução',
      what: 'demanda validada',
      when: 'após análise inicial',
      how: 'email + sistema'
    },
    // ... outros handoffs
  ],
  
  // Etapa 7: Regras de negócio
  businessRules: [
    {
      name: 'Aprovação Conselho para Grandes Projetos',
      condition: 'project_value > 50000',
      action: 'require_conselho_approval()',
      confidence: 0.95,
      activity: 'Analisar escopo'
    },
    // ... outras regras
  ],
  
  // Gamification
  gamification: {
    total_points: 185,
    badges: ['Mapeador Funcional'],
    processes_mapped: 5,
    activities_mapped: 25,
    handoffs_validated: 8,
    rules_extracted: 4,
    quality_score: 0.92
  }
};
```

---

## 🔧 **Script de Ingestão (Template)**

### **Para usar quando o usuário preencher:**
```javascript
// functional_onboarding_ingest.js (template pronto para usar)
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function ingestFunctionalOnboarding(data) {
  const session = driver.session();
  
  try {
    console.log('🚀 Ingerindo Functional Onboarding do usuário:', data.user);
    
    // 1. Conectar usuário a áreas de interface
    for (const area of data.interfaceAreas) {
      await session.run(`
        MATCH (u:User {email: $userEmail})
        MATCH (d:Department {name: $areaName})
        MERGE (u)-[:WORKS_AT {interface: true}]->(d)
      `, { userEmail: data.user, areaName: area });
    }
    
    // 2. Criar processos
    for (const process of data.processes) {
      await session.run(`
        MATCH (d:Department {name: $area})
        MERGE (p:Process {name: $name, owner_id: $owner})
        SET p.description = $description,
            p.area = $area,
            p.status = 'active',
            p.created_at = datetime()
        MERGE (d)-[:HAS_PROCESS]->(p)
      `, { 
        name: process.name, 
        description: process.description,
        area: process.area,
        owner: data.user
      });
    }
    
    // 3. Criar atividades
    for (const [processName, activities] of Object.entries(data.activities)) {
      for (const activity of activities) {
        await session.run(`
          MATCH (p:Process {name: $processName})
          MERGE (a:Activity {name: $activityName, process_name: $processName})
          SET a.description = $description,
              a.sequence_order = $sequence,
              a.duration_estimate = $duration,
              a.created_at = datetime()
          MERGE (p)-[:HAS_ACTIVITY]->(a)
        `, {
          processName: processName,
          activityName: activity.name,
          description: activity.description,
          sequence: activity.sequence,
          duration: activity.duration
        });
      }
    }
    
    // 4. Criar regras de negócio
    for (const rule of data.businessRules) {
      await session.run(`
        MATCH (a:Activity {name: $activityName})
        MERGE (br:BusinessRule {name: $ruleName})
        SET br.condition = $condition,
            br.action = $action,
            br.confidence = $confidence,
            br.source_user_id = $userId,
            br.status = 'validated',
            br.created_at = datetime()
        MERGE (a)-[:GOVERNED_BY]->(br)
      `, {
        activityName: rule.activity,
        ruleName: rule.name,
        condition: rule.condition,
        action: rule.action,
        confidence: rule.confidence,
        userId: data.user
      });
    }
    
    // 5. Criar handoffs
    for (const handoff of data.handoffs) {
      await session.run(`
        MATCH (u:User {email: $userEmail})
        MATCH (a:Activity {name: $activityName})
        MATCH (p:Person {name: $personName})
        MERGE (u)-[ho:HANDS_OFF {
          what: $what,
          when: $when,
          how: $how,
          status: 'validated',
          average_duration: 30
        }]->(a)
        MERGE (a)-[:TO]->(p)
      `, {
        userEmail: data.user,
        activityName: handoff.from_activity,
        personName: handoff.to_person,
        what: handoff.what,
        when: handoff.when,
        how: handoff.how
      });
    }
    
    // 6. Criar gamification
    await session.run(`
      MATCH (u:User {email: $userEmail})
      MERGE (g:GamificationScore {user_email: $userEmail})
      SET g.total_points = $points,
          g.badges = $badges,
          g.processes_mapped = $processes,
          g.activities_mapped = $activities,
          g.handoffs_validated = $handoffs,
          g.rules_extracted = $rules,
          g.quality_score = $quality,
          g.updated_at = datetime()
      MERGE (u)-[:HAS_SCORE]->(g)
    `, {
      userEmail: data.user,
      points: data.gamification.total_points,
      badges: data.gamification.badges,
      processes: data.gamification.processes_mapped,
      activities: data.gamification.activities_mapped,
      handoffs: data.gamification.handoffs_validated,
      rules: data.gamification.rules_extracted,
      quality: data.gamification.quality_score
    });
    
    console.log('✅ Functional Onboarding ingerido com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na ingestão:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Uso:
// ingestFunctionalOnboarding(onboardingData);
```

---

## 🎯 **Fluxo Completo**

### **1. Frontend (onde usuário preenche)**
- Exibe textos do `functional_onboarding_texts.md`
- Captura respostas em estrutura JSON
- Valida dados antes de enviar

### **2. Backend (processamento)**
- Recebe JSON do frontend
- Executa script de ingestão acima
- Retorna confirmação e resumo

### **3. Neo4j (resultado final)**
- Nodes criados conforme estrutura
- Relacionamentos estabelecidos
- Dados prontos para consultas

### **4. Dashboard (visualização)**
- Mapa funcional do usuário
- Métricas e gamification
- Conexões organizacionais

---

## 📊 **Exemplo de Resultado no Neo4j**

Após o usuário 040 preencher, teremos:

```cypher
// Consulta para verificar resultado
MATCH (u:User {email: 'usuario040@aurora.example'})
OPTIONAL MATCH (u)-[:WORKS_AT]->(d:Department)
OPTIONAL MATCH (d)-[:HAS_PROCESS]->(p:Process)
OPTIONAL MATCH (p)-[:HAS_ACTIVITY]->(a:Activity)
OPTIONAL MATCH (a)-[:GOVERNED_BY]->(br:BusinessRule)
OPTIONAL MATCH (u)-[:HANDS_OFF]->(h)
RETURN 
  count(DISTINCT d) AS departments,
  count(DISTINCT p) AS processes,
  count(DISTINCT a) AS activities,
  count(DISTINCT br) AS business_rules,
  count(DISTINCT h) AS handoffs
```

**Resultado esperado:**
- departments: 4+ (Plataforma + interfaces)
- processes: 3-5 (conforme resposta)
- activities: 15-25 (conforme detalhamento)
- business_rules: 3-7 (conforme extração)
- handoffs: 5-10 (conforme mapeamento)

---

## 🚀 **Pronto para Uso**

**Agora você tem:**
1. ✅ **Textos prontos** para o frontend
2. ✅ **Estrutura definida** para ingestão
3. ✅ **Script template** para processamento
4. ✅ **Ambiente limpo** no Neo4j

**Basta implementar no frontend e usar quando o usuário 040 preencher!** 🎯
