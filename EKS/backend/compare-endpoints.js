require('dotenv').config();

// Testar endpoints que funcionam vs o que não funciona
async function compareEndpoints() {
  try {
    console.log('🔍 Comparando endpoints...\n');
    
    // 1. Testar endpoint que funciona (ontology/stats)
    console.log('1️⃣ Testando /ontology/stats (deve funcionar):');
    try {
      const response1 = await fetch('http://localhost:3002/ontology/stats');
      console.log(`   Status: ${response1.status}`);
      const data1 = await response1.json();
      console.log(`   ✅ Funcionou! Labels: ${data1.labels?.length || 0}`);
    } catch (e) {
      console.log(`   ❌ Erro: ${e.message}`);
    }
    
    // 2. Testar endpoint que não funciona (documents/linkable-entities)
    console.log('\n2️⃣ Testando /documents/linkable-entities (não funciona):');
    try {
      const response2 = await fetch('http://localhost:3002/documents/linkable-entities');
      console.log(`   Status: ${response2.status}`);
      const data2 = await response2.json();
      console.log(`   ❌ Erro: ${data2.error}`);
    } catch (e) {
      console.log(`   ❌ Erro: ${e.message}`);
    }
    
    // 3. Verificar se o problema está na rota documents em geral
    console.log('\n3️⃣ Testando /documents (listar documentos):');
    try {
      const response3 = await fetch('http://localhost:3002/documents');
      console.log(`   Status: ${response3.status}`);
      const data3 = await response3.json();
      console.log(`   Status: ${data3.success ? '✅ Funcionou!' : '❌ Erro: ' + data3.error}`);
    } catch (e) {
      console.log(`   ❌ Erro: ${e.message}`);
    }
    
    // 4. Verificar se é autenticação específica
    console.log('\n4️⃣ Testando /documents/linkable-entities COM Authorization header vazio:');
    try {
      const response4 = await fetch('http://localhost:3002/documents/linkable-entities', {
        headers: {
          'Authorization': 'Bearer fake-token-just-to-test'
        }
      });
      console.log(`   Status: ${response4.status}`);
      const data4 = await response4.json();
      console.log(`   Status: ${data4.success ? '✅ Funcionou!' : '❌ Erro: ' + data4.error}`);
    } catch (e) {
      console.log(`   ❌ Erro: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

compareEndpoints();
