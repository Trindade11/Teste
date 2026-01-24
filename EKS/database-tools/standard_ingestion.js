const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuração da API
const API_BASE = 'http://localhost:3002';

/**
 * Faz login na API e obtém token JWT
 */
async function login(email, password) {
  console.log('🔐 Fazendo login na API...');
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Login realizado com sucesso');
  console.log('🔑 Token obtido (primeiros 50 chars):', data.data?.accessToken?.substring(0, 50) + '...');
  return data.data.accessToken;
}

/**
 * Verifica status do banco via API
 */
async function checkDatabaseStatus(token) {
  console.log('🔍 Verificando status do banco...');
  
  const response = await fetch(`${API_BASE}/admin/ingest/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao verificar status: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📊 Status atual do banco:');
  console.log(`  👥 Usuários: ${data.nodeCounts?.User || 0}`);
  console.log(`  🏢 Departamentos: ${data.nodeCounts?.Department || 0}`);
  console.log(`  🏭 Organizações: ${data.nodeCounts?.Organization || 0}`);
  console.log(`  📍 Localizações: ${data.nodeCounts?.Location || 0}`);
  console.log(`  🔗 Relacionamentos: ${Object.values(data.relationshipCounts || {}).reduce((a, b) => a + b, 0)}`);
  
  return data;
}

/**
 * Faz upload do CSV via API (processo padrão do sistema)
 */
async function uploadCsvViaApi(csvPath, token) {
  console.log('📤 Enviando CSV via API...');
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado: ${csvPath}`);
  }

  // Criar FormData para upload
  const form = new FormData();
  const fileStream = fs.createReadStream(csvPath);
  form.append('file', fileStream, {
    filename: path.basename(csvPath),
    contentType: 'text/csv',
  });

  const response = await fetch(`${API_BASE}/admin/ingest/orgchart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload falhou: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('🎉 Upload processado com sucesso!');
  
  // Mostrar resultados
  console.log('\n📊 Resumo da ingestão:');
  console.log(`  📄 Linhas processadas: ${result.summary.totalRows}`);
  console.log(`  ✅ Usuários criados: ${result.summary.usersCreated}`);
  console.log(`  🔄 Usuários atualizados: ${result.summary.usersUpdated}`);
  console.log(`  🏢 Departamentos criados: ${result.summary.departmentsCreated}`);
  console.log(`  🏭 Organizações criadas: ${result.summary.organizationsCreated}`);
  console.log(`  📍 Localizações criadas: ${result.summary.locationsCreated}`);
  console.log(`  🔗 Relacionamentos criados: ${result.summary.relationshipsCreated}`);
  console.log(`  👥 REPORTS_TO criados: ${result.summary.reportsToCreated}`);
  console.log(`  ❌ Erros: ${result.summary.errors.length}`);

  if (result.summary.errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    result.summary.errors.forEach(error => {
      console.log(`  Linha ${error.row}: ${error.email} - ${error.error}`);
    });
  }

  return result;
}

/**
 * Função principal
 */
async function main() {
  try {
    const csvPath = process.argv[2] || 'Nodes_VF_sanitizado_fixed.csv';
    
    console.log('🚀 Iniciando processo de ingestão padrão do sistema...');
    console.log(`📁 Arquivo: ${csvPath}`);
    
    // 1. Fazer login com usuário admin
    const token = await login('usuario040@aurora.example', 'aurora123');
    
    // 2. Verificar status atual
    await checkDatabaseStatus(token);
    
    // 3. Fazer upload do CSV
    const result = await uploadCsvViaApi(csvPath, token);
    
    // 4. Verificar status final
    console.log('\n🔄 Verificando status final...');
    await checkDatabaseStatus(token);
    
    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('💡 Você pode acessar o frontend em http://localhost:3000');
    console.log('🔐 Login: usuario040@aurora.example / aurora123');
    
  } catch (error) {
    console.error('❌ Erro no processo:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  login,
  checkDatabaseStatus,
  uploadCsvViaApi,
};
