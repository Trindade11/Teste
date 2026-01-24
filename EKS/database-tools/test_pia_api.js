const fetch = require('node-fetch');

async function testPiaEndpoint() {
  try {
    // 1. Login para pegar token
    const loginRes = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usuario040@aurora.example',
        password: 'aurora123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data?.accessToken) {
      console.error('Falha no login:', loginData);
      return;
    }

    console.log('Login OK. Token obtido.');

    // 2. Chamar endpoint PIA
    const piaRes = await fetch('http://localhost:3002/pia/organizational-structure', {
      headers: { 
        'Authorization': `Bearer ${loginData.data.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const piaData = await piaRes.json();
    console.log('\n--- DADOS PIA ---');
    console.log(JSON.stringify(piaData, null, 2));

  } catch (err) {
    console.error('Erro:', err);
  }
}

testPiaEndpoint();
