const fetch = require('node-fetch').default || require('node-fetch');

async function getAuthToken() {
  try {
    const response = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rodrigo.trindade@alocc.com.br',
        password: 'temp123'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Login successful!');
      return result.data.accessToken;
    } else {
      console.log('❌ Login failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function uploadFile(token) {
  const fs = require('fs');
  const FormData = require('form-data');
  
  const filePath = 'c:\\Users\\rodrigo.trindade\\Projetos\\Teste\\EKS\\Nodes_VF.csv';
  const uri = 'http://localhost:3002/admin/ingest/orgchart';

  try {
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    // Make request
    const response = await fetch(uri, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('Upload Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Upload successful!`);
      console.log(`📊 Summary:`);
      console.log(`   - Total rows: ${result.summary.totalRows}`);
      console.log(`   - Users created: ${result.summary.usersCreated}`);
      console.log(`   - Users updated: ${result.summary.usersUpdated}`);
      console.log(`   - Departments created: ${result.summary.departmentsCreated}`);
      console.log(`   - Organizations created: ${result.summary.organizationsCreated}`);
      console.log(`   - Locations created: ${result.summary.locationsCreated}`);
      console.log(`   - Relationships created: ${result.summary.relationshipsCreated}`);
      console.log(`   - Reports to relationships: ${result.summary.reportsToCreated}`);
      console.log(`   - Errors: ${result.summary.errors.length}`);
      
      if (result.summary.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.summary.errors.forEach(error => {
          console.log(`   Row ${error.row} (${error.email}): ${error.error}`);
        });
      }
    } else {
      console.log(`❌ Upload failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

async function main() {
  console.log('🔐 Getting auth token...');
  const token = await getAuthToken();
  
  if (token) {
    console.log('📤 Uploading CSV file...');
    await uploadFile(token);
  } else {
    console.log('❌ Could not get auth token. Upload cancelled.');
  }
}

main();
