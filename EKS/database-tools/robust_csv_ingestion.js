const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j+ssc://af132785.databases.neo4j.io',
  neo4j.auth.basic('neo4j', '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A')
);

/**
 * Detecta e corrige encoding de arquivos CSV
 * @param {string} filePath - Caminho do arquivo CSV
 * @returns {string} - Conteúdo corrigido em UTF-8
 */
function detectAndFixEncoding(filePath) {
  console.log('🔍 Detectando encoding do arquivo...');
  
  // Ler arquivo como buffer
  const buffer = fs.readFileSync(filePath);
  
  // Tentar diferentes encodings
  const encodings = ['utf8', 'latin1', 'cp1252'];
  let content = null;
  let detectedEncoding = null;
  
  for (const encoding of encodings) {
    try {
      const testContent = buffer.toString(encoding);
      
      // Verificar se há caracteres corrompidos comuns
      const hasCorruptedChars = /|[\x80-\x9F]/.test(testContent);
      
      if (!hasCorruptedChars || testContent.includes('Execução') || testContent.includes('Finanças')) {
        content = testContent;
        detectedEncoding = encoding;
        console.log(`✅ Encoding detectado: ${encoding}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!content) {
    // Usar latin1 como fallback
    content = buffer.toString('latin1');
    detectedEncoding = 'latin1';
    console.log('⚠️ Usando fallback: latin1');
  }
  
  // Correções específicas para caracteres problemáticos
  const corrections = {
    'Execuo': 'Execução',
    'Finanas': 'Finanças',
    'Portiflio': 'Portfólio',
    'Jurdico': 'Jurídico',
    'Alocao': 'Alocação',
    'Estratgico': 'Estratégico',
    'Governana': 'Governança',
    'Operao': 'Operação',
    'Coord': 'Coord',
    'Frum': 'Fórum',
    'Direo': 'Direção',
    'Sul': 'Sul',
    'Norte': 'Norte',
    'Leste': 'Leste',
    'Oeste': 'Oeste'
  };
  
  // Aplicar correções
  let correctedContent = content;
  Object.entries(corrections).forEach(([wrong, correct]) => {
    correctedContent = correctedContent.replace(new RegExp(wrong, 'g'), correct);
  });
  
  console.log('🔧 Encoding corrigido e caracteres especiais normalizados');
  return correctedContent;
}

/**
 * Processa ingestão de CSV com tratamento de encoding
 * @param {string} csvFilePath - Caminho do arquivo CSV
 */
async function ingestCsvWithEncodingFix(csvFilePath) {
  const session = driver.session();
  
  try {
    console.log('📥 Iniciando ingestão robusta de CSV...');
    
    // Detectar e corrigir encoding
    const csvContent = detectAndFixEncoding(csvFilePath);
    
    // Salvar versão corrigida para verificação
    const correctedPath = csvFilePath.replace('.csv', '_encoding_fixed.csv');
    fs.writeFileSync(correctedPath, csvContent, 'utf8');
    console.log(`💾 Versão corrigida salva: ${correctedPath}`);
    
    // Processar CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio ou inválido');
    }
    
    // Parse header
    const header = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 Colunas detectadas:', header);
    
    // Processar linhas de dados
    const dataLines = lines.slice(1);
    console.log(`📊 Processando ${dataLines.length} registros...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i].trim();
        if (!line) continue;
        
        // Parse CSV com tratamento de aspas
        const values = parseCsvLine(line);
        
        if (values.length >= header.length) {
          const record = {};
          header.forEach((col, index) => {
            record[col] = values[index] ? values[index].trim() : '';
          });
          
          // Criar nó Person
          const result = await session.run(`
            MERGE (p:Person {email: $email})
            ON CREATE SET 
              p.id = randomUUID(),
              p.name = $name,
              p.company = $company,
              p.jobTitle = $jobTitle,
              p.department = $department,
              p.access = $access,
              p.relationshipType = $relationshipType,
              p.accessTypes = $accessTypes,
              p.location = $location,
              p.email = $email,
              p.status = $status,
              p.role = $role,
              p.managerEmail = $managerEmail,
              p.createdAt = datetime()
            ON MATCH SET 
              p.name = $name,
              p.company = $company,
              p.jobTitle = $jobTitle,
              p.department = $department,
              p.access = $access,
              p.relationshipType = $relationshipType,
              p.accessTypes = $accessTypes,
              p.location = $location,
              p.status = $status,
              p.role = $role,
              p.managerEmail = $managerEmail,
              p.updatedAt = datetime()
            RETURN p.name AS name, p.email AS email
          `, record);
          
          if (result.records.length > 0) {
            const person = result.records[0];
            console.log(`✅ [${i + 1}/${dataLines.length}] ${person.get('name')} - ${person.get('email')}`);
            successCount++;
          }
          
          // Criar relacionamento com gerente se existir
          if (record.managerEmail && record.managerEmail && record.managerEmail !== record.email) {
            await session.run(`
              MATCH (p:Person {email: $email})
              MATCH (m:Person {email: $managerEmail})
              MERGE (p)-[:REPORTS_TO]->(m)
            `, {
              email: record.email,
              managerEmail: record.managerEmail
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro na linha ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`🎉 Ingestão concluída!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Erro geral na ingestão:', error.message);
  } finally {
    await session.close();
  }
}

/**
 * Parse CSV line com tratamento de aspas e separadores
 */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Função principal
 */
async function main() {
  try {
    const csvPath = process.argv[2] || 'Nodes_VF_sanitizado.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Arquivo não encontrado:', csvPath);
      console.log('💡 Uso: node robust_csv_ingestion.js [arquivo.csv]');
      return;
    }
    
    await ingestCsvWithEncodingFix(csvPath);
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  } finally {
    await driver.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ingestCsvWithEncodingFix,
  detectAndFixEncoding,
  parseCsvLine
};
