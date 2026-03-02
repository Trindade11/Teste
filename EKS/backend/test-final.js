require('dotenv').config();

// Teste final do endpoint sem autenticação
async function testFinal() {
  try {
    console.log('🔍 Testando final do endpoint...\n');
    
    const response = await fetch('http://localhost:3002/documents/linkable-entities');
    console.log(`📊 Status: ${response.status}`);
    
    const data = await response.json();
    console.log('\n✅ Resposta JSON:', JSON.stringify(data, null, 2));
    
    if (data.success && data.entities) {
      const projects = data.entities.filter(e => e.type === 'project');
      console.log(`\n📂 Projetos encontrados: ${projects.length}`);
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (id: ${project.id}, status: ${project.status})`);
      });
      
      if (projects.length > 0) {
        console.log('\n🎉 O frontend agora deve mostrar os projetos no dropdown!');
      }
    } else {
      console.log('\n❌ Resposta inesperada:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testFinal();
