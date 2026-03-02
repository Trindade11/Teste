import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function extractOriginalDocx() {
  console.log('🔧 Extraindo texto do DOCX original com mammoth.js...\n');

  const originalPath = path.join(process.cwd(), '..', 'Proposta comercial CoCreateAI - Move Studio.docx');
  
  if (!fs.existsSync(originalPath)) {
    console.log('❌ Arquivo DOCX original não encontrado em:', originalPath);
    console.log('💡 Verifique se o arquivo está no diretório EKS/');
    return;
  }

  try {
    // Read the DOCX file
    const buffer = fs.readFileSync(originalPath);
    console.log(`📏 Tamanho do arquivo: ${buffer.length} bytes\n`);

    // Extract with mammoth
    console.log('🔧 Extraindo com mammoth.js...');
    const result = await mammoth.extractRawText({ buffer });
    
    console.log('✅ Extração bem-sucedida!\n');
    
    // Save extracted text
    const outputPath = path.join(process.cwd(), 'output', 'Proposta comercial CoCreateAI - Move Studio_ORIGINAL.txt');
    fs.writeFileSync(outputPath, result.value, 'utf8');
    
    console.log('💾 Texto original salvo em:', outputPath);
    console.log('📝 Primeiros 500 caracteres:');
    console.log('─'.repeat(50));
    console.log(result.value.substring(0, 500));
    console.log('─'.repeat(50));
    console.log('\n');

    // Check for encoding issues
    const hasIssues = /[]/.test(result.value);
    console.log(`🔍 Problemas de encoding detectados: ${hasIssues ? 'SIM' : 'NÃO'}`);
    
    // Word count
    const words = result.value.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`\n📊 Estatísticas do original:`);
    console.log(`   - Caracteres: ${result.value.length}`);
    console.log(`   - Palavras: ${words}`);
    console.log(`   - Linhas: ${result.value.split('\n').length}`);

  } catch (error) {
    console.error('❌ Erro na extração:', error);
  }
}

extractOriginalDocx();
