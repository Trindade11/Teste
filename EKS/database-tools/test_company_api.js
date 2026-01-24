const fetch = require('node-fetch');

const API_URL = 'http://localhost:3002';

async function testCompanyAPI() {
  console.log('🧪 Testando API de Descrição da Empresa\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'carlos.silva@aurora.com',
        password: 'aurora123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Obter perfil atual
    console.log('2️⃣ Obtendo perfil atual...');
    const getResponse = await fetch(`${API_URL}/company/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const getCurrentData = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Resposta:', JSON.stringify(getCurrentData, null, 2));
    console.log('');

    // 3. Salvar perfil
    console.log('3️⃣ Salvando perfil da empresa...');
    const profileData = {
      name: 'Aurora Corretora',
      description: 'Corretora de seguros especializada em soluções personalizadas para empresas e pessoas físicas.',
      industry: 'Serviços Financeiros',
      size: '51-200',
      mission: 'Proteger o patrimônio e o futuro de nossos clientes com soluções de seguros personalizadas e atendimento de excelência.',
      vision: 'Ser a corretora de seguros mais confiável e inovadora do mercado brasileiro.',
      values: ['Integridade', 'Inovação', 'Excelência', 'Compromisso com o Cliente']
    };

    const saveResponse = await fetch(`${API_URL}/company/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    console.log('Status:', saveResponse.status);
    
    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.log('❌ Erro na resposta:', errorText);
      throw new Error(`Erro ao salvar: ${saveResponse.status}`);
    }

    const saveData = await saveResponse.json();
    console.log('✅ Perfil salvo com sucesso!');
    console.log('Resposta:', JSON.stringify(saveData, null, 2));
    console.log('');

    // 4. Verificar se foi salvo
    console.log('4️⃣ Verificando se foi salvo...');
    const verifyResponse = await fetch(`${API_URL}/company/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('Perfil recuperado:', JSON.stringify(verifyData, null, 2));
    console.log('');

    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testCompanyAPI();
