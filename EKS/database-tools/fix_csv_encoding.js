const fs = require('fs');
const path = require('path');

// Função para corrigir encoding do CSV
function fixCsvEncoding() {
  const inputFile = 'Nodes_VF_sanitizado.csv';
  const outputFile = 'Nodes_VF_sanitizado_corrigido.csv';
  
  try {
    console.log('🔧 Lendo arquivo com encoding problemático...');
    
    // Ler arquivo como buffer para detectar encoding
    const buffer = fs.readFileSync(inputFile);
    
    // Tentar ler como Latin-1 (Windows-1252) que é comum em CSVs do Windows
    let content = buffer.toString('latin1');
    
    // Correções específicas para caracteres problemáticos
    const corrections = {
      'Execuo': 'Execução',
      'Finanas': 'Finanças', 
      'Portiflio': 'Portfólio',
      'Jurdico': 'Jurídico',
      'Alocao': 'Alocação',
      'Coordenador': 'Coordenador',
      'Estratgico': 'Estratégico',
      'Governana': 'Governança',
      'Operao': 'Operação',
      'Unidade': 'Unidade',
      'Onboarding': 'Onboarding',
      'Backoffice': 'Backoffice',
      'Controles': 'Controles',
      'Clientes': 'Clientes',
      'Produtos': 'Produtos',
      'Plataforma': 'Plataforma',
      'Administrativo': 'Administrativo',
      'Sistemas': 'Sistemas',
      'Conselho': 'Conselho',
      'Frum': 'Fórum',
      'Ecossistema': 'Ecossistema',
      'Direo': 'Direção'
    };
    
    // Aplicar correções
    let correctedContent = content;
    Object.entries(corrections).forEach(([wrong, correct]) => {
      correctedContent = correctedContent.replace(new RegExp(wrong, 'g'), correct);
    });
    
    // Salvar arquivo corrigido como UTF-8
    fs.writeFileSync(outputFile, correctedContent, 'utf8');
    
    console.log('✅ Arquivo corrigido salvo como:', outputFile);
    console.log('🔍 Primeiras linhas do arquivo corrigido:');
    
    // Mostrar primeiras linhas
    const lines = correctedContent.split('\n').slice(0, 5);
    lines.forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo:', error.message);
  }
}

// Função para criar script de ingestão melhorado
function createImprovedIngestionScript() {
  const scriptContent = `
const neo4j = require('neo4j-driver');
const fs = require('fs');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

async function ingestUsersFromCsv() {
  const session = driver.session();
  
  try {
    console.log('📥 Iniciando ingestão do CSV corrigido...');
    
    // Ler arquivo CSV corrigido com encoding UTF-8
    const csvContent = fs.readFileSync('Nodes_VF_sanitizado_corrigido.csv', 'utf8');
    const lines = csvContent.split('\\n').filter(line => line.trim());
    
    // Pular header
    const header = lines[0].split(';');
    const dataLines = lines.slice(1);
    
    console.log(\`📊 Processando \${dataLines.length} registros...\`);
    
    for (let i = 0; i < dataLines.length; i++) {
      const values = dataLines[i].split(';');
      
      if (values.length >= 12) {
        const [name, company, jobTitle, department, access, relationshipType, accessTypes, location, email, status, role, managerEmail] = values;
        
        // Criar nó Person
        const result = await session.run(\`
          MERGE (p:Person {email: \$email})
          ON CREATE SET 
            p.id = randomUUID(),
            p.name = \$name,
            p.company = \$company,
            p.jobTitle = \$jobTitle,
            p.department = \$department,
            p.access = \$access,
            p.relationshipType = \$relationshipType,
            p.accessTypes = \$accessTypes,
            p.location = \$location,
            p.email = \$email,
            p.status = \$status,
            p.role = \$role,
            p.managerEmail = \$managerEmail,
            p.createdAt = datetime()
          ON MATCH SET 
            p.name = \$name,
            p.company = \$company,
            p.jobTitle = \$jobTitle,
            p.department = \$department,
            p.access = \$access,
            p.relationshipType = \$relationshipType,
            p.accessTypes = \$accessTypes,
            p.location = \$location,
            p.status = \$status,
            p.role = \$role,
            p.managerEmail = \$managerEmail,
            p.updatedAt = datetime()
          RETURN p.name AS name, p.email AS email
        \`, {
          name: name.trim(),
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          department: department.trim(),
          access: access.trim(),
          relationshipType: relationshipType.trim(),
          accessTypes: accessTypes.trim(),
          location: location.trim(),
          email: email.trim(),
          status: status.trim(),
          role: role.trim(),
          managerEmail: managerEmail.trim()
        });
        
        if (result.records.length > 0) {
          const person = result.records[0];
          console.log(\`✅ [\${i + 1}/\${dataLines.length}] \${person.get('name')} - \${person.get('email')}\`);
        }
        
        // Criar relacionamento com gerente se existir
        if (managerEmail && managerEmail.trim() && managerEmail.trim() !== email.trim()) {
          await session.run(\`
            MATCH (p:Person {email: \$email})
            MATCH (m:Person {email: \$managerEmail})
            MERGE (p)-[:REPORTS_TO]->(m)
          \`, {
            email: email.trim(),
            managerEmail: managerEmail.trim()
          });
        }
      }
    }
    
    console.log('🎉 Ingestão concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na ingestão:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

ingestUsersFromCsv();
`;
  
  fs.writeFileSync('ingest_users_improved.js', scriptContent);
  console.log('📝 Script de ingestão melhorado criado: ingest_users_improved.js');
}

// Executar correção
fixCsvEncoding();
createImprovedIngestionScript();
