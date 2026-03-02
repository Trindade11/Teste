require('dotenv').config();

// Teste com token simulado para ver se o endpoint funciona quando autenticado
async function testWithToken() {
  try {
    console.log('🔍 Testando endpoint COM token simulado...\n');
    
    // Primeiro, vamos tentar fazer login para pegar um token real
    console.log('🔑 Tentando fazer login...');
    
    const loginResponse = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@cvc.com.br', // usuário padrão
        password: 'admin123'        // senha padrão (ajustar se necessário)
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`📊 Login Status: ${loginResponse.status}`);
    console.log('📦 Login Response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success && loginData.data?.accessToken) {
      const token = loginData.data.accessToken;
      console.log('✅ Token obtido com sucesso!');
      
      // Agora testa o linkable-entities com o token
      console.log('\n🔍 Testando /documents/linkable-entities COM token...');
      
      const response = await fetch('http://localhost:3002/documents/linkable-entities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log('\n✅ Resposta JSON:', JSON.stringify(data, null, 2));
      
      if (data.success && data.entities) {
        const projects = data.entities.filter(e => e.type === 'project');
        console.log(`\n📂 Projetos encontrados: ${projects.length}`);
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (id: ${project.id}, status: ${project.status})`);
        });
      }
      
    } else {
      console.log('❌ Falha no login - tentando token mock...');
      
      // Se falhar o login, tenta com um token mock para ver se o endpoint funciona
      const mockToken = 'mock-token-for-testing';
      
      const response = await fetch('http://localhost:3002/documents/linkable-entities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
      
      console.log(`📊 Status com token mock: ${response.status}`);
      const data = await response.json();
      console.log('📦 Resposta com token mock:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testWithToken();
