require('dotenv').config();

// Teste direto do endpoint sem dependências do frontend
async function testLinkableEntities() {
  try {
    console.log('🔍 Testando endpoint GET /documents/linkable-entities...\n');
    
    const response = await fetch('http://localhost:3002/documents/linkable-entities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Adicionando headers de autenticação se necessário
        // 'Authorization': 'Bearer seu-token'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📦 Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\n✅ Resposta JSON:', JSON.stringify(data, null, 2));
    
    // Verificar se há projetos
    if (data.success && data.entities) {
      const projects = data.entities.filter(e => e.type === 'project');
      console.log(`\n📂 Projetos encontrados: ${projects.length}`);
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (id: ${project.id}, status: ${project.status})`);
      });
    } else {
      console.log('\n❌ Resposta não contém projetos ou falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testLinkableEntities();
