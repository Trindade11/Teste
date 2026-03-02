// Script para rodar no CONSOLE DO NAVEGADOR
// Copie e cole este código no console do navegador quando estiver logado

console.log('🔍 Verificando token no frontend...\n');

// 1. Verificar localStorage
console.log('1️⃣ Tokens no localStorage:');
console.log('accessToken:', localStorage.getItem('accessToken') ? '✅ Existe' : '❌ Não existe');
console.log('refreshToken:', localStorage.getItem('refreshToken') ? '✅ Existe' : '❌ Não existe');

// 2. Testar API diretamente do navegador
console.log('\n2️⃣ Testando API do navegador:');

async function testFromBrowser() {
  try {
    const token = localStorage.getItem('accessToken');
    console.log('Token disponível:', !!token);
    
    if (token) {
      // Testar com token real
      const response = await fetch('http://localhost:3002/documents/linkable-entities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log('Resposta:', data);
      
      if (data.success && data.entities) {
        const projects = data.entities.filter(e => e.type === 'project');
        console.log(`✅ Projetos encontrados: ${projects.length}`);
        projects.forEach(p => console.log(`   - ${p.name}`));
      }
    } else {
      console.log('❌ Nenhum token encontrado no localStorage');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testFromBrowser();

console.log('\n💡 Se não houver token, faça login novamente.');
console.log('💡 Se houver token mas ainda falhar, o problema é no formato do token.');
