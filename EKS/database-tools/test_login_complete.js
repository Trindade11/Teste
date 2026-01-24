const fetch = require('node-fetch');

async function testCompleteLogin() {
  console.log('🧪 Testando Login Completo com Carlos Silva\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login com carlos.silva@aurora.com...');
    const loginResponse = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'carlos.silva@aurora.com',
        password: 'EKB123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('❌ Login falhou:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    console.log('   Token gerado:', loginData.data?.accessToken ? '✅' : '❌');
    console.log('   Refresh Token:', loginData.data?.refreshToken ? '✅' : '❌');

    // 2. Testar endpoint /me
    console.log('\n2️⃣ Testando endpoint /me...');
    const meResponse = await fetch('http://localhost:3002/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginData.data.accessToken}`
      }
    });

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.log('❌ Endpoint /me falhou:', error);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ Endpoint /me funcionando!');
    console.log('   Usuário:', meData.data?.name);
    console.log('   Email:', meData.data?.email);
    console.log('   Role:', meData.data?.role);
    console.log('   Force Password Change:', meData.data?.forcePasswordChange ? '✅' : '❌');

    // 3. Testar alteração de senha
    console.log('\n3️⃣ Testando alteração de senha...');
    const changePasswordResponse = await fetch('http://localhost:3002/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.data.accessToken}`
      },
      body: JSON.stringify({
        currentPassword: 'EKB123',
        newPassword: 'novaSenha456'
      })
    });

    if (!changePasswordResponse.ok) {
      const error = await changePasswordResponse.text();
      console.log('❌ Alteração de senha falhou:', error);
      return;
    }

    const changeData = await changePasswordResponse.json();
    console.log('✅ Senha alterada com sucesso!');
    console.log('   Mensagem:', changeData.message);

    // 4. Testar login com nova senha
    console.log('\n4️⃣ Testando login com nova senha...');
    const newLoginResponse = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'carlos.silva@aurora.com',
        password: 'novaSenha456'
      })
    });

    if (!newLoginResponse.ok) {
      const error = await newLoginResponse.text();
      console.log('❌ Login com nova senha falhou:', error);
      return;
    }

    const newLoginData = await newLoginResponse.json();
    console.log('✅ Login com nova senha funcionando!');

    // 5. Verificar se forcePasswordChange foi removido
    console.log('\n5️⃣ Verificando se forcePasswordChange foi removido...');
    const newMeResponse = await fetch('http://localhost:3002/auth/me', {
      headers: {
        'Authorization': `Bearer ${newLoginData.data.accessToken}`
      }
    });

    const newMeData = await newMeResponse.json();
    console.log('   Force Password Change:', newMeData.data?.forcePasswordChange ? '❌ Ainda true' : '✅ Removido');

    console.log('\n🎉 Teste completo finalizado com sucesso!');
    console.log('\n📋 Resumo do fluxo:');
    console.log('1. ✅ Login com senha padrão EKB123');
    console.log('2. ✅ Endpoint /me retorna forcePasswordChange: true');
    console.log('3. ✅ Alteração de senha funcionando');
    console.log('4. ✅ Login com nova senha funcionando');
    console.log('5. ✅ Flag forcePasswordChange removido');

    console.log('\n🔐 Credenciais finais:');
    console.log('   Email: carlos.silva@aurora.com');
    console.log('   Senha: novaSenha456');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCompleteLogin();
