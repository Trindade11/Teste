const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch').default || require('node-fetch');

const filePath = 'c:\\Users\\rodrigo.trindade\\Projetos\\Teste\\EKS\\Nodes_VF.csv';
const uri = 'http://localhost:3002/admin/ingest/orgchart';

async function uploadFile() {
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
        'Authorization': 'Bearer admin-token'
      }
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Upload successful!`);
      console.log(`📊 Summary:`);
      console.log(`   - Total rows: ${result.summary.totalRows}`);
      console.log(`   - Users created: ${result.summary.usersCreated}`);
      console.log(`   - Users updated: ${result.summary.usersUpdated}`);
      console.log(`   - Errors: ${result.summary.errors.length}`);
    } else {
      console.log(`❌ Upload failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

uploadFile();
